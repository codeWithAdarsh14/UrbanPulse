import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { DASHBOARD_URL } from '../../config/constants';
import LiveMapPreview from '../Common/LiveMapPreview';
import './HeroSection.css';

export default function HeroSection({ onExploreMap, onReportIssue, onOpenLoginModal, onOpenDashboard }) {
  const { user, isAuthenticated } = useAuth();
  return (
    <section className="up-hero">
      <div className="up-container up-hero-grid">
        {/* Left Content */}
        <div className="up-hero-content">
          <div className="up-hero-badge-wrap">
            <span className="up-badge up-badge--purple">
              <span className="up-pulse-dot"></span> Civic Intelligence Platform
            </span>
            <span className="up-badge up-badge--cyan">Mathura Live Grid</span>
          </div>

          <h1 className="up-hero-title">
            Make Your City Better.{' '}
            <span className="up-text-gradient-purple">One Report</span> at a Time.
          </h1>

          <p className="up-hero-desc">
            Discover local issues, report civic problems, track community events,
            and work together to build a cleaner, safer, and smarter city.
          </p>

          <div className="up-hero-ctas">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="up-btn up-btn--cyan"
                  style={{ padding: '12px 26px', fontSize: '1rem' }}
                  onClick={onOpenDashboard || (() => { window.location.href = '/app'; })}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="14" width="7" height="7" rx="2" />
                    <rect x="3" y="14" width="7" height="7" rx="2" />
                  </svg>
                  Open Live Dashboard ➔
                </button>
                <button
                  type="button"
                  className="up-btn up-btn--secondary"
                  onClick={onExploreMap}
                >
                  Explore Map
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="up-btn up-btn--primary"
                  onClick={onExploreMap}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                    <line x1="9" y1="3" x2="9" y2="18" />
                    <line x1="15" y1="6" x2="15" y2="21" />
                  </svg>
                  Explore Live Map
                </button>

                <button
                  type="button"
                  className="up-btn up-btn--secondary"
                  onClick={onOpenLoginModal || onReportIssue}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Sign In to Report
                </button>
              </>
            )}
          </div>

          <div className="up-hero-tags">
            <div className="up-hero-tag-item">
              <span style={{ color: '#10B981' }}>✓</span> 100% Genuine Backend Telemetry
            </div>
            <div className="up-hero-tag-item">
              <span style={{ color: '#22D3EE' }}>✓</span> Real-Time Geospatial Resolution
            </div>
            <div className="up-hero-tag-item">
              <span style={{ color: '#C084FC' }}>✓</span> Verified Citizen Reports
            </div>
          </div>
        </div>

        {/* Right Map Preview Card */}
        <div className="up-hero-map-card">
          <div className="up-hero-map-header">
            <div className="up-hero-map-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Mathura Metropolitan Interactive Preview</span>
            </div>
            <span className="up-badge up-badge--green" style={{ fontSize: '0.72rem' }}>
              Live Sync
            </span>
          </div>

          <div className="up-hero-map-viewport">
            <LiveMapPreview />
            <div className="up-hero-map-overlay">
              <div className="up-hero-overlay-stat">
                <span>Coordinates:</span>
                <span className="up-hero-overlay-val">27.49° N, 77.67° E</span>
              </div>
              <div className="up-hero-overlay-stat">
                <span className="up-pulse-dot up-pulse-dot--green"></span>
                <span className="up-hero-overlay-val">Real Atlas MongoDB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
