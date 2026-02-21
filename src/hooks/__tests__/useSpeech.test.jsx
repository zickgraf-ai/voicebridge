import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { useSpeech } from '../useSpeech';

function wrapper({ children }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('useSpeech', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Return mock voices from getVoices
    globalThis.speechSynthesis.getVoices.mockReturnValue([
      { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha', default: true },
    ]);
  });

  it('returns speak and cancel functions', () => {
    const { result } = renderHook(() => useSpeech(), { wrapper });

    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
  });

  it('calls speechSynthesis.speak when speak is called', () => {
    const { result } = renderHook(() => useSpeech(), { wrapper });

    act(() => {
      result.current.speak('Hello');
    });

    expect(globalThis.speechSynthesis.cancel).toHaveBeenCalled();
    expect(globalThis.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('does nothing when speak is called with empty text', () => {
    const { result } = renderHook(() => useSpeech(), { wrapper });

    act(() => {
      result.current.speak('');
    });

    expect(globalThis.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('calls speechSynthesis.cancel when cancel is called', () => {
    const { result } = renderHook(() => useSpeech(), { wrapper });

    act(() => {
      result.current.cancel();
    });

    expect(globalThis.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('passes utterance with correct rate to speechSynthesis.speak', () => {
    const { result } = renderHook(() => useSpeech(), { wrapper });

    act(() => {
      result.current.speak('Test');
    });

    const utterance = globalThis.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).toBe('Test');
    // Default voiceRate is 0.9
    expect(utterance.rate).toBe(0.9);
  });
});
