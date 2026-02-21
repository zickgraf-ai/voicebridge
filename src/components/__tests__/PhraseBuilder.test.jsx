import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhraseBuilder from '../PhraseBuilder';

describe('PhraseBuilder', () => {
  it('renders starter buttons', () => {
    render(<PhraseBuilder onPhrase={() => {}} gridRows={3} />);

    // Should show builder starters like "I need...", "Can you...", etc.
    expect(screen.getByText('I need...')).toBeInTheDocument();
    expect(screen.getByText('Can you...')).toBeInTheDocument();
  });

  it('shows sub-phrases when a starter is tapped', async () => {
    const user = userEvent.setup();
    render(<PhraseBuilder onPhrase={() => {}} gridRows={3} />);

    await user.click(screen.getByText('I need...'));

    // Should show the starter text and a Back button
    expect(screen.getByText('I need ...')).toBeInTheDocument();
    expect(screen.getByText(/Back/)).toBeInTheDocument();
  });

  it('calls onPhrase with combined text when sub-phrase is tapped', async () => {
    const user = userEvent.setup();
    const onPhrase = vi.fn();
    render(<PhraseBuilder onPhrase={onPhrase} gridRows={3} />);

    await user.click(screen.getByText('I need...'));

    // Find and click a sub-phrase
    const waterBtn = screen.getByText('water');
    await user.click(waterBtn);

    expect(onPhrase).toHaveBeenCalledWith('I need water');
  });

  it('returns to starters when Back is clicked', async () => {
    const user = userEvent.setup();
    render(<PhraseBuilder onPhrase={() => {}} gridRows={3} />);

    await user.click(screen.getByText('I need...'));
    await user.click(screen.getByText(/Back/));

    // Should show starters again
    expect(screen.getByText('I need...')).toBeInTheDocument();
  });
});
