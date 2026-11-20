import React from 'react';
import './CTASection.css';

export default function CTASection({ onRegister, onExplore }) {
  return (
    <section className="up-cta-section">
      <div className="up-container">
        <div className="up-cta-card">
          <div className="up-cta-badge">
            <span className="up-badge up-badge--cyan">Join UrbanPulse</span>
          </div>
          <h2 className="up-cta-title">
            Your City. Your Voice.{' '}
            <span className="up-text-gradient-purple">Your Responsibility.</span>
          </h2>
          <p className="up-cta-desc">
            Join your community and help make a real difference.
            Be the first to report issues in your neighborhood or volunteer at local events.
          </p>
          <div className="up-cta-buttons">
            <button
              type="button"
              className="up-btn up-btn--primary"
              style={{ padding: '14px 32px', fontSize: '1rem' }}
              onClick={onRegister}
            >
              Create Free Account
            </button>
            <button
              type="button"
              className="up-btn up-btn--secondary"
              style={{ padding: '14px 28px', fontSize: '1rem' }}
              onClick={onExplore}
            >
              Explore UrbanPulse
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
