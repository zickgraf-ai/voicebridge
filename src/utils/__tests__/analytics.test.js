import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setEnabled,
  isEnabled,
  trackPrebuiltPhrase,
  trackCustomPhrase,
  trackDeviceVoice,
  trackPremiumVoice,
  trackSuggestionsShown,
  trackSuggestionAccepted,
  trackSuggestionDismissed,
  trackSessionStart,
  trackActiveMinute,
  buildPayload,
  flushAnalytics,
  _resetForTesting,
  _getTodayAccumulator,
  _loadAccumulators,
} from '../analytics';

// Mock localStorage
const store = {};
beforeEach(() => {
  _resetForTesting();
  for (const key of Object.keys(store)) delete store[key];
  vi.stubGlobal('localStorage', {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  });
  // Mock __APP_VERSION__
  vi.stubGlobal('__APP_VERSION__', '1.9.4');
  // Mock navigator
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_3 like Mac OS X)', language: 'en-US' });
});

describe('analytics enable/disable', () => {
  it('starts disabled', () => {
    expect(isEnabled()).toBe(false);
  });

  it('can be enabled', () => {
    setEnabled(true);
    expect(isEnabled()).toBe(true);
  });

  it('clears accumulators when disabled', () => {
    setEnabled(true);
    trackPrebuiltPhrase('yes');
    setEnabled(false);
    expect(store['taptospeak_analytics']).toBeUndefined();
    expect(store['taptospeak_analytics_last_ping']).toBeUndefined();
  });
});

describe('tracking functions (when disabled)', () => {
  it('does not accumulate when disabled', () => {
    trackPrebuiltPhrase('yes');
    trackCustomPhrase(20);
    expect(store['taptospeak_analytics']).toBeUndefined();
  });
});

describe('tracking functions (when enabled)', () => {
  beforeEach(() => {
    setEnabled(true);
  });

  it('tracks prebuilt phrase', () => {
    trackPrebuiltPhrase('yes');
    trackPrebuiltPhrase('yes');
    trackPrebuiltPhrase('no');

    const day = _getTodayAccumulator();
    expect(day.phrase_usage.prebuilt.total_spoken).toBe(3);
    expect(day.phrase_usage.prebuilt.unique_spoken.size).toBe(2);
    expect(day.phrase_usage.prebuilt.by_phrase_id.yes).toBe(2);
    expect(day.phrase_usage.prebuilt.by_phrase_id.no).toBe(1);
  });

  it('tracks custom phrase (length only, no text)', () => {
    trackCustomPhrase(15);
    trackCustomPhrase(30);

    const day = _getTodayAccumulator();
    expect(day.phrase_usage.custom.total_spoken).toBe(2);
    expect(day.phrase_usage.custom.char_lengths).toEqual([15, 30]);
  });

  it('tracks device voice', () => {
    trackDeviceVoice(true);
    trackDeviceVoice(false);

    const day = _getTodayAccumulator();
    expect(day.voice_usage.device_voice.requests).toBe(2);
    expect(day.voice_usage.device_voice.successes).toBe(1);
    expect(day.voice_usage.device_voice.failures).toBe(1);
  });

  it('tracks premium voice with latency and cache', () => {
    trackPremiumVoice(true, 350, false);
    trackPremiumVoice(true, 0, true);
    trackPremiumVoice(false);

    const day = _getTodayAccumulator();
    expect(day.voice_usage.premium_voice.requests).toBe(3);
    expect(day.voice_usage.premium_voice.successes).toBe(2);
    expect(day.voice_usage.premium_voice.failures).toBe(1);
    expect(day.voice_usage.premium_voice.latencies).toEqual([350]);
    expect(day.voice_usage.premium_voice.cache_hits).toBe(1);
  });

  it('tracks suggestions', () => {
    trackSuggestionsShown(9);
    trackSuggestionAccepted();
    trackSuggestionDismissed();
    trackSuggestionDismissed();

    const day = _getTodayAccumulator();
    expect(day.suggestions.shown).toBe(9);
    expect(day.suggestions.accepted).toBe(1);
    expect(day.suggestions.dismissed).toBe(2);
  });

  it('tracks session start and active minutes', () => {
    trackSessionStart();
    trackActiveMinute();
    trackActiveMinute();

    const day = _getTodayAccumulator();
    expect(day.session.sessions_today).toBe(1);
    expect(day.session.active_minutes).toBe(2);
  });
});

describe('buildPayload', () => {
  beforeEach(() => {
    setEnabled(true);
  });

  it('builds correct payload structure', () => {
    trackPrebuiltPhrase('yes');
    trackPrebuiltPhrase('no');
    trackCustomPhrase(20);
    trackCustomPhrase(40);
    trackPremiumVoice(true, 300, false);
    trackSuggestionsShown(5);
    trackSuggestionAccepted();
    trackSessionStart();
    trackActiveMinute();

    const day = _getTodayAccumulator();
    const settings = { buttonSize: 'large', voiceRate: 0.9, voiceProvider: 'premium' };
    const payload = buildPayload(day, settings);

    expect(payload.schema_version).toBe(2);
    expect(payload.app_version).toBe('1.9.4');
    expect(payload.platform).toBe('ios');
    expect(payload.locale).toBe('en-US');

    expect(payload.settings_snapshot.button_size).toBe('large');
    expect(payload.settings_snapshot.voice_speed).toBe(0.9);
    expect(payload.settings_snapshot.premium_voice_enabled).toBe(true);

    expect(payload.phrase_usage.prebuilt.total_spoken).toBe(2);
    expect(payload.phrase_usage.prebuilt.unique_spoken).toBe(2);
    expect(payload.phrase_usage.prebuilt.by_phrase_id.yes).toBe(1);

    expect(payload.phrase_usage.custom.total_spoken).toBe(2);
    expect(payload.phrase_usage.custom.avg_character_length).toBe(30);
    expect(payload.phrase_usage.custom.max_character_length).toBe(40);

    expect(payload.voice_usage.premium_voice.requests).toBe(1);
    expect(payload.voice_usage.premium_voice.avg_latency_ms).toBe(300);

    expect(payload.suggestions.shown).toBe(5);
    expect(payload.suggestions.accepted).toBe(1);

    expect(payload.session.sessions_today).toBe(1);
    expect(payload.session.total_active_minutes).toBe(1);
  });

  it('does not include personal data', () => {
    trackPrebuiltPhrase('yes');
    const day = _getTodayAccumulator();
    const payload = buildPayload(day, {});
    const json = JSON.stringify(payload);

    // Ensure no personal fields leak through
    expect(json).not.toContain('name');
    expect(json).not.toContain('dob');
    expect(json).not.toContain('address');
    expect(json).not.toContain('medication');
    expect(json).not.toContain('familyMember');
    expect(json).not.toContain('userId');
    expect(json).not.toContain('deviceId');
  });
});

describe('flushAnalytics', () => {
  it('does not send when disabled', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await flushAnalytics({});
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not send when no completed days exist', async () => {
    setEnabled(true);
    trackPrebuiltPhrase('yes'); // today's data

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await flushAnalytics({});
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends yesterday data and clears accumulator on success', async () => {
    setEnabled(true);

    // Manually inject yesterday's data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);

    const accumulators = {
      [yKey]: {
        phrase_usage: {
          prebuilt: { total_spoken: 5, unique_spoken: ['yes', 'no'], by_phrase_id: { yes: 3, no: 2 } },
          custom: { total_spoken: 1, unique_texts: [20], char_lengths: [20] },
        },
        voice_usage: {
          device_voice: { requests: 0, successes: 0, failures: 0 },
          premium_voice: { requests: 5, successes: 5, failures: 0, latencies: [300], cache_hits: 3 },
        },
        suggestions: { shown: 10, accepted: 3, dismissed: 7 },
        session: { sessions_today: 2, active_minutes: 30 },
      },
    };
    store['taptospeak_analytics'] = JSON.stringify(accumulators);

    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchSpy);

    await flushAnalytics({});

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/analytics');
    expect(opts.method).toBe('POST');

    const body = JSON.parse(opts.body);
    expect(body.schema_version).toBe(2);
    expect(body.phrase_usage.prebuilt.total_spoken).toBe(5);

    // Accumulator should be cleared
    const remaining = JSON.parse(store['taptospeak_analytics']);
    expect(remaining[yKey]).toBeUndefined();
  });
});

describe('privacy guarantees', () => {
  it('PHRASE_TEXT_TO_ID maps phrase text to IDs, not the reverse', async () => {
    const { PHRASE_TEXT_TO_ID } = await import('../../data/phrases');
    // IDs should be short snake_case, not phrase text
    for (const [text, id] of Object.entries(PHRASE_TEXT_TO_ID)) {
      expect(id).toMatch(/^[a-z_]+$/);
      expect(id.length).toBeLessThan(30);
    }
  });

  it('accumulator never stores raw phrase text', () => {
    setEnabled(true);
    trackPrebuiltPhrase('need_water');
    trackCustomPhrase(42);

    const raw = JSON.parse(store['taptospeak_analytics']);
    const json = JSON.stringify(raw);

    // Should only contain phrase IDs, never text
    expect(json).not.toContain('I need water');
    expect(json).toContain('need_water');
  });
});
