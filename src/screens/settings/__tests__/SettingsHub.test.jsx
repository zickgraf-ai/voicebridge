import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsHub from '../SettingsHub';

const mockSettings = {
  autoSpeak: true,
  voiceProvider: 'premium',
  premiumVoice: 'nova',
  voiceRate: 1.0,
  buttonSize: 'large',
  tabSize: 'xl',
  painReminder: 120,
  caregiverAlert: 6,
};

describe('SettingsHub', () => {
  it('renders all hub rows', () => {
    render(
      <SettingsHub
        settings={mockSettings}
        locations={[]}
        onSelectSection={() => {}}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByText('Voice & Speech')).toBeInTheDocument();
    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('Health & Alerts')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Backup & Restore')).toBeInTheDocument();
    expect(screen.getByText('About TapToSpeak')).toBeInTheDocument();
  });

  it('shows voice summary with premium voice name', () => {
    render(
      <SettingsHub
        settings={mockSettings}
        locations={[]}
        onSelectSection={() => {}}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByText(/Nova/i)).toBeInTheDocument();
    expect(screen.getByText(/Normal speed/i)).toBeInTheDocument();
  });

  it('shows display summary', () => {
    render(
      <SettingsHub
        settings={mockSettings}
        locations={[]}
        onSelectSection={() => {}}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByText(/Large/)).toBeInTheDocument();
    expect(screen.getByText(/XL/)).toBeInTheDocument();
  });

  it('shows location count', () => {
    render(
      <SettingsHub
        settings={mockSettings}
        locations={[{ label: 'Home' }, { label: 'Hospital' }]}
        onSelectSection={() => {}}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByText('2 saved')).toBeInTheDocument();
  });

  it('shows "None saved" when no locations', () => {
    render(
      <SettingsHub
        settings={mockSettings}
        locations={[]}
        onSelectSection={() => {}}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByText('None saved')).toBeInTheDocument();
  });

  it('calls onSelectSection when a row is clicked', async () => {
    const user = userEvent.setup();
    const onSelectSection = vi.fn();
    render(
      <SettingsHub
        settings={mockSettings}
        locations={[]}
        onSelectSection={onSelectSection}
        onNavigate={() => {}}
      />
    );
    await user.click(screen.getByText('Voice & Speech'));
    expect(onSelectSection).toHaveBeenCalledWith('voice');
  });

  it('calls onNavigate for About row', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <SettingsHub
        settings={mockSettings}
        locations={[]}
        onSelectSection={() => {}}
        onNavigate={onNavigate}
      />
    );
    await user.click(screen.getByText('About TapToSpeak'));
    expect(onNavigate).toHaveBeenCalledWith('about');
  });

  it('shows version footer', () => {
    render(
      <SettingsHub
        settings={mockSettings}
        locations={[]}
        onSelectSection={() => {}}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByText(/TapToSpeak v/)).toBeInTheDocument();
  });

  it('shows health summary with pain reminder', () => {
    render(
      <SettingsHub
        settings={mockSettings}
        locations={[]}
        onSelectSection={() => {}}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByText(/Pain reminder: 2hr/)).toBeInTheDocument();
  });
});
