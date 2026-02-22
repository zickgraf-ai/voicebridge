import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement } from 'react';

// ---- Mocks (must be before imports that use them) ----

// audioCache mock
const mockCacheStore = new Map();
vi.mock('../../utils/audioCache', () => ({
  getAudio: vi.fn((key) => Promise.resolve(mockCacheStore.get(key) || null)),
  putAudio: vi.fn((key, blob) => {
    mockCacheStore.set(key, blob);
    return Promise.resolve();
  }),
  deleteAudio: vi.fn((key) => {
    mockCacheStore.delete(key);
    return Promise.resolve();
  }),
  getCacheStatus: vi.fn(() => Promise.resolve({ cached: 3, total: 3 })),
  clearAudio: vi.fn(() => {
    mockCacheStore.clear();
    return Promise.resolve();
  }),
  hasCachedKeySync: vi.fn((key) => mockCacheStore.has(key)),
}));

// audioManifest mock
vi.mock('../../data/audioManifest.json', () => ({
  default: {
    nova: { 'Yes': 'abc123def456.mp3', 'Hello, I need some water please.': 'test789abc.mp3' },
    shimmer: { 'Yes': 'shim123def456.mp3' },
    alloy: {},
    echo: {},
    onyx: {},
    fable: {},
  },
}));

// phrases mock
vi.mock('../../data/phrases', () => ({
  ALL_STANDARD_PHRASES: ['Yes', 'No', 'Hello, I need some water please.'],
}));

// Mock storage
const mockStorage = {};
vi.mock('../../utils/storage', () => ({
  loadState: vi.fn((key, fallback) => mockStorage[key] ?? fallback),
  saveState: vi.fn((key, value) => { mockStorage[key] = value; }),
  removeState: vi.fn((key) => { delete mockStorage[key]; }),
}));

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// ---- Audio mock using a class so `new Audio()` works ----
const audioInstances = [];
let audioPlayImpl = null; // override per-test

class MockAudioClass {
  constructor() {
    this.src = '';
    this.volume = 1;
    this.onplaying = null;
    this.onended = null;
    this.onerror = null;
    this.play = vi.fn(() => {
      if (audioPlayImpl) return audioPlayImpl(this);
      return Promise.resolve();
    });
    this.pause = vi.fn();
    audioInstances.push(this);
  }
}
globalThis.Audio = MockAudioClass;

// ---- Imports (after mocks) ----
import { AppProvider } from '../../context/AppContext';
import { usePremiumSpeech } from '../usePremiumSpeech';
import * as audioCache from '../../utils/audioCache';

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

function lastAudio() {
  return audioInstances[audioInstances.length - 1];
}

describe('usePremiumSpeech', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheStore.clear();
    mockFetch.mockReset();
    audioInstances.length = 0;
    audioPlayImpl = null;
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    globalThis.speechSynthesis.speaking = false;
    globalThis.speechSynthesis.pending = false;
    globalThis.speechSynthesis.speak.mockClear();
    globalThis.speechSynthesis.cancel.mockClear();
  });

  describe('Bundled path (PATH A)', () => {
    it('plays from static URL when phrase is in manifest for nova', async () => {
      seedPremiumSettings();
      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.speak('Yes', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
      });

      expect(lastAudio().src).toContain('/audio/nova/abc123def456.mp3');
      expect(lastAudio().play).toHaveBeenCalled();
      expect(globalThis.speechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('plays from static URL for shimmer + phrase in manifest', async () => {
      seedPremiumSettings({ premiumVoice: 'shimmer' });
      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.speak('Yes', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
      });

      expect(lastAudio().src).toContain('/audio/shimmer/shim123def456.mp3');
      expect(lastAudio().play).toHaveBeenCalled();
      expect(globalThis.speechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('falls through when bundled audio.play() rejects', async () => {
      seedPremiumSettings();

      // First play call rejects (bundled), subsequent calls succeed
      let callCount = 0;
      audioPlayImpl = () => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error('play failed'));
        return Promise.resolve();
      };

      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.speak('Yes', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
      });

      // After bundled failure, should fall through to Web Speech
      expect(globalThis.speechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('Sync cached path (PATH B)', () => {
    it('plays from IndexedDB when hasCachedKeySync returns true and no manifest entry', async () => {
      seedPremiumSettings();
      const blob = new Blob(['audio data that is long enough to pass size check'.repeat(3)], { type: 'audio/mp3' });
      mockCacheStore.set('nova:Custom typed phrase', blob);

      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.speak('Custom typed phrase', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
      });

      expect(globalThis.speechSynthesis.speak).not.toHaveBeenCalled();
      expect(lastAudio().play).toHaveBeenCalled();
    });

    it('deletes stale key when blob is null despite sync returning true', async () => {
      seedPremiumSettings();
      audioCache.hasCachedKeySync.mockReturnValueOnce(true);
      audioCache.getAudio.mockResolvedValueOnce(null);

      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.speak('Stale phrase', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
      });

      expect(audioCache.deleteAudio).toHaveBeenCalledWith('nova:Stale phrase');
    });
  });

  describe('Cache miss path (PATH C)', () => {
    it('starts Web Speech immediately for cache miss when not premiumOnly', async () => {
      seedPremiumSettings();
      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.speak('Unknown phrase not in manifest', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
      });

      expect(globalThis.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('waits for API when premiumOnly + cache miss', async () => {
      seedPremiumSettings({ premiumOnly: true });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/mp3' })),
      });

      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.speak('Unknown phrase not in manifest', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/speak', expect.any(Object));
      expect(lastAudio().play).toHaveBeenCalled();
    });

    it('falls back to Web Speech when premiumOnly + API failure', async () => {
      seedPremiumSettings({ premiumOnly: true });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.speak('Unknown phrase not in manifest', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
      });

      expect(globalThis.speechSynthesis.speak).toHaveBeenCalled();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Cancel timing (overlap fix)', () => {
    it('cancels Web Speech BEFORE audio.play() when sync-cached blob found', async () => {
      seedPremiumSettings();
      const blob = new Blob(['audio data that is long enough'.repeat(5)], { type: 'audio/mp3' });
      mockCacheStore.set('nova:Cached phrase', blob);

      const callOrder = [];
      globalThis.speechSynthesis.speaking = true;
      globalThis.speechSynthesis.cancel.mockImplementation(() => callOrder.push('cancel'));

      audioPlayImpl = () => {
        callOrder.push('play');
        return Promise.resolve();
      };

      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.speak('Cached phrase', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
      });

      const cancelIdx = callOrder.indexOf('cancel');
      const playIdx = callOrder.indexOf('play');
      expect(cancelIdx).toBeGreaterThanOrEqual(0);
      expect(playIdx).toBeGreaterThanOrEqual(0);
      expect(cancelIdx).toBeLessThan(playIdx);
    });
  });

  describe('Rapid taps (guard)', () => {
    it('pauses previous audio when second tap arrives', async () => {
      seedPremiumSettings();
      const blob = new Blob(['audio data long enough to pass'.repeat(3)], { type: 'audio/mp3' });
      mockCacheStore.set('nova:First', blob);
      mockCacheStore.set('nova:Second', blob);

      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        const p1 = result.current.speak('First', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
        const p2 = result.current.speak('Second', { voiceRate: 0.9, webVoices: [], webVoiceURI: '' });
        await Promise.all([p1, p2]);
      });

      // First audio should have been paused by the second speak call
      expect(audioInstances[0].pause).toHaveBeenCalled();
    });
  });

  describe('importVoice', () => {
    it('fetches manifest entries from CDN and stores via putAudio', async () => {
      seedPremiumSettings();
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mp3 data'], { type: 'audio/mp3' })),
      });

      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.importVoice('shimmer');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/audio/shimmer/shim123def456.mp3',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(audioCache.putAudio).toHaveBeenCalledWith('shimmer:Yes', expect.any(Blob));
    });

    it('reports progress during import', async () => {
      seedPremiumSettings();
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mp3'], { type: 'audio/mp3' })),
      });

      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.importVoice('shimmer');
      });

      expect(result.current.voiceStatus.shimmer).toBeDefined();
      expect(result.current.voiceStatus.shimmer.importing).toBe(false);
    });
  });

  describe('removeVoice', () => {
    it('calls clearAudio for the specified voice', async () => {
      seedPremiumSettings();
      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.removeVoice('shimmer');
      });

      expect(audioCache.clearAudio).toHaveBeenCalledWith('shimmer');
    });
  });

  describe('Nova skips API pre-cache', () => {
    it('does not start API pre-cache when manifest exists for nova', async () => {
      seedPremiumSettings();
      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Non-premium mode', () => {
    it('uses Web Speech directly when not premium', async () => {
      // Default settings have voiceProvider: 'device'
      const { result } = renderHook(() => usePremiumSpeech(), { wrapper });

      await act(async () => {
        await result.current.speak('Hello', {
          voiceRate: 0.9,
          webVoices: [{ voiceURI: 'test', name: 'Test' }],
          webVoiceURI: 'test',
        });
      });

      expect(globalThis.speechSynthesis.speak).toHaveBeenCalled();
      // No Audio instance should be created for non-premium
      expect(audioInstances.length).toBe(0);
    });
  });
});
