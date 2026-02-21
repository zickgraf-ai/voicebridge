import { useState, useEffect } from 'react';
import { filterVoices } from '../utils/voiceFilter';

export function useVoices() {
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const load = () => {
      const all = synth.getVoices() || [];
      if (all.length > 0) {
        setVoices(filterVoices(all));
      }
    };

    // Initial load
    load();

    // Listen for voiceschanged (works on desktop Chrome/Firefox)
    synth.addEventListener('voiceschanged', load);

    // iOS Safari workaround: voiceschanged often never fires.
    // Poll a few times to catch async voice loading.
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      const all = synth.getVoices() || [];
      if (all.length > 0) {
        setVoices(filterVoices(all));
        clearInterval(poll);
      }
      if (attempts >= 20) clearInterval(poll);
    }, 250);

    return () => {
      synth.removeEventListener('voiceschanged', load);
      clearInterval(poll);
    };
  }, []);

  return voices;
}
