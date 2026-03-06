import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsSubPage from '../SettingsSubPage';

describe('SettingsSubPage', () => {
  it('renders title', () => {
    render(<SettingsSubPage title="Voice & Speech" onBack={() => {}}>Content</SettingsSubPage>);
    expect(screen.getByText('Voice & Speech')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <SettingsSubPage title="Test" onBack={() => {}}>
        <div>Child content</div>
      </SettingsSubPage>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<SettingsSubPage title="Test" onBack={onBack}>Content</SettingsSubPage>);
    await user.click(screen.getByLabelText('Back to settings'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('applies locked styling when locked prop is true', () => {
    const { container } = render(
      <SettingsSubPage title="Test" onBack={() => {}} locked={true}>
        <div>Content</div>
      </SettingsSubPage>
    );
    const content = container.querySelector('[data-testid="subpage-content"]');
    expect(content).toHaveStyle({ opacity: '0.5', pointerEvents: 'none' });
  });

  it('does not apply locked styling when locked is false', () => {
    const { container } = render(
      <SettingsSubPage title="Test" onBack={() => {}} locked={false}>
        <div>Content</div>
      </SettingsSubPage>
    );
    const content = container.querySelector('[data-testid="subpage-content"]');
    expect(content).not.toHaveStyle({ opacity: '0.5' });
  });
});
