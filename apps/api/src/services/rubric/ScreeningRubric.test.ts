import { describe, expect, it } from 'vitest';
import type { EngineItem } from '../../clients/AiEngineClient.js';
import { ScreeningRubric } from './ScreeningRubric.js';

const SOURCE = [
  'An abstract data type hides representation so clients depend only on a specification.',
  'A representation invariant is a condition that is true of every well-formed instance.',
  'An abstraction function maps a concrete representation to the abstract value it stands for.',
].join(' ');

const rubric = new ScreeningRubric();

function item(overrides: Partial<EngineItem> & { stem: string }): EngineItem {
  return {
    type: 'multiple_choice',
    difficulty: 'medium',
    bloom_level: 'understand',
    explanation: null,
    source_chunk_ordinal: 0,
    choices: [
      { label: 'A', content: 'A condition true of every well-formed instance', is_correct: true, rationale: null },
      { label: 'B', content: 'A mapping from representation to abstract value', is_correct: false, rationale: null },
      { label: 'C', content: 'The public method list of a class', is_correct: false, rationale: null },
      { label: 'D', content: 'A proof that the implementation terminates', is_correct: false, rationale: null },
    ],
    ...overrides,
  };
}

function codes(result: { findings: { code: string }[] }): string[] {
  return result.findings.map((finding) => finding.code);
}

describe('ScreeningRubric', () => {
  it('passes a well-formed multiple-choice item', () => {
    const result = rubric.evaluate(
      item({ stem: 'What is a representation invariant of an abstract data type?' }),
      SOURCE,
    );
    expect(result.passed).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it('rejects multiple-choice items that do not have exactly one correct option', () => {
    const result = rubric.evaluate(
      item({
        stem: 'What is a representation invariant of an abstract data type?',
        choices: [
          { label: 'A', content: 'First option about invariants', is_correct: true, rationale: null },
          { label: 'B', content: 'Second option about functions', is_correct: true, rationale: null },
          { label: 'C', content: 'Third option about methods', is_correct: false, rationale: null },
          { label: 'D', content: 'Fourth option about proofs', is_correct: false, rationale: null },
        ],
      }),
      SOURCE,
    );
    expect(result.passed).toBe(false);
    expect(codes(result)).toContain('mc_one_correct');
  });

  it('rejects catch-all options', () => {
    const result = rubric.evaluate(
      item({
        stem: 'Which statement about abstract data types is correct in this course?',
        choices: [
          { label: 'A', content: 'Clients depend only on the specification', is_correct: true, rationale: null },
          { label: 'B', content: 'Fields should all be public', is_correct: false, rationale: null },
          { label: 'C', content: 'Tests must inspect private state', is_correct: false, rationale: null },
          { label: 'D', content: 'All of the above', is_correct: false, rationale: null },
        ],
      }),
      SOURCE,
    );
    expect(result.passed).toBe(false);
    expect(codes(result)).toContain('catch_all_option');
  });

  it('flags a conspicuously long correct option', () => {
    const result = rubric.evaluate(
      item({
        stem: 'Which statement about abstract data types is correct in this course?',
        choices: [
          {
            label: 'A',
            content:
              'Clients depend only on the specification of the type, never on the hidden representation, which is why a rewrite of the internals should not force client changes.',
            is_correct: true,
            rationale: null,
          },
          { label: 'B', content: 'Fields are public', is_correct: false, rationale: null },
          { label: 'C', content: 'Tests read privates', is_correct: false, rationale: null },
          { label: 'D', content: 'Methods cannot fail', is_correct: false, rationale: null },
        ],
      }),
      SOURCE,
    );
    expect(result.passed).toBe(true);
    expect(codes(result)).toContain('length_cue');
  });

  it('rejects identical distractors', () => {
    const result = rubric.evaluate(
      item({
        stem: 'Which statement about abstract data types is correct in this course?',
        choices: [
          { label: 'A', content: 'Clients depend only on the specification', is_correct: true, rationale: null },
          { label: 'B', content: 'The representation is always a linked list', is_correct: false, rationale: null },
          { label: 'C', content: 'The representation is always a linked list', is_correct: false, rationale: null },
          { label: 'D', content: 'Methods cannot throw exceptions', is_correct: false, rationale: null },
        ],
      }),
      SOURCE,
    );
    expect(result.passed).toBe(false);
    expect(codes(result)).toContain('duplicate_choices');
  });

  it('rejects stems copied verbatim from the source', () => {
    const result = rubric.evaluate(
      item({
        stem: 'A representation invariant is a condition that is true of every well-formed instance, correct?',
      }),
      SOURCE,
    );
    expect(result.passed).toBe(false);
    expect(codes(result)).toContain('verbatim_source');
  });

  it('rejects a stem that is too short to be an item', () => {
    const result = rubric.evaluate(item({ stem: 'What is RI?' }), SOURCE);
    expect(result.passed).toBe(false);
    expect(codes(result)).toContain('stem_too_short');
  });
});
