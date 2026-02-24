import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { getAudio, putAudio, getCacheStatus, deleteAudio, clearAudio, hasCachedKeySync } from '../utils/audioCache';
import { ALL_STANDARD_PHRASES } from '../data/phrases';
import { getIdentityPhrase } from '../utils/identity';
import AUDIO_MANIFEST from '../data/audioManifest.json';

const MAX_CONCURRENT = 5;
const IMPORT_BATCH_SIZE = 10;

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
 * Check if a phrase has a bundled static audio file in the manifest.
 */
function getBundledUrl(voice, phrase) {
  const voiceManifest = AUDIO_MANIFEST[voice];
  if (!voiceManifest) return null;
  const filename = voiceManifest[phrase];
  if (!filename) return null;
  return `/audio/${voice}/${filename}`;
}

/**
 * Check if a voice has any entries in the manifest (i.e., has been generated).
 */
function hasManifestEntries(voice) {
  const voiceManifest = AUDIO_MANIFEST[voice];
  return voiceManifest && Object.keys(voiceManifest).length > 0;
}

/**
 * Hook that manages premium TTS with bundled audio, IndexedDB cache,
 * voice import/download, and overlap-free fallback.
 */
export function usePremiumSpeech() {
  const { state } = useAppContext();
  const { settings, profile } = state;
  const isPremium = settings.voiceProvider === 'premium';
  const voiceName = settings.premiumVoice || 'nova';
  const premiumOnly = settings.premiumOnly || false;

  const [cacheProgress, setCacheProgress] = useState({ cached: 0, total: 0, loading: false });
  const [error, setError] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState({});
  const abortRef = useRef(null);
  const audioRef = useRef(null);
  const importAbortRef = useRef(null);

  // Pre-cache dynamic profile phrases (identity, family, medications)
  // so the first tap on "My Info", "Call Jeff", "Time for Ibuprofen" etc.
  // plays the premium voice instantly instead of falling back to Web Speech.
  const profileRef = useRef(null);
  useEffect(() => {
    if (!isPremium) return;

    const p = profile || {};
    const phrases = [];

    // Identity phrase ("My Info")
    const identity = getIdentityPhrase(p);
    if (identity) phrases.push(identity);

    // Family member phrases ("Call X", "Where's X?")
    for (const f of p.familyMembers || []) {
      if (f.name) {
        phrases.push('Call ' + f.name);
        phrases.push("Where's " + f.name + '?');
      }
    }

    // Medication phrases ("Time for X")
    for (const m of p.medications || []) {
      if (m.name) {
        phrases.push('Time for ' + m.name);
      }
    }

    if (phrases.length === 0) return;

    // Build a fingerprint to avoid re-fetching unchanged phrases
    const fingerprint = voiceName + ':' + phrases.join('|');
    if (profileRef.current === fingerprint) return;
    profileRef.current = fingerprint;

    let cancelled = false;
    (async () => {
      for (const text of phrases) {
        if (cancelled) break;
        const key = voiceName + ':' + text;
        if (hasCachedKeySync(key)) continue;
        const existing = await getAudio(key);
        if (existing || cancelled) continue;

        try {
          const resp = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice: voiceName }),
          });
          if (resp.ok && !cancelled) {
            const blob = await resp.blob();
            await putAudio(key, blob);
          }
        } catch {
          // Silent — Web Speech fallback will handle it
        }
      }
    })();

    return () => { cancelled = true; };
  }, [isPremium, voiceName, profile]);

  // Check cache status on mount and when voice changes
  useEffect(() => {
    if (!isPremium) return;

    let cancelled = false;

    // If the voice has manifest entries, skip API pre-cache entirely.
    // The manifest means static files exist on CDN/service worker.
    if (hasManifestEntries(voiceName)) {
      // Just check IndexedDB status for non-bundled phrases (custom/typed text)
      getCacheStatus(voiceName, ALL_STANDARD_PHRASES).then((status) => {
        if (!cancelled) {
          setCacheProgress({ ...status, loading: false });
        }
      });
      return () => { cancelled = true; };
    }

    // No manifest entries — fall back to old API pre-cache behavior
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

  // Initialize voice status on mount
  useEffect(() => {
    if (!isPremium) return;

    const initStatus = async () => {
      const status = {};
      for (const v of PREMIUM_VOICES) {
        const manifestEntries = AUDIO_MANIFEST[v.id] ? Object.keys(AUDIO_MANIFEST[v.id]).length : 0;
        if (manifestEntries > 0) {
          // Has manifest — check how many are in IndexedDB
          const cacheInfo = await getCacheStatus(v.id, ALL_STANDARD_PHRASES);
          status[v.id] = { cached: cacheInfo.cached, total: manifestEntries, importing: false };
        } else {
          status[v.id] = { cached: 0, total: 0, importing: false };
        }
      }
      setVoiceStatus(status);
    };

    initStatus();
  }, [isPremium]);

  const startPreCache = useCallback(async (voice, initialStatus) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const PRIORITY_PHRASES = ['Hello, I need some water please.'];
    const phrasesToCache = [];
    const seen = new Set();

    for (const phrase of PRIORITY_PHRASES) {
      const key = voice + ':' + phrase;
      const existing = await getAudio(key);
      if (!existing) {
        phrasesToCache.push(phrase);
      }
      seen.add(phrase);
    }

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
   * Import all phrases for a voice from CDN static files into IndexedDB.
   * This provides offline access and instant playback for non-bundled voices.
   */
  const importVoice = useCallback(async (voice) => {
    const manifest = AUDIO_MANIFEST[voice];
    if (!manifest) return;

    const entries = Object.entries(manifest);
    if (entries.length === 0) return;

    // Abort any existing import
    if (importAbortRef.current) {
      importAbortRef.current.abort();
    }
    const controller = new AbortController();
    importAbortRef.current = controller;

    setVoiceStatus((prev) => ({
      ...prev,
      [voice]: { cached: 0, total: entries.length, importing: true },
    }));

    let cached = 0;

    for (let i = 0; i < entries.length; i += IMPORT_BATCH_SIZE) {
      if (controller.signal.aborted) break;

      const batch = entries.slice(i, i + IMPORT_BATCH_SIZE);
      const promises = batch.map(async ([phrase, filename]) => {
        try {
          const resp = await fetch(`/audio/${voice}/${filename}`, {
            signal: controller.signal,
          });
          if (resp.ok) {
            const blob = await resp.blob();
            await putAudio(voice + ':' + phrase, blob);
            cached++;
            setVoiceStatus((prev) => ({
              ...prev,
              [voice]: { ...prev[voice], cached },
            }));
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('Failed to import:', voice, phrase, err);
          }
        }
      });

      await Promise.all(promises);
    }

    if (!controller.signal.aborted) {
      setVoiceStatus((prev) => ({
        ...prev,
        [voice]: { cached, total: entries.length, importing: false },
      }));
    }

    importAbortRef.current = null;
  }, []);

  /**
   * Remove all cached audio for a voice from IndexedDB.
   */
  const removeVoice = useCallback(async (voice) => {
    await clearAudio(voice);
    setVoiceStatus((prev) => ({
      ...prev,
      [voice]: { cached: 0, total: prev[voice]?.total || 0, importing: false },
    }));
  }, []);

  /**
   * Speak text using the 4-path priority system:
   *
   * PATH A — Bundled: phrase exists in static manifest → play from URL
   * PATH B — IndexedDB (sync check): hasCachedKeySync → play from cache
   * PATH C — Cache miss: Web Speech fallback + background API fetch
   * PATH D — premiumOnly + miss: wait for API, fallback on error
   */
  const speak = useCallback(async (text, { voiceRate = 0.9, webVoices = [], webVoiceURI = '' } = {}) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Only cancel Web Speech if something is actually playing or queued.
    const synth = window.speechSynthesis;
    const wasSpeaking = synth && (synth.speaking || synth.pending);
    if (wasSpeaking) {
      synth.cancel();
    }

    if (!text) return;

    if (!isPremium) {
      // iOS Safari bug: after synth.cancel(), the next utterance can have
      // its first word swallowed or start muted. A brief delay fixes this.
      if (wasSpeaking) {
        setTimeout(() => speakWebSpeech(text, voiceRate, webVoices, webVoiceURI), 80);
      } else {
        speakWebSpeech(text, voiceRate, webVoices, webVoiceURI);
      }
      return;
    }

    // iOS Safari: create Audio element synchronously in the user gesture handler
    const audio = new Audio();
    audio.volume = 1;
    audioRef.current = audio;

    const key = voiceName + ':' + text;

    // ----- PATH A: Bundled static audio -----
    const bundledUrl = getBundledUrl(voiceName, text);
    if (bundledUrl) {
      audio.src = bundledUrl;
      audio.onended = () => {
        if (audioRef.current === audio) audioRef.current = null;
      };
      audio.onerror = () => {
        if (audioRef.current === audio) audioRef.current = null;
        // Bundled file failed — fall through to IndexedDB/Web Speech
        speakFallback(text, key, audio, voiceRate, webVoices, webVoiceURI);
      };
      try {
        await audio.play();
        return;
      } catch {
        // play() rejected — fall through to next path
      }
    }

    // ----- PATH B: IndexedDB sync cached -----
    if (hasCachedKeySync(key)) {
      const blob = await getAudio(key);

      // Guard: bail if another tap happened
      if (audioRef.current !== audio) return;

      if (blob && blob.size > 100) {
        setError(null);
        const url = URL.createObjectURL(blob);
        audio.src = url;

        // Cancel Web Speech BEFORE play (overlap fix)
        if (synth && (synth.speaking || synth.pending)) {
          synth.cancel();
        }

        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
          deleteAudio(key);
        };
        try {
          await audio.play();
          return;
        } catch {
          URL.revokeObjectURL(url);
          deleteAudio(key);
        }
      } else {
        // Stale/corrupt cache entry
        deleteAudio(key);
      }
    }

    // ----- PATH C / D: Cache miss -----
    if (!premiumOnly) {
      // PATH C: Start Web Speech fallback, background cache
      // Release the unused Audio element so it doesn't interfere with
      // iOS Safari's audio session (creating Audio() claims the session).
      audio.src = '';
      audioRef.current = null;

      // iOS Safari/WebKit bug: the first word of a Web Speech utterance can
      // be swallowed or muted after synth.cancel() OR after creating an
      // Audio element (which claims the audio session). Since PATH C always
      // follows Audio() creation above, always delay to let the audio
      // session settle before speaking.
      setTimeout(() => speakWebSpeech(text, voiceRate, webVoices, webVoiceURI), 80);

      // Double-check async (maybe sync set wasn't populated yet)
      const blob = await getAudio(key);
      if (blob && blob.size > 100) {
        // Found in async check — but DON'T interrupt Web Speech mid-utterance.
        // The jarring cancel→switch causes a muted-then-loud volume jump.
        // Just cache it silently; next tap will use the cached premium audio.
        return;
      }

      // Not cached at all — background API fetch for next time
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
      // PATH D: premiumOnly — wait for API response
      try {
        const resp = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: voiceName }),
        });
        if (audioRef.current !== audio) return;
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

  /**
   * Fallback when bundled audio fails — tries IndexedDB then Web Speech.
   */
  const speakFallback = useCallback(async (text, key, originalAudio, voiceRate, webVoices, webVoiceURI) => {
    // Try IndexedDB
    const blob = await getAudio(key);
    if (audioRef.current !== originalAudio && audioRef.current !== null) return;

    if (blob && blob.size > 100) {
      const url = URL.createObjectURL(blob);
      const audio = new Audio();
      audio.volume = 1;
      audio.src = url;
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
      };
      try {
        await audio.play();
        return;
      } catch {
        URL.revokeObjectURL(url);
      }
    }

    // Last resort: Web Speech
    speakWebSpeech(text, voiceRate, webVoices, webVoiceURI);
  }, []);

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, cancel, cacheProgress, isPremium, error, importVoice, removeVoice, voiceStatus };
}

function speakWebSpeech(text, rate, voices, voiceURI) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate || 0.9;
  const voice = voices.find((v) => v.voiceURI === voiceURI) || voices[0];
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}
