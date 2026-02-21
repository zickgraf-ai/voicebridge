import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhraseGrid from '../PhraseGrid';

const makeItems = (count) =>
  Array.from({ length: count }, (_, i) => ({
    t: `Phrase ${i + 1}`,
    i: '💬',
  }));

describe('PhraseGrid', () => {
  it('renders phrases up to pageSize', () => {
    const items = makeItems(9);
    render(
      <PhraseGrid items={items} onTap={() => {}} color="#3B82F6" pageSize={6} category="test" />
    );

    // Only first 6 should be visible
    expect(screen.getByText('Phrase 1')).toBeInTheDocument();
    expect(screen.getByText('Phrase 6')).toBeInTheDocument();
    expect(screen.queryByText('Phrase 7')).not.toBeInTheDocument();
  });

  it('shows pagination when items exceed pageSize', () => {
    const items = makeItems(9);
    render(
      <PhraseGrid items={items} onTap={() => {}} color="#3B82F6" pageSize={6} category="test" />
    );

    expect(screen.getByText(/More/)).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('does not show pagination when items fit in one page', () => {
    const items = makeItems(3);
    render(
      <PhraseGrid items={items} onTap={() => {}} color="#3B82F6" pageSize={6} category="test" />
    );

    expect(screen.queryByText(/More/)).not.toBeInTheDocument();
  });

  it('navigates to next page on More click', async () => {
    const user = userEvent.setup();
    const items = makeItems(9);
    render(
      <PhraseGrid items={items} onTap={() => {}} color="#3B82F6" pageSize={6} category="test" />
    );

    await user.click(screen.getByText(/More/));

    expect(screen.getByText('Phrase 7')).toBeInTheDocument();
    expect(screen.queryByText('Phrase 1')).not.toBeInTheDocument();
  });

  it('calls onTap with the phrase when a button is clicked', async () => {
    const user = userEvent.setup();
    const onTap = vi.fn();
    const items = makeItems(3);
    render(
      <PhraseGrid items={items} onTap={onTap} color="#3B82F6" pageSize={6} category="test" />
    );

    await user.click(screen.getByText('Phrase 1'));
    expect(onTap).toHaveBeenCalledWith({ t: 'Phrase 1', i: '💬' });
  });
});
