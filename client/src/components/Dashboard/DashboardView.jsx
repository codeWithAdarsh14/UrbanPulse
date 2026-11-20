import React, { useState, useEffect } from 'react';
import './DashboardView.css';

/**
 * Animated number counter component
 * Counts up smoothly from 0 on mount using requestAnimationFrame
 */
function AnimatedCounter({ value, duration = 1200 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

/**
 * Formats relative time (e.g., "2 hours ago", "just now")
 */
function formatTimeAgo(dateInput) {
  if (!dateInput) return 'recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'recently';

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/**
 * Formats date into readable format: "Nov 19, 2026"
 */
function formatDate(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats event date & time: "Sat, Nov 22 • 10:00 AM"
 */
function formatEventDateTime(dateInput) {
  if (!dateInput) return 'Date TBA';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Date TBA';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Main DashboardView component
 * Fetches reports and events on mount and displays civic metrics,
 * live activity feed, filtered reports table, and upcoming events.
 */
export default function DashboardView({
  onReportClick,
  onEventClick,
  lastSubmittedReport,
  lastSubmittedEvent,
  activeLocationName = 'Mathura District',
}) {
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportFilter, setReportFilter] = useState('all'); // 'all' | 'active' | 'resolved'
  const [expandedEventId, setExpandedEventId] = useState(null);

  // Synchronize immediately when a new report is submitted
  useEffect(() => {
    if (!lastSubmittedReport) return;
    setReports((prev) => {
      if (prev.some((r) => r._id === lastSubmittedReport._id)) return prev;
      return [lastSubmittedReport, ...prev];
    });
  }, [lastSubmittedReport]);

  // Synchronize immediately when a new event is submitted
  useEffect(() => {
    if (!lastSubmittedEvent) return;
    setEvents((prev) => {
      if (prev.some((e) => e._id === lastSubmittedEvent._id)) return prev;
      return [lastSubmittedEvent, ...prev];
    });
  }, [lastSubmittedEvent]);

  // Fetch reports and events on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      setLoading(true);
      try {
        const [reportsRes, eventsRes] = await Promise.all([
          fetch('/api/reports?limit=50').catch(() => null),
          fetch('/api/events?limit=20').catch(() => null)
        ]);

        if (isMounted) {
          if (reportsRes && reportsRes.ok) {
            const reportsJson = await reportsRes.json();
            const repData = Array.isArray(reportsJson.data)
              ? reportsJson.data
              : Array.isArray(reportsJson)
              ? reportsJson
              : [];
            setReports(repData);
          }

          if (eventsRes && eventsRes.ok) {
            const eventsJson = await eventsRes.json();
            const evData = Array.isArray(eventsJson.data)
              ? eventsJson.data
              : Array.isArray(eventsJson)
              ? eventsJson
              : [];
            setEvents(evData);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute metrics
  const totalReports = reports.length;
  const activeIssues = reports.filter(
    (r) => (r.status || 'active').toLowerCase() === 'active'
  ).length;
  const resolvedIssues = reports.filter(
    (r) => (r.status || '').toLowerCase() === 'resolved'
  ).length;
  const communityEvents = events.length;

  // Combine reports and events for Recent Activity feed (last 8 sorted desc by createdAt)
  const combinedActivity = [
    ...reports.map((r) => ({
      id: `rep-${r._id || r.title || 'unknown'}`,
      type: 'report',
      status: (r.status || 'active').toLowerCase(),
      title: r.title || 'Civic Issue Report',
      category: r.category || 'General',
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(0),
      raw: r
    })),
    ...events.map((e) => ({
      id: `ev-${e._id || e.title || 'unknown'}`,
      type: 'event',
      status: 'event',
      title: e.title || 'Community Event',
      category: e.category || 'Event',
      createdAt: e.createdAt ? new Date(e.createdAt) : new Date(0),
      raw: e
    }))
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  // Filtered reports for the Recent Reports Table (last 10)
  const filteredReports = reports
    .filter((r) => {
      const st = (r.status || 'active').toLowerCase();
      if (reportFilter === 'active') return st === 'active';
      if (reportFilter === 'resolved') return st === 'resolved';
      return true;
    })
    .slice(0, 10);

  // Upcoming events (sorted by startDate or createdAt asc, nearest first, next 4)
  const upcomingEvents = [...events]
    .sort((a, b) => {
      const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
      return dateA - dateB;
    })
    .slice(0, 4);

  const toggleEventDetails = (eventId) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  };

  return (
    <div className="dash-wrapper">
      {/* ── SECTION A: WELCOME HERO BANNER ── */}
      <section className="hero-banner">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Civic Intelligence & Action Hub
          </div>
          <h1 className="hero-title">Welcome to UrbanPulse 👋</h1>
          <p className="hero-subtitle">
            Together, let's build cleaner, safer and smarter communities. Report issues,
            track local resolutions in real-time, and join neighborhood impact events.
          </p>
          <div className="hero-actions">
            <button
              className="hero-cta"
              onClick={onReportClick}
              type="button"
              aria-label="Report an Issue"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>Report an Issue</span>
            </button>
            <button
              className="hero-cta hero-cta--event"
              onClick={onEventClick}
              type="button"
              aria-label="Report an Event"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Report an Event</span>
            </button>
            <div className="hero-meta-pill">
              <span className="live-pulse"></span>
              Live in {activeLocationName}
            </div>
          </div>
        </div>

        {/* Right side: Stylized Mathura City Skyline Illustration (Pure SVG) */}
        <div className="hero-illustration" aria-hidden="true">
          <svg
            className="mathura-skyline-svg"
            viewBox="0 0 380 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E1338" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#080B18" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="purpleTone" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7838F5" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="cyanTone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0891B2" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#171D35" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#080B18" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="domeGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#A855F7" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#7838F5" stopOpacity="0.4" />
              </linearGradient>
              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Sky & Ambient Stars */}
            <rect width="380" height="220" rx="16" fill="url(#skyGrad)" />
            <circle cx="295" cy="45" r="3" fill="#22D3EE" opacity="0.6" />
            <circle cx="240" cy="30" r="2" fill="#A855F7" opacity="0.7" />
            <circle cx="160" cy="40" r="1.5" fill="#F8FAFC" opacity="0.4" />
            <circle cx="90" cy="55" r="2" fill="#22D3EE" opacity="0.5" />
            <circle cx="340" cy="70" r="1.5" fill="#F8FAFC" opacity="0.5" />

            {/* Stylized Crescent Moon */}
            <path
              d="M315 28C310 32 308 40 312 47C316 54 324 57 331 54C322 62 306 58 301 47C297 36 304 26 315 28Z"
              fill="#22D3EE"
              opacity="0.85"
              filter="url(#glowFilter)"
            />

            {/* Back Silhouette Layer — Distant Temples & Civic Towers */}
            <path
              d="M20 180V120H35V105L45 80L55 105V120H75V135H95V110L105 95L115 110V135H140V125H160V140H185V115L195 90L205 115V140H230V118H255V140H280V105L295 75L310 105V140H340V125H365V180H20Z"
              fill="rgba(120,56,245,0.22)"
            />

            {/* Mid Silhouette Layer — Mathura Ghats, Shikharas, Chhatri Domes */}
            {/* Temple 1 (Left Shikhara with Kalash flag) */}
            <path
              d="M48 180V110H56L68 60L80 110H88V180H48Z"
              fill="rgba(168,85,247,0.35)"
              stroke="#A855F7"
              strokeWidth="0.75"
            />
            <line x1="68" y1="60" x2="68" y2="48" stroke="#22D3EE" strokeWidth="1.5" />
            <path d="M68 48L78 52L68 56Z" fill="#F59E0B" />

            {/* Pavilion Chhatri Dome (Mathura Yamuna ghat architecture) */}
            <path
              d="M98 180V130H106C106 130 112 108 126 108C140 108 146 130 146 130H154V180H98Z"
              fill="rgba(120,56,245,0.4)"
              stroke="url(#domeGlow)"
              strokeWidth="1"
            />
            <path d="M114 145H138V180H114V145Z" fill="#0C1024" opacity="0.6" />
            {/* Pillars */}
            <line x1="108" y1="130" x2="108" y2="180" stroke="#7838F5" strokeWidth="2" />
            <line x1="144" y1="130" x2="144" y2="180" stroke="#7838F5" strokeWidth="2" />

            {/* Grand Main Shikhara (Krishna Janmabhoomi motif) */}
            <path
              d="M175 180V105H185C185 105 196 68 205 52C214 68 225 105 225 105H235V180H175Z"
              fill="rgba(168,85,247,0.4)"
              stroke="#22D3EE"
              strokeWidth="1"
            />
            <line x1="205" y1="52" x2="205" y2="38" stroke="#22D3EE" strokeWidth="2" />
            <path d="M205 38L218 43L205 48Z" fill="#F59E0B" />
            <circle cx="205" cy="52" r="3" fill="#22D3EE" />

            {/* Right Chhatri Pavilion */}
            <path
              d="M255 180V128H263C263 128 270 112 282 112C294 112 301 128 301 128H309V180H255Z"
              fill="rgba(120,56,245,0.45)"
              stroke="#A855F7"
              strokeWidth="1"
            />
            {/* Small spire on right */}
            <path d="M320 180V125L335 95L350 125V180H320Z" fill="rgba(34,211,238,0.25)" />

            {/* Front Foreground — Yamuna Riverbank Ghat Steps */}
            <path
              d="M10 180H370V186H10V180ZM18 186H362V192H18V186ZM26 192H354V198H26V192ZM34 198H346V204H34V198Z"
              fill="#171D35"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />

            {/* Yamuna Water Layer */}
            <rect x="0" y="200" width="380" height="20" fill="url(#waterGrad)" />
            {/* Water reflections and ripples */}
            <line
              x1="50"
              y1="206"
              x2="110"
              y2="206"
              stroke="#22D3EE"
              strokeWidth="1.5"
              opacity="0.6"
              strokeLinecap="round"
            />
            <line
              x1="160"
              y1="209"
              x2="250"
              y2="209"
              stroke="#A855F7"
              strokeWidth="1.5"
              opacity="0.5"
              strokeLinecap="round"
            />
            <line
              x1="270"
              y1="205"
              x2="330"
              y2="205"
              stroke="#22D3EE"
              strokeWidth="1.5"
              opacity="0.4"
              strokeLinecap="round"
            />

            {/* Floating River Diyas (Ghat Lamps) */}
            <circle cx="130" cy="207" r="2.5" fill="#F59E0B" filter="url(#glowFilter)" />
            <circle cx="215" cy="210" r="2" fill="#F59E0B" filter="url(#glowFilter)" />

            {/* Smart Civic Streetlights (IoT/Tech accent) */}
            <line x1="88" y1="180" x2="88" y2="152" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="88" cy="152" r="3" fill="#22D3EE" filter="url(#glowFilter)" />
            <line x1="242" y1="180" x2="242" y2="152" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="242" cy="152" r="3" fill="#22D3EE" filter="url(#glowFilter)" />
          </svg>
        </div>
      </section>

      {/* ── SECTION B: STATS CARDS ROW (4 CARDS) ── */}
      <section className="stats-row" aria-label="Key Platform Metrics">
        {/* Card 1: Total Reports (Purple) */}
        <div className="stat-card stat-card--purple">
          <div className="stat-accent-bar" style={{ background: 'var(--dash-purple, #7838F5)' }} />
          <div className="stat-header">
            <span className="stat-icon-wrap stat-icon-wrap--purple">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <span className="stat-trend stat-trend--up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              Live
            </span>
          </div>
          <div className="stat-value">
            {loading ? <span className="skel-text" style={{ width: 60 }} /> : <AnimatedCounter value={totalReports} />}
          </div>
          <div className="stat-label">Total Reports</div>
        </div>

        {/* Card 2: Active Issues (Amber) */}
        <div className="stat-card stat-card--amber">
          <div className="stat-accent-bar" style={{ background: 'var(--dash-amber, #F59E0B)' }} />
          <div className="stat-header">
            <span className="stat-icon-wrap stat-icon-wrap--amber">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span className="stat-badge-tag stat-badge-tag--amber">Pending</span>
          </div>
          <div className="stat-value">
            {loading ? <span className="skel-text" style={{ width: 50 }} /> : <AnimatedCounter value={activeIssues} />}
          </div>
          <div className="stat-label">Active Issues</div>
        </div>

        {/* Card 3: Resolved Issues (Green) */}
        <div className="stat-card stat-card--green">
          <div className="stat-accent-bar" style={{ background: 'var(--dash-green, #10B981)' }} />
          <div className="stat-header">
            <span className="stat-icon-wrap stat-icon-wrap--green">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
            <span className="stat-badge-tag stat-badge-tag--green">Fixed</span>
          </div>
          <div className="stat-value">
            {loading ? <span className="skel-text" style={{ width: 50 }} /> : <AnimatedCounter value={resolvedIssues} />}
          </div>
          <div className="stat-label">Resolved Issues</div>
        </div>

        {/* Card 4: Community Events (Cyan) */}
        <div className="stat-card stat-card--cyan">
          <div className="stat-accent-bar" style={{ background: 'var(--dash-cyan, #22D3EE)' }} />
          <div className="stat-header">
            <span className="stat-icon-wrap stat-icon-wrap--cyan">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span className="stat-badge-tag stat-badge-tag--cyan">Upcoming</span>
          </div>
          <div className="stat-value">
            {loading ? <span className="skel-text" style={{ width: 45 }} /> : <AnimatedCounter value={communityEvents} />}
          </div>
          <div className="stat-label">Community Events</div>
        </div>
      </section>

      {/* ── SECTION C: RECENT ACTIVITY FEED ── */}
      <section className="dash-card activity-section">
        <div className="dash-card-header">
          <div>
            <h2 className="dash-card-title">Recent Activity</h2>
            <p className="dash-card-subtitle">Live updates from your community</p>
          </div>
          <div className="activity-live-indicator">
            <span className="pulse-dot"></span>
            Real-time Feed
          </div>
        </div>

        <div className="activity-feed">
          {loading ? (
            // 4 shimmer skeleton rows while loading
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`skel-act-${idx}`} className="activity-item skel-row">
                <div className="skel-circle" />
                <div className="skel-content">
                  <div className="skel-line" style={{ width: '65%' }} />
                  <div className="skel-line" style={{ width: '35%', marginTop: 6 }} />
                </div>
              </div>
            ))
          ) : combinedActivity.length === 0 ? (
            // Empty state
            <div className="dash-empty-state">
              <div className="dash-empty-icon">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="dash-empty-title">No activity yet</h3>
              <p className="dash-empty-desc">
                New reports and civic events will appear here in real-time as community members submit them.
              </p>
            </div>
          ) : (
            combinedActivity.map((item) => {
              // Determine dot color & icon based on item type and status
              const isResolvedReport = item.type === 'report' && item.status === 'resolved';
              const isActiveReport = item.type === 'report' && item.status === 'active';
              const isEvent = item.type === 'event';

              const dotClass = isActiveReport
                ? 'activity-dot--red'
                : isResolvedReport
                ? 'activity-dot--green'
                : 'activity-dot--indigo';

              const truncatedTitle =
                item.title.length > 50 ? `${item.title.slice(0, 50)}…` : item.title;

              return (
                <div key={item.id} className="activity-item">
                  <span className={`activity-dot ${dotClass}`} />
                  <div className="activity-icon-box">
                    {isActiveReport && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    )}
                    {isResolvedReport && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                    {isEvent && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#22D3EE"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    )}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title" title={item.title}>
                      {truncatedTitle}
                    </div>
                    <div className="activity-meta">
                      <span className="activity-meta-cat">{item.category}</span>
                      <span className="activity-meta-sep">•</span>
                      <span className="activity-meta-time">{formatTimeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="activity-timestamp">{formatTimeAgo(item.createdAt)}</div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── SECTION D: RECENT REPORTS TABLE ── */}
      <section className="dash-card reports-section">
        <div className="dash-card-header reports-header-wrap">
          <div>
            <h2 className="dash-card-title">Recent Reports</h2>
            <p className="dash-card-subtitle">Last 10 civic issue submissions</p>
          </div>

          {/* Filter tabs: All / Active / Resolved */}
          <div className="reports-filter-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={reportFilter === 'all'}
              className={`filter-tab ${reportFilter === 'all' ? 'filter-tab--active' : ''}`}
              onClick={() => setReportFilter('all')}
            >
              All
              <span className="filter-count">{reports.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={reportFilter === 'active'}
              className={`filter-tab ${reportFilter === 'active' ? 'filter-tab--active' : ''}`}
              onClick={() => setReportFilter('active')}
            >
              Active
              <span className="filter-count filter-count--amber">{activeIssues}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={reportFilter === 'resolved'}
              className={`filter-tab ${reportFilter === 'resolved' ? 'filter-tab--active' : ''}`}
              onClick={() => setReportFilter('resolved')}
            >
              Resolved
              <span className="filter-count filter-count--green">{resolvedIssues}</span>
            </button>
          </div>
        </div>

        {/* Reports Table container */}
        <div className="reports-table-container">
          {loading ? (
            // Skeleton rows while loading
            <div className="reports-table">
              <div className="reports-table-head">
                <div className="col-status">Status</div>
                <div className="col-title">Issue Title</div>
                <div className="col-category">Category</div>
                <div className="col-date">Date Reported</div>
                <div className="col-badge">State</div>
              </div>
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={`skel-row-${idx}`} className="report-row skel-row">
                  <div className="skel-circle" style={{ width: 10, height: 10 }} />
                  <div className="skel-line" style={{ width: '45%' }} />
                  <div className="skel-line" style={{ width: '18%' }} />
                  <div className="skel-line" style={{ width: '15%' }} />
                  <div className="skel-badge" />
                </div>
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            // Empty state
            <div className="dash-empty-state">
              <div className="dash-empty-icon">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="dash-empty-title">No reports match this filter</h3>
              <p className="dash-empty-desc">
                {reportFilter === 'all'
                  ? 'No civic issues have been submitted yet.'
                  : `There are currently no ${reportFilter} reports in the system.`}
              </p>
            </div>
          ) : (
            <div className="reports-table">
              <div className="reports-table-head">
                <div className="col-status">Status</div>
                <div className="col-title">Issue Title</div>
                <div className="col-category">Category</div>
                <div className="col-date">Date Reported</div>
                <div className="col-badge">State</div>
              </div>
              <div className="reports-table-body">
                {filteredReports.map((report) => {
                  const status = (report.status || 'active').toLowerCase();
                  const isResolved = status === 'resolved';

                  return (
                    <div key={report._id || report.id} className="report-row">
                      <div className="col-status">
                        <span
                          className={`report-status-dot ${
                            isResolved ? 'report-status-dot--green' : 'report-status-dot--amber'
                          }`}
                          title={isResolved ? 'Resolved' : 'Active'}
                        />
                      </div>
                      <div className="col-title" title={report.title}>
                        <span className="report-title-text">{report.title}</span>
                        {report.description && (
                          <span className="report-desc-preview">
                            {report.description.length > 70
                              ? `${report.description.slice(0, 70)}…`
                              : report.description}
                          </span>
                        )}
                      </div>
                      <div className="col-category">
                        <span className="category-chip">{report.category || 'Civic'}</span>
                      </div>
                      <div className="col-date">{formatDate(report.createdAt)}</div>
                      <div className="col-badge">
                        <span
                          className={`status-badge ${
                            isResolved ? 'status-badge--resolved' : 'status-badge--active'
                          }`}
                        >
                          {isResolved ? (
                            <>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Resolved
                            </>
                          ) : (
                            <>
                              <span className="status-badge-dot"></span>
                              Active
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION E: UPCOMING EVENTS CARDS ── */}
      <section className="dash-card events-section">
        <div className="dash-card-header">
          <div>
            <h2 className="dash-card-title">Upcoming Events</h2>
            <p className="dash-card-subtitle">Connect and collaborate with fellow citizens</p>
          </div>
          <span className="events-count-badge">{upcomingEvents.length} Scheduled</span>
        </div>

        {loading ? (
          // Skeleton event cards
          <div className="events-grid">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`skel-ev-${idx}`} className="event-card skel-row">
                <div className="skel-header-box" />
                <div style={{ padding: 16 }}>
                  <div className="skel-line" style={{ width: '70%', height: 18 }} />
                  <div className="skel-line" style={{ width: '40%', marginTop: 10 }} />
                  <div className="skel-line" style={{ width: '55%', marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          // Empty state
          <div className="dash-empty-state">
            <div className="dash-empty-icon">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
            </div>
            <h3 className="dash-empty-title">No upcoming events scheduled</h3>
            <p className="dash-empty-desc">
              Community cleanup drives, town halls, and tree plantation events will be listed here soon.
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {upcomingEvents.map((event) => {
              const eventId = event._id || event.id;
              const isExpanded = expandedEventId === eventId;

              return (
                <div key={eventId} className="event-card">
                  {/* Purple gradient header */}
                  <div className="event-header">
                    <span className="event-category-badge">{event.category || 'Community'}</span>
                    <span className="event-time-badge">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatTimeAgo(event.startDate || event.createdAt)}
                    </span>
                  </div>

                  {/* Event Body */}
                  <div className="event-body">
                    <h3 className="event-title">{event.title}</h3>

                    <div className="event-details-list">
                      {/* Venue */}
                      <div className="event-detail-item">
                        <svg
                          className="event-detail-icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="event-detail-text">
                          {event.venue || 'Mathura Civic Grounds'}
                        </span>
                      </div>

                      {/* Date & Time */}
                      <div className="event-detail-item">
                        <svg
                          className="event-detail-icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span className="event-detail-text">
                          {formatEventDateTime(event.startDate)}
                        </span>
                      </div>
                    </div>

                    {/* View Details expandable button */}
                    <div className="event-footer">
                      <button
                        type="button"
                        className="event-details-btn"
                        onClick={() => toggleEventDetails(eventId)}
                        aria-expanded={isExpanded}
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>

                    {/* Inline Expandable Info Panel */}
                    {isExpanded && (
                      <div className="event-expanded-panel">
                        <p className="event-expanded-desc">
                          {event.description || 'No additional description provided.'}
                        </p>
                        {event.endDate && (
                          <div className="event-expanded-meta">
                            <strong>Ends:</strong> {formatEventDateTime(event.endDate)}
                          </div>
                        )}
                        {event.location && event.location.coordinates && (
                          <div className="event-expanded-meta">
                            <strong>Coordinates:</strong> {event.location.coordinates[1].toFixed(4)}°N,{' '}
                            {event.location.coordinates[0].toFixed(4)}°E
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
