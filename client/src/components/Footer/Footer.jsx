import React from 'react';
import './Footer.css';

export default function Footer({ onNavigate, onOpenModal }) {
  return (
    <footer className="up-footer">
      <div className="up-container">
        <div className="up-footer-grid">
          {/* Brand Col */}
          <div className="up-footer-brand-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--up-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--up-border)',
                boxShadow: '0 0 10px var(--up-purple-glow)'
              }}>
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                  <rect x="3" y="14" width="5" height="15" rx="1" fill="#7C3AED" />
                  <rect x="10" y="6" width="6" height="23" rx="1.5" fill="#A855F7" />
                  <rect x="18" y="11" width="5" height="18" rx="1" fill="#22D3EE" />
                </svg>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFF' }}>
                UrbanPulse
              </span>
            </div>
            <p className="up-footer-desc">
              Civic issue monitoring, geospatial incident telemetry, and community event coordination for smarter cities.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#22D3EE' }}>
              <span className="up-pulse-dot"></span> Mathura Municipal Metropolitan Grid
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="up-footer-col-title">Navigation</h4>
            <ul className="up-footer-links">
              <li>
                <button type="button" className="up-footer-link" onClick={() => onNavigate('home')}>
                  Home
                </button>
              </li>
              <li>
                <button type="button" className="up-footer-link" onClick={() => onNavigate('map')}>
                  Explore Map
                </button>
              </li>
              <li>
                <button type="button" className="up-footer-link" onClick={() => onNavigate('events')}>
                  Community Events
                </button>
              </li>
              <li>
                <button type="button" className="up-footer-link" onClick={() => onNavigate('features')}>
                  Why UrbanPulse
                </button>
              </li>
            </ul>
          </div>

          {/* Civic Actions */}
          <div>
            <h4 className="up-footer-col-title">Civic Action</h4>
            <ul className="up-footer-links">
              <li>
                <button type="button" className="up-footer-link" onClick={() => onNavigate('login')}>
                  Citizen Login
                </button>
              </li>
              <li>
                <button type="button" className="up-footer-link" onClick={() => onNavigate('register')}>
                  Register Account
                </button>
              </li>
              <li>
                <button type="button" className="up-footer-link" onClick={() => onNavigate('map')}>
                  Report an Issue
                </button>
              </li>
              <li>
                <button type="button" className="up-footer-link" onClick={() => onNavigate('events')}>
                  Attend Townhalls
                </button>
              </li>
            </ul>
          </div>

          {/* System & Architecture */}
          <div>
            <h4 className="up-footer-col-title">Platform</h4>
            <ul className="up-footer-links">
              <li style={{ fontSize: '0.84rem' }}>
                <span style={{ color: '#FFF' }}>Backend:</span> Node.js + Express
              </li>
              <li style={{ fontSize: '0.84rem' }}>
                <span style={{ color: '#FFF' }}>Database:</span> MongoDB Atlas SRV
              </li>
              <li style={{ fontSize: '0.84rem' }}>
                <span style={{ color: '#FFF' }}>Geospatial:</span> GeoJSON 2dsphere
              </li>
              <li style={{ fontSize: '0.84rem' }}>
                <span style={{ color: '#FFF' }}>Frontend:</span> React 19 + Leaflet
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="up-footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} UrbanPulse Platform. Built for civic transparency.
          </div>
          <div className="up-footer-legal-links">
            <button
              type="button"
              className="up-footer-link"
              onClick={() => onOpenModal && onOpenModal('privacy')}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="up-footer-link"
              onClick={() => onOpenModal && onOpenModal('terms')}
            >
              Terms & Conditions
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
