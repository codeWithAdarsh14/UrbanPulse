import React from 'react';
import NotificationPopUp from '../Notifications/NotificationPopUp';
import ThemeToggle from './ThemeToggle';
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

      {/* ── Right: Location, Theme Toggle, Notifications, Avatar ── */}
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--up-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="up-location-text">{activeLocationName}</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell & Popover */}
        <NotificationPopUp user={user} onOpenSettings={onOpenSettings} />

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
