import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasscodeModal from '../PasscodeModal';

describe('PasscodeModal', () => {
  it('renders number pad buttons 0-9', () => {
    render(<PasscodeModal mode="set" onSuccess={() => {}} onCancel={() => {}} />);
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('renders 4 dot indicators', () => {
    const { container } = render(
      <PasscodeModal mode="set" onSuccess={() => {}} onCancel={() => {}} />
    );
    const dots = container.querySelectorAll('[data-testid="pin-dot"]');
    expect(dots.length).toBe(4);
  });

  it('shows "Set a 4-digit PIN" title in set mode', () => {
    render(<PasscodeModal mode="set" onSuccess={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/Set a 4-digit PIN/i)).toBeInTheDocument();
  });

  it('shows "Enter PIN" title in verify mode', () => {
    render(<PasscodeModal mode="verify" correctPasscode="1234" onSuccess={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/Enter PIN/i)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<PasscodeModal mode="set" onSuccess={() => {}} onCancel={onCancel} />);
    await user.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onSuccess after entering and confirming 4 digits in set mode', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<PasscodeModal mode="set" onSuccess={onSuccess} onCancel={() => {}} />);

    // Enter PIN: 1-2-3-4
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: '4' }));

    // Should ask to confirm
    expect(screen.getByText(/Confirm PIN/i)).toBeInTheDocument();

    // Enter same PIN again
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: '4' }));

    expect(onSuccess).toHaveBeenCalledWith('1234');
  });

  it('shows error when confirm PIN does not match in set mode', async () => {
    const user = userEvent.setup();
    render(<PasscodeModal mode="set" onSuccess={() => {}} onCancel={() => {}} />);

    // Enter PIN: 1-2-3-4
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: '4' }));

    // Enter different PIN: 5-6-7-8
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '6' }));
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: '8' }));

    expect(screen.getByText(/PINs don't match/i)).toBeInTheDocument();
  });

  it('calls onSuccess when correct PIN is entered in verify mode', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<PasscodeModal mode="verify" correctPasscode="5678" onSuccess={onSuccess} onCancel={() => {}} />);

    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '6' }));
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: '8' }));

    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('shows error when wrong PIN is entered in verify mode', async () => {
    const user = userEvent.setup();
    render(<PasscodeModal mode="verify" correctPasscode="1234" onSuccess={() => {}} onCancel={() => {}} />);

    await user.click(screen.getByRole('button', { name: '9' }));
    await user.click(screen.getByRole('button', { name: '9' }));
    await user.click(screen.getByRole('button', { name: '9' }));
    await user.click(screen.getByRole('button', { name: '9' }));

    expect(screen.getByText(/Wrong PIN/i)).toBeInTheDocument();
  });

  it('has a backspace button', () => {
    render(<PasscodeModal mode="set" onSuccess={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText('Backspace')).toBeInTheDocument();
  });
});
