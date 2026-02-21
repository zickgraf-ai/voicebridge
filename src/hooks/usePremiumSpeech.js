import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { getAudio, putAudio, getCacheStatus } from '../utils/audioCache';
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
    window.speechSynthesis?.cancel();

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

    // When not premiumOnly, start Web Speech SYNCHRONOUSLY before any await.
    // iOS Safari requires speechSynthesis.speak() to be in the synchronous
    // user gesture handler chain — an await breaks this context.
    // If premium audio is found in cache, we cancel Web Speech and play it.
    if (!premiumOnly) {
      speakWebSpeech(text, voiceRate, webVoices, webVoiceURI);
    }

    // Try cached premium audio
    const key = voiceName + ':' + text;
    const blob = await getAudio(key);

    if (blob) {
      // Cancel Web Speech fallback — premium audio is available
      window.speechSynthesis?.cancel();
      setError(null);
      const url = URL.createObjectURL(blob);
      audio.src = url;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
        speakWebSpeech(text, voiceRate, webVoices, webVoiceURI);
      };
      audio.play().catch(() => {
        URL.revokeObjectURL(url);
        speakWebSpeech(text, voiceRate, webVoices, webVoiceURI);
      });
      return;
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
          // Fall back to Web Speech only on error
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
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate || 0.9;
  const voice = voices.find((v) => v.voiceURI === voiceURI) || voices[0];
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
