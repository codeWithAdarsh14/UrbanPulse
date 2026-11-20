/**
 * UrbanPulse Live Air Quality Index (AQI) Service
 *
 * Air Quality Telemetry & Standards:
 * - Open-Meteo Air Quality API provides real-time `us_aqi` computed from
 *   particulate matter (PM2.5, PM10) based on the United States Environmental
 *   Protection Agency (US EPA) standard (scale 0–500).
 * - This service explicitly distinguishes between the US EPA AQI standard and
 *   the Indian National Air Quality Index (NAQI / CPCB), which uses different
 *   breakpoints and category nomenclature (Good, Satisfactory, Moderate, Poor,
 *   Very Poor, Severe).
 * - Category labels and breakpoints for US EPA:
 *     0 - 50:    Good
 *     51 - 100:  Moderate
 *     101 - 150: Unhealthy for Sensitive Groups
 *     151 - 200: Unhealthy
 *     201 - 300: Very Unhealthy
 *     301 - 500: Hazardous
 */

import { POPULAR_INDIAN_HUBS } from './geocoding.js';

// Supported AQI Standards
export const AQI_STANDARDS = {
  US_EPA: 'US_EPA',
  INDIAN_NAQI: 'INDIAN_NAQI',
};

// Breakpoint configurations
export const US_EPA_BREAKPOINTS = Object.freeze({
  GOOD: 50,
  MODERATE: 100,
  UNHEALTHY_SENSITIVE: 150,
  UNHEALTHY: 200,
  VERY_UNHEALTHY: 300,
  HAZARDOUS: 500,
});

export const INDIAN_NAQI_BREAKPOINTS = Object.freeze({
  GOOD: 50,
  SATISFACTORY: 100,
  MODERATE: 200,
  POOR: 300,
  VERY_POOR: 400,
  SEVERE: 500,
});

// In-memory cache: key -> { data, timestamp }
const aqiCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_ENTRIES = 50;

const UNAVAILABLE_AQI = Object.freeze({
  aqi: null,
  category: 'Unavailable',
  color: '#94A3B8',
  gradient: '#64748B',
  barWidth: '0%',
});

/**
 * Creates an unavailable or error fallback result structure
 * @param {string} stationName
 * @param {'unavailable' | 'error'} status
 * @returns {object}
 */
function createUnavailableResult(stationName, status = 'unavailable') {
  return {
    ...UNAVAILABLE_AQI,
    stationName: typeof stationName === 'string' && stationName.trim() ? stationName.trim() : 'Location unavailable',
    status,
  };
}

/**
 * Validates geographic coordinates
 * @param {number} lat
 * @param {number} lon
 * @returns {boolean}
 */
function isValidCoordinate(lat, lon) {
  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lon === 'number' &&
    Number.isFinite(lon) &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Checks if an error is an AbortError from an AbortController / AbortSignal
 * @param {unknown} error
 * @returns {boolean}
 */
function isAbortError(error) {
  return (
    Boolean(error) &&
    (error.name === 'AbortError' ||
      error.code === 'ABORT_ERR' ||
      (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError'))
  );
}

/**
 * Creates and throws or re-throws an AbortError
 * Avoids mutating un-writable properties on DOMException instances
 * @param {unknown} [originalError]
 */
function throwAbortError(originalError) {
  if (originalError && typeof originalError === 'object' && originalError.name === 'AbortError') {
    throw originalError;
  }
  const abortErr = new Error('The operation was aborted');
  abortErr.name = 'AbortError';
  throw abortErr;
}

/**
 * Retrieves valid cached entry if present and unexpired
 * @param {string} key
 * @returns {object|null}
 */
function getFromCache(key) {
  const entry = aqiCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    aqiCache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Stores a successful result in cache with LRU-style size pruning
 * @param {string} key
 * @param {object} data
 */
function setInCache(key, data) {
  if (!data || data.status !== 'success' || typeof data.aqi !== 'number' || !Number.isFinite(data.aqi)) {
    return;
  }

  if (aqiCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = aqiCache.keys().next().value;
    if (oldestKey) {
      aqiCache.delete(oldestKey);
    }
  }

  aqiCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clears the in-memory cache (useful for testing and reset)
 */
export function clearAQICache() {
  aqiCache.clear();
}

/**
 * Maps AQI values to category labels, theme colors, gradients, and bar widths.
 * Defaults to US EPA standard (0–500) matching Open-Meteo `us_aqi`.
 *
 * @param {number} aqi - Numerical AQI index
 * @param {'US_EPA' | 'INDIAN_NAQI'} [standard='US_EPA'] - Classification standard
 * @returns {{ category: string, color: string, gradient: string, barWidth: string }}
 */
export function getAQICategory(aqi, standard = AQI_STANDARDS.US_EPA) {
  if (
    typeof aqi !== 'number' ||
    !Number.isFinite(aqi) ||
    aqi < 0
  ) {
    return {
      category: 'Unavailable',
      color: '#94A3B8',
      gradient: '#64748B',
      barWidth: '0%',
    };
  }

  const rounded = Math.round(aqi);
  const barWidth = `${Math.min(100, Math.max(0, Math.round((rounded / 500) * 100)))}%`;

  const isIndian =
    typeof standard === 'string' &&
    (standard.toUpperCase() === 'INDIAN_NAQI' || standard.toUpperCase() === 'NAQI');

  // Indian NAQI standard (CPCB)
  if (isIndian) {
    if (rounded <= INDIAN_NAQI_BREAKPOINTS.GOOD) {
      return {
        category: 'Good',
        color: '#10B981',
        gradient: 'linear-gradient(90deg, #10B981, #34D399)',
        barWidth,
      };
    }
    if (rounded <= INDIAN_NAQI_BREAKPOINTS.SATISFACTORY) {
      return {
        category: 'Satisfactory',
        color: '#84CC16',
        gradient: 'linear-gradient(90deg, #10B981, #84CC16)',
        barWidth,
      };
    }
    if (rounded <= INDIAN_NAQI_BREAKPOINTS.MODERATE) {
      return {
        category: 'Moderate',
        color: '#F59E0B',
        gradient: 'linear-gradient(90deg, #84CC16, #F59E0B)',
        barWidth,
      };
    }
    if (rounded <= INDIAN_NAQI_BREAKPOINTS.POOR) {
      return {
        category: 'Poor',
        color: '#F97316',
        gradient: 'linear-gradient(90deg, #F59E0B, #F97316)',
        barWidth,
      };
    }
    if (rounded <= INDIAN_NAQI_BREAKPOINTS.VERY_POOR) {
      return {
        category: 'Very Poor',
        color: '#EF4444',
        gradient: 'linear-gradient(90deg, #F97316, #EF4444)',
        barWidth,
      };
    }
    return {
      category: 'Severe',
      color: '#DC2626',
      gradient: 'linear-gradient(90deg, #EF4444, #DC2626)',
      barWidth,
    };
  }

  // Default: US EPA standard (0-500)
  if (rounded <= US_EPA_BREAKPOINTS.GOOD) {
    return {
      category: 'Good',
      color: '#10B981',
      gradient: 'linear-gradient(90deg, #10B981, #34D399)',
      barWidth,
    };
  }

  if (rounded <= US_EPA_BREAKPOINTS.MODERATE) {
    return {
      category: 'Moderate',
      color: '#FACC15',
      gradient: 'linear-gradient(90deg, #10B981, #FACC15)',
      barWidth,
    };
  }

  if (rounded <= US_EPA_BREAKPOINTS.UNHEALTHY_SENSITIVE) {
    return {
      category: 'Unhealthy for Sensitive Groups',
      color: '#F97316',
      gradient: 'linear-gradient(90deg, #FACC15, #F97316)',
      barWidth,
    };
  }

  if (rounded <= US_EPA_BREAKPOINTS.UNHEALTHY) {
    return {
      category: 'Unhealthy',
      color: '#EF4444',
      gradient: 'linear-gradient(90deg, #F97316, #EF4444)',
      barWidth,
    };
  }

  if (rounded <= US_EPA_BREAKPOINTS.VERY_UNHEALTHY) {
    return {
      category: 'Very Unhealthy',
      color: '#8B5CF6',
      gradient: 'linear-gradient(90deg, #EF4444, #8B5CF6)',
      barWidth,
    };
  }

  return {
    category: 'Hazardous',
    color: '#7F1D1D',
    gradient: 'linear-gradient(90deg, #8B5CF6, #7F1D1D)',
    barWidth,
  };
}

/**
 * Resolves latitude and longitude coordinates for an Indian city or locality.
 * Validates responses against coordinate boundaries.
 *
 * @param {string} locationName
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ latitude: number, longitude: number, displayName: string }|null>}
 */
async function resolveLocationCoordinates(locationName, signal) {
  if (signal?.aborted) {
    throwAbortError();
  }

  if (!locationName || typeof locationName !== 'string') {
    return null;
  }

  const trimmed = locationName.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  // 1. Check POPULAR_INDIAN_HUBS from geocoding dependency (with boundary validation)
  if (Array.isArray(POPULAR_INDIAN_HUBS) && POPULAR_INDIAN_HUBS.length > 0) {
    const hubMatch = POPULAR_INDIAN_HUBS.find((hub) => {
      if (!hub || typeof hub !== 'object') return false;
      const hubName = typeof hub.name === 'string' ? hub.name.toLowerCase() : '';
      const hubSub = typeof hub.sub === 'string' ? hub.sub.toLowerCase() : '';
      return (
        lower.includes(hubName) ||
        hubName.includes(lower) ||
        (hubSub && lower.includes(hubSub))
      );
    });

    if (hubMatch && isValidCoordinate(hubMatch.latitude, hubMatch.longitude)) {
      return {
        latitude: hubMatch.latitude,
        longitude: hubMatch.longitude,
        displayName: typeof hubMatch.name === 'string' && hubMatch.name.trim() ? hubMatch.name.trim() : trimmed,
      };
    }
  }

  // 2. Common city aliases
  if (lower.includes('mathura')) {
    return {
      latitude: 27.4924,
      longitude: 77.6737,
      displayName: 'Mathura, UP',
    };
  }

  if (lower.includes('delhi')) {
    return {
      latitude: 28.6315,
      longitude: 77.2167,
      displayName: 'New Delhi',
    };
  }

  // 3. Fallback to OpenStreetMap Nominatim
  try {
    const endpoint =
      `https://nominatim.openstreetmap.org/search?format=json` +
      `&q=${encodeURIComponent(trimmed)}` +
      '&countrycodes=in&limit=1';

    const response = await fetch(endpoint, {
      signal,
      headers: {
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    });

    if (signal?.aborted) {
      throwAbortError();
    }

    if (!response.ok) return null;

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === 'object') {
      const latitude = Number(data[0].lat);
      const longitude = Number(data[0].lon);

      if (!isValidCoordinate(latitude, longitude)) {
        return null;
      }

      const displayName =
        typeof data[0].display_name === 'string' && data[0].display_name.trim()
          ? data[0].display_name.split(',')[0].trim()
          : trimmed;

      return {
        latitude,
        longitude,
        displayName: displayName || trimmed,
      };
    }
  } catch (error) {
    if (isAbortError(error) || signal?.aborted) {
      throwAbortError(error);
    }
    return null;
  }

  return null;
}

/**
 * Fetches current live AQI for a given city or location.
 *
 * @param {string} locationName - City or locality name
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<{
 *   aqi: number|null,
 *   category: string,
 *   color: string,
 *   gradient: string,
 *   barWidth: string,
 *   stationName: string,
 *   status: 'success' | 'unavailable' | 'error'
 * }>}
 */
export async function fetchLiveCityAQI(locationName, signal) {
  // Check abort signal immediately
  if (signal?.aborted) {
    throwAbortError();
  }

  // Validate location input
  if (!locationName || typeof locationName !== 'string' || !locationName.trim()) {
    return createUnavailableResult('Location not specified');
  }

  const normalizedLocation = locationName.trim();
  const cacheKey = normalizedLocation.toLowerCase();

  // Return unexpired cache if present
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Resolve location coordinates
    const coords = await resolveLocationCoordinates(normalizedLocation, signal);

    if (signal?.aborted) {
      throwAbortError();
    }

    if (!coords || !isValidCoordinate(coords.latitude, coords.longitude)) {
      return createUnavailableResult(normalizedLocation);
    }

    // Fetch current air quality metrics from Open-Meteo
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${encodeURIComponent(coords.latitude)}` +
      `&longitude=${encodeURIComponent(coords.longitude)}` +
      '&current=us_aqi,pm2_5,pm10';

    const response = await fetch(url, { signal });

    if (signal?.aborted) {
      throwAbortError();
    }

    if (!response.ok) {
      throw new Error(`Air quality API returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      return createUnavailableResult(coords.displayName || normalizedLocation);
    }

    const currentAqi = data?.current?.us_aqi;

    // Validate numerical AQI value
    if (
      typeof currentAqi !== 'number' ||
      !Number.isFinite(currentAqi) ||
      currentAqi < 0
    ) {
      return createUnavailableResult(coords.displayName || normalizedLocation);
    }

    const aqiNumber = Math.round(currentAqi);
    const categoryInfo = getAQICategory(aqiNumber);

    const result = {
      aqi: aqiNumber,
      category: categoryInfo.category,
      color: categoryInfo.color,
      gradient: categoryInfo.gradient,
      barWidth: categoryInfo.barWidth,
      stationName: coords.displayName || normalizedLocation,
      status: 'success',
    };

    // Cache successful results only
    setInCache(cacheKey, result);

    return result;
  } catch (error) {
    // Ensure AbortError propagates so calling effects discard cancelled requests
    if (isAbortError(error) || signal?.aborted) {
      throwAbortError(error);
    }

    // Network / parse errors return safe error status without crashing or throwing
    return createUnavailableResult(normalizedLocation, 'error');
  }
}
