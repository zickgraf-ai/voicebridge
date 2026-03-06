import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackupRestoreSettings from '../BackupRestoreSettings';

describe('BackupRestoreSettings', () => {
  it('renders backup section', () => {
    render(
      <BackupRestoreSettings
        profile={{ name: 'Test' }}
        settings={{ autoSpeak: true }}
      />
    );
    expect(screen.getByText(/Backup & Restore/)).toBeInTheDocument();
  });

  it('renders backup button', () => {
    render(
      <BackupRestoreSettings
        profile={{ name: 'Test' }}
        settings={{ autoSpeak: true }}
      />
    );
    expect(screen.getByText(/Copy Encrypted Backup Link/)).toBeInTheDocument();
  });

  it('opens password modal when backup is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BackupRestoreSettings
        profile={{ name: 'Test' }}
        settings={{ autoSpeak: true }}
      />
    );
    await user.click(screen.getByText(/Copy Encrypted Backup Link/));
    expect(screen.getByText(/Encrypt Backup/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/)).toBeInTheDocument();
  });

  it('shows cancel button in modal', async () => {
    const user = userEvent.setup();
    render(
      <BackupRestoreSettings
        profile={{ name: 'Test' }}
        settings={{ autoSpeak: true }}
      />
    );
    await user.click(screen.getByText(/Copy Encrypted Backup Link/));
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
