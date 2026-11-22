import React from 'react';
import './Sidebar.css';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    id: 'map',
    label: 'Explore Map',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    id: 'report',
    label: 'Report Issue',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    id: 'events',
    label: 'Community Events',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'my-reports',
    label: 'My Reports',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
];

export default function Sidebar({
  activeNav = 'dashboard',
  setActiveNav,
  collapsed = false,
  setCollapsed,
  onReportClick,
  user,
  onOpenSettings,
  onLogout,
}) {
  const handleNavClick = (item) => {
    if (item.id === 'report') {
      if (onReportClick) {
        onReportClick();
      }
      if (setActiveNav) {
        setActiveNav(item.id);
      }
    } else {
      if (setActiveNav) {
        setActiveNav(item.id);
      }
    }
  };

  const toggleCollapsed = () => {
    if (setCollapsed) {
      setCollapsed(!collapsed);
    }
  };

  return (
    <aside className={`up-sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Main Navigation">
      {/* ── Logo Area ── */}
      <div className="up-sidebar-logo-area">
        <div className="up-sidebar-logo-icon" title="UrbanPulse">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="up-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C62852" />
                <stop offset="100%" stopColor="#F7A6B7" />
              </linearGradient>
            </defs>
            <rect x="3" y="14" width="5" height="15" rx="1" fill="url(#up-logo-grad)" fillOpacity="0.75" />
            <rect x="10" y="6" width="6" height="23" rx="1.5" fill="url(#up-logo-grad)" />
            <rect x="18" y="11" width="5" height="18" rx="1" fill="url(#up-logo-grad)" fillOpacity="0.85" />
            <rect x="25" y="16" width="4" height="13" rx="1" fill="url(#up-logo-grad)" fillOpacity="0.7" />
            <circle cx="13" cy="10" r="1" fill="#FFFFFF" />
            <circle cx="13" cy="14" r="1" fill="#FFFFFF" />
            <circle cx="20.5" cy="15" r="1" fill="#FFFFFF" />
          </svg>
        </div>
        {!collapsed && (
          <div className="up-sidebar-brand-text">
            <span className="up-sidebar-brand-name">UrbanPulse</span>
            <span className="up-sidebar-brand-tagline">Report • Track • Improve</span>
          </div>
        )}
      </div>

      {/* ── Nav Items ── */}
      <nav className="up-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`up-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="up-nav-icon">{item.icon}</span>
              {!collapsed && <span className="up-nav-text">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom Section ── */}
      <div className="up-sidebar-bottom">
        {/* Promo card */}
        {!collapsed && (
          <div className="up-sidebar-promo-card">
            <div className="up-promo-header">
              <div className="up-promo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--up-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                </svg>
              </div>
              <span className="up-promo-title">Greener Mathura Together</span>
            </div>
            <p className="up-promo-desc">
              Transform our city street by street with community-powered civic actions.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="up-sidebar-divider" />

        {/* User & Settings & Collapse toggle */}
        <div className="up-sidebar-user-row">
          <div
            className="up-sidebar-user-avatar"
            title={`${user?.name || 'Citizen'} (${user?.role || 'citizen'})`}
            onClick={onOpenSettings}
            style={{ cursor: onOpenSettings ? 'pointer' : 'default' }}
          >
            <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
          </div>
          {!collapsed && (
            <div
              className="up-sidebar-user-meta"
              onClick={onOpenSettings}
              style={{ cursor: onOpenSettings ? 'pointer' : 'default' }}
            >
              <span className="up-sidebar-user-name">{user?.name || 'Urban Citizen'}</span>
              <span className="up-sidebar-user-badge">
                {user?.role ? user.role.toUpperCase() : 'Active Reporter'}
              </span>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              className="up-sidebar-action-btn"
              title="Settings & Profile"
              aria-label="Settings"
              onClick={onOpenSettings}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
          {!collapsed && onLogout && (
            <button
              type="button"
              className="up-sidebar-action-btn"
              title="Sign Out"
              aria-label="Sign Out"
              onClick={onLogout}
              style={{ color: '#F87171' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="up-sidebar-toggle-btn"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`up-collapse-chevron ${collapsed ? 'rotated' : ''}`}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
