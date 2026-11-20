import React from 'react';
import './HowItWorks.css';

export default function HowItWorks() {
  return (
    <section className="up-hiw-section" id="how-it-works">
      <div className="up-container">
        <div className="up-hiw-header">
          <span className="up-badge up-badge--purple" style={{ marginBottom: '12px' }}>
            Workflow Pipeline
          </span>
          <h2 className="up-hiw-title">
            How <span className="up-text-gradient-purple">UrbanPulse</span> Works
          </h2>
          <p className="up-hiw-desc">
            Empowering residents and municipal authorities through a transparent, 3-step civic resolution cycle.
          </p>
        </div>

        <div className="up-hiw-steps">
          {/* Step 1 */}
          <div className="up-hiw-step-card">
            <span className="up-hiw-step-number">01</span>
            <div className="up-hiw-icon-box up-hiw-icon-box--purple">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h3 className="up-hiw-step-title">1. Report</h3>
            <p className="up-hiw-step-body">
              Citizens spot and submit local civic problems with precise GPS coordinates, photographic proof,
              and category tags in seconds.
            </p>
          </div>

          {/* Step 2 */}
          <div className="up-hiw-step-card">
            <span className="up-hiw-step-number">02</span>
            <div className="up-hiw-icon-box up-hiw-icon-box--cyan">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            </div>
            <h3 className="up-hiw-step-title">2. Track</h3>
            <p className="up-hiw-step-body">
              Neighbours discover reported civic issues and ongoing community townhalls on an interactive,
              real-time geographic map.
            </p>
          </div>

          {/* Step 3 */}
          <div className="up-hiw-step-card">
            <span className="up-hiw-step-number">03</span>
            <div className="up-hiw-icon-box up-hiw-icon-box--green">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="up-hiw-step-title">3. Improve</h3>
            <p className="up-hiw-step-body">
              Communities collaborate with civic officials, verify resolved repairs, and confirm resolution
              to maintain urban standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
