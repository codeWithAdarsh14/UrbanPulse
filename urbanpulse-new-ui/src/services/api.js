/**
 * Base HTTP Client for UrbanPulse Frontend
 * Communicates with the Express backend via Vite proxy /api -> http://localhost:5000
 */

export async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // If a JWT token exists in storage, attach it
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
      const errorMsg = (isJson && data.message) ? data.message : `Request failed (${res.status})`;
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
