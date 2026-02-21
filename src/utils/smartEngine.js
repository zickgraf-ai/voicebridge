import { SMART_PHRASES, getTimeOfDay, ALL_SMART_PHRASES } from '../data/smartSuggest';
import { CATEGORY_PHRASES } from '../data/phrases';

// Weights for scoring formula (without location)
const W_FREQUENCY = 0.25;
const W_TIME_PATTERN = 0.20;
const W_CONTEXT = 0.25;
const W_MED_TIMING = 0.15;
const W_PINNED = 0.15;

// Weights with location (when location is available)
const W_LOC_FREQUENCY = 0.20;
const W_LOC_TIME_PATTERN = 0.15;
const W_LOC_CONTEXT = 0.20;
const W_LOC_MED_TIMING = 0.15;
const W_LOC_LOCATION = 0.15;
const W_LOC_PINNED = 0.15;

// Recency decay: suppress phrases used within last 5 minutes
const RECENCY_WINDOW_MS = 5 * 60 * 1000;
const RECENCY_PENALTY = -50;

// Context signal window: only consider last 10 minutes
const CONTEXT_WINDOW_MS = 10 * 60 * 1000;

// Med timing: boost when within 30 minutes of dose time
const MED_BOOST_WINDOW_MS = 30 * 60 * 1000;

// Max pinned phrase slots
const MAX_PINNED_SLOTS = 3;

// Cold start threshold: need at least this many total taps before personalization kicks in
const COLD_START_THRESHOLD = 20;

/**
 * Create an empty frequency map.
 */
export function createFrequencyMap() {
  return {};
}

/**
 * Update frequency map with a new phrase usage. Returns a new map (immutable).
 * @param {Object} map - Current frequency map
 * @param {string} phrase - Phrase text
 * @param {string} [locationLabel] - Current location label (optional)
 */
export function updateFrequencyMap(map, phrase, locationLabel) {
  const now = new Date();
  const hour = now.getHours();
  const existing = map[phrase];

  const locationBuckets = existing?.locationBuckets
    ? { ...existing.locationBuckets }
    : {};
  if (locationLabel) {
    locationBuckets[locationLabel] = (locationBuckets[locationLabel] || 0) + 1;
  }

  const entry = existing
    ? {
        count: existing.count + 1,
        lastUsed: now.toISOString(),
        hourBuckets: {
          ...existing.hourBuckets,
          [hour]: (existing.hourBuckets[hour] || 0) + 1,
        },
        locationBuckets,
      }
    : {
        count: 1,
        lastUsed: now.toISOString(),
        hourBuckets: { [hour]: 1 },
        locationBuckets,
      };

  return { ...map, [phrase]: entry };
}

/**
 * Determine context signal from recent history.
 * Returns: 'pain' | 'food' | 'comfort' | 'medical' | null
 */
export function buildContextSignal(history) {
  if (!history || history.length === 0) return null;

  const now = Date.now();
  const recent = history[0];
  if (!recent) return null;

  const elapsed = now - new Date(recent.timestamp).getTime();
  if (elapsed > CONTEXT_WINDOW_MS) return null;

  const phrase = (recent.phrase || '').toLowerCase();
  const category = recent.category || '';

  // Pain signals
  if (phrase.includes('pain') || phrase.includes('hurt')) return 'pain';

  // Food signals
  if (
    category === 'food' ||
    /hungry|thirsty|water|smoothie|broth|shake|juice|tea|yogurt|soup/i.test(phrase)
  ) {
    return 'food';
  }

  // Comfort signals
  if (
    category === 'comfort' ||
    /pillow|blanket|cold|hot|bathroom|light|window|sit/i.test(phrase)
  ) {
    return 'comfort';
  }

  // Medical signals
  if (category === 'medical' || /medication|medicine|doctor|nurse/i.test(phrase)) {
    return 'medical';
  }

  return null;
}

// Context chain: what categories are boosted after each signal
const CONTEXT_BOOSTS = {
  pain: ['medical', 'comfort'],
  food: ['comfort', 'food'],
  comfort: ['medical', 'food'],
  medical: ['comfort', 'food'],
};

// Map phrases to their "context category" for boosting
function getPhraseContextCategory(phrase) {
  const t = phrase.toLowerCase();
  if (/medication|medicine|med|doctor|nurse|pain|ice|dizzy|nause|stiff|breathe|swelling|rinse/i.test(t)) return 'medical';
  if (/hungry|thirsty|water|smoothie|broth|shake|juice|tea|yogurt|soup|food|applesauce|pudding|ice cream/i.test(t)) return 'food';
  if (/pillow|blanket|cold|hot|bathroom|light|window|sit|walk|heating|tv|comfort|help/i.test(t)) return 'comfort';
  return null;
}

/**
 * Parse a time string like "2:00 PM" or "14:00" into minutes since midnight.
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const str = timeStr.trim().toUpperCase();

  // Try 12-hour format: "2:00 PM"
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    if (match12[3] === 'PM' && hours !== 12) hours += 12;
    if (match12[3] === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Try 24-hour format: "14:00"
  const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }

  return null;
}

/**
 * Get smart suggestions scored by multiple signals.
 *
 * @param {Object} opts
 * @param {Object} opts.frequencyMap - Phrase frequency data
 * @param {Array} opts.allPhrases - All available phrases [{t, i, a?}]
 * @param {Array} opts.history - Recent communication history
 * @param {Array} opts.medications - Profile medications
 * @param {Array} opts.pinnedPhrases - Caregiver-pinned phrases [{text, icon, addedBy?, expiresAt?}]
 * @param {number} opts.count - Number of suggestions to return (default 9)
 * @param {string} [opts.locationLabel] - Current location label for future location scoring
 * @param {Array} [opts.locationPhrases] - Location-specific phrases to inject [{t, i}]
 * @returns {Array} Scored and ranked phrases [{t, i, a?, pinned?}]
 */
export function getSmartSuggestions({
  frequencyMap = {},
  allPhrases = [],
  history = [],
  medications = [],
  pinnedPhrases = [],
  count = 9,
  locationLabel = null,
  locationPhrases = [],
}) {
  // Filter valid (non-expired) pinned phrases
  const now = Date.now();
  const validPins = pinnedPhrases
    .filter((p) => !p.expiresAt || new Date(p.expiresAt).getTime() > now)
    .slice(0, MAX_PINNED_SLOTS);

  // Check if we're in cold start mode
  const totalTaps = Object.values(frequencyMap).reduce((sum, e) => sum + e.count, 0);
  const isColdStart = totalTaps < COLD_START_THRESHOLD;

  // If cold start, return time-of-day phrases with pinned slots prepended
  if (isColdStart) {
    const timeOfDay = getTimeOfDay();
    const fallback = SMART_PHRASES[timeOfDay] || SMART_PHRASES.afternoon;

    // Build result: pinned first, then fallback (deduped)
    const result = [];
    const seen = new Set();

    for (const pin of validPins) {
      result.push({ t: pin.text, i: pin.icon || '📌', pinned: true });
      seen.add(pin.text);
    }

    // Inject up to 3 location-specific phrases
    let locInjected = 0;
    for (const lp of locationPhrases) {
      if (locInjected >= 3) break;
      if (!seen.has(lp.t)) {
        result.push(lp);
        seen.add(lp.t);
        locInjected++;
      }
    }

    for (const p of fallback) {
      if (!seen.has(p.t) && result.length < count) {
        result.push(p);
        seen.add(p.t);
      }
    }

    // Fill remaining from allPhrases if needed
    for (const p of allPhrases) {
      if (!seen.has(p.t) && result.length < count) {
        result.push(p);
        seen.add(p.t);
      }
    }

    return result.slice(0, count);
  }

  // Personalized scoring
  const contextSignal = buildContextSignal(history);
  const boostedCategories = contextSignal ? CONTEXT_BOOSTS[contextSignal] || [] : [];

  // Check if any medication is due soon
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  let medDueSoon = false;
  for (const med of medications) {
    const doseMinutes = parseTimeToMinutes(med.nextDose);
    if (doseMinutes !== null) {
      const diff = Math.abs(doseMinutes - nowMinutes);
      if (diff <= 30) {
        medDueSoon = true;
        break;
      }
    }
  }

  // Build recently-used set for recency decay
  const recentlyUsed = new Set();
  for (const h of history) {
    const elapsed = now - new Date(h.timestamp).getTime();
    if (elapsed <= RECENCY_WINDOW_MS) {
      recentlyUsed.add(h.phrase);
    } else {
      break; // history is sorted newest first
    }
  }

  const currentHour = new Date().getHours();
  const hasLocation = !!locationLabel;

  // Select weight set based on whether location is available
  const wFreq = hasLocation ? W_LOC_FREQUENCY : W_FREQUENCY;
  const wTime = hasLocation ? W_LOC_TIME_PATTERN : W_TIME_PATTERN;
  const wCtx = hasLocation ? W_LOC_CONTEXT : W_CONTEXT;
  const wMed = hasLocation ? W_LOC_MED_TIMING : W_MED_TIMING;
  const wLoc = hasLocation ? W_LOC_LOCATION : 0;

  // Score each phrase
  const scored = allPhrases.map((phrase) => {
    const entry = frequencyMap[phrase.t];
    let score = 0;

    // 1. Frequency score (0-1, normalized)
    if (entry) {
      const maxCount = Math.max(
        ...Object.values(frequencyMap).map((e) => e.count),
        1
      );
      score += (entry.count / maxCount) * wFreq;
    }

    // 2. Time pattern score (0-1, based on hour bucket proportion)
    if (entry && entry.hourBuckets[currentHour]) {
      const hourCount = entry.hourBuckets[currentHour];
      const totalForPhrase = entry.count || 1;
      score += (hourCount / totalForPhrase) * wTime;
    }

    // 3. Context chain score
    const phraseCategory = getPhraseContextCategory(phrase.t);
    if (phraseCategory && boostedCategories.includes(phraseCategory)) {
      score += wCtx;
    }

    // 4. Med timing score
    if (medDueSoon && /medication|medicine|med/i.test(phrase.t)) {
      score += wMed;
    }

    // 5. Location score — boost phrases frequently used at current location
    if (hasLocation && entry && entry.locationBuckets && entry.locationBuckets[locationLabel]) {
      const locCount = entry.locationBuckets[locationLabel];
      const totalForPhrase = entry.count || 1;
      score += (locCount / totalForPhrase) * wLoc;
    }

    // 6. Recency decay
    if (recentlyUsed.has(phrase.t)) {
      score += RECENCY_PENALTY;
    }

    return { ...phrase, _score: score };
  });

  // Sort by score descending
  scored.sort((a, b) => b._score - a._score);

  // Build final result: pinned first, then scored (deduped)
  const result = [];
  const seen = new Set();

  for (const pin of validPins) {
    result.push({ t: pin.text, i: pin.icon || '📌', pinned: true });
    seen.add(pin.text);
  }

  // Inject up to 3 location-specific phrases
  let locInjectedScored = 0;
  for (const lp of locationPhrases) {
    if (locInjectedScored >= 3) break;
    if (!seen.has(lp.t)) {
      result.push(lp);
      seen.add(lp.t);
      locInjectedScored++;
    }
  }

  const slotsForScored = count - result.length;
  let added = 0;
  for (const p of scored) {
    if (added >= slotsForScored) break;
    if (!seen.has(p.t)) {
      const { _score, ...phrase } = p;
      result.push(phrase);
      seen.add(p.t);
      added++;
    }
  }

  return result.slice(0, count);
}
