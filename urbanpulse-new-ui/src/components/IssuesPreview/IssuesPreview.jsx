import React, { useState, useEffect } from 'react';
import { fetchReports } from '../../services/reportService';
import { formatDate, truncate } from '../../utils/formatters';
import './IssuesPreview.css';

export default function IssuesPreview({ onExploreMap }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'resolved'

  useEffect(() => {
    let isMounted = true;
    async function loadReports() {
      setLoading(true);
      try {
        const res = await fetchReports({
          limit: 12,
          status: filter === 'all' ? undefined : filter,
        });
        if (isMounted) {
          setReports(res.reports || []);
        }
      } catch (err) {
        console.error('Error fetching reports preview:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReports();
    return () => {
      isMounted = false;
    };
  }, [filter]);

  return (
    <section className="up-issues-section" id="issues">
      <div className="up-container">
        <div className="up-issues-header-wrap">
          <div className="up-issues-title-area">
            <span className="up-badge up-badge--purple" style={{ marginBottom: '8px' }}>
              Live Civic Incidents
            </span>
            <h2 className="up-issues-title">
              Explore <span className="up-text-gradient-purple">Nearby Issues</span>
            </h2>
            <p className="up-issues-desc">
              Real community grievance reports registered directly on the UrbanPulse platform.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="up-issues-filters">
            <button
              type="button"
              className={`up-filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Issues
            </button>
            <button
              type="button"
              className={`up-filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              type="button"
              className={`up-filter-tab ${filter === 'resolved' ? 'active' : ''}`}
              onClick={() => setFilter('resolved')}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
            <div className="up-pulse-dot" style={{ margin: '0 auto 16px', width: '14px', height: '14px' }}></div>
            <span>Fetching live database records...</span>
          </div>
        ) : reports.length === 0 ? (
          <div style={{
            background: 'var(--up-card)',
            border: '1px solid var(--up-border)',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            color: '#94A3B8'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <h4 style={{ color: '#FFF', marginBottom: '6px' }}>No {filter} issues found</h4>
            <p style={{ fontSize: '0.9rem' }}>Check back later or report a new civic issue in your area.</p>
          </div>
        ) : (
          <div className="up-issues-grid">
            {reports.slice(0, 6).map((report) => {
              const isResolved = (report.status || '').toLowerCase() === 'resolved';
              const coords = report.location?.coordinates;
              const hasImage = report.images && report.images.length > 0 && report.images[0];

              return (
                <div key={report._id || report.title} className="up-issue-card">
                  <div className="up-issue-top">
                    <span className="up-badge up-badge--purple" style={{ fontSize: '0.72rem' }}>
                      {report.category || 'General'}
                    </span>
                    <span
                      className={`up-badge ${isResolved ? 'up-badge--green' : 'up-badge--amber'}`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      {report.status || 'Active'}
                    </span>
                  </div>

                  {hasImage && (
                    <div className="up-issue-image-wrap">
                      <img src={report.images[0]} alt={report.title} loading="lazy" />
                    </div>
                  )}

                  <h3 className="up-issue-title">{report.title}</h3>
                  <p className="up-issue-desc">{truncate(report.description, 110)}</p>

                  <div className="up-issue-footer">
                    <div className="up-issue-loc" title="Coordinates">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>
                        {coords ? `${coords[0].toFixed(3)}°E, ${coords[1].toFixed(3)}°N` : 'Mathura'}
                      </span>
                    </div>

                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="up-issues-actions-bar">
          <button
            type="button"
            className="up-btn up-btn--primary"
            onClick={onExploreMap}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            Explore All Issues on Live Map
          </button>
        </div>
      </div>
    </section>
  );
}
