import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategorySelector from '../CategorySelector';

const enabledCategories = ['smart', 'quick', 'medical', 'food', 'people', 'emotions', 'build'];

describe('CategorySelector', () => {
  it('renders all categories', () => {
    render(
      <CategorySelector
        enabledCategories={enabledCategories}
        onUpdate={() => {}}
        onClose={() => {}}
      />
    );
    // Active section
    expect(screen.getByText('Smart')).toBeInTheDocument();
    expect(screen.getByText('Quick')).toBeInTheDocument();
    // Hidden section
    expect(screen.getByText('Mine')).toBeInTheDocument();
    expect(screen.getByText('Prose')).toBeInTheDocument();
    expect(screen.getByText('Comfort')).toBeInTheDocument();
  });

  it('shows Enable All button', () => {
    render(
      <CategorySelector
        enabledCategories={enabledCategories}
        onUpdate={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Enable All')).toBeInTheDocument();
  });

  it('calls onUpdate when a hidden category is enabled', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <CategorySelector
        enabledCategories={enabledCategories}
        onUpdate={onUpdate}
        onClose={() => {}}
      />
    );
    // Find the toggle for Mine (hidden category) and click it
    const mineRow = screen.getByText('Mine').closest('[data-testid]');
    const toggle = mineRow.querySelector('[role="switch"]');
    await user.click(toggle);
    expect(onUpdate).toHaveBeenCalledWith([...enabledCategories, 'mine']);
  });

  it('calls onUpdate with all categories when Enable All is clicked', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <CategorySelector
        enabledCategories={enabledCategories}
        onUpdate={onUpdate}
        onClose={() => {}}
      />
    );
    await user.click(screen.getByText('Enable All'));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining(['smart', 'mine', 'build', 'quick', 'medical', 'food', 'comfort', 'people', 'emotions', 'prose'])
    );
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CategorySelector
        enabledCategories={enabledCategories}
        onUpdate={() => {}}
        onClose={onClose}
      />
    );
    await user.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows descriptions for hidden categories', () => {
    render(
      <CategorySelector
        enabledCategories={enabledCategories}
        onUpdate={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/custom saved phrases/i)).toBeInTheDocument();
    expect(screen.getByText(/longer paragraphs/i)).toBeInTheDocument();
    expect(screen.getByText(/comfort requests/i)).toBeInTheDocument();
  });
});
