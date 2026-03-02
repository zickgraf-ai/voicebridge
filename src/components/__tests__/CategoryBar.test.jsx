import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryBar from '../CategoryBar';

describe('CategoryBar', () => {
  it('renders all category tabs', () => {
    render(<CategoryBar active="smart" onSelect={() => {}} size="xl" />);

    expect(screen.getByText('Smart')).toBeInTheDocument();
    expect(screen.getByText('Mine')).toBeInTheDocument();
    expect(screen.getByText('Build')).toBeInTheDocument();
    expect(screen.getByText('Quick')).toBeInTheDocument();
    expect(screen.getByText('Med')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Comfort')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Feel')).toBeInTheDocument();
  });

  it('calls onSelect with category id when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CategoryBar active="smart" onSelect={onSelect} size="xl" />);

    await user.click(screen.getByText('Quick'));
    expect(onSelect).toHaveBeenCalledWith('quick');
  });

  it('highlights the active category', () => {
    render(<CategoryBar active="medical" onSelect={() => {}} size="xl" />);

    const medLabel = screen.getByText('Med');
    expect(medLabel).toHaveStyle({ color: '#fff', fontWeight: 700 });
  });

  it('dims inactive categories', () => {
    render(<CategoryBar active="smart" onSelect={() => {}} size="xl" />);

    const foodLabel = screen.getByText('Food');
    expect(foodLabel).toHaveStyle({ color: '#94A3B8', fontWeight: 500 });
  });

  it('renders with different size presets', () => {
    const { container: c1 } = render(
      <CategoryBar active="smart" onSelect={() => {}} size="normal" />
    );
    expect(c1.querySelectorAll('button').length).toBe(9);

    const { container: c2 } = render(
      <CategoryBar active="smart" onSelect={() => {}} size="xl" />
    );
    expect(c2.querySelectorAll('button').length).toBe(9);
  });
});
