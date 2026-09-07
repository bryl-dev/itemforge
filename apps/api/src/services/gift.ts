import type { Choice } from '../domain/models/Choice.js';
import type { Question } from '../domain/models/Question.js';

/**
 * Moodle GIFT. Approved items only: exporting drafts would leak unreviewed
 * model output into an LMS, which is the failure mode this whole product is
 * built to prevent.
 *
 * Special characters in stems and options are escaped per the GIFT spec.
 */
export function toGift(questions: Question[]): string {
  return questions
    .map((question) => formatQuestion(question))
    .join('\n\n');
}

function formatQuestion(question: Question): string {
  const title = question.id.slice(0, 8);
  const stem = escapeGift(question.stem);
  if (question.type === 'true_false') {
    const correct = (question.choices ?? []).find((choice) => choice.isCorrect);
    const value = correct && /^true$/i.test(correct.content) ? 'T' : 'F';
    return `::${title}:: ${stem} {${value}}`;
  }
  if (question.type === 'short_answer') {
    const answers = (question.choices ?? [])
      .filter((choice) => choice.isCorrect)
      .map((choice) => `=${escapeGift(choice.content)}`)
      .join(' ');
    return `::${title}:: ${stem} {${answers || '='}}`;
  }
  const options = [...(question.choices ?? [])]
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((choice) => formatChoice(choice))
    .join('\n');
  return `::${title}:: ${stem} {\n${options}\n}`;
}

function formatChoice(choice: Choice): string {
  const prefix = choice.isCorrect ? '=' : '~';
  const feedback = choice.rationale ? `#${escapeGift(choice.rationale)}` : '';
  return `${prefix}${escapeGift(choice.content)}${feedback}`;
}

function escapeGift(text: string): string {
  return text.replace(/[\\~=#{}:]/g, (char) => `\\${char}`);
}
