import { describe, expect, it } from 'vitest';
import { levenshtein } from './text.js';

describe('levenshtein', () => {
  it('is zero for identical strings', () => {
    expect(levenshtein('representation invariant', 'representation invariant')).toBe(0);
  });

  it('counts a single substitution', () => {
    expect(levenshtein('cat', 'car')).toBe(1);
  });

  it('counts insertions and deletions', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });
});
