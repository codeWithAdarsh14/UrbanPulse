/**
 * API service for UrbanPulse frontend
 * Leverages Vite proxy (/api -> http://127.0.0.1:5000)
 */

/**
 * Fetch reports within radius of given coordinates
 * @param {number} longitude
 * @param {number} latitude
 * @param {number} [radius=5000] - in metres
 */
export async function fetchNearbyReports(longitude, latitude, radius = 5000) {
  const url = `/api/reports/nearby?longitude=${longitude}&latitude=${latitude}&radius=${radius}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch nearby reports (${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

/**
 * Fetch events within radius of given coordinates
 * @param {number} longitude
 * @param {number} latitude
 * @param {number} [radius=5000] - in metres
 */
export async function fetchNearbyEvents(longitude, latitude, radius = 5000) {
  const url = `/api/events/nearby?longitude=${longitude}&latitude=${latitude}&radius=${radius}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch nearby events (${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

/**
 * Create and submit a new civic issue report
 * @param {Object} reportData - { title, description, category, location, images?, status? }
 * @returns {Promise<Object>} Created report object
 */
export async function createReport(reportData) {
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `Failed to submit report (${response.status})`);
  }

  return result.data;
}
