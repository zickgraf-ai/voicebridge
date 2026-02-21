import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SegmentControl from '../SegmentControl';

const OPTIONS = [
  { label: 'Slow', value: 0.7 },
  { label: 'Normal', value: 0.9 },
  { label: 'Fast', value: 1.1 },
];

describe('SegmentControl', () => {
  it('renders the label', () => {
    render(
      <SegmentControl label="Speed" options={OPTIONS} value={0.9} onChange={() => {}} />
    );
    expect(screen.getByText('Speed')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(
      <SegmentControl label="Speed" options={OPTIONS} value={0.9} onChange={() => {}} />
    );
    expect(screen.getByText('Slow')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();
  });

  it('highlights the selected option', () => {
    render(
      <SegmentControl label="Speed" options={OPTIONS} value={0.9} onChange={() => {}} />
    );
    expect(screen.getByText('Normal')).toHaveStyle({ background: '#3B82F6', color: '#fff' });
  });

  it('dims unselected options', () => {
    render(
      <SegmentControl label="Speed" options={OPTIONS} value={0.9} onChange={() => {}} />
    );
    expect(screen.getByText('Slow')).toHaveStyle({ background: '#0F172A', color: '#94A3B8' });
  });

  it('calls onChange with the option value when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentControl label="Speed" options={OPTIONS} value={0.9} onChange={onChange} />
    );

    await user.click(screen.getByText('Fast'));
    expect(onChange).toHaveBeenCalledWith(1.1);
  });
});
