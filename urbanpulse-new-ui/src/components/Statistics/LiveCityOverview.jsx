import React, { useState, useEffect } from 'react';
import { fetchRealReportMetrics } from '../../services/reportService';
import { fetchRealEventMetrics } from '../../services/eventService';
import './LiveCityOverview.css';

function Counter({ value, duration = 1000 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) {
      setDisplay(0);
      return;
    }
    let start = null;
    let animId;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * target));
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplay(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [value, duration]);

  return <span>{display}</span>;
}

export default function LiveCityOverview() {
  const [stats, setStats] = useState({
    totalReports: 0,
    activeIssues: 0,
    resolvedIssues: 0,
    communityEvents: 0,
    activeWards: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const [repMetrics, evMetrics] = await Promise.all([
          fetchRealReportMetrics(),
          fetchRealEventMetrics(),
        ]);

        if (isMounted) {
          setStats({
            totalReports: repMetrics.total,
            activeIssues: repMetrics.active,
            resolvedIssues: repMetrics.resolved,
            communityEvents: evMetrics.total,
            activeWards: repMetrics.activeWardsCount,
          });
        }
      } catch (err) {
        console.error('Failed to load live city overview:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="up-stats-section" id="overview">
      <div className="up-container">
        <div className="up-stats-header">
          <div className="up-stats-badge">
            <span className="up-badge up-badge--cyan">
              <span className="up-pulse-dot"></span> Live Telemetry
            </span>
          </div>
          <h2 className="up-stats-title">
            Live City <span className="up-text-gradient-purple">Overview</span>
          </h2>
          <p className="up-stats-subtitle">
            Genuine civic metrics computed directly from our active MongoDB Atlas database.
            No simulated counts or invented statistics.
          </p>
        </div>

        <div className="up-stats-grid">
          {/* Total Reports */}
          <div className="up-stat-card up-stat-card--purple">
            <div className="up-stat-card__glow"></div>
            <div className="up-stat-icon-wrap" style={{ color: '#C084FC' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="up-stat-val">
              {loading ? '—' : <Counter value={stats.totalReports} />}
            </div>
            <div className="up-stat-lbl">Total Reported Issues</div>
            <div className="up-stat-sub">Across all municipal wards</div>
          </div>

          {/* Active Issues */}
          <div className="up-stat-card up-stat-card--amber">
            <div className="up-stat-card__glow"></div>
            <div className="up-stat-icon-wrap" style={{ color: '#F59E0B' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="up-stat-val">
              {loading ? '—' : <Counter value={stats.activeIssues} />}
            </div>
            <div className="up-stat-lbl">Currently Active</div>
            <div className="up-stat-sub">Pending municipal dispatch</div>
          </div>

          {/* Resolved Issues */}
          <div className="up-stat-card up-stat-card--green">
            <div className="up-stat-card__glow"></div>
            <div className="up-stat-icon-wrap" style={{ color: '#10B981' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="up-stat-val">
              {loading ? '—' : <Counter value={stats.resolvedIssues} />}
            </div>
            <div className="up-stat-lbl">Resolved Issues</div>
            <div className="up-stat-sub">Confirmed by citizens</div>
          </div>

          {/* Community Events */}
          <div className="up-stat-card up-stat-card--cyan">
            <div className="up-stat-card__glow"></div>
            <div className="up-stat-icon-wrap" style={{ color: '#22D3EE' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="up-stat-val">
              {loading ? '—' : <Counter value={stats.communityEvents} />}
            </div>
            <div className="up-stat-lbl">Community Events</div>
            <div className="up-stat-sub">Local drives & townhalls</div>
          </div>

          {/* Active Wards */}
          <div className="up-stat-card up-stat-card--purple">
            <div className="up-stat-card__glow"></div>
            <div className="up-stat-icon-wrap" style={{ color: '#C084FC' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="up-stat-val">
              {loading ? '—' : <Counter value={stats.activeWards} />}
            </div>
            <div className="up-stat-lbl">Active Wards</div>
            <div className="up-stat-sub">Connected coverage zones</div>
          </div>
        </div>
      </div>
    </section>
  );
}
