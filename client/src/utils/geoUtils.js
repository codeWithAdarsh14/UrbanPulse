/**
 * Geospatial utilities for UrbanPulse map
 */

/**
 * Calculate Haversine distance in meters between two lat/lng pairs
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in meters
 */
export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371e3; // Earth's mean radius in meters
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaPhi = (lat2 - lat1) * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Group reports by exact coordinate or close spatial proximity
 * @param {Array} reports - List of report documents
 * @param {number} [proximityMeters=20] - Radius in meters to cluster nearby markers
 * @returns {Array<{ id: string, coordinates: [number, number], reports: Array }>}
 */
export function groupReportsByProximity(reports, proximityMeters = 20) {
  if (!Array.isArray(reports)) return [];

  const groups = [];

  for (const report of reports) {
    const coords = report.location?.coordinates;
    if (!coords || !Array.isArray(coords) || coords.length < 2) continue;
    const [lng, lat] = coords;
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) continue;

    let matchedGroup = null;

    // Check against existing groups
    for (const group of groups) {
      const [gLng, gLat] = group.coordinates;

      // 1. Exact coordinate match
      if (lng === gLng && lat === gLat) {
        matchedGroup = group;
        break;
      }

      // 2. Proximity threshold match (nearby non-identical coordinates)
      const dist = getDistanceMeters(lat, lng, gLat, gLng);
      if (dist <= proximityMeters) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.reports.push(report);
    } else {
      groups.push({
        id: `group-${report._id || `${lng.toFixed(5)}-${lat.toFixed(5)}`}`,
        coordinates: [lng, lat],
        reports: [report],
      });
    }
  }

  return groups;
}

/**
 * Calculate offset coordinates around a center point for spiderfying markers
 * @param {number} centerLat
 * @param {number} centerLng
 * @param {number} count - Total items in group
 * @param {number} [radiusMeters=35] - Distance to spread markers outward
 * @returns {Array<[number, number]>} Array of [lat, lng] offsets
 */
export function calculateSpiderOffsets(centerLat, centerLng, count, radiusMeters = 35) {
  if (count <= 1) return [[centerLat, centerLng]];

  const offsets = [];
  const rad = Math.PI / 180;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * rad);

  // Dynamic radius: slightly wider if many items
  const effectiveRadius = radiusMeters + Math.min(25, (count - 2) * 5);

  for (let i = 0; i < count; i++) {
    // Distribute angles evenly starting from the top (-PI / 2)
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const dLat = (effectiveRadius * Math.cos(angle)) / metersPerDegreeLat;
    const dLng = (effectiveRadius * Math.sin(angle)) / metersPerDegreeLng;

    offsets.push([centerLat + dLat, centerLng + dLng]);
  }

  return offsets;
}
