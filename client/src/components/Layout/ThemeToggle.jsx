import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ThemeToggle — icon-only sun/moon button.
 * Light mode → shows Moon icon (switch to dark)
 * Dark mode → shows Sun icon (switch to light)
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`up-theme-toggle ${className}`}
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--up-surface)',
        border: '1px solid var(--up-border-2)',
        color: 'var(--up-text-2)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--up-accent-soft)';
        e.currentTarget.style.borderColor = 'var(--up-accent-border)';
        e.currentTarget.style.color = 'var(--up-accent)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--up-surface)';
        e.currentTarget.style.borderColor = 'var(--up-border-2)';
        e.currentTarget.style.color = 'var(--up-text-2)';
      }}
    >
      {isDark ? (
        /* Sun icon — shown in dark mode to switch to light */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        /* Moon icon — shown in light mode to switch to dark */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
