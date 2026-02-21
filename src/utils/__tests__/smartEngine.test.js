import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createFrequencyMap,
  updateFrequencyMap,
  getSmartSuggestions,
  buildContextSignal,
} from '../smartEngine';

// Helper: build a frequency entry for a phrase
function makeEntry(text, { count = 1, lastUsed = null, hourBuckets = {} } = {}) {
  return {
    count,
    lastUsed: lastUsed || new Date().toISOString(),
    hourBuckets,
  };
}

describe('createFrequencyMap', () => {
  it('returns an empty object', () => {
    const map = createFrequencyMap();
    expect(map).toEqual({});
  });
});

describe('updateFrequencyMap', () => {
  it('creates a new entry for an unseen phrase', () => {
    const map = {};
    const result = updateFrequencyMap(map, "I'm thirsty");
    expect(result["I'm thirsty"]).toBeDefined();
    expect(result["I'm thirsty"].count).toBe(1);
    expect(result["I'm thirsty"].hourBuckets).toBeDefined();
  });

  it('increments count for an existing phrase', () => {
    const map = { "I'm thirsty": makeEntry("I'm thirsty", { count: 5 }) };
    const result = updateFrequencyMap(map, "I'm thirsty");
    expect(result["I'm thirsty"].count).toBe(6);
  });

  it('updates lastUsed timestamp', () => {
    const oldTime = '2025-01-01T00:00:00.000Z';
    const map = { "Help!": makeEntry("Help!", { lastUsed: oldTime }) };
    const result = updateFrequencyMap(map, "Help!");
    expect(new Date(result["Help!"].lastUsed).getTime()).toBeGreaterThan(
      new Date(oldTime).getTime()
    );
  });

  it('updates the hour bucket for current hour', () => {
    const map = {};
    const hour = new Date().getHours();
    const result = updateFrequencyMap(map, 'Bathroom');
    expect(result['Bathroom'].hourBuckets[hour]).toBe(1);
  });

  it('increments existing hour bucket', () => {
    const hour = new Date().getHours();
    const map = {
      'Bathroom': makeEntry('Bathroom', { hourBuckets: { [hour]: 3 } }),
    };
    const result = updateFrequencyMap(map, 'Bathroom');
    expect(result['Bathroom'].hourBuckets[hour]).toBe(4);
  });

  it('does not mutate the original map', () => {
    const map = { 'Water': makeEntry('Water', { count: 2 }) };
    const result = updateFrequencyMap(map, 'Water');
    expect(map['Water'].count).toBe(2);
    expect(result['Water'].count).toBe(3);
  });
});

describe('buildContextSignal', () => {
  it('returns "pain" when last phrase was pain-related', () => {
    const history = [
      { phrase: 'My pain is 7 out of 10', category: 'medical', timestamp: new Date().toISOString() },
    ];
    expect(buildContextSignal(history)).toBe('pain');
  });

  it('returns "food" when last phrase was food-related', () => {
    const history = [
      { phrase: "I'm hungry", category: 'food', timestamp: new Date().toISOString() },
    ];
    expect(buildContextSignal(history)).toBe('food');
  });

  it('returns "comfort" when last phrase was comfort-related', () => {
    const history = [
      { phrase: 'Adjust pillow', category: 'comfort', timestamp: new Date().toISOString() },
    ];
    expect(buildContextSignal(history)).toBe('comfort');
  });

  it('returns null for old history entries (>10 min)', () => {
    const old = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const history = [
      { phrase: "I'm in pain", category: 'medical', timestamp: old },
    ];
    expect(buildContextSignal(history)).toBeNull();
  });

  it('returns null for empty history', () => {
    expect(buildContextSignal([])).toBeNull();
  });
});

describe('getSmartSuggestions', () => {
  const allPhrases = [
    { t: "I'm thirsty", i: '💧' },
    { t: 'Bathroom', i: '🚻' },
    { t: 'Need medication', i: '💊' },
    { t: "I'm in pain", i: '🔴', a: 'pain' },
    { t: 'I need ice', i: '🧊' },
    { t: 'Good morning', i: '☀️' },
    { t: 'Feeling better', i: '😊' },
    { t: 'Water', i: '💧' },
    { t: 'My Info', i: '🪪', a: 'identity' },
    { t: 'Adjust pillow', i: '🛏️' },
    { t: 'Mouth rinse', i: '🪥' },
    { t: "Didn't sleep well", i: '😴' },
  ];

  it('returns time-of-day phrases as cold start fallback when no frequency data', () => {
    const result = getSmartSuggestions({
      frequencyMap: {},
      allPhrases,
      history: [],
      medications: [],
      pinnedPhrases: [],
      count: 9,
    });
    expect(result).toHaveLength(9);
    // Should return phrases (cold start = time-of-day fallback)
    result.forEach((p) => {
      expect(p.t).toBeDefined();
      expect(p.i).toBeDefined();
    });
  });

  it('returns the requested number of suggestions', () => {
    const result = getSmartSuggestions({
      frequencyMap: {},
      allPhrases,
      history: [],
      medications: [],
      pinnedPhrases: [],
      count: 6,
    });
    expect(result).toHaveLength(6);
  });

  it('boosts frequently used phrases', () => {
    const frequencyMap = {
      'Bathroom': makeEntry('Bathroom', { count: 50 }),
      "I'm thirsty": makeEntry("I'm thirsty", { count: 1 }),
    };
    const result = getSmartSuggestions({
      frequencyMap,
      allPhrases,
      history: [],
      medications: [],
      pinnedPhrases: [],
      count: 9,
    });
    const bathroomIdx = result.findIndex((p) => p.t === 'Bathroom');
    const thirstyIdx = result.findIndex((p) => p.t === "I'm thirsty");
    expect(bathroomIdx).toBeLessThan(thirstyIdx);
  });

  it('applies recency decay — suppresses recently used phrases', () => {
    const now = new Date().toISOString();
    const frequencyMap = {
      "I'm thirsty": {
        count: 100,
        lastUsed: now,
        hourBuckets: {},
      },
      'Bathroom': makeEntry('Bathroom', { count: 5 }),
    };
    const result = getSmartSuggestions({
      frequencyMap,
      allPhrases,
      history: [{ phrase: "I'm thirsty", timestamp: now }],
      medications: [],
      pinnedPhrases: [],
      count: 12, // request all so both appear
    });
    // "I'm thirsty" was just used, should be suppressed below non-recently-used
    const thirstyIdx = result.findIndex((p) => p.t === "I'm thirsty");
    const bathroomIdx = result.findIndex((p) => p.t === 'Bathroom');
    expect(bathroomIdx).toBeGreaterThanOrEqual(0);
    expect(thirstyIdx).toBeGreaterThan(bathroomIdx);
  });

  it('boosts medication phrases when near dose time', () => {
    const now = new Date();
    // Set nextDose to 15 minutes from now
    const doseTime = new Date(now.getTime() + 15 * 60 * 1000);
    const doseStr =
      doseTime.getHours() +
      ':' +
      String(doseTime.getMinutes()).padStart(2, '0') +
      (doseTime.getHours() >= 12 ? ' PM' : ' AM');

    const medications = [
      { name: 'Ibuprofen 600mg', schedule: 'Every 6 hours', nextDose: doseStr },
    ];

    const result = getSmartSuggestions({
      frequencyMap: {},
      allPhrases,
      history: [],
      medications,
      pinnedPhrases: [],
      count: 9,
    });
    // Med phrases should be boosted
    const medIdx = result.findIndex((p) => p.t === 'Need medication');
    expect(medIdx).toBeLessThan(6); // should be in top 6
  });

  it('places pinned phrases in the first slots', () => {
    const pinnedPhrases = [
      { text: 'Ask about swelling', icon: '🔍', addedBy: 'Caregiver' },
    ];
    const result = getSmartSuggestions({
      frequencyMap: {},
      allPhrases,
      history: [],
      medications: [],
      pinnedPhrases,
      count: 9,
    });
    expect(result[0].t).toBe('Ask about swelling');
    expect(result[0].pinned).toBe(true);
  });

  it('limits pinned phrases to max 3 slots', () => {
    const pinnedPhrases = [
      { text: 'Pin 1', icon: '📌' },
      { text: 'Pin 2', icon: '📌' },
      { text: 'Pin 3', icon: '📌' },
      { text: 'Pin 4', icon: '📌' },
    ];
    const result = getSmartSuggestions({
      frequencyMap: {},
      allPhrases,
      history: [],
      medications: [],
      pinnedPhrases,
      count: 9,
    });
    const pinnedCount = result.filter((p) => p.pinned).length;
    expect(pinnedCount).toBeLessThanOrEqual(3);
  });

  it('excludes expired pinned phrases', () => {
    const expired = new Date(Date.now() - 1000).toISOString(); // 1 second ago
    const pinnedPhrases = [
      { text: 'Expired pin', icon: '📌', expiresAt: expired },
    ];
    const result = getSmartSuggestions({
      frequencyMap: {},
      allPhrases,
      history: [],
      medications: [],
      pinnedPhrases,
      count: 9,
    });
    expect(result[0].t).not.toBe('Expired pin');
  });

  it('boosts context-appropriate phrases after pain', () => {
    const now = new Date().toISOString();
    const history = [
      { phrase: 'My pain is 7 out of 10', category: 'medical', timestamp: now },
    ];
    const result = getSmartSuggestions({
      frequencyMap: {},
      allPhrases,
      history,
      medications: [],
      pinnedPhrases: [],
      count: 9,
    });
    // Med phrases should be boosted after pain
    const medIdx = result.findIndex((p) => p.t === 'Need medication');
    expect(medIdx).toBeLessThan(5);
  });

  it('boosts time-pattern matched phrases', () => {
    const hour = new Date().getHours();
    const frequencyMap = {
      'Bathroom': makeEntry('Bathroom', {
        count: 10,
        hourBuckets: { [hour]: 8 },
      }),
      "I'm thirsty": makeEntry("I'm thirsty", {
        count: 10,
        hourBuckets: { [(hour + 12) % 24]: 8 }, // Different hour
      }),
    };
    const result = getSmartSuggestions({
      frequencyMap,
      allPhrases,
      history: [],
      medications: [],
      pinnedPhrases: [],
      count: 9,
    });
    const bathroomIdx = result.findIndex((p) => p.t === 'Bathroom');
    const thirstyIdx = result.findIndex((p) => p.t === "I'm thirsty");
    // Bathroom used more at current hour, should rank higher
    expect(bathroomIdx).toBeLessThan(thirstyIdx);
  });

  it('does not return duplicate phrases', () => {
    const result = getSmartSuggestions({
      frequencyMap: {},
      allPhrases,
      history: [],
      medications: [],
      pinnedPhrases: [],
      count: 9,
    });
    const texts = result.map((p) => p.t);
    const unique = new Set(texts);
    expect(texts.length).toBe(unique.size);
  });

  describe('location phrase injection', () => {
    const locationPhrases = [
      { t: 'Room service please', i: '🛎️' },
      { t: 'Need extra towels', i: '🧴' },
      { t: 'Wi-Fi password?', i: '📶' },
      { t: 'Late checkout', i: '🕐' },
      { t: 'Where is the elevator?', i: '🛗' },
    ];

    it('injects location phrases when locationPhrases provided', () => {
      const result = getSmartSuggestions({
        frequencyMap: {},
        allPhrases,
        history: [],
        medications: [],
        pinnedPhrases: [],
        locationPhrases,
        count: 9,
      });
      // At least one location phrase should appear
      const hasLocationPhrase = result.some((p) =>
        locationPhrases.some((lp) => lp.t === p.t)
      );
      expect(hasLocationPhrase).toBe(true);
    });

    it('does not inject when no locationPhrases provided', () => {
      const result = getSmartSuggestions({
        frequencyMap: {},
        allPhrases,
        history: [],
        medications: [],
        pinnedPhrases: [],
        count: 9,
      });
      const hasLocationPhrase = result.some((p) =>
        locationPhrases.some((lp) => lp.t === p.t)
      );
      expect(hasLocationPhrase).toBe(false);
    });

    it('limits location injection to 3 phrases', () => {
      const result = getSmartSuggestions({
        frequencyMap: {},
        allPhrases,
        history: [],
        medications: [],
        pinnedPhrases: [],
        locationPhrases,
        count: 12,
      });
      const locationCount = result.filter((p) =>
        locationPhrases.some((lp) => lp.t === p.t)
      ).length;
      expect(locationCount).toBeLessThanOrEqual(3);
    });

    it('does not produce duplicate phrases when location phrases overlap', () => {
      // Use a location phrase that matches an existing phrase
      const overlapping = [
        { t: "I'm thirsty", i: '💧' }, // already in allPhrases
        { t: 'Room service please', i: '🛎️' },
      ];
      const result = getSmartSuggestions({
        frequencyMap: {},
        allPhrases,
        history: [],
        medications: [],
        pinnedPhrases: [],
        locationPhrases: overlapping,
        count: 9,
      });
      const texts = result.map((p) => p.t);
      const unique = new Set(texts);
      expect(texts.length).toBe(unique.size);
    });

    it('places location phrases after pins but before regular suggestions', () => {
      const pinnedPhrases = [
        { text: 'Pinned phrase', icon: '📌' },
      ];
      const result = getSmartSuggestions({
        frequencyMap: {},
        allPhrases,
        history: [],
        medications: [],
        pinnedPhrases,
        locationPhrases,
        count: 9,
      });
      // First item should be pinned
      expect(result[0].pinned).toBe(true);
      // Next few should include location phrases
      const locIndices = result
        .map((p, i) => (locationPhrases.some((lp) => lp.t === p.t) ? i : -1))
        .filter((i) => i >= 0);
      // Location phrases should come right after pins (indices 1, 2, 3)
      expect(locIndices[0]).toBeLessThanOrEqual(3);
    });
  });
});
