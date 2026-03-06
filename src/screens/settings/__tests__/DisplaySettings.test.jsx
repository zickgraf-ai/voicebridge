import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisplaySettings from '../DisplaySettings';

describe('DisplaySettings', () => {
  const defaultSettings = {
    tabSize: 'xl',
    buttonSize: 'large',
  };

  it('renders tab size control', () => {
    render(
      <DisplaySettings
        settings={defaultSettings}
        onUpdate={() => {}}
        categoryOrder={null}
        setCategoryOrder={() => {}}
      />
    );
    expect(screen.getByText(/Category Tab Size/)).toBeInTheDocument();
  });

  it('renders button size control', () => {
    render(
      <DisplaySettings
        settings={defaultSettings}
        onUpdate={() => {}}
        categoryOrder={null}
        setCategoryOrder={() => {}}
      />
    );
    expect(screen.getByText(/Button Size/)).toBeInTheDocument();
  });

  it('renders category order section', () => {
    render(
      <DisplaySettings
        settings={defaultSettings}
        onUpdate={() => {}}
        categoryOrder={null}
        setCategoryOrder={() => {}}
      />
    );
    expect(screen.getByText(/Category Order/)).toBeInTheDocument();
  });

  it('calls onUpdate when tab size is changed', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <DisplaySettings
        settings={defaultSettings}
        onUpdate={onUpdate}
        categoryOrder={null}
        setCategoryOrder={() => {}}
      />
    );
    // Click "Large" in the tab size section (there's only one "Large" radio)
    const largeButtons = screen.getAllByText('Large');
    await user.click(largeButtons[0]);
    expect(onUpdate).toHaveBeenCalled();
  });
});
