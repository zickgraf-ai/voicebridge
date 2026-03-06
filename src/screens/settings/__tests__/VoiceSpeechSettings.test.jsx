import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceSpeechSettings from '../VoiceSpeechSettings';

vi.mock('../../../hooks/useVoices', () => ({
  useVoices: () => [
    { name: 'Samantha', voiceURI: 'samantha', default: true, lang: 'en-US' },
    { name: 'Alex', voiceURI: 'alex', default: false, lang: 'en-US' },
  ],
}));

vi.mock('../../../hooks/usePremiumSpeech', () => ({
  PREMIUM_VOICES: [
    { id: 'nova', name: 'Nova', description: 'Warm and natural' },
    { id: 'shimmer', name: 'Shimmer', description: 'Clear and bright' },
  ],
  usePremiumSpeech: () => ({
    importVoice: vi.fn(),
    removeVoice: vi.fn(),
    voiceStatus: {},
  }),
}));

vi.mock('../../../utils/audioCache', () => ({
  getAudio: vi.fn(),
  putAudio: vi.fn(),
  clearAudio: vi.fn(),
}));

vi.mock('../../../data/audioManifest.json', () => ({ default: {} }));

const defaultSettings = {
  autoSpeak: true,
  voiceProvider: 'premium',
  premiumVoice: 'nova',
  premiumOnly: false,
  voiceURI: 'samantha',
  voiceRate: 1.0,
};

describe('VoiceSpeechSettings', () => {
  it('renders auto-speak toggle', () => {
    render(<VoiceSpeechSettings settings={defaultSettings} onUpdate={() => {}} />);
    expect(screen.getByLabelText('Auto-speak on tap')).toBeInTheDocument();
  });

  it('renders voice provider selection', () => {
    render(<VoiceSpeechSettings settings={defaultSettings} onUpdate={() => {}} />);
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Device')).toBeInTheDocument();
  });

  it('renders speed control', () => {
    render(<VoiceSpeechSettings settings={defaultSettings} onUpdate={() => {}} />);
    expect(screen.getByText('Slow')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();
  });

  it('renders test voice button', () => {
    render(<VoiceSpeechSettings settings={defaultSettings} onUpdate={() => {}} />);
    expect(screen.getByText(/Test.*Voice/)).toBeInTheDocument();
  });

  it('calls onUpdate when auto-speak is toggled', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<VoiceSpeechSettings settings={defaultSettings} onUpdate={onUpdate} />);
    await user.click(screen.getByLabelText('Auto-speak on tap'));
    expect(onUpdate).toHaveBeenCalledWith('autoSpeak', false);
  });

  it('shows premium voice picker when premium selected', () => {
    render(<VoiceSpeechSettings settings={defaultSettings} onUpdate={() => {}} />);
    expect(screen.getAllByText('Nova').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Shimmer').length).toBeGreaterThanOrEqual(1);
  });

  it('shows device voice picker when device selected', () => {
    const settings = { ...defaultSettings, voiceProvider: 'device' };
    render(<VoiceSpeechSettings settings={settings} onUpdate={() => {}} />);
    expect(screen.getByLabelText('Device voice')).toBeInTheDocument();
  });
});
