import React, { useState, useEffect } from 'react';
import LiveMapPreview from '../../components/Common/LiveMapPreview';
import { fetchReports } from '../../services/reportService';
import { formatDate, truncate } from '../../utils/formatters';
import './MapPage.css';

export default function MapPage({ onBackToHome }) {
  const [reports, setReports] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetchReports({ limit: 50 });
        setReports(res.reports || []);
      } catch (err) {
        console.error('Failed to load map page reports:', err);
      }
    }
    loadReports();
  }, []);

  const filtered = reports.filter((r) => {
    if (filter === 'all') return true;
    return (r.status || 'active').toLowerCase() === filter;
  });

  return (
    <div className="up-map-page">
      {/* Sidebar List */}
      <div className="up-map-sidebar">
        <div className="up-map-sidebar-header">
          <div className="up-map-sidebar-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.5">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            <span>Live Geospatial Incidents</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '12px' }}>
            Mathura Metropolitan Jurisdiction • {reports.length} Real Incidents
          </p>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`up-btn ${filter === 'all' ? 'up-btn--primary' : 'up-btn--secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setFilter('all')}
            >
              All ({reports.length})
            </button>
            <button
              type="button"
              className={`up-btn ${filter === 'active' ? 'up-btn--primary' : 'up-btn--secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setFilter('active')}
            >
              Active ({reports.filter((r) => (r.status || 'active').toLowerCase() === 'active').length})
            </button>
            <button
              type="button"
              className={`up-btn ${filter === 'resolved' ? 'up-btn--primary' : 'up-btn--secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setFilter('resolved')}
            >
              Resolved ({reports.filter((r) => (r.status || '').toLowerCase() === 'resolved').length})
            </button>
          </div>
        </div>

        <div className="up-map-list">
          {filtered.map((item) => {
            const isResolved = (item.status || '').toLowerCase() === 'resolved';
            const isSelected = selectedIssue?._id === item._id;

            return (
              <div
                key={item._id || item.title}
                className="up-map-item-card"
                style={isSelected ? { borderColor: '#7C3AED', background: 'var(--up-surface-2)' } : {}}
                onClick={() => setSelectedIssue(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="up-badge up-badge--purple" style={{ fontSize: '0.7rem' }}>
                    {item.category || 'General'}
                  </span>
                  <span
                    className={`up-badge ${isResolved ? 'up-badge--green' : 'up-badge--amber'}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {item.status || 'Active'}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#FFF', marginBottom: '4px' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '8px' }}>
                  {truncate(item.description, 80)}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748B' }}>
                  <span>📍 {item.location?.coordinates ? `${item.location.coordinates[0].toFixed(2)}, ${item.location.coordinates[1].toFixed(2)}` : 'Mathura'}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="up-map-viewport-full">
        <LiveMapPreview onSelectIssue={(issue) => setSelectedIssue(issue)} />
      </div>
    </div>
  );
}
