/**
 * UrbanPulse Geocoding & Pan-India Location Discovery Service
 * Uses OpenStreetMap Nominatim for free, legitimate geocoding across India.
 */

export const POPULAR_INDIAN_HUBS = [
  {
    id: 'gla-mathura',
    name: 'GLA University, Mathura',
    sub: '17km Stone, NH-19, Chaumuhan',
    latitude: 27.60486,
    longitude: 77.59704,
    zoom: 17,
  },
  {
    id: 'mathura-center',
    name: 'Mathura City Center',
    sub: 'Vishram Ghat & Krishna Janmabhoomi',
    latitude: 27.4924,
    longitude: 77.6737,
    zoom: 14,
  },
  {
    id: 'delhi-cp',
    name: 'New Delhi (Connaught Place)',
    sub: 'Central Delhi Metropolitan',
    latitude: 28.6315,
    longitude: 77.2167,
    zoom: 14,
  },
  {
    id: 'mumbai-south',
    name: 'Mumbai (Nariman Point)',
    sub: 'South Mumbai Civic Ward',
    latitude: 18.9256,
    longitude: 72.8242,
    zoom: 14,
  },
  {
    id: 'bengaluru-mg',
    name: 'Bengaluru (MG Road)',
    sub: 'Central Business District',
    latitude: 12.9756,
    longitude: 77.6066,
    zoom: 14,
  },
  {
    id: 'lucknow-hazratganj',
    name: 'Lucknow (Hazratganj)',
    sub: 'Capital Civic Center, UP',
    latitude: 26.8467,
    longitude: 80.9462,
    zoom: 14,
  },
];

/**
 * Searches locations across India using OpenStreetMap Nominatim
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{ id, name, sub, latitude, longitude, zoom }>>}
 */
export async function searchLocationsAcrossIndia(query, signal) {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim().toLowerCase();

  // Instant local match for GLA University or popular hubs
  const localMatches = POPULAR_INDIAN_HUBS.filter(
    (h) =>
      h.name.toLowerCase().includes(trimmed) ||
      h.sub.toLowerCase().includes(trimmed)
  );

  const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&countrycodes=in&limit=7&addressdetails=1`;

  try {
    const response = await fetch(endpoint, {
      signal,
      headers: {
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    });

    if (!response.ok) return localMatches;

    const data = await response.json();
    if (!Array.isArray(data)) return localMatches;

    const remoteResults = data.map((item) => {
      const parts = (item.display_name || '').split(',').map((p) => p.trim());
      const title = parts.slice(0, 2).join(', ');
      const sub = parts.slice(2, 5).join(', ');

      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);

      // Higher zoom for buildings, amenities, universities
      let zoom = 14;
      if (item.type === 'university' || item.type === 'college' || item.type === 'hospital') {
        zoom = 16;
      } else if (item.type === 'city' || item.type === 'administrative') {
        zoom = 12;
      }

      return {
        id: `osm-${item.place_id || `${lat}-${lon}`}`,
        name: title || item.display_name,
        sub: sub || 'India',
        latitude: lat,
        longitude: lon,
        zoom,
      };
    });

    // Merge without duplicates
    const combined = [...localMatches];
    remoteResults.forEach((r) => {
      if (!combined.some((c) => Math.abs(c.latitude - r.latitude) < 0.005 && Math.abs(c.longitude - r.longitude) < 0.005)) {
        combined.push(r);
      }
    });

    return combined.slice(0, 8);
  } catch (err) {
    if (err.name === 'AbortError') return [];
    return localMatches;
  }
}

/**
 * Reverse geocodes coordinates to a friendly city / locality name
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>}
 */
export async function reverseGeocodeLocation(latitude, longitude) {
  // Check if near any predefined popular hub
  for (const hub of POPULAR_INDIAN_HUBS) {
    if (Math.abs(latitude - hub.latitude) < 0.03 && Math.abs(longitude - hub.longitude) < 0.03) {
      return hub.name;
    }
  }

  try {
    const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
    const response = await fetch(endpoint, {
      headers: { 'Accept-Language': 'en-IN,en;q=0.9' },
    });
    if (!response.ok) return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;

    const data = await response.json();
    const addr = data.address || {};
    const locality = addr.suburb || addr.neighbourhood || addr.amenity || addr.road;
    const city = addr.city || addr.town || addr.county || addr.state_district;
    const state = addr.state;

    if (locality && city) return `${locality}, ${city}`;
    if (city && state) return `${city}, ${state}`;
    return data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
  } catch {
    return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
  }
}
