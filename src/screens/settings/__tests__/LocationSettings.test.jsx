import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationSettings from '../LocationSettings';

vi.mock('../../../hooks/useLocation', () => ({
  useLocation: () => ({
    coords: null,
    locationLabel: null,
    permissionGranted: false,
    requestPermission: vi.fn(),
  }),
}));

describe('LocationSettings', () => {
  it('renders location section header', () => {
    render(
      <LocationSettings
        locations={[]}
        setLocations={() => {}}
      />
    );
    expect(screen.getByText(/Locations/)).toBeInTheDocument();
  });

  it('renders saved locations', () => {
    render(
      <LocationSettings
        locations={[
          { label: 'Hospital', latitude: 1, longitude: 1, radius: 200 },
          { label: 'Home', latitude: 2, longitude: 2, radius: 200 },
        ]}
        setLocations={() => {}}
      />
    );
    expect(screen.getByText('Hospital')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders save location button', () => {
    render(
      <LocationSettings
        locations={[]}
        setLocations={() => {}}
      />
    );
    expect(screen.getByText(/Save This Location/)).toBeInTheDocument();
  });

  it('renders remove buttons for saved locations', () => {
    render(
      <LocationSettings
        locations={[{ label: 'Hospital', latitude: 1, longitude: 1, radius: 200 }]}
        setLocations={() => {}}
      />
    );
    expect(screen.getByLabelText('Remove Hospital location')).toBeInTheDocument();
  });
});
