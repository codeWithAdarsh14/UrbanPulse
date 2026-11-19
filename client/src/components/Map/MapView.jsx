import { useState, useEffect, useCallback, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { fetchNearbyReports, fetchNearbyEvents } from '../../services/api';
import {
  userLocationIcon,
  reportIcon,
  eventIcon,
  createGroupedReportIcon,
  createSpiderReportIcon,
  mapPinIcon,
} from './leaflet-icons';
import { DEV_LOCATION, ENABLE_DEV_LOCATION_OVERRIDE } from '../../config/devLocation';
import { groupReportsByProximity, calculateSpiderOffsets } from '../../utils/geoUtils';
import GroupedReportPopup from './GroupedReportPopup';
import ReportModal from '../ReportModal/ReportModal';
import './MapView.css';

const DEFAULT_RADIUS_METRES = 5000;

/**
 * Helper component to re-center Leaflet map when coordinates change
 */
function RecenterMap({ center, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * Helper component to capture map clicks and update manual pin location
 */
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (e?.latlng) {
        onMapClick({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      }
    },
  });
  return null;
}

/**
 * Format date string safely
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Reusable MapView Component for UrbanPulse
 */
export default function MapView({
  isReportModalOpen: controlledIsOpen,
  setIsReportModalOpen: setControlledIsOpen,
}) {
  // Modal state (controlled or uncontrolled fallback)
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isReportModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsReportModalOpen = setControlledIsOpen || setInternalIsOpen;

  // Feedback toast state
  const [successToast, setSuccessToast] = useState(null);

  // Geolocation states
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState(null);

  // Manual map-pin location state: { latitude: number, longitude: number } | null
  const [mapPinLocation, setMapPinLocation] = useState(null);

  // Data states
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  // Filter state: 'all' | 'reports' | 'events'
  const [activeFilter, setActiveFilter] = useState('all');

  // Spiderfied groups map: { [groupId]: boolean }
  const [spiderfiedGroups, setSpiderfiedGroups] = useState({});

  const toggleSpiderfy = useCallback((groupId) => {
    setSpiderfiedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  /**
   * Request user location.
   * If the development override is enabled, use DEV_LOCATION coordinates.
   * Otherwise, execute standard browser geolocation.
   */
  const requestLocation = useCallback(() => {
    // Development-only location override
    if (ENABLE_DEV_LOCATION_OVERRIDE) {
      queueMicrotask(() => {
        setUserLocation({
          latitude: DEV_LOCATION.latitude,
          longitude: DEV_LOCATION.longitude,
          isDevOverride: true,
        });
        setGeoLoading(false);
        setGeoError(null);
      });
      return;
    }

    if (!navigator.geolocation) {
      queueMicrotask(() => {
        setGeoError('Geolocation is not supported by your browser.');
        setGeoLoading(false);
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setGeoLoading(false);
        setGeoError(null);
      },
      (error) => {
        let errorMsg = 'Unable to determine your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied. Please allow location access in your browser to view nearby urban reports and events.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is currently unavailable from your device.';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to obtain your location timed out. Please try again.';
            break;
          default:
            errorMsg = error.message || errorMsg;
            break;
        }
        setGeoError(errorMsg);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  const handleRetryLocation = () => {
    setGeoLoading(true);
    setGeoError(null);
    requestLocation();
  };

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  /**
   * Fetch nearby reports and events
   */
  const loadNearbyData = useCallback(async (location) => {
    const loc = location || userLocation;
    if (!loc) return;

    setDataLoading(true);
    setDataError(null);

    try {
      const [reportsData, eventsData] = await Promise.all([
        fetchNearbyReports(loc.longitude, loc.latitude, DEFAULT_RADIUS_METRES),
        fetchNearbyEvents(loc.longitude, loc.latitude, DEFAULT_RADIUS_METRES),
      ]);

      setReports(reportsData);
      setEvents(eventsData);
    } catch (err) {
      setDataError(err.message || 'Failed to load nearby data.');
    } finally {
      setDataLoading(false);
    }
  }, [userLocation]);

  /**
   * Handle successful report creation
   */
  const handleReportSuccess = useCallback(() => {
    setIsReportModalOpen(false);
    setMapPinLocation(null);
    setSuccessToast('Issue reported successfully! Your report has been added to the map.');
    // Re-fetch nearby reports to display the newly submitted issue
    loadNearbyData();
  }, [setIsReportModalOpen, loadNearbyData]);

  // Auto-dismiss success toast after 5 seconds
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => {
      setSuccessToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [successToast]);

  useEffect(() => {
    if (!userLocation) return;
    let isMounted = true;

    async function fetchData() {
      setDataLoading(true);
      setDataError(null);

      try {
        const [reportsData, eventsData] = await Promise.all([
          fetchNearbyReports(userLocation.longitude, userLocation.latitude, DEFAULT_RADIUS_METRES),
          fetchNearbyEvents(userLocation.longitude, userLocation.latitude, DEFAULT_RADIUS_METRES),
        ]);

        if (isMounted) {
          setReports(reportsData);
          setEvents(eventsData);
        }
      } catch (err) {
        if (isMounted) {
          setDataError(err.message || 'Failed to load nearby data.');
        }
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [userLocation]);

  // Filtered lists
  const showReports = activeFilter === 'all' || activeFilter === 'reports';
  const showEvents = activeFilter === 'all' || activeFilter === 'events';

  const visibleReports = showReports ? reports : [];
  const visibleEvents = showEvents ? events : [];
  const totalVisible = visibleReports.length + visibleEvents.length;

  // Group overlapping and nearby reports (threshold = 20m)
  const reportGroups = groupReportsByProximity(visibleReports, 20);

  return (
    <div className="map-wrapper">
      {/* Controls / Filter Bar */}
      <div className="map-controls-bar">
        <div className="filter-group">
          <button
            type="button"
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Items
            <span className="filter-badge">{reports.length + events.length}</span>
          </button>
          <button
            type="button"
            className={`filter-btn ${activeFilter === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveFilter('reports')}
          >
            Problems
            <span className="filter-badge">{reports.length}</span>
          </button>
          <button
            type="button"
            className={`filter-btn ${activeFilter === 'events' ? 'active' : ''}`}
            onClick={() => setActiveFilter('events')}
          >
            Events
            <span className="filter-badge">{events.length}</span>
          </button>
        </div>

        <div className="map-action-group">
          <button
            type="button"
            className="btn-report-issue"
            onClick={() => setIsReportModalOpen(true)}
          >
            + Report an Issue
          </button>
        </div>

        <div className="map-meta-info">
          {userLocation?.isDevOverride && (
            <span className="dev-location-pill" title="Development Location Override Active">
              Dev Location
            </span>
          )}
          <span>Search Radius: <strong>{(DEFAULT_RADIUS_METRES / 1000).toFixed(0)} km</strong></span>
          <button
            type="button"
            className="refresh-btn"
            onClick={loadNearbyData}
            disabled={dataLoading || !userLocation}
            title="Refresh nearby items"
          >
            {dataLoading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="map-success-toast" role="status">
          <div className="toast-content">
            <span className="toast-icon">✓</span>
            <span className="toast-text">{successToast}</span>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setSuccessToast(null)}
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Map Canvas and Overlays */}
      <div className="map-canvas-container">
        {/* Geolocation Loading State */}
        {geoLoading && (
          <div className="map-state-overlay">
            <div className="map-state-card">
              <div className="spinner"></div>
              <h3 className="map-state-title">Locating your position...</h3>
              <p className="map-state-desc">
                Please allow browser location access when prompted to see urban reports and community events around you.
              </p>
            </div>
          </div>
        )}

        {/* Geolocation Error / Permission Denied State */}
        {!geoLoading && geoError && (
          <div className="map-state-overlay">
            <div className="map-state-card">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3 className="map-state-title">Location Required</h3>
              <p className="map-state-desc">{geoError}</p>
              <button type="button" className="map-state-btn" onClick={handleRetryLocation}>
                Retry Location Access
              </button>
            </div>
          </div>
        )}

        {/* Floating status notice for data loading or empty results */}
        {!geoLoading && !geoError && dataLoading && (
          <div className="map-floating-badge">
            <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
            Fetching nearby reports & events...
          </div>
        )}

        {!geoLoading && !geoError && !dataLoading && dataError && (
          <div className="map-floating-badge" style={{ color: '#dc2626' }}>
            ⚠ {dataError}
          </div>
        )}

        {!geoLoading && !geoError && !dataLoading && !dataError && totalVisible === 0 && (
          <div className="map-floating-badge">
            No {activeFilter === 'all' ? 'reports or events' : activeFilter} found within 5 km
          </div>
        )}

        {/* Active Map View */}
        {userLocation && (
          <MapContainer
            center={[userLocation.latitude, userLocation.longitude]}
            zoom={14}
            scrollWheelZoom={true}
          >
            <RecenterMap center={[userLocation.latitude, userLocation.longitude]} zoom={14} />
            <MapClickHandler onMapClick={setMapPinLocation} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* User Location Marker */}
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="popup-container">
                  <div className="popup-header">
                    <h4 className="popup-title">
                      {userLocation.isDevOverride ? 'Development Location' : 'Your Current Location'}
                    </h4>
                    <span className="popup-badge badge-user">
                      {userLocation.isDevOverride ? 'Dev Mode' : 'You'}
                    </span>
                  </div>
                  <p className="popup-desc">
                    {userLocation.isDevOverride
                      ? 'Using development location override (77.6737, 27.4924). Showing nearby civic reports and community events within 5 km.'
                      : 'Showing nearby civic reports and community events within 5 km of this point.'}
                  </p>
                  <div className="popup-footer">
                    Lat: {userLocation.latitude.toFixed(5)}, Lng: {userLocation.longitude.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Selected Map Pin Marker */}
            {mapPinLocation && (
              <Marker
                position={[mapPinLocation.latitude, mapPinLocation.longitude]}
                icon={mapPinIcon}
              >
                <Popup>
                  <div className="popup-container">
                    <div className="popup-header">
                      <h4 className="popup-title">Selected Location</h4>
                      <span className="popup-badge badge-map-pin">Map Pin</span>
                    </div>
                    <p className="popup-desc">
                      Selected location for reporting an issue.
                    </p>
                    <div className="popup-footer">
                      Lat: {mapPinLocation.latitude.toFixed(5)}, Lng: {mapPinLocation.longitude.toFixed(5)}
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-report-issue"
                        style={{ padding: '4px 10px', fontSize: '12px', flex: 1, justifyContent: 'center' }}
                        onClick={() => setIsReportModalOpen(true)}
                      >
                        Report Here
                      </button>
                      <button
                        type="button"
                        className="refresh-btn"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => setMapPinLocation(null)}
                        title="Remove pin"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Problem Report Markers (Grouped & Single) */}
            {reportGroups.map((group) => {
              const [lng, lat] = group.coordinates;
              const isGroup = group.reports.length > 1;
              const isSpiderfied = Boolean(spiderfiedGroups[group.id]);

              if (!isGroup) {
                // Single Report
                const report = group.reports[0];
                return (
                  <Marker
                    key={`report-${report._id || `${lat}-${lng}`}`}
                    position={[lat, lng]}
                    icon={reportIcon}
                  >
                    <Popup>
                      <div className="popup-container">
                        <div className="popup-header">
                          <h4 className="popup-title">{report.title}</h4>
                          <span className="popup-badge badge-report">{report.category}</span>
                        </div>

                        <div className="popup-meta">
                          <div className="meta-row">
                            <span className="meta-label">Category:</span>
                            <span>{report.category}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">Status:</span>
                            <span className="popup-badge badge-status">{report.status || 'active'}</span>
                          </div>
                          {report.confidenceScore > 0 && (
                            <div className="meta-row">
                              <span className="meta-label">Confidence:</span>
                              <span>{report.confidenceScore}%</span>
                            </div>
                          )}
                        </div>

                        <p className="popup-desc">{report.description}</p>

                        {report.createdAt && (
                          <div className="popup-footer">
                            Reported: {formatDate(report.createdAt)}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              }

              // Multiple Reports Group (Identical or nearby coordinates)
              if (isSpiderfied) {
                const spiderOffsets = calculateSpiderOffsets(lat, lng, group.reports.length, 35);

                return (
                  <Fragment key={group.id}>
                    {/* Center Marker to collapse or view list */}
                    <Marker
                      position={[lat, lng]}
                      icon={createGroupedReportIcon(group.reports.length)}
                    >
                      <Popup minWidth={280} maxWidth={360}>
                        <GroupedReportPopup
                          reports={group.reports}
                          formatDate={formatDate}
                          isSpiderfied={true}
                          onToggleSpiderfy={() => toggleSpiderfy(group.id)}
                        />
                      </Popup>
                    </Marker>

                    {/* Spiderfied legs and offset markers */}
                    {group.reports.map((report, idx) => {
                      const offset = spiderOffsets[idx];
                      return (
                        <Fragment key={`spider-${report._id || idx}`}>
                          <Polyline
                            positions={[[lat, lng], offset]}
                            pathOptions={{
                              color: '#dc2626',
                              dashArray: '4, 4',
                              weight: 2,
                              opacity: 0.65,
                            }}
                          />
                          <Marker
                            position={offset}
                            icon={createSpiderReportIcon(idx + 1)}
                          >
                            <Popup minWidth={240} maxWidth={320}>
                              <div className="popup-container">
                                <div className="popup-header">
                                  <span className="report-card-index">#{idx + 1}</span>
                                  <h4 className="popup-title">{report.title}</h4>
                                  <span className="popup-badge badge-report">{report.category}</span>
                                </div>

                                <div className="popup-meta">
                                  <div className="meta-row">
                                    <span className="meta-label">Status:</span>
                                    <span className="popup-badge badge-status">{report.status || 'active'}</span>
                                  </div>
                                  {report.createdAt && (
                                    <div className="meta-row">
                                      <span className="meta-label">Reported:</span>
                                      <span className="meta-val">{formatDate(report.createdAt)}</span>
                                    </div>
                                  )}
                                </div>

                                <p className="popup-desc">{report.description}</p>
                              </div>
                            </Popup>
                          </Marker>
                        </Fragment>
                      );
                    })}
                  </Fragment>
                );
              }

              // Normal Grouped Marker (not spiderfied)
              return (
                <Marker
                  key={group.id}
                  position={[lat, lng]}
                  icon={createGroupedReportIcon(group.reports.length)}
                >
                  <Popup minWidth={280} maxWidth={360}>
                    <GroupedReportPopup
                      reports={group.reports}
                      formatDate={formatDate}
                      isSpiderfied={false}
                      onToggleSpiderfy={() => toggleSpiderfy(group.id)}
                    />
                  </Popup>
                </Marker>
              );
            })}

            {/* Event Markers */}
            {visibleEvents.map((event) => {
              const coords = event.location?.coordinates;
              if (!coords || coords.length < 2) return null;
              const [lng, lat] = coords;

              return (
                <Marker
                  key={`event-${event._id}`}
                  position={[lat, lng]}
                  icon={eventIcon}
                >
                  <Popup>
                    <div className="popup-container">
                      <div className="popup-header">
                        <h4 className="popup-title">{event.title}</h4>
                        <span className="popup-badge badge-event">Event</span>
                      </div>

                      <div className="popup-meta">
                        <div className="meta-row">
                          <span className="meta-label">Category:</span>
                          <span>{event.category}</span>
                        </div>
                        <div className="meta-row">
                          <span className="meta-label">Venue:</span>
                          <span>{event.venue}</span>
                        </div>
                        <div className="meta-row">
                          <span className="meta-label">Starts:</span>
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        <div className="meta-row">
                          <span className="meta-label">Ends:</span>
                          <span>{formatDate(event.endDate)}</span>
                        </div>
                      </div>

                      <p className="popup-desc">{event.description}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-swatch swatch-user"></span>
            <span>Your Location</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-report"></span>
            <span>Problems ({reports.length})</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-event"></span>
            <span>Events ({events.length})</span>
          </div>
        </div>
      </div>

      {/* Report an Issue Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userLocation={userLocation}
        mapPinLocation={mapPinLocation}
        onSuccess={handleReportSuccess}
      />
    </div>
  );
}
