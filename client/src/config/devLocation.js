/**
 * Development-Only Location Configuration
 *
 * Configurable mock coordinates for local testing of nearby reports and events.
 *
 * Coordinates:
 * - Longitude: 77.6737
 * - Latitude:  27.4924
 *
 * Clearly named development flag:
 * - ENABLE_DEV_LOCATION_OVERRIDE: Defaults to true ONLY in Vite development mode (`import.meta.env.DEV`).
 * - In production (`import.meta.env.PROD`), this flag is strictly false and never used.
 * - Can be overridden in dev via `VITE_ENABLE_DEV_LOCATION=false` in environment variables.
 */

export const DEV_LOCATION = {
  longitude: 77.6737,
  latitude: 27.4924,
};

export const ENABLE_DEV_LOCATION_OVERRIDE = Boolean(
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_LOCATION === 'true'
);

