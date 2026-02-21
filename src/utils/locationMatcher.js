/**
 * Haversine distance between two GPS coordinates in meters.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find which saved location the user is currently at, if any.
 * @param {Object} coords - { latitude, longitude }
 * @param {Array} locations - [{ label, latitude, longitude, radius }]
 * @returns {string|null} The label of the matched location, or null
 */
export function matchLocation(coords, locations) {
  if (!coords || !locations || locations.length === 0) return null;

  for (const loc of locations) {
    const dist = haversineDistance(
      coords.latitude, coords.longitude,
      loc.latitude, loc.longitude
    );
    if (dist <= (loc.radius || 200)) {
      return loc.label;
    }
  }

  return null;
}
