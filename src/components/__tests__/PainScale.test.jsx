import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PainScale from '../PainScale';

describe('PainScale', () => {
  it('renders buttons 1 through 10', () => {
    render(<PainScale onSelect={() => {}} />);

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('calls onSelect with pain phrase when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PainScale onSelect={onSelect} />);

    await user.click(screen.getByText('7'));
    expect(onSelect).toHaveBeenCalledWith('My pain is 7 out of 10');
  });

  it('renders all buttons as interactive elements', () => {
    render(<PainScale onSelect={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(10);
  });

  it('uses green for low pain (1-3)', () => {
    render(<PainScale onSelect={() => {}} />);
    const btn = screen.getByText('2');
    expect(btn).toHaveStyle({ background: '#10B981' });
  });

  it('uses yellow for moderate pain (4-6)', () => {
    render(<PainScale onSelect={() => {}} />);
    const btn = screen.getByText('5');
    expect(btn).toHaveStyle({ background: '#F59E0B' });
  });

  it('uses orange for high pain (7-8)', () => {
    render(<PainScale onSelect={() => {}} />);
    const btn = screen.getByText('8');
    expect(btn).toHaveStyle({ background: '#F97316' });
  });

  it('uses red for severe pain (9-10)', () => {
    render(<PainScale onSelect={() => {}} />);
    const btn = screen.getByText('10');
    expect(btn).toHaveStyle({ background: '#EF4444' });
  });
});
