import { useState, useCallback, useEffect } from 'react';
import MapView from './components/Map/MapView';
import MultiStepReportModal from './components/ReportModal/MultiStepReportModal';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import DashboardView from './components/Dashboard/DashboardView';
import { fetchLiveCityAQI } from './services/aqiService';
import './App.css';

/**
 * UrbanPulse 2.0 — Main Application Component
 * Premium 3-panel civic-tech SaaS layout:
 * - Left: Collapsible Sidebar (235px / 64px)
 * - Center: TopBar + Dynamic Main Content Area
 * - Right: Contextual Civic Operations Panel (300px on wide screens)
 */
export default function App() {
  // Navigation state: 'dashboard' | 'map' | 'report' | 'events' | 'my-reports'
  const [activeNav, setActiveNav] = useState('dashboard');

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Active geographic location name (e.g. 'GLA University, Mathura' or 'Mathura, UP')
  const [activeLocationName, setActiveLocationName] = useState('Mathura, UP');

  // Sidebar collapse toggle state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Search query state for TopBar
  const [searchQuery, setSearchQuery] = useState('');

  // Toast notifications array: { id, message, type: 'success' | 'error' | 'info' }
  const [toasts, setToasts] = useState([]);

  // Dynamic Air Quality Index telemetry for active location
  const [aqiData, setAqiData] = useState({
    aqi: 179,
    category: 'Moderate',
    color: '#F59E0B',
    gradient: 'linear-gradient(90deg, #10B981, #F59E0B)',
    barWidth: '45%',
    stationName: 'Mathura, UP',
    loading: false,
    status: 'success',
  });

  // Fetch live AQI whenever activeLocationName changes and refresh every 10 minutes
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function updateAQI() {
      setAqiData((prev) => ({ ...prev, loading: true }));
      try {
        const liveAQI = await fetchLiveCityAQI(activeLocationName, controller.signal);
        if (isMounted) {
          setAqiData({ ...liveAQI, loading: false });
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
          setAqiData((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    updateAQI();

    // Periodic refresh every 10 minutes
    const interval = setInterval(updateAQI, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [activeLocationName]);

  /**
   * Helper to trigger transient toasts
   */
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  /**
   * Manual dismiss for toasts
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Handle sidebar and navigation changes
   */
  const handleNavChange = useCallback((nav) => {
    if (nav === 'report') {
      setIsReportModalOpen(true);
      setActiveNav('report');
    } else {
      setActiveNav(nav);
    }
  }, []);

  /**
   * Handle modal close cleanly
   */
  const handleModalClose = useCallback(() => {
    setIsReportModalOpen(false);
    if (activeNav === 'report') {
      setActiveNav('dashboard');
    }
  }, [activeNav]);

  /**
   * Handle successful report creation
   */
  const handleReportSuccess = useCallback((report) => {
    const title = report?.title ? `"${report.title}"` : 'Issue';
    addToast(`${title} reported successfully to Mathura Civic Cell!`, 'success');
    setIsReportModalOpen(false);
    if (activeNav === 'report') {
      setActiveNav('map');
    }
  }, [addToast, activeNav]);

  return (
    <div className="up-app">
      {/* ── Left Sidebar (235px / 64px) ── */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={handleNavChange}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onReportClick={() => setIsReportModalOpen(true)}
      />

      {/* ── Main Content Area ── */}
      <div className="up-main-area">
        {/* Top Header Bar */}
        <TopBar
          onSearch={(val) => setSearchQuery(val)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Dynamic Route Content */}
        <main className="up-content-area">
          {activeNav === 'dashboard' && (
            <DashboardView
              onReportClick={() => setIsReportModalOpen(true)}
            />
          )}

          {(activeNav === 'map' || activeNav === 'report') && (
            <MapView
              isReportModalOpen={isReportModalOpen}
              setIsReportModalOpen={setIsReportModalOpen}
              activeLocationName={activeLocationName}
              onLocationNameChange={setActiveLocationName}
            />
          )}

          {activeNav === 'events' && (
            <div className="up-coming-soon">
              <div className="up-coming-soon__glow"></div>
              <div className="up-coming-soon__icon up-coming-soon__icon--cyan">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span className="up-coming-soon__tag">Community Events</span>
              <h2 className="up-coming-soon__title">Community Events Coming Soon</h2>
              <p className="up-coming-soon__desc">
                Organize and attend local cleanup drives, tree planting campaigns, and citizen townhalls.
                Full RSVP schedules, community leaderboards, and location maps will launch in the next release.
              </p>
              <div className="up-coming-soon__actions">
                <button
                  type="button"
                  className="up-btn up-btn--primary"
                  onClick={() => setActiveNav('dashboard')}
                >
                  Back to Dashboard
                </button>
                <button
                  type="button"
                  className="up-btn up-btn--secondary"
                  onClick={() => setActiveNav('map')}
                >
                  Explore Map
                </button>
              </div>
            </div>
          )}

          {activeNav === 'my-reports' && (
            <div className="up-coming-soon">
              <div className="up-coming-soon__glow"></div>
              <div className="up-coming-soon__icon up-coming-soon__icon--violet">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <span className="up-coming-soon__tag">Citizen Portal</span>
              <h2 className="up-coming-soon__title">My Reports Coming Soon</h2>
              <p className="up-coming-soon__desc">
                Track all your civic grievance submissions with real-time SLA timelines, municipal inspection notes,
                and digital resolution certificates.
              </p>
              <div className="up-coming-soon__actions">
                <button
                  type="button"
                  className="up-btn up-btn--primary"
                  onClick={() => setIsReportModalOpen(true)}
                >
                  Submit New Report
                </button>
                <button
                  type="button"
                  className="up-btn up-btn--secondary"
                  onClick={() => setActiveNav('dashboard')}
                >
                  View Dashboard
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Right Operations Panel (300px on wide screens >=1400px) ── */}
      <aside className="up-right-panel" aria-label="City Operations Overview">
        {/* Civic Header */}
        <div className="up-right-panel__header">
          <div className="up-right-panel__badge">
            <span className="up-live-indicator"></span> Live Civic Pulse
          </div>
          <h3 className="up-right-panel__title">Mathura Metropolitan</h3>
          <p className="up-right-panel__sub">Live municipal telemetry and civic emergency hotlines</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="up-rp-stats">
          <div className="up-rp-stat-card">
            <span className="up-rp-stat-val text-green">89%</span>
            <span className="up-rp-stat-lbl">Resolution Rate</span>
          </div>
          <div className="up-rp-stat-card">
            <span className="up-rp-stat-val text-violet">24m</span>
            <span className="up-rp-stat-lbl">Avg Response</span>
          </div>
          <div className="up-rp-stat-card">
            <span className="up-rp-stat-val text-cyan">14</span>
            <span className="up-rp-stat-lbl">Active Wards</span>
          </div>
          <div className="up-rp-stat-card">
            <span className="up-rp-stat-val text-amber">3</span>
            <span className="up-rp-stat-lbl">Critical Alerts</span>
          </div>
        </div>

        {/* Quick Report CTA Card */}
        <div className="up-rp-action-card">
          <div className="up-rp-action-card__glow"></div>
          <h4>Spotted an issue?</h4>
          <p>Help Mathura stay clean and safe. Report potholes, waste, or broken streetlights in seconds.</p>
          <button
            type="button"
            className="up-rp-cta-btn"
            onClick={() => setIsReportModalOpen(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Report an Issue
          </button>
        </div>

        {/* Emergency Helplines */}
        <div className="up-rp-section">
          <div className="up-rp-section-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Civic Helplines
          </div>
          <ul className="up-rp-helplines">
            <li>
              <span>Nagar Nigam Mathura</span>
              <span className="up-rp-pill">1913</span>
            </li>
            <li>
              <span>Police Control Room</span>
              <span className="up-rp-pill">112</span>
            </li>
            <li>
              <span>Disaster & Flood Cell</span>
              <span className="up-rp-pill">1077</span>
            </li>
          </ul>
        </div>

        {/* Environmental & Air Quality Indicator */}
        <div className="up-rp-section">
          <div className="up-rp-section-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
            Environmental Status
          </div>
          <div className="up-rp-aqi-card">
            <div className="up-rp-aqi-header">
              <span>Air Quality Index</span>
              <span
                className="up-rp-aqi-badge"
                style={{ color: aqiData.color }}
                title={aqiData.loading ? 'Updating sensor telemetry...' : undefined}
              >
                {aqiData.loading
                  ? 'Updating…'
                  : aqiData.aqi !== null
                  ? `${aqiData.category} · ${aqiData.aqi}`
                  : aqiData.category}
              </span>
            </div>
            <div className="up-rp-aqi-bar">
              <div
                className="up-rp-aqi-fill"
                style={{
                  width: aqiData.barWidth,
                  background: aqiData.gradient,
                  transition: 'width 0.4s ease, background 0.4s ease',
                }}
              ></div>
            </div>
            <div className="up-rp-aqi-footer">
              <span title={aqiData.stationName}>{aqiData.stationName}</span>
              <span>{aqiData.status === 'unavailable' ? 'Data Offline' : 'Live Telemetry'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MultiStep Report Modal (Triggerable anywhere) ── */}
      <MultiStepReportModal
        isOpen={isReportModalOpen}
        onClose={handleModalClose}
        onSuccess={handleReportSuccess}
      />

      {/* ── Fixed Toast Notifications Stack (Bottom-Right) ── */}
      <div className="up-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`up-toast up-toast--${toast.type || 'info'}`}>
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
            <div className="up-toast__content">
              <p className="up-toast__message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="up-toast__close"
              onClick={() => removeToast(toast.id)}
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
    </div>
  );
}
