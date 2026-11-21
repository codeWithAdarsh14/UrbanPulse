/**
 * Report Service — Interacts with existing /api/reports backend endpoints
 */
import { request } from './api';

export async function fetchReports({ page = 1, limit = 20, status, category } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status && status !== 'all') params.append('status', status);
  if (category && category !== 'all') params.append('category', category);

  const res = await request(`/api/reports?${params.toString()}`);
  return {
    reports: res.data || [],
    pagination: res.pagination || { total: res.data ? res.data.length : 0 },
  };
}

export async function fetchNearbyReports(longitude, latitude, radius = 5000) {
  const params = new URLSearchParams({ longitude, latitude, radius });
  const res = await request(`/api/reports/nearby?${params.toString()}`);
  return res.data || [];
}

export async function fetchReportById(id) {
  const res = await request(`/api/reports/${id}`);
  return res.data;
}

/**
 * Confirm an existing report
 * @param {string} id - Report ID
 * @returns {Promise<Object>} Updated report object
 */
export async function confirmReport(id) {
  const res = await request(`/api/reports/${id}/confirm`, {
    method: 'POST',
  });
  return res.data;
}

/**
 * Dispute an existing report
 * @param {string} id - Report ID
 * @returns {Promise<Object>} Updated report object
 */
export async function disputeReport(id) {
  const res = await request(`/api/reports/${id}/dispute`, {
    method: 'POST',
  });
  return res.data;
}

/**
 * Calculates genuine aggregates strictly from real report records
 */
export async function fetchRealReportMetrics() {
  try {
    // Fetch up to 100 actual reports to calculate real metrics
    const res = await request('/api/reports?limit=100');
    const reports = res.data || [];
    const total = res.pagination?.total || reports.length;

    const active = reports.filter((r) => (r.status || 'active').toLowerCase() === 'active').length;
    const resolved = reports.filter((r) => (r.status || '').toLowerCase() === 'resolved').length;

    // Distinct categories reported
    const categoriesSet = new Set(reports.map((r) => r.category).filter(Boolean));

    // Approximate active wards based on coordinates clustering
    const wardsSet = new Set(
      reports
        .map((r) => {
          if (r.location?.coordinates) {
            return `${r.location.coordinates[0].toFixed(2)},${r.location.coordinates[1].toFixed(2)}`;
          }
          return null;
        })
        .filter(Boolean)
    );

    return {
      total,
      active,
      resolved,
      categoriesCount: categoriesSet.size,
      activeWardsCount: Math.max(wardsSet.size, 1),
    };
  } catch (err) {
    console.error('Failed to fetch real report metrics:', err);
    return {
      total: 0,
      active: 0,
      resolved: 0,
      categoriesCount: 0,
      activeWardsCount: 0,
    };
  }
}
