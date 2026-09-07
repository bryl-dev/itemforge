import { describe, expect, it } from 'vitest';
import { Choice } from '../domain/models/Choice.js';
import { Question } from '../domain/models/Question.js';
import { toGift } from './gift.js';

function fakeQuestion(overrides: Partial<Question> & { stem: string; choices: Choice[] }): Question {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    type: 'multiple_choice',
    ...overrides,
  } as unknown as Question;
}

describe('toGift', () => {
  it('emits Moodle GIFT with the correct option marked', () => {
    const gift = toGift([
      fakeQuestion({
        stem: 'What is a representation invariant?',
        choices: [
          { label: 'A', content: 'A condition true of every instance', isCorrect: true, ordinal: 0 } as Choice,
          { label: 'B', content: 'A public method list', isCorrect: false, ordinal: 1 } as Choice,
        ],
      }),
    ]);
    expect(gift).toContain('What is a representation invariant?');
    expect(gift).toContain('=A condition true of every instance');
    expect(gift).toContain('~A public method list');
  });

  it('escapes GIFT special characters', () => {
    const gift = toGift([
      fakeQuestion({
        stem: 'What does {RI} mean: A=B?',
        choices: [
          { label: 'A', content: 'A ~ B', isCorrect: true, ordinal: 0 } as Choice,
        ],
      }),
    ]);
    expect(gift).toContain('\\{RI\\}');
    expect(gift).toContain('\\~');
  });
});
