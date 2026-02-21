import '@testing-library/jest-dom/vitest';

// Mock Web Speech API
globalThis.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

globalThis.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text || '';
    this.voice = null;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
  }
};

// Mock ResizeObserver
globalThis.ResizeObserver = class {
  constructor() {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  }
};

// Mock matchMedia
globalThis.matchMedia = vi.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
