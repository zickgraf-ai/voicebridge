/**
 * TapToSpeak Anonymous Analytics Module
 *
 * Privacy-respecting, opt-in analytics that collects ONLY anonymous aggregate
 * usage counts. This is the SINGLE file that handles all analytics. Anyone
 * auditing the privacy claim can read this one file to verify:
 *
 * - NO user ID, device ID, or persistent identifier
 * - NO IP address retention (backend strips IPs)
 * - NO raw phrase text (only prebuilt phrase IDs and character length stats)
 * - NO personal data (name, DOB, medical info, etc.)
 *
 * Data flow:
 * 1. User enables "Help Improve TapToSpeak" toggle (default OFF)
 * 2. App increments counters in localStorage throughout the day
 * 3. Once per day, yesterday's counters are POSTed to /api/analytics
 * 4. Payload is fire-and-forget; no retries on failure
 */

const STORAGE_KEY = 'taptospeak_analytics';
const LAST_PING_KEY = 'taptospeak_analytics_last_ping';
const ANALYTICS_ENDPOINT = '/api/analytics';
const SEND_TIMEOUT_MS = 5000;
const MAX_UNSENT_DAYS = 3;

// ---- Helpers ----

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function loadAccumulators() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccumulators(accumulators) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accumulators));
  } catch {
    // localStorage full — silently fail
  }
}

function getLastPingDate() {
  try {
    return localStorage.getItem(LAST_PING_KEY) || null;
  } catch {
    return null;
  }
}

function setLastPingDate(dateStr) {
  try {
    localStorage.setItem(LAST_PING_KEY, dateStr);
  } catch {
    // silently fail
  }
}

function emptyDay() {
  return {
    phrase_usage: {
      prebuilt: { total_spoken: 0, unique_spoken: new Set(), by_phrase_id: {} },
      custom: { total_spoken: 0, unique_texts: new Set(), char_lengths: [] },
    },
    voice_usage: {
      device_voice: { requests: 0, successes: 0, failures: 0 },
      premium_voice: { requests: 0, successes: 0, failures: 0, latencies: [], cache_hits: 0 },
    },
    suggestions: { shown: 0, accepted: 0, dismissed: 0 },
    session: { sessions_today: 0, active_minutes: 0 },
  };
}

// Serialization: Sets are stored as arrays in JSON
function serializeDay(day) {
  return {
    ...day,
    phrase_usage: {
      prebuilt: {
        ...day.phrase_usage.prebuilt,
        unique_spoken: [...(day.phrase_usage.prebuilt.unique_spoken instanceof Set
          ? day.phrase_usage.prebuilt.unique_spoken
          : day.phrase_usage.prebuilt.unique_spoken || [])],
      },
      custom: {
        ...day.phrase_usage.custom,
        unique_texts: [...(day.phrase_usage.custom.unique_texts instanceof Set
          ? day.phrase_usage.custom.unique_texts
          : day.phrase_usage.custom.unique_texts || [])],
      },
    },
  };
}

function deserializeDay(raw) {
  if (!raw) return emptyDay();
  try {
    return {
      phrase_usage: {
        prebuilt: {
          total_spoken: raw.phrase_usage?.prebuilt?.total_spoken || 0,
          unique_spoken: new Set(raw.phrase_usage?.prebuilt?.unique_spoken || []),
          by_phrase_id: raw.phrase_usage?.prebuilt?.by_phrase_id || {},
        },
        custom: {
          total_spoken: raw.phrase_usage?.custom?.total_spoken || 0,
          unique_texts: new Set(raw.phrase_usage?.custom?.unique_texts || []),
          char_lengths: raw.phrase_usage?.custom?.char_lengths || [],
        },
      },
      voice_usage: {
        device_voice: {
          requests: raw.voice_usage?.device_voice?.requests || 0,
          successes: raw.voice_usage?.device_voice?.successes || 0,
          failures: raw.voice_usage?.device_voice?.failures || 0,
        },
        premium_voice: {
          requests: raw.voice_usage?.premium_voice?.requests || 0,
          successes: raw.voice_usage?.premium_voice?.successes || 0,
          failures: raw.voice_usage?.premium_voice?.failures || 0,
          latencies: raw.voice_usage?.premium_voice?.latencies || [],
          cache_hits: raw.voice_usage?.premium_voice?.cache_hits || 0,
        },
      },
      suggestions: {
        shown: raw.suggestions?.shown || 0,
        accepted: raw.suggestions?.accepted || 0,
        dismissed: raw.suggestions?.dismissed || 0,
      },
      session: {
        sessions_today: raw.session?.sessions_today || 0,
        active_minutes: raw.session?.active_minutes || 0,
      },
    };
  } catch {
    return emptyDay();
  }
}

// ---- Get/set today's accumulator ----

function getTodayAccumulator() {
  const all = loadAccumulators();
  const key = todayKey();
  return deserializeDay(all[key]);
}

function saveTodayAccumulator(day) {
  const all = loadAccumulators();
  const key = todayKey();
  all[key] = serializeDay(day);

  // Prune old days beyond MAX_UNSENT_DAYS
  const keys = Object.keys(all).sort();
  while (keys.length > MAX_UNSENT_DAYS + 1) {
    delete all[keys.shift()];
  }

  saveAccumulators(all);
}

// ---- Public tracking functions ----

/**
 * Track a prebuilt phrase being spoken.
 * @param {string} phraseId - The stable phrase ID (e.g., 'need_water')
 */
export function trackPrebuiltPhrase(phraseId) {
  if (!isEnabled()) return;
  const day = getTodayAccumulator();
  day.phrase_usage.prebuilt.total_spoken++;
  day.phrase_usage.prebuilt.unique_spoken.add(phraseId);
  day.phrase_usage.prebuilt.by_phrase_id[phraseId] =
    (day.phrase_usage.prebuilt.by_phrase_id[phraseId] || 0) + 1;
  saveTodayAccumulator(day);
}

/**
 * Track a custom (user-typed or user-created) phrase being spoken.
 * Only the character length is recorded — never the text.
 * @param {number} charLength - Length of the phrase text
 */
export function trackCustomPhrase(charLength) {
  if (!isEnabled()) return;
  const day = getTodayAccumulator();
  day.phrase_usage.custom.total_spoken++;
  // Use character length as a proxy for uniqueness (not text)
  day.phrase_usage.custom.unique_texts.add(charLength);
  day.phrase_usage.custom.char_lengths.push(charLength);
  saveTodayAccumulator(day);
}

/**
 * Track a device voice TTS request.
 * @param {boolean} success
 */
export function trackDeviceVoice(success) {
  if (!isEnabled()) return;
  const day = getTodayAccumulator();
  day.voice_usage.device_voice.requests++;
  if (success) day.voice_usage.device_voice.successes++;
  else day.voice_usage.device_voice.failures++;
  saveTodayAccumulator(day);
}

/**
 * Track a premium voice TTS request.
 * @param {boolean} success
 * @param {number} [latencyMs] - Request latency in ms (only for non-cached)
 * @param {boolean} [cacheHit] - Whether the audio was served from cache
 */
export function trackPremiumVoice(success, latencyMs, cacheHit) {
  if (!isEnabled()) return;
  const day = getTodayAccumulator();
  day.voice_usage.premium_voice.requests++;
  if (success) day.voice_usage.premium_voice.successes++;
  else day.voice_usage.premium_voice.failures++;
  if (typeof latencyMs === 'number' && latencyMs > 0) {
    day.voice_usage.premium_voice.latencies.push(latencyMs);
  }
  if (cacheHit) day.voice_usage.premium_voice.cache_hits++;
  saveTodayAccumulator(day);
}

/**
 * Track smart suggestions being shown.
 * @param {number} count - Number of suggestions shown
 */
export function trackSuggestionsShown(count) {
  if (!isEnabled()) return;
  const day = getTodayAccumulator();
  day.suggestions.shown += count;
  saveTodayAccumulator(day);
}

/**
 * Track a suggestion being accepted.
 */
export function trackSuggestionAccepted() {
  if (!isEnabled()) return;
  const day = getTodayAccumulator();
  day.suggestions.accepted++;
  saveTodayAccumulator(day);
}

/**
 * Track a suggestion being dismissed (user picked something else).
 */
export function trackSuggestionDismissed() {
  if (!isEnabled()) return;
  const day = getTodayAccumulator();
  day.suggestions.dismissed++;
  saveTodayAccumulator(day);
}

/**
 * Record a new session start.
 */
export function trackSessionStart() {
  if (!isEnabled()) return;
  const day = getTodayAccumulator();
  day.session.sessions_today++;
  saveTodayAccumulator(day);
}

/**
 * Increment active minutes (call once per minute while app is in foreground).
 */
export function trackActiveMinute() {
  if (!isEnabled()) return;
  const day = getTodayAccumulator();
  day.session.active_minutes++;
  saveTodayAccumulator(day);
}

// ---- Enable/disable ----

let _enabled = false;

export function isEnabled() {
  return _enabled;
}

export function setEnabled(on) {
  _enabled = !!on;
  if (!on) {
    // Clear all stored accumulators when user opts out
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_PING_KEY);
    } catch {
      // silently fail
    }
  }
}

// ---- Build payload ----

function detectPlatform() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh/.test(ua)) return 'macos';
  if (/Windows/.test(ua)) return 'windows';
  return 'web';
}

function detectOsVersion() {
  const ua = navigator.userAgent || '';
  // iOS: "OS 18_3" → "18.3"
  const ios = ua.match(/OS (\d+[_\.]\d+)/);
  if (ios) return ios[1].replace('_', '.');
  // Android: "Android 14"
  const android = ua.match(/Android (\d+[\.\d]*)/);
  if (android) return android[1];
  return 'unknown';
}

export function buildPayload(dayData, settings) {
  const prebuilt = dayData.phrase_usage.prebuilt;
  const custom = dayData.phrase_usage.custom;
  const charLengths = custom.char_lengths || [];

  return {
    schema_version: 2,
    app_version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown',
    platform: detectPlatform(),
    os_version: detectOsVersion(),
    locale: navigator.language || 'en-US',

    settings_snapshot: {
      button_size: settings?.buttonSize || 'large',
      voice_speed: settings?.voiceRate || 1.0,
      smart_suggestions_enabled: settings?.smartSuggestionsEnabled ?? true,
      premium_voice_enabled: (settings?.voiceProvider || 'premium') === 'premium',
      location_feature_enabled: false,
    },

    phrase_usage: {
      prebuilt: {
        total_spoken: prebuilt.total_spoken,
        unique_spoken: prebuilt.unique_spoken instanceof Set
          ? prebuilt.unique_spoken.size
          : (prebuilt.unique_spoken?.length || 0),
        by_phrase_id: { ...prebuilt.by_phrase_id },
      },
      custom: {
        total_spoken: custom.total_spoken,
        unique_spoken: custom.unique_texts instanceof Set
          ? custom.unique_texts.size
          : (custom.unique_texts?.length || 0),
        avg_character_length: charLengths.length > 0
          ? Math.round(charLengths.reduce((a, b) => a + b, 0) / charLengths.length)
          : 0,
        max_character_length: charLengths.length > 0
          ? Math.max(...charLengths)
          : 0,
      },
    },

    voice_usage: {
      device_voice: { ...dayData.voice_usage.device_voice },
      premium_voice: {
        requests: dayData.voice_usage.premium_voice.requests,
        successes: dayData.voice_usage.premium_voice.successes,
        failures: dayData.voice_usage.premium_voice.failures,
        avg_latency_ms: dayData.voice_usage.premium_voice.latencies.length > 0
          ? Math.round(
              dayData.voice_usage.premium_voice.latencies.reduce((a, b) => a + b, 0) /
              dayData.voice_usage.premium_voice.latencies.length
            )
          : 0,
        cache_hits: dayData.voice_usage.premium_voice.cache_hits,
      },
    },

    suggestions: { ...dayData.suggestions },

    session: {
      sessions_today: dayData.session.sessions_today,
      total_active_minutes: dayData.session.active_minutes,
    },
  };
}

// ---- Send logic ----

/**
 * Attempt to send yesterday's (or older unsent) analytics data.
 * Call on app launch / foreground. Fire and forget.
 */
export async function flushAnalytics(settings) {
  if (!isEnabled()) return;

  const all = loadAccumulators();
  const today = todayKey();
  const lastPing = getLastPingDate();

  // Find completed days (not today) that haven't been sent
  const unsent = Object.keys(all)
    .filter((k) => k < today)
    .sort();

  if (unsent.length === 0) return;

  // Send oldest unsent day
  const dateToSend = unsent[0];

  // Don't re-send if already sent today
  if (lastPing === dateToSend) return;

  const dayData = deserializeDay(all[dateToSend]);
  const payload = buildPayload(dayData, settings);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

    const resp = await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (resp.ok || resp.status === 204) {
      // Success — remove the sent day and update last ping
      delete all[dateToSend];
      saveAccumulators(all);
      setLastPingDate(dateToSend);
    }
    // On failure, keep the accumulator and try next launch
  } catch {
    // Network error / timeout — silently fail, try next time
  }
}

// ---- Session tracking ----

let _minuteTimer = null;

/**
 * Start session tracking (call on app mount).
 * Tracks session count and active minutes.
 */
export function startSession() {
  trackSessionStart();

  // Increment active minutes every 60 seconds
  if (_minuteTimer) clearInterval(_minuteTimer);
  _minuteTimer = setInterval(() => {
    if (isEnabled()) trackActiveMinute();
  }, 60_000);
}

/**
 * Stop session tracking (call on app unmount).
 */
export function stopSession() {
  if (_minuteTimer) {
    clearInterval(_minuteTimer);
    _minuteTimer = null;
  }
}

// ---- Testing helpers ----

/** @internal - for tests only */
export function _resetForTesting() {
  _enabled = false;
  stopSession();
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_PING_KEY);
  } catch {
    // ignore
  }
}

/** @internal - for tests only */
export { getTodayAccumulator as _getTodayAccumulator };
/** @internal - for tests only */
export { loadAccumulators as _loadAccumulators };
/** @internal - for tests only */
export { saveTodayAccumulator as _saveTodayAccumulator };
