import React from 'react';
import './WhyUrbanPulse.css';

const FEATURES = [
  {
    title: 'Interactive Civic Map',
    text: 'View live issues and events on an interactive, dark-themed geospatial map powered by OpenStreetMap and real GPS coordinates.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Issue Reporting',
    text: 'Submit problems with rich categories, detailed incident descriptions, photos, and exact geographical locations.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    title: 'Community Event Discovery',
    text: 'Explore college cultural fests, citizen cleanup campaigns, and neighborhood tree plantation drives with full venue details.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: 'Transparent Issue Tracking',
    text: 'Track real status transitions from active pending to verified resolution with honest timestamps and SLA transparency.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: 'Community Participation',
    text: 'Citizens confirm reported issues, eliminate duplicate submissions, and support local civic governance initiatives.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Verified Issue Resolution',
    text: 'Clear, verifiable grievance closure verified by community feedback and authenticated civic cell oversight.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
];

export default function WhyUrbanPulse() {
  return (
    <section className="up-features-section" id="features">
      <div className="up-container">
        <div className="up-features-header">
          <span className="up-badge up-badge--purple" style={{ marginBottom: '10px' }}>
            Built for Smart Cities
          </span>
          <h2 className="up-features-title">
            Why <span className="up-text-gradient-purple">UrbanPulse</span>?
          </h2>
          <p className="up-features-desc">
            A battle-tested municipal platform delivering transparent accountability, genuine GIS telemetry, and community empowerment.
          </p>
        </div>

        <div className="up-features-grid">
          {FEATURES.map((feat, idx) => (
            <div key={idx} className="up-feature-card">
              <div className="up-feature-icon-box">{feat.icon}</div>
              <h3 className="up-feature-title">{feat.title}</h3>
              <p className="up-feature-text">{feat.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
