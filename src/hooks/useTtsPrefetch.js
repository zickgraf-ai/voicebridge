import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { putAudio, hasCachedKeySync } from '../utils/audioCache';
import AUDIO_MANIFEST from '../data/audioManifest.json';

const DEBOUNCE_MS = 600;
const MIN_WORDS = 2;
const MIN_CHARS = 8;
const FETCH_TIMEOUT_MS = 5000;

/**
 * Prefetch TTS audio as the user types.
 *
 * After a 600ms typing pause, fetches TTS
 * for the full phrase and stores it in IndexedDB. When the user taps Speak,
 * the existing PATH B (hasCachedKeySync) finds the prefetched audio instantly.
 *
 * Does nothing when: not premium, text too short, text already cached,
 * or text matches a bundled manifest entry.
 */
export function useTtsPrefetch(text) {
  const { state } = useAppContext();
  const { settings } = state;
  const isPremium = settings.voiceProvider === 'premium';
  const voiceName = settings.premiumVoice || 'nova';

  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const lastPrefetchedRef = useRef('');

  useEffect(() => {
    // Clear previous debounce timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const trimmed = (text || '').trim();

    // Guard: skip if not premium or text too short
    if (!isPremium || !trimmed) return;
    const words = trimmed.split(/\s+/);
    if (words.length < MIN_WORDS || trimmed.length < MIN_CHARS) return;

    // Guard: skip if already cached or bundled
    const cacheKey = voiceName + ':' + trimmed;
    if (lastPrefetchedRef.current === cacheKey) return;
    if (hasCachedKeySync(cacheKey)) return;
    const voiceManifest = AUDIO_MANIFEST[voiceName];
    if (voiceManifest && voiceManifest[trimmed]) return;

    // Abort any in-flight prefetch from a previous text value
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // Start debounce timer
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const resp = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, voice: voiceName }),
          signal: controller.signal,
        });

        if (resp.ok && !controller.signal.aborted) {
          const blob = await resp.blob();
          await putAudio(cacheKey, blob);
          lastPrefetchedRef.current = cacheKey;
        }
      } catch {
        // Silent failure — PATH C/D handles it at speak time
      } finally {
        clearTimeout(timeoutId);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [text, isPremium, voiceName]);

  // Abort in-flight fetch on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);
}
