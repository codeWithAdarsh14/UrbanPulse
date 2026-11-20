import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../../services/eventService';
import { formatEventDateTime, truncate } from '../../utils/formatters';
import './EventsPreview.css';

export default function EventsPreview() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      try {
        const res = await fetchEvents({ limit: 6 });
        if (isMounted) {
          setEvents(res.events || []);
        }
      } catch (err) {
        console.error('Error fetching events preview:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="up-events-section" id="events">
      <div className="up-container">
        <div className="up-events-header">
          <span className="up-badge up-badge--cyan" style={{ marginBottom: '10px' }}>
            Civic Community
          </span>
          <h2 className="up-events-title">
            Community <span className="up-text-gradient-purple">Events</span>
          </h2>
          <p className="up-events-desc">
            Connect with local citizen cleanup drives, campus festivals, and municipal townhalls.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
            <div className="up-pulse-dot" style={{ margin: '0 auto 16px', width: '14px', height: '14px' }}></div>
            <span>Loading community events from database...</span>
          </div>
        ) : events.length === 0 ? (
          <div style={{
            background: 'var(--up-card)',
            border: '1px solid var(--up-border)',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            color: '#94A3B8'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
            </svg>
            <h4 style={{ color: '#FFF', marginBottom: '6px' }}>No Upcoming Events Scheduled</h4>
            <p style={{ fontSize: '0.9rem' }}>Check back soon for upcoming citizen drives and municipal gatherings.</p>
          </div>
        ) : (
          <div className="up-events-grid">
            {events.map((ev) => {
              const isPast = ev.endDate && new Date(ev.endDate) < new Date();

              return (
                <div key={ev._id || ev.title} className="up-event-card">
                  <div className="up-event-glow-line"></div>

                  <div className="up-event-badge-row">
                    <span className="up-badge up-badge--cyan" style={{ fontSize: '0.72rem' }}>
                      {ev.category || 'Event'}
                    </span>
                    <span
                      className={`up-badge ${isPast ? 'up-badge--red' : 'up-badge--green'}`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      {isPast ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>

                  <h3 className="up-event-title">{ev.title}</h3>

                  <div className="up-event-venue">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{ev.venue || 'Mathura Venue'}</span>
                  </div>

                  <p className="up-event-desc">{truncate(ev.description, 130)}</p>

                  <div className="up-event-date-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{formatEventDateTime(ev.startDate)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
