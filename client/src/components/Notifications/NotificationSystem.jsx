import React from 'react';
import './NotificationSystem.css';

/**
 * NotificationSystem Component — Global Toast Stack & Alert Display
 * Renders animated toast cards (success, error, info) for civic reporting actions,
 * status updates, and nearby event notifications.
 */
export default function NotificationSystem({ toasts = [], onRemoveToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="up-toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`up-toast up-toast--${toast.type || 'info'}`}
          role="status"
        >
          {/* Icon */}
          <div className="up-toast__icon">
            {toast.type === 'success' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {toast.type !== 'success' && toast.type !== 'error' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="up-toast__content">
            <p className="up-toast__message">{toast.message}</p>
          </div>

          {/* Close Action */}
          <button
            type="button"
            className="up-toast__close"
            onClick={() => onRemoveToast && onRemoveToast(toast.id)}
            aria-label="Close notification"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
