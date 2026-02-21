import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BottomNav from '../BottomNav';

describe('BottomNav', () => {
  it('renders all four tabs', () => {
    render(<BottomNav active="talk" onSelect={() => {}} />);

    expect(screen.getByText('Talk')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Care')).toBeInTheDocument();
  });

  it('calls onSelect with tab id when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BottomNav active="talk" onSelect={onSelect} />);

    await user.click(screen.getByText('Settings'));
    expect(onSelect).toHaveBeenCalledWith('settings');
  });

  it('highlights the active tab', () => {
    render(<BottomNav active="care" onSelect={() => {}} />);

    const careLabel = screen.getByText('Care');
    expect(careLabel).toHaveStyle({ color: '#3B82F6', fontWeight: 700 });
  });

  it('dims inactive tabs', () => {
    render(<BottomNav active="talk" onSelect={() => {}} />);

    const settingsLabel = screen.getByText('Settings');
    expect(settingsLabel).toHaveStyle({ color: '#64748B', fontWeight: 400 });
  });
});
