import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithContext } from '../../test/renderWithContext';
import CareScreen from '../CareScreen';

// Mock audioCache
vi.mock('../../utils/audioCache', () => ({
  putAudio: vi.fn(() => Promise.resolve()),
  hasCachedKeySync: vi.fn(() => false),
}));

// Mock audioManifest
vi.mock('../../data/audioManifest.json', () => ({
  default: {
    nova: {
      'Yes': '93cba07454f0.mp3',
      'No': 'bafd7322c6e9.mp3',
    },
  },
}));

// Mock AppContext to control settings
const mockSetPinnedPhrases = vi.fn((updater) => {
  // Call the updater so the test can verify it was called with a function
  if (typeof updater === 'function') updater([]);
});

vi.mock('../../context/AppContext', async () => {
  const actual = await vi.importActual('../../context/AppContext');
  return {
    ...actual,
    useAppContext: () => ({
      state: {
        profile: { name: 'Sarah', condition: 'Jaw Surgery Recovery', medications: [] },
        history: [],
        pinnedPhrases: [],
        settings: {
          voiceProvider: 'premium',
          premiumVoice: 'nova',
          autoSpeak: true,
          voiceRate: 0.9,
          buttonSize: 'large',
          tabSize: 'xl',
          painReminder: 120,
          caregiverAlert: 6,
        },
      },
      setPinnedPhrases: mockSetPinnedPhrases,
    }),
  };
});

describe('CareScreen audio pre-caching', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/mpeg' })),
    });
  });

  it('pre-fetches audio when pinning a custom phrase with premium voice', async () => {
    const user = userEvent.setup();
    const { putAudio } = await import('../../utils/audioCache');

    render(<CareScreen />);

    // Navigate to pins tab
    await user.click(screen.getByRole('tab', { name: /pinned/i }));

    // Open pin UI
    await user.click(screen.getByText(/pin a phrase/i));

    // Type a custom phrase
    const input = screen.getByPlaceholderText('Type a phrase to pin...');
    await user.type(input, 'I need help');
    await user.click(screen.getByRole('button', { name: 'Pin' }));

    // Should have called fetch with the phrase
    expect(fetchSpy).toHaveBeenCalledWith('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'I need help', voice: 'nova' }),
    });

    // Wait for the async cache to complete
    await vi.waitFor(() => {
      expect(putAudio).toHaveBeenCalledWith('nova:I need help', expect.any(Blob));
    });
  });

  it('skips pre-fetch for phrases already in manifest (bundled)', async () => {
    const user = userEvent.setup();

    render(<CareScreen />);

    // Navigate to pins tab
    await user.click(screen.getByRole('tab', { name: /pinned/i }));

    // Open pin UI
    await user.click(screen.getByText(/pin a phrase/i));

    // Type a phrase that IS in the manifest
    const input = screen.getByPlaceholderText('Type a phrase to pin...');
    await user.type(input, 'Yes');
    await user.click(screen.getByRole('button', { name: 'Pin' }));

    // Should NOT have called fetch since "Yes" is in the nova manifest
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips pre-fetch for phrases already cached in IndexedDB', async () => {
    const { hasCachedKeySync } = await import('../../utils/audioCache');
    hasCachedKeySync.mockReturnValue(true);

    const user = userEvent.setup();

    render(<CareScreen />);

    await user.click(screen.getByRole('tab', { name: /pinned/i }));
    await user.click(screen.getByText(/pin a phrase/i));

    const input = screen.getByPlaceholderText('Type a phrase to pin...');
    await user.type(input, 'Custom cached phrase');
    await user.click(screen.getByRole('button', { name: 'Pin' }));

    // Should NOT fetch since hasCachedKeySync returns true
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

function render(ui) {
  // Use @testing-library/react render directly since we mock useAppContext
  return require('@testing-library/react').render(ui);
}
