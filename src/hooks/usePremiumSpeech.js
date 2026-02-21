import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { getAudio, putAudio, getCacheStatus, deleteAudio } from '../utils/audioCache';
import { ALL_STANDARD_PHRASES } from '../data/phrases';

const MAX_CONCURRENT = 5;

// Premium voice options
export const PREMIUM_VOICES = [
  { id: 'nova', name: 'Nova', description: 'Warm female' },
  { id: 'shimmer', name: 'Shimmer', description: 'Expressive female' },
  { id: 'alloy', name: 'Alloy', description: 'Neutral' },
  { id: 'echo', name: 'Echo', description: 'Male' },
  { id: 'onyx', name: 'Onyx', description: 'Deep male' },
  { id: 'fable', name: 'Fable', description: 'Storyteller' },
];

/**
 * Hook that manages premium TTS with full pre-cache, progress tracking,
 * optimistic Web Speech API fallback, and voice switching re-cache.
 */
export function usePremiumSpeech() {
  const { state } = useAppContext();
  const { settings } = state;
  const isPremium = settings.voiceProvider === 'premium';
  const voiceName = settings.premiumVoice || 'nova';
  const premiumOnly = settings.premiumOnly || false;

  const [cacheProgress, setCacheProgress] = useState({ cached: 0, total: 0, loading: false });
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const audioRef = useRef(null);

  // Check cache status on mount and when voice changes
  useEffect(() => {
    if (!isPremium) return;

    let cancelled = false;
    getCacheStatus(voiceName, ALL_STANDARD_PHRASES).then((status) => {
      if (!cancelled) {
        setCacheProgress({ ...status, loading: status.cached < status.total });
        if (status.cached < status.total) {
          startPreCache(voiceName, status);
        }
      }
    });

    return () => {
      cancelled = true;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [isPremium, voiceName]);

  const startPreCache = useCallback(async (voice, initialStatus) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    // Priority phrases cached first (e.g. test voice phrase)
    const PRIORITY_PHRASES = ['Hello, I need some water please.'];

    const phrasesToCache = [];
    const seen = new Set();

    // Add priority phrases first
    for (const phrase of PRIORITY_PHRASES) {
      const key = voice + ':' + phrase;
      const existing = await getAudio(key);
      if (!existing) {
        phrasesToCache.push(phrase);
      }
      seen.add(phrase);
    }

    // Then the rest
    for (const phrase of ALL_STANDARD_PHRASES) {
      if (seen.has(phrase)) continue;
      const key = voice + ':' + phrase;
      const existing = await getAudio(key);
      if (!existing) {
        phrasesToCache.push(phrase);
      }
    }

    if (phrasesToCache.length === 0) {
      setCacheProgress({ cached: ALL_STANDARD_PHRASES.length, total: ALL_STANDARD_PHRASES.length, loading: false });
      return;
    }

    let cached = initialStatus?.cached || (ALL_STANDARD_PHRASES.length - phrasesToCache.length);
    const total = ALL_STANDARD_PHRASES.length;
    setCacheProgress({ cached, total, loading: true });

    // Process in batches of MAX_CONCURRENT
    for (let i = 0; i < phrasesToCache.length; i += MAX_CONCURRENT) {
      if (controller.signal.aborted) break;

      const batch = phrasesToCache.slice(i, i + MAX_CONCURRENT);
      const promises = batch.map(async (phrase) => {
        try {
          const resp = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: phrase, voice }),
            signal: controller.signal,
          });
          if (resp.ok) {
            const blob = await resp.blob();
            await putAudio(voice + ':' + phrase, blob);
            cached++;
            setCacheProgress((prev) => ({ ...prev, cached }));
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('Failed to cache:', phrase, err);
          }
        }
      });

      await Promise.all(promises);
    }

    if (!controller.signal.aborted) {
      setCacheProgress({ cached, total, loading: false });
    }
  }, []);

  /**
   * Speak text using premium voice (cached) or fall back to Web Speech API.
   */
  const speak = useCallback(async (text, { voiceRate = 0.9, webVoices = [], webVoiceURI = '' } = {}) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Only cancel Web Speech if something is actually playing or queued.
    // Calling cancel() with nothing active can put iOS Safari's synth
    // into a bad state where the next speak() call is silently dropped.
    const synth = window.speechSynthesis;
    if (synth && (synth.speaking || synth.pending)) {
      synth.cancel();
    }

    if (!text) return;

    if (!isPremium) {
      speakWebSpeech(text, voiceRate, webVoices, webVoiceURI);
      return;
    }

    // iOS Safari: create Audio element synchronously in the user gesture handler
    // so it's "blessed" for playback even after async operations
    const audio = new Audio();
    audio.volume = 1;
    audioRef.current = audio;

    const key = voiceName + ':' + text;

    // When not premiumOnly, ALWAYS start Web Speech synchronously.
    // iOS Safari requires speechSynthesis.speak() in the sync gesture chain.
    // If premium audio is found in cache (~5ms), we cancel Web Speech before
    // it produces audible output. This avoids silence when sync cache checks
    // disagree with async IndexedDB reads.
    if (!premiumOnly) {
      speakWebSpeech(text, voiceRate, webVoices, webVoiceURI);
    }

    // Try cached premium audio
    const blob = await getAudio(key);

    // Guard: if another tap happened while we were awaiting, bail out.
    // This prevents stale async continuations from playing over the new tap.
    if (audioRef.current !== audio) return;

    if (blob && blob.size > 100) {
      setError(null);
      const url = URL.createObjectURL(blob);
      audio.src = url;
      audio.onplaying = () => {
        // Only cancel Web Speech AFTER premium audio is confirmed playing.
        // This prevents silence if the blob is corrupt/unplayable.
        if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) {
          window.speechSynthesis.cancel();
        }
      };
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
        // Delete corrupt cache entry so the next tap works.
        // Do NOT retry speakWebSpeech here — we're outside iOS gesture context.
        deleteAudio(key);
      };
      audio.play().catch(() => {
        URL.revokeObjectURL(url);
        // Delete corrupt cache entry; Web Speech fallback continues naturally
        deleteAudio(key);
      });
      return;
    }

    // Blob was null or too small (corrupt) — delete it if it exists
    if (blob) {
      deleteAudio(key);
    }

    // Not cached: behavior depends on premiumOnly setting
    if (!premiumOnly) {
      // Web Speech is already playing (started synchronously above).
      // Cache premium audio in background for next time.
      audioRef.current = null;

      try {
        const resp = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: voiceName }),
        });
        if (audioRef.current !== null) return; // another tap took over
        if (resp.ok) {
          const newBlob = await resp.blob();
          await putAudio(key, newBlob);
          setError(null);
        } else if (resp.status === 429) {
          setError('Premium voice rate limited. Using device voice.');
          setTimeout(() => setError(null), 5000);
        } else {
          setError('Premium voice unavailable. Using device voice.');
          setTimeout(() => setError(null), 5000);
        }
      } catch {
        setError('Could not reach voice server. Using device voice.');
        setTimeout(() => setError(null), 5000);
      }
    } else {
      // Premium only: wait for API response and play it directly
      try {
        const resp = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: voiceName }),
        });
        if (audioRef.current !== audio) return; // another tap took over
        if (resp.ok) {
          const newBlob = await resp.blob();
          await putAudio(key, newBlob);
          setError(null);
          const url = URL.createObjectURL(newBlob);
          audio.src = url;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            if (audioRef.current === audio) audioRef.current = null;
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            if (audioRef.current === audio) audioRef.current = null;
          };
          audio.play().catch(() => URL.revokeObjectURL(url));
        } else {
          audioRef.current = null;
          const msg = resp.status === 429
            ? 'Premium voice rate limited.'
            : 'Premium voice unavailable.';
          setError(msg);
          setTimeout(() => setError(null), 5000);
          speakWebSpeech(text, voiceRate, webVoices, webVoiceURI);
        }
      } catch {
        audioRef.current = null;
        setError('Could not reach voice server.');
        setTimeout(() => setError(null), 5000);
        speakWebSpeech(text, voiceRate, webVoices, webVoiceURI);
      }
    }
  }, [isPremium, voiceName, premiumOnly]);

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, cancel, cacheProgress, isPremium, error };
}

function speakWebSpeech(text, rate, voices, voiceURI) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  // Do NOT call cancel() here — the caller is responsible for cancellation.
  // Double cancel → speak in the same call stack causes silence on iOS Safari.
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate || 0.9;
  const voice = voices.find((v) => v.voiceURI === voiceURI) || voices[0];
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}
