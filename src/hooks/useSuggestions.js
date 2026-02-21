import { useState, useEffect, useRef, useMemo } from 'react';
import { getSmartSuggestions } from '../utils/smartEngine';
import { LOCATION_PHRASES } from '../data/phrases';

// Cache AI suggestions for 2 minutes
const AI_CACHE_TTL = 2 * 60 * 1000;

// Local suggestions staleness: recompute after 30 seconds
const LOCAL_STALENESS_MS = 30 * 1000;

/**
 * Manages local-first → AI upgrade flow for smart suggestions.
 * Shows local suggestions immediately, then swaps in AI suggestions when available.
 *
 * Local suggestions are cached via ref and only recomputed when:
 * - locationLabel changes
 * - the hour changes
 * - 30 seconds have elapsed since last computation
 */
export function useSuggestions({
  frequencyMap,
  allPhrases,
  history,
  medications,
  pinnedPhrases,
  locationLabel,
  condition,
  familyNames,
  count = 9,
}) {
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const cacheRef = useRef({ key: '', suggestions: null, timestamp: 0 });
  const abortRef = useRef(null);

  // Ref-based cache for local suggestions to prevent reshuffling on every render
  const localRef = useRef({
    suggestions: null,
    locationLabel: null,
    hour: -1,
    timestamp: 0,
  });

  // Look up location-specific phrases
  const locationPhraseList = useMemo(
    () => (locationLabel ? LOCATION_PHRASES[locationLabel.toLowerCase()] || [] : []),
    [locationLabel]
  );

  // Build local suggestions with staleness check
  const currentHour = new Date().getHours();
  const now = Date.now();
  const cached = localRef.current;
  const isStale =
    !cached.suggestions ||
    cached.locationLabel !== locationLabel ||
    cached.hour !== currentHour ||
    now - cached.timestamp >= LOCAL_STALENESS_MS;

  let localSuggestions;
  if (isStale) {
    localSuggestions = getSmartSuggestions({
      frequencyMap,
      allPhrases,
      history,
      medications,
      pinnedPhrases,
      count,
      locationLabel,
      locationPhrases: locationPhraseList,
    });
    localRef.current = {
      suggestions: localSuggestions,
      locationLabel,
      hour: currentHour,
      timestamp: now,
    };
  } else {
    localSuggestions = cached.suggestions;
  }

  // Build a stable cache key (2-minute time buckets instead of per-tap)
  const cacheKey = buildCacheKey(locationLabel);

  // Fetch AI suggestions in background
  useEffect(() => {
    // Check cache first
    if (
      cacheRef.current.key === cacheKey &&
      Date.now() - cacheRef.current.timestamp < AI_CACHE_TTL
    ) {
      setAiSuggestions(cacheRef.current.suggestions);
      return;
    }

    // Don't fetch if no frequency data (cold start)
    const totalTaps = Object.values(frequencyMap).reduce((sum, e) => sum + e.count, 0);
    if (totalTaps < 20) {
      setAiSuggestions(null);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setAiLoading(true);

    fetchAiSuggestions({
      history,
      frequencyMap,
      locationLabel,
      condition,
      medications,
      familyNames,
      allPhrases,
      signal: controller.signal,
    })
      .then((suggestions) => {
        if (!controller.signal.aborted && suggestions) {
          setAiSuggestions(suggestions);
          cacheRef.current = { key: cacheKey, suggestions, timestamp: Date.now() };
        }
      })
      .catch(() => {
        // AI failed — local suggestions are already showing
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAiLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [cacheKey]);

  // Merge: pinned phrases first, then AI suggestions (or local fallback)
  const validPins = (pinnedPhrases || [])
    .filter((p) => !p.expiresAt || new Date(p.expiresAt).getTime() > Date.now())
    .slice(0, 3);

  let finalSuggestions;
  if (aiSuggestions && aiSuggestions.length > 0) {
    // Use AI suggestions with pinned phrases prepended
    const seen = new Set();
    finalSuggestions = [];

    for (const pin of validPins) {
      finalSuggestions.push({ t: pin.text, i: pin.icon || '\u{1F4CC}', pinned: true });
      seen.add(pin.text);
    }

    // Find the phrase objects for AI-suggested texts
    const phraseMap = new Map(allPhrases.map((p) => [p.t, p]));
    for (const text of aiSuggestions) {
      if (!seen.has(text) && finalSuggestions.length < count) {
        const phrase = phraseMap.get(text);
        if (phrase) {
          finalSuggestions.push(phrase);
          seen.add(text);
        }
      }
    }

    // Fill remaining with local if AI didn't return enough
    for (const p of localSuggestions) {
      if (!seen.has(p.t) && finalSuggestions.length < count) {
        finalSuggestions.push(p);
        seen.add(p.t);
      }
    }
  } else {
    finalSuggestions = localSuggestions;
  }

  return {
    suggestions: finalSuggestions.slice(0, count),
    aiActive: !!aiSuggestions,
    aiLoading,
  };
}

function buildCacheKey(locationLabel) {
  const hour = new Date().getHours();
  const timeBucket = Math.floor(Date.now() / 120000); // 2-minute buckets
  return `${hour}:${locationLabel || 'none'}:${timeBucket}`;
}

async function fetchAiSuggestions({
  history,
  frequencyMap,
  locationLabel,
  condition,
  medications,
  familyNames,
  allPhrases,
  signal,
}) {
  // Build request payload (privacy-safe)
  const recentPhrases = history.slice(0, 3).map((h) => h.phrase);

  const topFrequencies = Object.entries(frequencyMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 15)
    .map(([text, data]) => ({ text, count: data.count }));

  const medSchedules = (medications || []).map((m) => ({
    name: m.name,
    nextDose: m.nextDose,
  }));

  // Only send phrase texts
  const phraseTexts = allPhrases.map((p) => p.t);

  const resp = await fetch('/api/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      time: new Date().toLocaleTimeString(),
      locationLabel,
      recentPhrases,
      topFrequencies,
      condition,
      medSchedules,
      familyNames: familyNames || [],
      allPhrases: phraseTexts,
    }),
    signal,
  });

  if (!resp.ok) return null;

  const data = await resp.json();
  return data.suggestions || null;
}
