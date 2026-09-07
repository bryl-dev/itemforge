import type { EngineItem } from '../../clients/AiEngineClient.js';
import type { RubricFinding, RubricResult } from '../../domain/types.js';
import type { Rubric } from './Rubric.js';

const CATCH_ALL = [
  'all of the above',
  'none of the above',
  'both a and b',
  'both a & b',
  'all of these',
  'none of these',
];

const TRIVIAL = new Set(['n/a', 'na', 'idk', 'tbd', '...', '???']);

const WORD = /[a-z0-9']+/g;

export interface ScreeningOptions {
  minStemWords?: number;
  maxStemWords?: number;
  verbatimNgram?: number;
  lengthCueRatio?: number;
}

/**
 * Deterministic item screen. No model calls. Every finding has a stable `code`
 * so the UI can group them and the metrics layer can count them over time.
 */
export class ScreeningRubric implements Rubric {
  private readonly minStemWords: number;
  private readonly maxStemWords: number;
  private readonly verbatimNgram: number;
  private readonly lengthCueRatio: number;

  constructor(options: ScreeningOptions = {}) {
    this.minStemWords = options.minStemWords ?? 6;
    this.maxStemWords = options.maxStemWords ?? 60;
    this.verbatimNgram = options.verbatimNgram ?? 8;
    this.lengthCueRatio = options.lengthCueRatio ?? 1.6;
  }

  evaluate(item: EngineItem, sourceText: string): RubricResult {
    const findings: RubricFinding[] = [];
    this.checkStem(item, findings);
    this.checkChoices(item, findings);
    this.checkVerbatim(item, sourceText, findings);
    return {
      passed: findings.every((finding) => finding.severity !== 'error'),
      findings,
    };
  }

  private checkStem(item: EngineItem, findings: RubricFinding[]): void {
    const words = tokenize(item.stem);
    if (words.length < this.minStemWords) {
      findings.push({
        code: 'stem_too_short',
        severity: 'error',
        message: `Stem has ${words.length} words; a usable item needs at least ${this.minStemWords}.`,
      });
    }
    if (words.length > this.maxStemWords) {
      findings.push({
        code: 'stem_too_long',
        severity: 'warning',
        message: `Stem has ${words.length} words, which is heavy for an exam item.`,
      });
    }

    const sentences = item.stem.split(/[.?!]+/).filter((s) => s.trim().length > 0);
    const long = sentences.filter((s) => tokenize(s).length > 35);
    if (long.length > 0) {
      findings.push({
        code: 'stem_reading_load',
        severity: 'warning',
        message: 'At least one sentence in the stem exceeds 35 words, which raises reading load.',
      });
    }
  }

  private checkChoices(item: EngineItem, findings: RubricFinding[]): void {
    const choices = item.choices ?? [];
    if (item.type === 'short_answer') {
      return;
    }
    if (choices.length < 2) {
      findings.push({
        code: 'missing_choices',
        severity: 'error',
        message: 'This item has fewer than two choices.',
      });
      return;
    }

    const correct = choices.filter((choice) => choice.is_correct);
    if (item.type === 'multiple_choice' && correct.length !== 1) {
      findings.push({
        code: 'mc_one_correct',
        severity: 'error',
        message: `Multiple-choice items must have exactly one correct option (found ${correct.length}).`,
      });
    }

    if (item.type === 'true_false' && choices.length !== 2) {
      findings.push({
        code: 'tf_two_choices',
        severity: 'error',
        message: 'True/false items must have exactly two choices.',
      });
    }

    const seen = new Map<string, string>();
    for (const choice of choices) {
      const content = choice.content.trim();
      if (!content) {
        findings.push({
          code: 'blank_choice',
          severity: 'error',
          message: `Choice ${choice.label} is blank.`,
        });
        continue;
      }
      const normalized = normalize(content);
      if (TRIVIAL.has(normalized) || content.length < 2) {
        findings.push({
          code: 'trivial_distractor',
          severity: 'warning',
          message: `Choice ${choice.label} is too thin to function as a distractor.`,
        });
      }
      if (CATCH_ALL.some((phrase) => normalized.includes(phrase))) {
        findings.push({
          code: 'catch_all_option',
          severity: 'error',
          message: `Choice ${choice.label} ("${content}") is a catch-all option and should not appear.`,
        });
      }
      const previous = seen.get(normalized);
      if (previous) {
        findings.push({
          code: 'duplicate_choices',
          severity: 'error',
          message: `Choices ${previous} and ${choice.label} are effectively identical.`,
        });
      } else {
        seen.set(normalized, choice.label);
      }
    }

    this.checkLengthCue(item, findings);
  }

  private checkLengthCue(item: EngineItem, findings: RubricFinding[]): void {
    if (item.type !== 'multiple_choice') {
      return;
    }
    const correct = item.choices.find((choice) => choice.is_correct);
    const distractors = item.choices.filter((choice) => !choice.is_correct);
    if (!correct || distractors.length === 0) {
      return;
    }
    const lengths = distractors.map((choice) => choice.content.trim().length).sort((a, b) => a - b);
    const median = lengths[Math.floor(lengths.length / 2)] ?? 0;
    if (median > 0 && correct.content.trim().length > median * this.lengthCueRatio) {
      findings.push({
        code: 'length_cue',
        severity: 'warning',
        message:
          'The correct option is conspicuously longer than the distractors, which is a test-wiseness leak.',
      });
    }
  }

  private checkVerbatim(item: EngineItem, sourceText: string, findings: RubricFinding[]): void {
    const stemWords = tokenize(item.stem);
    const sourceWords = tokenize(sourceText);
    if (stemWords.length < this.verbatimNgram || sourceWords.length < this.verbatimNgram) {
      return;
    }
    const sourceGrams = ngramSet(sourceWords, this.verbatimNgram);
    for (let i = 0; i <= stemWords.length - this.verbatimNgram; i += 1) {
      const gram = stemWords.slice(i, i + this.verbatimNgram).join(' ');
      if (sourceGrams.has(gram)) {
        findings.push({
          code: 'verbatim_source',
          severity: 'error',
          message: `The stem copies ${this.verbatimNgram} or more consecutive words from the source, so it can be answered by lookup.`,
        });
        return;
      }
    }
  }
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(WORD) ?? []) as string[];
}

function normalize(text: string): string {
  return tokenize(text).join(' ');
}

function ngramSet(words: string[], n: number): Set<string> {
  const grams = new Set<string>();
  for (let i = 0; i <= words.length - n; i += 1) {
    grams.add(words.slice(i, i + n).join(' '));
  }
  return grams;
}
