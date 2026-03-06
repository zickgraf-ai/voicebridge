import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithContext } from '../../test/renderWithContext';
import * as storage from '../../utils/storage';
import TalkScreen from '../TalkScreen';

// Hoisted mutable state for per-test premium toggle
const mockPremium = vi.hoisted(() => ({ isPremium: false }));

// Mock usePremiumSpeech to avoid fetch/IndexedDB in tests
vi.mock('../../hooks/usePremiumSpeech', () => ({
  usePremiumSpeech: () => ({
    speak: vi.fn(),
    cancel: vi.fn(),
    cacheProgress: { cached: 0, total: 0, loading: false },
    isPremium: mockPremium.isPremium,
    error: null,
  }),
  PREMIUM_VOICES: [{ id: 'nova', name: 'Nova' }],
}));

// Mock audioCache for premium pre-cache tests
const mockAudioFns = vi.hoisted(() => ({
  putAudio: vi.fn(() => Promise.resolve()),
  hasCachedKeySync: vi.fn(() => false),
}));
vi.mock('../../utils/audioCache', () => mockAudioFns);

// Mock useLocation to avoid geolocation
vi.mock('../../hooks/useLocation', () => ({
  useLocation: () => ({
    coords: null,
    locationLabel: null,
    error: null,
    permissionGranted: false,
    requestPermission: vi.fn(),
  }),
}));

// Mock useSuggestions to return predictable phrases
vi.mock('../../hooks/useSuggestions', () => ({
  useSuggestions: () => ({
    suggestions: [
      { t: 'Yes', i: '\u2705' },
      { t: 'No', i: '\u274C' },
      { t: 'Thank you', i: '\u{1F49B}' },
    ],
    aiActive: false,
    aiLoading: false,
  }),
}));

describe('TalkScreen integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPremium.isPremium = false;
    globalThis.speechSynthesis.getVoices.mockReturnValue([
      { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha', default: true },
    ]);
  });

  it('renders speech bar, categories, and phrase grid', () => {
    renderWithContext(<TalkScreen />);

    // Speech bar placeholder
    expect(screen.getByPlaceholderText('Tap here to type...')).toBeInTheDocument();
    // Category tabs
    expect(screen.getByText('Smart')).toBeInTheDocument();
    expect(screen.getByText('Quick')).toBeInTheDocument();
    // Smart phrases from mock
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('fills speech bar when a phrase button is tapped', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    await user.click(screen.getByText('Yes'));

    // "Yes" appears in the speech bar input value and the phrase grid text
    expect(screen.getByDisplayValue('Yes')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('switches categories when a category tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    await user.click(screen.getByText('Quick'));

    // Quick phrases should be visible
    expect(screen.getByText('Please')).toBeInTheDocument();
    expect(screen.getByText('Help!')).toBeInTheDocument();
    expect(screen.getByText('Bathroom')).toBeInTheDocument();
  });

  it('shows pain scale when pain button is tapped in Medical', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    // Switch to Medical tab
    await user.click(screen.getByText('Med'));

    // Tap the pain button
    await user.click(screen.getByText("I'm in pain"));

    // Pain scale buttons 1-10 should appear
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('speaks pain level and fills speech bar when pain number is tapped', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    await user.click(screen.getByText('Med'));
    await user.click(screen.getByText("I'm in pain"));
    await user.click(screen.getByText('5'));

    expect(screen.getByDisplayValue('My pain is 5 out of 10')).toBeInTheDocument();
  });

  it('clears speech bar when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    // Tap a phrase
    await user.click(screen.getByText('Yes'));
    // Now speech bar has text — find the clear button (✕)
    await user.click(screen.getByText('\u2715'));

    // Speech bar should be empty again
    expect(screen.getByPlaceholderText('Tap here to type...')).toBeInTheDocument();
  });

  it('enters edit mode when speech bar is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    await user.click(screen.getByPlaceholderText('Tap here to type...'));

    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('appends phrase text in edit mode', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    // Enter edit mode by clicking speech bar
    await user.click(screen.getByPlaceholderText('Tap here to type...'));
    // Type something
    await user.type(screen.getByPlaceholderText('Type your message...'), 'I need');

    // Now click a quick phrase tab and phrase
    await user.click(screen.getByText('Quick'));
    await user.click(screen.getByText('Bathroom'));

    // Should have appended
    const input = screen.getByPlaceholderText('Type your message...');
    expect(input).toHaveValue('I need Bathroom');
  });
});

describe('Mine category premium pre-cache', () => {
  let originalFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPremium.isPremium = true;
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/mpeg' })),
      })
    );
    globalThis.speechSynthesis.getVoices.mockReturnValue([
      { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha', default: true },
    ]);
    // Enable 'mine' category so it's visible in the category bar
    const allCats = ['smart', 'mine', 'build', 'quick', 'medical', 'food', 'comfort', 'people', 'emotions', 'prose'];
    const originalLoadState = storage.loadState;
    vi.spyOn(storage, 'loadState').mockImplementation((key, fallback) => {
      if (key === 'settings') {
        return {
          autoSpeak: true, voiceURI: '', voiceRate: 1.0, buttonSize: 'large',
          tabSize: 'xl', painReminder: 120, caregiverAlert: 6,
          voiceProvider: 'premium', premiumVoice: 'nova', premiumOnly: false,
          enabledCategories: allCats,
        };
      }
      return originalLoadState(key, fallback);
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('pre-caches premium voice when a custom phrase is added', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    // Navigate to Mine category
    await user.click(screen.getByText('Mine'));

    // Open AddPhraseModal via the action bar button
    await user.click(screen.getByRole('button', { name: /Add Phrase/ }));

    // Type a phrase in the modal
    await user.type(screen.getByPlaceholderText('Type your phrase...'), 'Good morning nurse');

    // Click the modal's Add Phrase submit button (exact text, no emoji prefix)
    await user.click(screen.getByRole('button', { name: 'Add Phrase' }));

    // Verify fetch was called with the phrase for pre-caching
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/speak', expect.objectContaining({
      method: 'POST',
    }));
    const fetchBody = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(fetchBody.text).toBe('Good morning nurse');
    expect(fetchBody.voice).toBe('nova');
  });

  it('skips pre-cache if phrase is already cached', async () => {
    mockAudioFns.hasCachedKeySync.mockReturnValue(true);

    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    await user.click(screen.getByText('Mine'));
    await user.click(screen.getByRole('button', { name: /Add Phrase/ }));
    await user.type(screen.getByPlaceholderText('Type your phrase...'), 'Already cached');
    await user.click(screen.getByRole('button', { name: 'Add Phrase' }));

    // fetch should NOT have been called since the phrase is already cached
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does not pre-cache when premium is disabled', async () => {
    mockPremium.isPremium = false;

    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    await user.click(screen.getByText('Mine'));
    await user.click(screen.getByRole('button', { name: /Add Phrase/ }));
    await user.type(screen.getByPlaceholderText('Type your phrase...'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Add Phrase' }));

    // fetch should NOT have been called since premium is off
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
