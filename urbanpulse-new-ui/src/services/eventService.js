/**
 * Event Service — Interacts with existing /api/events backend endpoints
 */
import { request } from './api';

export async function fetchEvents({ page = 1, limit = 20, category } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (category && category !== 'all') params.append('category', category);

  const res = await request(`/api/events?${params.toString()}`);
  return {
    events: res.data || [],
    pagination: res.pagination || { total: res.data ? res.data.length : 0 },
  };
}

export async function fetchNearbyEvents(longitude, latitude, radius = 5000) {
  const params = new URLSearchParams({ longitude, latitude, radius });
  const res = await request(`/api/events/nearby?${params.toString()}`);
  return res.data || [];
}

export async function fetchRealEventMetrics() {
  try {
    const res = await request('/api/events?limit=50');
    const events = res.data || [];
    const total = res.pagination?.total || events.length;

    const now = new Date();
    const upcoming = events.filter((e) => !e.endDate || new Date(e.endDate) >= now).length;

    return {
      total,
      upcoming,
    };
  } catch (err) {
    console.error('Failed to fetch real event metrics:', err);
    return {
      total: 0,
      upcoming: 0,
    };
  }
}
