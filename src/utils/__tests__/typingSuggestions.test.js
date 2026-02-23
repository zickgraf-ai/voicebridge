import { describe, it, expect } from 'vitest';
import { getTypingSuggestions } from '../typingSuggestions';

const allPhrases = [
  { t: 'I need water', i: '💧' },
  { t: 'I need help', i: '🆘' },
  { t: 'I need ice', i: '🧊' },
  { t: 'Water', i: '💧' },
  { t: 'Water please', i: '💧' },
  { t: 'Bathroom', i: '🚻' },
  { t: 'Good morning', i: '☀️' },
  { t: 'Help!', i: '🆘' },
  { t: "I'm thirsty", i: '💧' },
  { t: 'Thank you', i: '💛' },
];

describe('getTypingSuggestions', () => {
  it('returns empty array for empty input', () => {
    const result = getTypingSuggestions('', [], allPhrases, 5);
    expect(result).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    const result = getTypingSuggestions('   ', [], allPhrases, 5);
    expect(result).toEqual([]);
  });

  it('returns prefix-matched standard phrases', () => {
    const result = getTypingSuggestions('wat', [], allPhrases, 5);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((phrase) => {
      expect(phrase.toLowerCase()).toContain('wat');
    });
  });

  it('matches prefix of any word in the phrase', () => {
    // "water" appears as a word in "I need water" — "wat" should match it
    const result = getTypingSuggestions('wat', [], allPhrases, 10);
    expect(result).toContain('I need water');
    expect(result).toContain('Water');
    expect(result).toContain('Water please');
  });

  it('is case-insensitive', () => {
    const result = getTypingSuggestions('WAT', [], allPhrases, 5);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Water');
  });

  it('prioritizes previously typed phrases from history', () => {
    const history = [
      { phrase: 'Water please', source: 'typed' },
      { phrase: 'I need water', source: 'button' }, // not typed, should not be prioritized
    ];
    const result = getTypingSuggestions('wat', history, allPhrases, 5);
    expect(result[0]).toBe('Water please');
  });

  it('only considers typed entries from history', () => {
    const history = [
      { phrase: 'Water', source: 'button' },
      { phrase: 'Water please', source: 'typed' },
    ];
    const result = getTypingSuggestions('wat', history, allPhrases, 5);
    // 'Water please' was typed — it should come first
    expect(result[0]).toBe('Water please');
  });

  it('respects limit parameter', () => {
    const result = getTypingSuggestions('i', [], allPhrases, 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('deduplicates results', () => {
    // History has a phrase that also exists in allPhrases
    const history = [
      { phrase: 'Water', source: 'typed' },
    ];
    const result = getTypingSuggestions('wat', history, allPhrases, 10);
    const unique = new Set(result);
    expect(result.length).toBe(unique.size);
  });

  it('includes custom typed phrases from history not in allPhrases', () => {
    const history = [
      { phrase: 'Watch a movie', source: 'typed' },
    ];
    const result = getTypingSuggestions('wat', history, allPhrases, 10);
    expect(result).toContain('Watch a movie');
  });

  it('returns empty array when nothing matches', () => {
    const result = getTypingSuggestions('zzz', [], allPhrases, 5);
    expect(result).toEqual([]);
  });
});
