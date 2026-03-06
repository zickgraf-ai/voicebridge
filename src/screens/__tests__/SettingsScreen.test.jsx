import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsScreen from '../SettingsScreen';

// Mock AppContext
vi.mock('../../context/AppContext', () => ({
  useAppContext: () => ({
    state: {
      settings: {
        autoSpeak: true,
        voiceProvider: 'premium',
        premiumVoice: 'nova',
        premiumOnly: false,
        voiceURI: '',
        voiceRate: 1.0,
        buttonSize: 'large',
        tabSize: 'xl',
        painReminder: 120,
        caregiverAlert: 6,
      },
      profile: { name: 'Sarah', dob: '', address: '', condition: 'Test', familyMembers: [], medications: [] },
      locations: [],
      categoryOrder: null,
    },
    setSettings: vi.fn(),
    setProfile: vi.fn(),
    setLocations: vi.fn(),
    setCategoryOrder: vi.fn(),
  }),
}));

vi.mock('../../hooks/useVoices', () => ({
  useVoices: () => [],
}));

vi.mock('../../hooks/usePremiumSpeech', () => ({
  PREMIUM_VOICES: [
    { id: 'nova', name: 'Nova', description: 'Warm' },
  ],
  usePremiumSpeech: () => ({
    importVoice: vi.fn(),
    removeVoice: vi.fn(),
    voiceStatus: {},
  }),
}));

vi.mock('../../hooks/useLocation', () => ({
  useLocation: () => ({
    coords: null,
    locationLabel: null,
    permissionGranted: false,
    requestPermission: vi.fn(),
  }),
}));

vi.mock('../../utils/audioCache', () => ({
  getAudio: vi.fn(),
  putAudio: vi.fn(),
  clearAudio: vi.fn(),
}));

vi.mock('../../data/audioManifest.json', () => ({ default: {} }));

describe('SettingsScreen', () => {
  it('renders the hub view by default', () => {
    render(<SettingsScreen onNavigate={() => {}} />);
    expect(screen.getByText(/Settings/)).toBeInTheDocument();
    expect(screen.getByText('Voice & Speech')).toBeInTheDocument();
    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('Health & Alerts')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Backup & Restore')).toBeInTheDocument();
    expect(screen.getByText('About TapToSpeak')).toBeInTheDocument();
  });

  it('navigates to Voice & Speech sub-page on click', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onNavigate={() => {}} />);
    await user.click(screen.getByText('Voice & Speech'));
    // Should show sub-page with back button
    expect(screen.getByLabelText('Back to settings')).toBeInTheDocument();
    // Should show voice settings
    expect(screen.getByLabelText('Auto-speak on tap')).toBeInTheDocument();
  });

  it('navigates to Display sub-page on click', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onNavigate={() => {}} />);
    await user.click(screen.getByText('Display'));
    expect(screen.getByLabelText('Back to settings')).toBeInTheDocument();
    expect(screen.getByText(/Category Tab Size/)).toBeInTheDocument();
  });

  it('navigates to Health & Alerts sub-page on click', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onNavigate={() => {}} />);
    await user.click(screen.getByText('Health & Alerts'));
    expect(screen.getByLabelText('Back to settings')).toBeInTheDocument();
    expect(screen.getByText(/Pain Reminder/)).toBeInTheDocument();
  });

  it('navigates back to hub from sub-page', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onNavigate={() => {}} />);
    await user.click(screen.getByText('Voice & Speech'));
    expect(screen.getByLabelText('Back to settings')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Back to settings'));
    // Should be back to hub
    expect(screen.getByText('Voice & Speech')).toBeInTheDocument();
    expect(screen.getByText('Display')).toBeInTheDocument();
  });

  it('calls onNavigate for About row', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<SettingsScreen onNavigate={onNavigate} />);
    await user.click(screen.getByText('About TapToSpeak'));
    expect(onNavigate).toHaveBeenCalledWith('about');
  });
});
