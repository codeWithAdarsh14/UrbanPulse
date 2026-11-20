/**
 * API service for UrbanPulse frontend — Vite proxy /api -> http://127.0.0.1:5000
 */

/**
 * Generic request helper with automatic Authorization header
 */
export async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const token = localStorage.getItem('up_auth_token');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(endpoint, config);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg = isJson && data.message ? data.message : `Request failed (${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      err.status = 0;
      err.message = err.message || 'Network connection failed. Make sure the backend server is running.';
    }
    throw err;
  }
}

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

/**
 * Create and submit a new community event
 * @param {Object} eventData - { title, description, category, venue, location, startDate, endDate, image? }
 * @returns {Promise<Object>} Created event object
 */
export async function createEvent(eventData) {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `Failed to submit event (${response.status})`);
  }

  return result.data;
}

/**
 * Fetch all reports (paginated)
 * @param {number} [page=1]
 * @param {number} [limit=50]
 */
export async function fetchAllReports(page = 1, limit = 50) {
  const url = `/api/reports?page=${page}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch reports (${response.status})`);
  }
  const result = await response.json();
  return { data: result.data || [], pagination: result.pagination || {} };
}

/**
 * Fetch all events (paginated)
 * @param {number} [page=1]
 * @param {number} [limit=20]
 */
export async function fetchAllEvents(page = 1, limit = 20) {
  const url = `/api/events?page=${page}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch events (${response.status})`);
  }
  const result = await response.json();
  return { data: result.data || [], pagination: result.pagination || {} };
}
