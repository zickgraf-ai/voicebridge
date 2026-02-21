import { describe, it, expect } from 'vitest';
import { filterVoices } from '../voiceFilter';

function makeVoice(name, lang = 'en-US') {
  return { name, lang, voiceURI: name, default: false };
}

describe('filterVoices', () => {
  it('returns quality voices when available', () => {
    const voices = [
      makeVoice('Samantha'),
      makeVoice('Google US English'),
      makeVoice('Microsoft David', 'en-US'),
      makeVoice('Fred', 'en-US'),
    ];
    const result = filterVoices(voices);
    const names = result.map((v) => v.name);
    expect(names).toContain('Samantha');
    expect(names).toContain('Google US English');
    expect(names).not.toContain('Microsoft David');
    expect(names).not.toContain('Fred');
  });

  it('filters out non-English voices', () => {
    const voices = [
      makeVoice('Samantha', 'en-US'),
      makeVoice('Google Deutsch', 'de-DE'),
      makeVoice('Marie', 'fr-FR'),
    ];
    const result = filterVoices(voices);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Samantha');
  });

  it('falls back to all English minus bad voices when no quality voices found', () => {
    const voices = [
      makeVoice('CustomVoice1', 'en-US'),
      makeVoice('CustomVoice2', 'en-GB'),
      makeVoice('Albert', 'en-US'), // bad voice
      makeVoice('Espeak Voice', 'en-US'), // bad voice
    ];
    const result = filterVoices(voices);
    const names = result.map((v) => v.name);
    expect(names).toContain('CustomVoice1');
    expect(names).toContain('CustomVoice2');
    expect(names).not.toContain('Albert');
    expect(names).not.toContain('Espeak Voice');
  });

  it('returns all English as final fallback', () => {
    // Only bad English voices — should still return them as last resort
    const voices = [
      makeVoice('Albert', 'en-US'),
      makeVoice('Fred', 'en-US'),
      makeVoice('Marie', 'fr-FR'),
    ];
    const result = filterVoices(voices);
    // All bad English voices excluded, cleaned is empty → fallback to all English
    expect(result).toHaveLength(2);
    expect(result.every((v) => v.lang.startsWith('en'))).toBe(true);
  });

  it('handles empty input', () => {
    const result = filterVoices([]);
    expect(result).toEqual([]);
  });
});
