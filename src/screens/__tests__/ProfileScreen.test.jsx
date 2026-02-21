import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithContext } from '../../test/renderWithContext';
import ProfileScreen from '../ProfileScreen';

describe('ProfileScreen – Connect step', () => {
  function renderAtConnectStep() {
    const onDone = vi.fn();
    renderWithContext(<ProfileScreen onDone={onDone} />);

    // Navigate to step 4 (Connect): click Next 3 times
    const nextBtn = screen.getByText(/Next/);
    return { onDone, nextBtn };
  }

  async function goToConnectStep() {
    const user = userEvent.setup();
    const { onDone } = renderAtConnectStep();

    // Step 0 → 1 → 2 → 3
    await user.click(screen.getByText(/Next/));
    await user.click(screen.getByText(/Next/));
    await user.click(screen.getByText(/Next/));

    return { onDone, user };
  }

  it('shows "Coming Soon" labels instead of Connect buttons', async () => {
    await goToConnectStep();

    const comingSoonLabels = screen.getAllByText('Coming Soon');
    expect(comingSoonLabels).toHaveLength(4);
  });

  it('does not render any Connect or Limited buttons', async () => {
    await goToConnectStep();

    expect(screen.queryByText('Connect')).not.toBeInTheDocument();
    expect(screen.queryByText('Limited')).not.toBeInTheDocument();
  });

  it('shows the info banner about integrations', async () => {
    await goToConnectStep();

    expect(
      screen.getByText(/Integrations are coming soon/)
    ).toBeInTheDocument();
  });

  it('lists all four services', async () => {
    await goToConnectStep();

    expect(screen.getByText('Google Contacts')).toBeInTheDocument();
    expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Apple Health')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
  });

  it('shows Done button on Connect step', async () => {
    await goToConnectStep();

    expect(screen.getByText(/Done/)).toBeInTheDocument();
  });

  it('calls onDone when Done is clicked', async () => {
    const { onDone, user } = await goToConnectStep();

    await user.click(screen.getByText(/Done/));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
