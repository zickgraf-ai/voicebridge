import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithContext } from '../../test/renderWithContext';
import TalkScreen from '../TalkScreen';

// Mock usePremiumSpeech to avoid fetch/IndexedDB in tests
vi.mock('../../hooks/usePremiumSpeech', () => ({
  usePremiumSpeech: () => ({
    speak: vi.fn(),
    cancel: vi.fn(),
    cacheProgress: { cached: 0, total: 0, loading: false },
    error: null,
  }),
  PREMIUM_VOICES: [{ id: 'nova', name: 'Nova' }],
}));

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
    globalThis.speechSynthesis.getVoices.mockReturnValue([
      { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha', default: true },
    ]);
  });

  it('renders speech bar, categories, and phrase grid', () => {
    renderWithContext(<TalkScreen />);

    // Speech bar placeholder
    expect(screen.getByText('Tap here to type...')).toBeInTheDocument();
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

    // "Yes" now appears in both the speech bar and the phrase grid
    const matches = screen.getAllByText('Yes');
    expect(matches.length).toBeGreaterThanOrEqual(2);
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

    expect(screen.getByText('My pain is 5 out of 10')).toBeInTheDocument();
  });

  it('clears speech bar when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    // Tap a phrase
    await user.click(screen.getByText('Yes'));
    // Now speech bar has text — find the clear button (✕)
    await user.click(screen.getByText('\u2715'));

    // Speech bar should be empty again
    expect(screen.getByText('Tap here to type...')).toBeInTheDocument();
  });

  it('enters edit mode when speech bar is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    await user.click(screen.getByText('Tap here to type...'));

    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('appends phrase text in edit mode', async () => {
    const user = userEvent.setup();
    renderWithContext(<TalkScreen />);

    // Enter edit mode by clicking speech bar
    await user.click(screen.getByText('Tap here to type...'));
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
