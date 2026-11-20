import React, { useState, useEffect, useRef } from 'react';
import './NotificationPopUp.css';

/**
 * NotificationPopUp Component — TopBar Notification Bell & Popover System
 * Displays real-time civic updates, upcoming community events from /api/events,
 * civic incidents from /api/reports, and locality telemetry for the user's pincode.
 */
export default function NotificationPopUp({ user, onOpenSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Load real notifications from backend on mount and when user's address/pincode changes
  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        const [evRes, repRes] = await Promise.all([
          fetch('/api/events?limit=3').catch(() => null),
          fetch('/api/reports?limit=3').catch(() => null),
        ]);

        const notifs = [];

        // 1. Community Events Notifications
        if (evRes && evRes.ok) {
          const evJson = await evRes.json();
          const events = evJson.data || [];
          events.forEach((ev) => {
            notifs.push({
              id: `ev-${ev._id || ev.title}`,
              type: 'event',
              title: `Nearby Event: ${ev.title}`,
              desc: `${ev.venue || 'Mathura'} • ${ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Upcoming'}`,
              time: 'Nearby',
              unread: true,
            });
          });
        }

        // 2. Incident & Civic Hazard Notifications
        if (repRes && repRes.ok) {
          const repJson = await repRes.json();
          const reports = repJson.data || [];
          reports.forEach((rep) => {
            notifs.push({
              id: `rep-${rep._id || rep.title}`,
              type: 'incident',
              title: `Civic Alert: ${rep.title}`,
              desc: `${rep.category || 'General'} • Status: ${rep.status || 'Active'}`,
              time: 'Recent',
              unread: true,
            });
          });
        }

        // 3. Location & Area Monitoring Telemetry Notification
        notifs.push({
          id: 'sys-loc',
          type: 'system',
          title: 'Civic Telemetry Active',
          desc: `Monitoring live alerts for ${user?.address ? user.address.split(',')[0] : 'Mathura Area'} (Pincode ${user?.pincode || '281001'}).`,
          time: 'Active',
          unread: false,
        });

        if (isMounted) {
          setNotifications(notifs);
        }
      } catch (err) {
        console.warn('Error loading notifications:', err);
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Click outside to dismiss popover
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleItemClick = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="up-notification-popup-wrap" ref={notifRef}>
      {/* Bell Button */}
      <button
        type="button"
        className={`up-notification-popup-bell ${isOpen ? 'active' : ''}`}
        title="Notifications"
        aria-label="View notifications"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="up-notification-popup-dot" aria-label={`${unreadCount} unread updates`}>
            <span className="up-notification-popup-ping" />
          </span>
        )}
      </button>

      {/* Pop-up Dropdown Card */}
      {isOpen && (
        <div className="up-notification-popup-card" role="dialog" aria-label="Notifications Panel">
          {/* Header */}
          <div className="up-notif-pop-header">
            <div className="up-notif-pop-title-area">
              <span className="up-notif-pop-title">Notifications</span>
              {unreadCount > 0 && (
                <span className="up-notif-pop-badge">{unreadCount} New</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="up-notif-pop-mark-read"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div className="up-notif-pop-list">
            {notifications.length === 0 ? (
              <div className="up-notif-pop-empty">
                No new alerts for your area.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`up-notif-pop-item ${notif.unread ? 'unread' : ''}`}
                  onClick={() => handleItemClick(notif.id)}
                >
                  <div className={`up-notif-pop-icon up-notif-pop-icon--${notif.type}`}>
                    {notif.type === 'event' && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                      </svg>
                    )}
                    {notif.type === 'incident' && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    )}
                    {notif.type === 'system' && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                  </div>

                  <div className="up-notif-pop-content">
                    <div className="up-notif-pop-heading">{notif.title}</div>
                    <div className="up-notif-pop-desc">{notif.desc}</div>
                    <div className="up-notif-pop-time">{notif.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with settings shortcut & close */}
          <div className="up-notif-pop-footer">
            {onOpenSettings && (
              <button
                type="button"
                className="up-notif-pop-config-btn"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
              >
                Alert Settings
              </button>
            )}
            <button
              type="button"
              className="up-notif-pop-close-btn"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
