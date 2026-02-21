import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CacheProgress from '../CacheProgress';

describe('CacheProgress', () => {
  it('renders nothing when not loading', () => {
    const { container } = render(
      <CacheProgress cached={0} total={10} loading={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when total is 0', () => {
    const { container } = render(
      <CacheProgress cached={0} total={0} loading={true} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows progress text when loading', () => {
    render(<CacheProgress cached={5} total={20} loading={true} />);
    expect(screen.getByText('Downloading voice... 5/20')).toBeInTheDocument();
  });

  it('renders progress bar', () => {
    const { container } = render(
      <CacheProgress cached={10} total={20} loading={true} />
    );
    // 50% width
    const bar = container.querySelector('[style*="width: 50%"]');
    expect(bar).not.toBeNull();
  });
});
