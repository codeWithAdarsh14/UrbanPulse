import React from 'react';
import './TopBar.css';

export default function TopBar({
  onSearch,
  searchQuery = '',
  setSearchQuery,
  activeLocationName = 'Mathura, UP',
  onLocationClick,
  user,
  onOpenSettings,
  onLogout,
}) {
  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (setSearchQuery) {
      setSearchQuery(value);
    }
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    if (setSearchQuery) {
      setSearchQuery('');
    }
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <header className="up-topbar">
      {/* ── Left: Search ── */}
      <div className="up-search-wrap">
        <span className="up-search-icon" aria-hidden="true">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          className="up-search-input"
          placeholder="Search for issues, events..."
          value={searchQuery}
          onChange={handleSearchChange}
          aria-label="Search issues and events"
        />
        {searchQuery && (
          <button
            type="button"
            className="up-search-clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Right: Location, Notifications, Avatar ── */}
      <div className="up-topbar-right">
        {/* Location pill */}
        <div
          className="up-location-pill"
          title="Click to explore this location on map"
          onClick={onLocationClick}
          style={{ cursor: onLocationClick ? 'pointer' : 'default' }}
          role={onLocationClick ? 'button' : undefined}
          tabIndex={onLocationClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (onLocationClick && (e.key === 'Enter' || e.key === ' ')) {
              onLocationClick();
            }
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="up-location-text">{activeLocationName}</span>
        </div>

        {/* Notification Bell */}
        <div className="up-notification-bell" title="Notifications" aria-label="Notifications">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="up-notification-dot" aria-label="Unread updates">
            <span className="up-notification-ping" />
          </span>
        </div>

        {/* User avatar circle */}
        <div
          className="up-topbar-avatar"
          title={`${user?.name || 'Citizen'} (${user?.role || 'citizen'}) — Click to open settings`}
          onClick={onOpenSettings}
          style={{ cursor: onOpenSettings ? 'pointer' : 'default' }}
          role={onOpenSettings ? 'button' : undefined}
          tabIndex={onOpenSettings ? 0 : undefined}
        >
          <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
        </div>

        {/* Quick Sign Out Action */}
        {onLogout && (
          <button
            type="button"
            className="up-topbar-logout-btn"
            title="Sign Out"
            aria-label="Sign Out"
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              borderRadius: '8px',
              padding: '7px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
              marginLeft: '6px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Exit</span>
          </button>
        )}
      </div>
    </header>
  );
}
