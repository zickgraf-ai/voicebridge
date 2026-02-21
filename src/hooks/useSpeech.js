import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useVoices } from './useVoices';

export function useSpeech() {
  const { state } = useAppContext();
  const voices = useVoices();
  const { settings } = state;

  const speak = useCallback(
    (text) => {
      if (!window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.voiceRate || 0.9;
      const voice = voices.find((v) => v.voiceURI === settings.voiceURI) || voices[0];
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    },
    [voices, settings.voiceRate, settings.voiceURI]
  );

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, cancel, voices };
}
