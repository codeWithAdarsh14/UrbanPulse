/**
 * UrbanPulse Live Air Quality Index (AQI) Service
 * Uses Open-Meteo Copernicus Atmosphere Monitoring Service (open, free, no API key required)
 */

import { POPULAR_INDIAN_HUBS } from './geocoding';

// In-memory cache to prevent duplicate requests: key -> { data, timestamp }
const aqiCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

/**
 * Maps numerical AQI to Indian National Air Quality Index (NAQI) / US EPA categories and colors
 * @param {number} aqi
 */
export function getAQICategory(aqi) {
  if (typeof aqi !== 'number' || isNaN(aqi)) {
    return {
      category: 'Unavailable',
      color: '#94A3B8',
      gradient: '#64748B',
      barWidth: '0%',
    };
  }

  if (aqi <= 50) {
    return {
      category: 'Good',
      color: '#10B981',
      gradient: 'linear-gradient(90deg, #10B981, #34D399)',
      barWidth: `${Math.min(100, Math.max(10, Math.round((aqi / 400) * 100)))}%`,
    };
  }
  if (aqi <= 100) {
    return {
      category: 'Satisfactory',
      color: '#84CC16',
      gradient: 'linear-gradient(90deg, #10B981, #84CC16)',
      barWidth: `${Math.min(100, Math.max(15, Math.round((aqi / 400) * 100)))}%`,
    };
  }
  if (aqi <= 200) {
    return {
      category: 'Moderate',
      color: '#F59E0B',
      gradient: 'linear-gradient(90deg, #10B981, #F59E0B)',
      barWidth: `${Math.min(100, Math.max(25, Math.round((aqi / 400) * 100)))}%`,
    };
  }
  if (aqi <= 300) {
    return {
      category: 'Poor',
      color: '#F97316',
      gradient: 'linear-gradient(90deg, #F59E0B, #F97316)',
      barWidth: `${Math.min(100, Math.max(40, Math.round((aqi / 400) * 100)))}%`,
    };
  }
  if (aqi <= 400) {
    return {
      category: 'Very Poor',
      color: '#EF4444',
      gradient: 'linear-gradient(90deg, #F97316, #EF4444)',
      barWidth: `${Math.min(100, Math.max(60, Math.round((aqi / 400) * 100)))}%`,
    };
  }
  return {
    category: 'Severe',
    color: '#DC2626',
    gradient: 'linear-gradient(90deg, #EF4444, #7F1D1D)',
    barWidth: '100%',
  };
}

/**
 * Resolves latitude and longitude for a given city / locality name
 * @param {string} locationName
 * @returns {Promise<{ latitude: number, longitude: number, displayName: string } | null>}
 */
async function resolveLocationCoordinates(locationName) {
  if (!locationName || typeof locationName !== 'string') return null;

  const trimmed = locationName.trim().toLowerCase();

  // 1. Check popular Indian hubs first (instant 0ms resolution)
  const hubMatch = POPULAR_INDIAN_HUBS.find(
    (h) =>
      trimmed.includes(h.name.toLowerCase()) ||
      h.name.toLowerCase().includes(trimmed) ||
      (h.sub && trimmed.includes(h.sub.toLowerCase()))
  );

  if (hubMatch) {
    return {
      latitude: hubMatch.latitude,
      longitude: hubMatch.longitude,
      displayName: hubMatch.name,
    };
  }

  // Common aliases
  if (trimmed.includes('mathura')) {
    return { latitude: 27.4924, longitude: 77.6737, displayName: 'Mathura, UP' };
  }
  if (trimmed.includes('delhi')) {
    return { latitude: 28.6315, longitude: 77.2167, displayName: 'New Delhi' };
  }

  // 2. Fallback to OpenStreetMap Nominatim geocoder
  try {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      locationName
    )}&countrycodes=in&limit=1`;
    const response = await fetch(endpoint, {
      headers: { 'User-Agent': 'UrbanPulse/2.0' },
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (Array.isArray(data) && data[0]) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name ? data[0].display_name.split(',')[0] : locationName,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Fetches real-time AQI for a given city or location name
 * @param {string} locationName
 * @param {AbortSignal} [signal]
 * @returns {Promise<{
 *   aqi: number | null,
 *   category: string,
 *   color: string,
 *   gradient: string,
 *   barWidth: string,
 *   stationName: string,
 *   status: 'success' | 'unavailable' | 'error'
 * }>}
 */
export async function fetchLiveCityAQI(locationName, signal) {
  if (!locationName) {
    return {
      aqi: null,
      category: 'Unavailable',
      color: '#94A3B8',
      gradient: '#64748B',
      barWidth: '0%',
      stationName: 'Location not specified',
      status: 'unavailable',
    };
  }

  const cacheKey = locationName.trim().toLowerCase();
  const cached = aqiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const coords = await resolveLocationCoordinates(locationName);
  if (!coords) {
    const unavailableResult = {
      aqi: null,
      category: 'Unavailable',
      color: '#94A3B8',
      gradient: '#64748B',
      barWidth: '0%',
      stationName: locationName,
      status: 'unavailable',
    };
    return unavailableResult;
  }

  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.latitude}&longitude=${coords.longitude}&current=us_aqi,pm2_5,pm10`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Air quality service returned ${response.status}`);
    }

    const data = await response.json();
    const currentAqi = data?.current?.us_aqi;

    if (typeof currentAqi !== 'number' || isNaN(currentAqi)) {
      return {
        aqi: null,
        category: 'Data Unavailable',
        color: '#94A3B8',
        gradient: '#64748B',
        barWidth: '0%',
        stationName: coords.displayName || locationName,
        status: 'unavailable',
      };
    }

    const aqiNumber = Math.round(currentAqi);
    const catInfo = getAQICategory(aqiNumber);

    const result = {
      aqi: aqiNumber,
      category: catInfo.category,
      color: catInfo.color,
      gradient: catInfo.gradient,
      barWidth: catInfo.barWidth,
      stationName: coords.displayName || locationName,
      status: 'success',
    };

    aqiCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    if (err.name === 'AbortError') throw err;

    return {
      aqi: null,
      category: 'Service Offline',
      color: '#94A3B8',
      gradient: '#64748B',
      barWidth: '0%',
      stationName: locationName,
      status: 'error',
    };
  }
}
