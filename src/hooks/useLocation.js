import { useState, useEffect, useCallback } from 'react';
import { matchLocation } from '../utils/locationMatcher';

const UPDATE_INTERVAL = 60000; // 60 seconds

/**
 * Geolocation API wrapper that updates location every 60s.
 * Returns current coords and matched location label.
 */
export function useLocation(savedLocations = []) {
  const [coords, setCoords] = useState(null);
  const [locationLabel, setLocationLabel] = useState(null);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const updatePosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setCoords(newCoords);
        setError(null);
        setPermissionGranted(true);

        const label = matchLocation(newCoords, savedLocations);
        setLocationLabel(label);
      },
      (err) => {
        setError(err.message);
        if (err.code === 1) setPermissionGranted(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    );
  }, [savedLocations]);

  useEffect(() => {
    if (!permissionGranted && savedLocations.length === 0) return;
    if (!navigator.geolocation) return;

    updatePosition();
    const interval = setInterval(updatePosition, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [updatePosition, permissionGranted, savedLocations.length]);

  const requestPermission = useCallback(() => {
    updatePosition();
  }, [updatePosition]);

  return { coords, locationLabel, error, permissionGranted, requestPermission };
}
