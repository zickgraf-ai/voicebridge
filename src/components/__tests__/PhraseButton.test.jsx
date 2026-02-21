import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhraseButton from '../PhraseButton';

describe('PhraseButton', () => {
  it('renders text and icon', () => {
    render(<PhraseButton text="Bathroom" icon="🚽" onTap={() => {}} />);

    expect(screen.getByText('Bathroom')).toBeInTheDocument();
    expect(screen.getByText('🚽')).toBeInTheDocument();
  });

  it('calls onTap when clicked', async () => {
    const onTap = vi.fn();
    const user = userEvent.setup();

    render(<PhraseButton text="Water" icon="💧" onTap={onTap} />);

    await user.click(screen.getByRole('button'));
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('renders as a button element for accessibility', () => {
    render(<PhraseButton text="Help" icon="🆘" onTap={() => {}} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
