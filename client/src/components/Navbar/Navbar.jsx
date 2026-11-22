import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../services/api';
import { DASHBOARD_URL } from '../../config/constants';
import ThemeToggle from '../Layout/ThemeToggle';
import './Navbar.css';

export default function Navbar({ onNavigate, activePage = 'home', onOpenLoginModal }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'ok' | 'down' | 'checking'

  // Scroll detection for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check backend server health
  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await request('/api/health');
        if (isMounted) {
          setServerStatus(res.status === 'ok' ? 'ok' : 'degraded');
        }
      } catch {
        if (isMounted) setServerStatus('down');
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleNav = (target) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(target);
    }
  };

  return (
    <header className={`up-navbar-wrap ${isScrolled ? 'scrolled' : ''}`}>
      <div className="up-container up-navbar">
        {/* Brand Logo */}
        <div className="up-brand" onClick={() => handleNav('home')}>
          <div className="up-brand-logo">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="up-nav-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C62852" />
                  <stop offset="100%" stopColor="#F7A6B7" />
                </linearGradient>
              </defs>
              <rect x="3" y="14" width="5" height="15" rx="1" fill="url(#up-nav-logo-grad)" fillOpacity="0.8" />
              <rect x="10" y="6" width="6" height="23" rx="1.5" fill="url(#up-nav-logo-grad)" />
              <rect x="18" y="11" width="5" height="18" rx="1" fill="url(#up-nav-logo-grad)" fillOpacity="0.9" />
              <rect x="25" y="16" width="4" height="13" rx="1" fill="url(#up-nav-logo-grad)" fillOpacity="0.75" />
              <circle cx="13" cy="10" r="1.2" fill="#FFFFFF" />
              <circle cx="13" cy="14" r="1.2" fill="#FFFFFF" />
              <circle cx="20.5" cy="15" r="1.2" fill="#FFFFFF" />
            </svg>
          </div>
          <div className="up-brand-text">
            <span className="up-brand-name">UrbanPulse</span>
            <span className="up-brand-tagline">Civic Intelligence</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav>
          <ul className="up-nav-links">
            <li>
              <button
                type="button"
                className={`up-nav-link ${activePage === 'home' ? 'active' : ''}`}
                onClick={() => handleNav('home')}
              >
                Home
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`up-nav-link ${activePage === 'map' ? 'active' : ''}`}
                onClick={() => handleNav('map')}
              >
                Explore Map
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`up-nav-link ${activePage === 'events' ? 'active' : ''}`}
                onClick={() => handleNav('events')}
              >
                Community Events
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`up-nav-link ${activePage === 'features' ? 'active' : ''}`}
                onClick={() => handleNav('features')}
              >
                Features
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`up-nav-link ${activePage === 'about' ? 'active' : ''}`}
                onClick={() => handleNav('about')}
              >
                About Us
              </button>
            </li>
            <li>
              {isAuthenticated ? (
                <button
                  type="button"
                  className="up-nav-link"
                  style={{ color: 'var(--up-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => handleNav('app')}
                  title="Go to Live Civic Dashboard"
                >
                  Dashboard ↗
                </button>
              ) : (
                <button
                  type="button"
                  className="up-nav-link"
                  style={{ color: 'var(--up-text-2)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    if (onOpenLoginModal) onOpenLoginModal();
                    else handleNav('login');
                  }}
                  title="Sign in required to access Dashboard"
                >
                  Dashboard 🔒
                </button>
              )}
            </li>
          </ul>
        </nav>

        {/* Right Actions */}
        <div className="up-navbar-actions">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Live Status Indicator */}
          <div className="up-health-pill" title={`API Server Status: ${serverStatus}`}>
            <span
              className={`up-pulse-dot ${
                serverStatus === 'ok' ? 'up-pulse-dot--green' : ''
              }`}
            ></span>
            <span>
              {serverStatus === 'ok'
                ? 'Live: Operational'
                : serverStatus === 'checking'
                ? 'Connecting...'
                : 'Server Offline'}
            </span>
          </div>

          {/* Auth State */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="up-btn up-btn--cyan"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                onClick={() => handleNav('app')}
                title="Open Live Dashboard"
              >
                Open Dashboard ➔
              </button>
              <div className="up-user-dropdown">
                <div className="up-user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="up-user-info">
                  <span className="up-user-name">{user?.name || 'Citizen'}</span>
                  <span className="up-user-role">{user?.role || 'Citizen'}</span>
                </div>
                <button
                  type="button"
                  className="up-btn up-btn--ghost"
                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  onClick={logout}
                  title="Log Out"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="up-auth-buttons">
              <button
                type="button"
                className="up-btn up-btn--ghost"
                onClick={() => {
                  if (onOpenLoginModal) onOpenLoginModal();
                  else handleNav('login');
                }}
              >
                Login
              </button>
              <button
                type="button"
                className="up-btn up-btn--primary"
                onClick={() => handleNav('register')}
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="up-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span
              className="up-menu-bar"
              style={mobileMenuOpen ? { transform: 'rotate(45deg) translate(5px, 6px)' } : {}}
            ></span>
            <span
              className="up-menu-bar"
              style={mobileMenuOpen ? { opacity: 0 } : {}}
            ></span>
            <span
              className="up-menu-bar"
              style={mobileMenuOpen ? { transform: 'rotate(-45deg) translate(5px, -6px)' } : {}}
            ></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="up-mobile-menu">
          <button
            type="button"
            className={`up-mobile-nav-link ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => handleNav('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`up-mobile-nav-link ${activePage === 'map' ? 'active' : ''}`}
            onClick={() => handleNav('map')}
          >
            Explore Map
          </button>
          <button
            type="button"
            className={`up-mobile-nav-link ${activePage === 'events' ? 'active' : ''}`}
            onClick={() => handleNav('events')}
          >
            Community Events
          </button>
          <button
            type="button"
            className={`up-mobile-nav-link ${activePage === 'features' ? 'active' : ''}`}
            onClick={() => handleNav('features')}
          >
            Features
          </button>
          <button
            type="button"
            className={`up-mobile-nav-link ${activePage === 'about' ? 'active' : ''}`}
            onClick={() => handleNav('about')}
          >
            About Us
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              className="up-mobile-nav-link"
              style={{ color: 'var(--up-accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left' }}
              onClick={() => handleNav('app')}
            >
              <span>Live Civic Dashboard</span>
              <span>↗</span>
            </button>
          ) : (
            <button
              type="button"
              className="up-mobile-nav-link"
              style={{ color: 'var(--up-text-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left' }}
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenLoginModal) onOpenLoginModal();
                else handleNav('login');
              }}
            >
              <span>Civic Dashboard</span>
              <span>🔒 Sign In Required</span>
            </button>
          )}

          <div className="up-mobile-actions">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="up-btn up-btn--cyan"
                  style={{ textAlign: 'center' }}
                  onClick={() => handleNav('app')}
                >
                  Open Dashboard ➔
                </button>
                <button
                  type="button"
                  className="up-btn up-btn--secondary"
                  onClick={logout}
                >
                  Logout ({user?.name})
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="up-btn up-btn--secondary"
                  onClick={() => handleNav('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="up-btn up-btn--primary"
                  onClick={() => handleNav('register')}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
