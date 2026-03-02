import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { createElement } from 'react';

// ---- Mocks (before imports) ----

const mockCacheStore = new Map();
vi.mock('../../utils/audioCache', () => ({
  putAudio: vi.fn((key, blob) => {
    mockCacheStore.set(key, blob);
    return Promise.resolve();
  }),
  hasCachedKeySync: vi.fn((key) => mockCacheStore.has(key)),
}));

vi.mock('../../data/audioManifest.json', () => ({
  default: {
    nova: { 'Yes': 'abc123.mp3', 'No': 'def456.mp3', 'I need help': 'help789.mp3' },
    shimmer: { 'Yes': 'shim123.mp3' },
    alloy: {},
    echo: {},
    onyx: {},
    fable: {},
  },
}));

vi.mock('../../data/phrases', () => ({
  ALL_STANDARD_PHRASES: ['Yes', 'No'],
}));

const mockStorage = {};
vi.mock('../../utils/storage', () => ({
  loadState: vi.fn((key, fallback) => mockStorage[key] ?? fallback),
  saveState: vi.fn((key, value) => { mockStorage[key] = value; }),
  removeState: vi.fn((key) => { delete mockStorage[key]; }),
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// ---- Imports (after mocks) ----
import { AppProvider } from '../../context/AppContext';
import { useTtsPrefetch } from '../useTtsPrefetch';
import * as audioCache from '../../utils/audioCache';

// ---- Helpers ----

function seedPremiumSettings(overrides = {}) {
  mockStorage.settings = {
    autoSpeak: true,
    voiceProvider: 'premium',
    premiumVoice: 'nova',
    premiumOnly: false,
    voiceRate: 0.9,
    voiceURI: '',
    buttonSize: 'large',
    tabSize: 'xl',
    painReminder: 120,
    caregiverAlert: 6,
    ...overrides,
  };
}

function wrapper({ children }) {
  return createElement(AppProvider, null, children);
}

describe('useTtsPrefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockCacheStore.clear();
    mockFetch.mockReset();
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      blob: () => Promise.resolve(new Blob(['audio data'], { type: 'audio/mp3' })),
    }));
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('does not prefetch when voiceProvider is device', async () => {
    seedPremiumSettings({ voiceProvider: 'device' });
    const { rerender } = renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need some water please' } }
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not prefetch when text is empty', async () => {
    seedPremiumSettings();
    renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: '' } }
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not prefetch when text is shorter than 2 words', async () => {
    seedPremiumSettings();
    renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'Hello' } }
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('triggers prefetch after 600ms debounce', async () => {
    seedPremiumSettings();
    renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need water please' } }
    );

    // Not yet at debounce threshold
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(mockFetch).not.toHaveBeenCalled();

    // Cross the debounce threshold
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/speak', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ text: 'I need water please', voice: 'nova' }),
    }));
  });

  it('aborts debounce timer when text changes before it fires', async () => {
    seedPremiumSettings();
    const { rerender } = renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need water' } }
    );

    // Advance partway through debounce
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(mockFetch).not.toHaveBeenCalled();

    // User types more — text changes, resets the timer
    rerender({ text: 'I need water please' });

    // Original timer would have fired at 600ms, but it was reset
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(mockFetch).not.toHaveBeenCalled();

    // New timer fires at 600ms from the rerender
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).text).toBe('I need water please');
  });

  it('stores prefetched audio in IndexedDB with correct cache key', async () => {
    seedPremiumSettings();
    renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need water please' } }
    );

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(audioCache.putAudio).toHaveBeenCalledWith(
      'nova:I need water please',
      expect.any(Blob)
    );
  });

  it('does not re-prefetch when text has not changed', async () => {
    seedPremiumSettings();
    const { rerender } = renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need water please' } }
    );

    // First prefetch
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Re-render with same text (e.g., parent re-rendered)
    rerender({ text: 'I need water please' });

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    // Should not have fetched again
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('handles API error gracefully without crashing', async () => {
    seedPremiumSettings();
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need water please' } }
    );

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    // Should not throw or store anything
    expect(audioCache.putAudio).not.toHaveBeenCalled();
  });

  it('handles network error gracefully without crashing', async () => {
    seedPremiumSettings();
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need water please' } }
    );

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    // Should not throw or store anything
    expect(audioCache.putAudio).not.toHaveBeenCalled();
  });

  it('does not prefetch text already in cache', async () => {
    seedPremiumSettings();
    mockCacheStore.set('nova:I need water please', new Blob(['cached'], { type: 'audio/mp3' }));

    renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need water please' } }
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not prefetch text that matches a bundled manifest entry', async () => {
    seedPremiumSettings();
    // "I need help" passes the 2-word and 8-char minimums but is in the nova manifest
    renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need help' } }
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Skipped solely because it's in the bundled manifest
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('cleans up timers on unmount', async () => {
    seedPremiumSettings();
    const { unmount } = renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need water please' } }
    );

    // Unmount before debounce fires
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('uses correct voice name from settings', async () => {
    seedPremiumSettings({ premiumVoice: 'shimmer' });
    renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need water please' } }
    );

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/speak', expect.objectContaining({
      body: JSON.stringify({ text: 'I need water please', voice: 'shimmer' }),
    }));
    expect(audioCache.putAudio).toHaveBeenCalledWith(
      'shimmer:I need water please',
      expect.any(Blob)
    );
  });

  it('prefetches with abort signal for cancellation', async () => {
    seedPremiumSettings();
    renderHook(
      ({ text }) => useTtsPrefetch(text),
      { wrapper, initialProps: { text: 'I need water please' } }
    );

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    // Verify that fetch was called with a signal
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[1]).toHaveProperty('signal');
    expect(fetchCall[1].signal).toBeInstanceOf(AbortSignal);
  });
});
