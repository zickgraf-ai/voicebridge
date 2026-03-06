import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToggleSwitch from '../ToggleSwitch';

describe('ToggleSwitch', () => {
  it('renders with checked state', () => {
    render(<ToggleSwitch checked={true} onChange={() => {}} ariaLabel="Test toggle" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders with unchecked state', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} ariaLabel="Test toggle" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} ariaLabel="Test toggle" />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('calls onChange on Enter key', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} ariaLabel="Test toggle" />);
    screen.getByRole('switch').focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('uses custom color when checked', () => {
    render(<ToggleSwitch checked={true} onChange={() => {}} ariaLabel="Test" color="#8B5CF6" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveStyle({ background: '#8B5CF6' });
  });

  it('uses default green color when checked and no color prop', () => {
    render(<ToggleSwitch checked={true} onChange={() => {}} ariaLabel="Test" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveStyle({ background: '#10B981' });
  });

  it('uses grey background when unchecked', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} ariaLabel="Test" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveStyle({ background: '#475569' });
  });

  it('has the correct aria-label', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} ariaLabel="Auto-speak" />);
    expect(screen.getByLabelText('Auto-speak')).toBeInTheDocument();
  });
});
