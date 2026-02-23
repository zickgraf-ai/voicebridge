/**
 * Returns autocomplete suggestions based on typed input.
 * Matches prefix of any word in each phrase, case-insensitive.
 * Prioritizes previously typed custom phrases from history.
 *
 * @param {string} input - Current text in the input field
 * @param {Array<{phrase: string, source: string}>} history - Communication history entries
 * @param {Array<{t: string}>} allPhrases - Standard phrase objects with `.t` text
 * @param {number} limit - Max number of suggestions to return
 * @returns {string[]} Matching phrase texts, ordered by priority
 */
export function getTypingSuggestions(input, history, allPhrases, limit) {
  const trimmed = (input || '').trim().toLowerCase();
  if (!trimmed) return [];

  const matches = (text) => {
    const lower = text.toLowerCase();
    // Match if any word starts with the input
    const words = lower.split(/\s+/);
    return words.some((w) => w.startsWith(trimmed));
  };

  const seen = new Set();
  const result = [];

  // 1. Previously typed phrases from history (highest priority)
  const typedPhrases = [];
  for (const entry of history) {
    if (entry.source === 'typed' && !seen.has(entry.phrase)) {
      seen.add(entry.phrase);
      if (matches(entry.phrase)) {
        typedPhrases.push(entry.phrase);
      }
    }
  }
  for (const p of typedPhrases) {
    result.push(p);
    if (result.length >= limit) return result;
  }

  // 2. Standard phrases matching the prefix
  for (const phrase of allPhrases) {
    if (!seen.has(phrase.t) && matches(phrase.t)) {
      seen.add(phrase.t);
      result.push(phrase.t);
      if (result.length >= limit) return result;
    }
  }

  return result;
}
