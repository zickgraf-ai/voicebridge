import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HealthAlertSettings from '../HealthAlertSettings';

describe('HealthAlertSettings', () => {
  const defaultSettings = {
    painReminder: 120,
    caregiverAlert: 6,
  };

  it('renders pain reminder control', () => {
    render(<HealthAlertSettings settings={defaultSettings} onUpdate={() => {}} />);
    expect(screen.getByText(/Pain Reminder/)).toBeInTheDocument();
  });

  it('renders caregiver alert control', () => {
    render(<HealthAlertSettings settings={defaultSettings} onUpdate={() => {}} />);
    expect(screen.getByText(/Alert Caregiver/)).toBeInTheDocument();
  });

  it('shows pain reminder options', () => {
    render(<HealthAlertSettings settings={defaultSettings} onUpdate={() => {}} />);
    expect(screen.getByText('1hr')).toBeInTheDocument();
    expect(screen.getByText('2hr')).toBeInTheDocument();
    expect(screen.getByText('4hr')).toBeInTheDocument();
    // "Off" appears in both pain reminder and caregiver alert
    expect(screen.getAllByText('Off').length).toBe(2);
  });

  it('calls onUpdate when pain reminder is changed', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<HealthAlertSettings settings={defaultSettings} onUpdate={onUpdate} />);
    await user.click(screen.getByText('4hr'));
    expect(onUpdate).toHaveBeenCalledWith('painReminder', 240);
  });
});
