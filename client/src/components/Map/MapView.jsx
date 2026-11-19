import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { fetchNearbyReports, fetchNearbyEvents } from '../../services/api';
import {
  userLocationIcon,
  reportIcon,
  eventIcon,
  mapPinIcon,
  campusIcon,
  createGroupedReportIcon,
  createSpiderReportIcon,
} from './leaflet-icons';
import { DEV_LOCATION, ENABLE_DEV_LOCATION_OVERRIDE } from '../../config/devLocation';
import { groupReportsByProximity, calculateSpiderOffsets } from '../../utils/geoUtils';
import { searchLocationsAcrossIndia, reverseGeocodeLocation, POPULAR_INDIAN_HUBS } from '../../services/geocoding';
import { GLA_CAMPUS_LANDMARKS, GLA_CAMPUS_CENTER } from '../../data/campusLandmarks';
import GroupedReportPopup from './GroupedReportPopup';
import ReportModal from '../ReportModal/ReportModal';
import EventModal from '../EventModal/EventModal';
import './MapView.css';

const DEFAULT_RADIUS_METRES = 5000;

/** Distance in kilometers between two lat/lng points using Haversine formula */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Re-centers the Leaflet map when center or zoom changes */
function RecenterMap({ center, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

/** Listens for map clicks, moves, and zoom events */
function MapEventsHandler({ onMapClick, onMoveEnd, onZoomChange }) {
  useMapEvents({
    click(e) {
      onMapClick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
    moveend(e) {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      onMoveEnd({ latitude: center.lat, longitude: center.lng, zoom });
    },
    zoomend(e) {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

/** Format date string safely */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString(undefined, {
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

/** Stats strip component */
function StatsStrip({ reports, events }) {
  const active = reports.filter((r) => (r.status || 'active').toLowerCase() === 'active').length;
  const resolved = reports.filter((r) => (r.status || '').toLowerCase() === 'resolved').length;

  return (
    <div className="map-stats-strip">
      <div className="stat-card">
        <div className="stat-card__icon stat-card__icon--violet">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div className="stat-card__body">
          <span className="stat-card__value">{reports.length}</span>
          <span className="stat-card__label">Total Reports</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card__icon stat-card__icon--red">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="stat-card__body">
          <span className="stat-card__value">{active}</span>
          <span className="stat-card__label">Active Issues</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card__icon stat-card__icon--green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="stat-card__body">
          <span className="stat-card__value">{resolved}</span>
          <span className="stat-card__label">Resolved</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card__icon stat-card__icon--indigo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="stat-card__body">
          <span className="stat-card__value">{events.length}</span>
          <span className="stat-card__label">Community Events</span>
        </div>
      </div>
    </div>
  );
}

/**
 * MapView — primary interactive map component for UrbanPulse
 */
export default function MapView({
  isReportModalOpen: controlledIsOpen,
  setIsReportModalOpen: setControlledIsOpen,
  isEventModalOpen: controlledEventIsOpen,
  setIsEventModalOpen: setControlledEventIsOpen,
  onLocationUpdate,
  onMapPinUpdate,
  activeLocationName,
  onLocationNameChange,
  lastSubmittedReport,
  lastSubmittedEvent,
  focusSearchTrigger,
}) {
  // Modal state (controlled or uncontrolled fallback)
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isReportModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsReportModalOpen = setControlledIsOpen || setInternalIsOpen;

  const [internalEventIsOpen, setInternalEventIsOpen] = useState(false);
  const isEventModalOpen = controlledEventIsOpen !== undefined ? controlledEventIsOpen : internalEventIsOpen;
  const setIsEventModalOpen = setControlledEventIsOpen || setInternalEventIsOpen;

  // Selected map pin
  const [mapPinLocation, setMapPinLocation] = useState(null);

  // Success Toast
  const [successToast, setSuccessToast] = useState(null);

  // Location telemetry & GPS state
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState(null);
  const [dismissGeoAlert, setDismissGeoAlert] = useState(false);

  // Map viewport state
  const [mapCenter, setMapCenter] = useState([GLA_CAMPUS_CENTER.latitude, GLA_CAMPUS_CENTER.longitude]);
  const [mapZoom, setMapZoom] = useState(14);
  const [currentCenter, setCurrentCenter] = useState({
    latitude: GLA_CAMPUS_CENTER.latitude,
    longitude: GLA_CAMPUS_CENTER.longitude,
  });
  const [currentZoom, setCurrentZoom] = useState(14);

  // Pan-India Location Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(POPULAR_INDIAN_HUBS);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Map layer: 'street' | 'satellite' | 'hybrid'
  const [mapLayer, setMapLayer] = useState('street');

  // Nearby civic data
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  // Filter: 'all' | 'reports' | 'events'
  const [activeFilter, setActiveFilter] = useState('all');

  // Spiderfied report groups
  const [spiderfiedGroups, setSpiderfiedGroups] = useState({});

  // Refs for debouncing, race condition prevention, and DOM interaction
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchDebounceTimerRef = useRef(null);
  const searchAbortControllerRef = useRef(null);
  const moveDebounceTimerRef = useRef(null);
  const isProgrammaticMoveRef = useRef(false);
  const fetchSeqRef = useRef(0);
  const lastFetchedPosRef = useRef(null);

  const toggleSpiderfy = useCallback((groupId) => {
    setSpiderfiedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  /* ── Map click handler ── */
  const handleMapClick = useCallback(
    (loc) => {
      setMapPinLocation(loc);
      if (onMapPinUpdate) {
        onMapPinUpdate(loc);
      }
    },
    [onMapPinUpdate]
  );

  /* ── Telemetry bubble to parent ── */
  useEffect(() => {
    if (userLocation && onLocationUpdate) {
      onLocationUpdate(userLocation);
    }
  }, [userLocation, onLocationUpdate]);

  // Telemetry refs to prevent unnecessary re-creations of data loaders
  const userLocationRef = useRef(userLocation);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  const currentCenterRef = useRef(currentCenter);
  useEffect(() => { currentCenterRef.current = currentCenter; }, [currentCenter]);

  /* ── Load nearby reports & events with race-condition prevention ── */
  const loadNearbyData = useCallback(
    async (location) => {
      const loc =
        location ||
        (userLocationRef.current
          ? { latitude: userLocationRef.current.latitude, longitude: userLocationRef.current.longitude }
          : currentCenterRef.current);
      if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return;

      const currentSeq = ++fetchSeqRef.current;
      lastFetchedPosRef.current = { latitude: loc.latitude, longitude: loc.longitude };

      setDataLoading(true);
      setDataError(null);

      try {
        const [reportsData, eventsData] = await Promise.all([
          fetchNearbyReports(loc.longitude, loc.latitude, DEFAULT_RADIUS_METRES),
          fetchNearbyEvents(loc.longitude, loc.latitude, DEFAULT_RADIUS_METRES),
        ]);

        if (currentSeq === fetchSeqRef.current) {
          setReports(reportsData);
          setEvents(eventsData);
        }
      } catch (err) {
        if (currentSeq === fetchSeqRef.current) {
          setDataError(err.message || 'Failed to load nearby data.');
        }
      } finally {
        if (currentSeq === fetchSeqRef.current) {
          setDataLoading(false);
        }
      }
    },
    []
  );

  /* ── Synchronize new report immediately upon submission ── */
  useEffect(() => {
    if (!lastSubmittedReport) return;
    setReports((prev) => {
      if (prev.some((r) => r._id === lastSubmittedReport._id)) return prev;
      return [lastSubmittedReport, ...prev];
    });
    if (
      lastSubmittedReport.location?.coordinates &&
      lastSubmittedReport.location.coordinates.length === 2
    ) {
      const [lng, lat] = lastSubmittedReport.location.coordinates;
      setMapCenter([lat, lng]);
      setMapZoom(15);
    }
  }, [lastSubmittedReport]);

  /* ── Synchronize new event immediately upon submission ── */
  useEffect(() => {
    if (!lastSubmittedEvent) return;
    setEvents((prev) => {
      if (prev.some((e) => e._id === lastSubmittedEvent._id)) return prev;
      return [lastSubmittedEvent, ...prev];
    });
    if (
      lastSubmittedEvent.location?.coordinates &&
      lastSubmittedEvent.location.coordinates.length === 2
    ) {
      const [lng, lat] = lastSubmittedEvent.location.coordinates;
      setMapCenter([lat, lng]);
      setMapZoom(15);
    }
  }, [lastSubmittedEvent]);

  /* ── Geolocation & Automatic current-location detection ── */
  const requestLocation = useCallback(() => {
    setGeoLoading(true);
    setGeoError(null);

    if (ENABLE_DEV_LOCATION_OVERRIDE) {
      queueMicrotask(() => {
        const devLoc = {
          latitude: DEV_LOCATION.latitude,
          longitude: DEV_LOCATION.longitude,
          accuracy: 12,
          isDevOverride: true,
        };
        setUserLocation(devLoc);
        setMapCenter([devLoc.latitude, devLoc.longitude]);
        setMapZoom(14);
        setGeoLoading(false);
        setGeoError(null);
        loadNearbyData(devLoc);
        if (onLocationNameChange) {
          onLocationNameChange('Mathura, UP');
        }
      });
      return;
    }

    if (!navigator.geolocation) {
      queueMicrotask(() => {
        setGeoError('Geolocation is not supported by your browser.');
        setGeoLoading(false);
        loadNearbyData({ latitude: GLA_CAMPUS_CENTER.latitude, longitude: GLA_CAMPUS_CENTER.longitude });
        if (onLocationNameChange) {
          onLocationNameChange('GLA University, Mathura');
        }
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude, accuracy } }) => {
        const loc = { latitude, longitude, accuracy: accuracy || 25, isDevOverride: false };
        setUserLocation(loc);
        setMapCenter([latitude, longitude]);
        setMapZoom(14);
        setGeoLoading(false);
        setGeoError(null);
        loadNearbyData(loc);

        try {
          const detectedName = await reverseGeocodeLocation(latitude, longitude);
          if (onLocationNameChange && detectedName) {
            onLocationNameChange(detectedName);
          }
        } catch {
          // Keep previous name if reverse geocoding is unavailable
        }
      },
      (error) => {
        let errorMsg = 'Unable to determine your GPS location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied. You can search any city across India using the search bar above.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'GPS signal is currently unavailable from your device.';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to obtain your GPS location timed out.';
            break;
          default:
            errorMsg = error.message || errorMsg;
        }
        setGeoError(errorMsg);
        setGeoLoading(false);
        // Retain interactive map with sensible default center (GLA University)
        loadNearbyData({ latitude: GLA_CAMPUS_CENTER.latitude, longitude: GLA_CAMPUS_CENTER.longitude });
        if (onLocationNameChange) {
          onLocationNameChange('GLA University, Mathura');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [loadNearbyData, onLocationNameChange]);

  const handleRetryLocation = () => {
    requestLocation();
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Dynamic Map Movement & Data Refresh ── */
  const handleMapMoveEnd = useCallback(
    ({ latitude, longitude, zoom }) => {
      setCurrentCenter({ latitude, longitude });
      setCurrentZoom(zoom);

      if (isProgrammaticMoveRef.current) {
        isProgrammaticMoveRef.current = false;
        return;
      }

      if (moveDebounceTimerRef.current) {
        clearTimeout(moveDebounceTimerRef.current);
      }

      moveDebounceTimerRef.current = setTimeout(async () => {
        const last = lastFetchedPosRef.current;
        if (!last) {
          loadNearbyData({ latitude, longitude });
          return;
        }

        const distanceMoved = getDistanceKm(last.latitude, last.longitude, latitude, longitude);
        // Refresh nearby items if map was panned > 1.5 km
        if (distanceMoved >= 1.5) {
          loadNearbyData({ latitude, longitude });

          // If moved > 5 km, update active location name in header
          if (distanceMoved >= 5 && onLocationNameChange) {
            try {
              const name = await reverseGeocodeLocation(latitude, longitude);
              if (name) {
                onLocationNameChange(name);
              }
            } catch {
              // Ignore geocode error during pan
            }
          }
        }
      }, 700);
    },
    [loadNearbyData, onLocationNameChange]
  );

  /* ── Pan-India Location Search handlers ── */
  useEffect(() => {
    if (focusSearchTrigger && focusSearchTrigger > 0) {
      setShowSearchDropdown(true);
      searchInputRef.current?.focus();
    }
  }, [focusSearchTrigger]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSearchDropdown(true);

    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    if (val.trim().length < 2) {
      setSearchResults(POPULAR_INDIAN_HUBS);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    searchDebounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      searchAbortControllerRef.current = controller;
      try {
        const results = await searchLocationsAcrossIndia(val, controller.signal);
        setSearchResults(results);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSearchError('Unable to search locations.');
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectLocation = (loc) => {
    isProgrammaticMoveRef.current = true;
    setMapCenter([loc.latitude, loc.longitude]);
    setMapZoom(loc.zoom || 14);
    setCurrentCenter({ latitude: loc.latitude, longitude: loc.longitude });
    setCurrentZoom(loc.zoom || 14);

    if (onLocationNameChange) {
      onLocationNameChange(loc.name);
    }
    setSearchQuery(loc.name);
    setShowSearchDropdown(false);
    loadNearbyData({ latitude: loc.latitude, longitude: loc.longitude });
  };

  const handleReturnToGPS = () => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      setMapZoom(15);
      setCurrentCenter({ latitude: userLocation.latitude, longitude: userLocation.longitude });
      loadNearbyData(userLocation);
      reverseGeocodeLocation(userLocation.latitude, userLocation.longitude).then((name) => {
        if (onLocationNameChange && name) {
          onLocationNameChange(name);
        }
      });
    } else {
      requestLocation();
    }
  };

  /* ── Report & Event Success Callbacks ── */
  const handleReportSuccess = useCallback(() => {
    setIsReportModalOpen(false);
    setMapPinLocation(null);
    setSuccessToast('Issue reported successfully! Your report has been added to the map.');
    loadNearbyData();
  }, [setIsReportModalOpen, loadNearbyData]);

  const handleEventSuccess = useCallback(() => {
    setIsEventModalOpen(false);
    setMapPinLocation(null);
    setSuccessToast('Event registered successfully! Your event has been added to the map.');
    loadNearbyData();
  }, [setIsEventModalOpen, loadNearbyData]);

  /* ── Auto-dismiss toast ── */
  useEffect(() => {
    if (!successToast) return;
    const t = setTimeout(() => setSuccessToast(null), 5000);
    return () => clearTimeout(t);
  }, [successToast]);

  /* ── Campus Landmarks Visibility ── */
  const distFromGLA = getDistanceKm(
    currentCenter.latitude,
    currentCenter.longitude,
    GLA_CAMPUS_CENTER.latitude,
    GLA_CAMPUS_CENTER.longitude
  );
  const showCampusLandmarks = distFromGLA <= 25 && currentZoom >= 14;

  /* ── Filtered data ── */
  const showReports = activeFilter === 'all' || activeFilter === 'reports';
  const showEvents = activeFilter === 'all' || activeFilter === 'events';
  const visibleReports = showReports ? reports : [];
  const visibleEvents = showEvents ? events : [];
  const totalVisible = visibleReports.length + visibleEvents.length;
  const reportGroups = groupReportsByProximity(visibleReports, 20);

  return (
    <div className="map-wrapper">
      {/* Stats strip */}
      <StatsStrip reports={reports} events={events} />

      {/* Controls bar */}
      <div className="map-controls-bar">
        {/* Top row: Search India, My GPS, and Layer Switcher */}
        <div className="map-controls-top-row">
          <div className="map-search-group">
            {/* Pan-India Location Search */}
            <div className="map-search-container" ref={searchContainerRef}>
              <div className="map-search-input-wrap">
                <span className="map-search-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="map-search-input"
                  placeholder={activeLocationName ? `Search in ${activeLocationName} or India...` : 'Search Indian cities, landmarks...'}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => setShowSearchDropdown(true)}
                  aria-label="Search Indian cities and landmarks"
                />
                {isSearching && (
                  <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }}></div>
                )}
                {searchQuery && !isSearching && (
                  <button
                    type="button"
                    className="map-search-clear-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults(POPULAR_INDIAN_HUBS);
                    }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && (
                <div className="map-search-dropdown">
                  <div className="map-search-header">
                    {searchQuery.trim().length >= 2 ? 'Search Results' : 'Popular Civic Hubs'}
                  </div>
                  {searchResults.length === 0 && !isSearching && (
                    <div className="map-search-empty">
                      {searchError || 'No locations found across India'}
                    </div>
                  )}
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="map-search-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectLocation(item);
                      }}
                      onClick={() => handleSelectLocation(item)}
                    >
                      <div className="map-search-item__icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div className="map-search-item__content">
                        <span className="map-search-item__name">{item.name}</span>
                        <span className="map-search-item__sub">{item.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Return Button */}
            <button
              type="button"
              className={`map-gps-btn ${userLocation ? 'active' : ''}`}
              onClick={handleReturnToGPS}
              title="Return to My GPS Location"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
              <span>My GPS</span>
            </button>
          </div>

          {/* Map Layer Selector: Street / Satellite / Hybrid */}
          <div className="map-layer-selector">
            <button
              type="button"
              className={`map-layer-btn ${mapLayer === 'street' ? 'active' : ''}`}
              onClick={() => setMapLayer('street')}
              title="Street map with detailed roads, buildings & POIs"
            >
              Street
            </button>
            <button
              type="button"
              className={`map-layer-btn ${mapLayer === 'satellite' ? 'active' : ''}`}
              onClick={() => setMapLayer('satellite')}
              title="High-resolution satellite imagery"
            >
              Satellite
            </button>
            <button
              type="button"
              className={`map-layer-btn ${mapLayer === 'hybrid' ? 'active' : ''}`}
              onClick={() => setMapLayer('hybrid')}
              title="Satellite imagery with street & road labels"
            >
              Hybrid
            </button>
          </div>
        </div>

        {/* Bottom row: Filter Group, Action CTAs, and Meta Info */}
        <div className="map-controls-bottom-row">
          {/* Filter Group: All / Problems / Events */}
          <div className="filter-group">
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
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

          {/* Action Group */}
          <div className="map-action-group">
            <button
              type="button"
              className="btn-report-issue"
              onClick={() => setIsReportModalOpen(true)}
            >
              + Report an Issue
            </button>
            <button
              type="button"
              className="btn-report-event"
              onClick={() => setIsEventModalOpen(true)}
            >
              + Report an Event
            </button>
          </div>

          {/* Meta Info */}
          <div className="map-meta-info">
            {userLocation?.isDevOverride && (
              <span className="dev-location-pill" title="Development Location Override Active">
                Dev Location
              </span>
            )}
            <span style={{ fontSize: '12px' }}>
              Radius: <strong>5 km</strong>
            </span>
            <button
              type="button"
              className="refresh-btn"
              onClick={() => loadNearbyData()}
              disabled={dataLoading}
              title="Refresh nearby items"
            >
              {dataLoading ? '…' : '↻'} Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Geolocation error banner (non-blocking) */}
      {!geoLoading && geoError && !dismissGeoAlert && (
        <div className="map-geo-alert">
          <div className="map-geo-alert-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{geoError}</span>
          </div>
          <div className="map-geo-alert-actions">
            <button type="button" className="map-geo-alert-btn" onClick={handleRetryLocation}>
              Retry GPS
            </button>
            <button
              type="button"
              className="map-geo-alert-dismiss"
              onClick={() => setDismissGeoAlert(true)}
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success toast */}
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
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Map canvas */}
      <div className="map-canvas-container">
        {/* Geolocation loading overlay */}
        {geoLoading && (
          <div className="map-state-overlay">
            <div className="map-state-card">
              <div className="spinner"></div>
              <h3 className="map-state-title">Locating your position…</h3>
              <p className="map-state-desc">
                Please allow browser location access when prompted to see civic reports and community events around you.
              </p>
            </div>
          </div>
        )}

        {/* Data loading badge */}
        {!geoLoading && dataLoading && (
          <div className="map-floating-badge">
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
            Fetching nearby reports &amp; events…
          </div>
        )}
        {!geoLoading && !dataLoading && dataError && (
          <div className="map-floating-badge" style={{ color: 'var(--up-red)' }}>
            ⚠ {dataError}
          </div>
        )}
        {!geoLoading && !dataLoading && !dataError && totalVisible === 0 && (
          <div className="map-floating-badge">
            No {activeFilter === 'all' ? 'reports or events' : activeFilter} found within 5 km
          </div>
        )}

        {/* Leaflet map */}
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true}>
          <RecenterMap center={mapCenter} zoom={mapZoom} />
          <MapEventsHandler
            onMapClick={handleMapClick}
            onMoveEnd={handleMapMoveEnd}
            onZoomChange={setCurrentZoom}
          />

          {/* Map Layer Rendering */}
          {mapLayer === 'street' && (
            <TileLayer
              key="street-layer"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {mapLayer === 'satellite' && (
            <TileLayer
              key="sat-layer"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          )}

          {mapLayer === 'hybrid' && (
            <>
              <TileLayer
                key="hybrid-base-layer"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
              <TileLayer
                key="hybrid-labels-layer"
                attribution='&copy; Esri, DeLorme, NAVTEQ'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </>
          )}

          {/* User location marker */}
          {userLocation && (
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userLocationIcon}>
              <Popup>
                <div className="popup-container">
                  <div className="popup-header">
                    <h4 className="popup-title">
                      {userLocation.isDevOverride ? 'Development Location' : 'Your Current Location'}
                    </h4>
                    <span className="popup-badge badge-user">
                      {userLocation.isDevOverride ? 'Dev' : 'You'}
                    </span>
                  </div>
                  <p className="popup-desc">
                    {userLocation.isDevOverride
                      ? 'Using development location override.'
                      : 'Showing civic reports and community events around your detected coordinates.'}
                  </p>
                  <div className="popup-footer" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div>
                      Lat: {userLocation.latitude.toFixed(5)}, Lng: {userLocation.longitude.toFixed(5)}
                    </div>
                    {userLocation.accuracy && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: userLocation.accuracy < 100 ? '#10B981' : '#F59E0B',
                        }}
                      >
                        GPS Accuracy: ±{Math.round(userLocation.accuracy)}m{' '}
                        {userLocation.accuracy < 100 ? '(Precise)' : '(Estimated)'}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Selected map pin */}
          {mapPinLocation && (
            <Marker position={[mapPinLocation.latitude, mapPinLocation.longitude]} icon={mapPinIcon}>
              <Popup>
                <div className="popup-container">
                  <div className="popup-header">
                    <h4 className="popup-title">Report Location Pin</h4>
                    <span
                      className="popup-badge"
                      style={{
                        background: 'var(--up-teal-bg)',
                        color: 'var(--up-teal)',
                        border: '1px solid var(--up-teal-bdr)',
                      }}
                    >
                      Selected
                    </span>
                  </div>
                  <p className="popup-desc">
                    Click &ldquo;Use Map Pin&rdquo; in the report form to submit at this location.
                  </p>
                  <div className="popup-footer">
                    Lat: {mapPinLocation.latitude.toFixed(5)}, Lng: {mapPinLocation.longitude.toFixed(5)}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-report-issue"
                      style={{ padding: '4px 10px', fontSize: '11.5px', flex: 1, justifyContent: 'center' }}
                      onClick={() => setIsReportModalOpen(true)}
                    >
                      Report Issue
                    </button>
                    <button
                      type="button"
                      className="btn-report-event"
                      style={{ padding: '4px 10px', fontSize: '11.5px', flex: 1, justifyContent: 'center' }}
                      onClick={() => setIsEventModalOpen(true)}
                    >
                      Host Event
                    </button>
                    <button
                      type="button"
                      className="refresh-btn"
                      style={{ padding: '4px 8px', fontSize: '11.5px' }}
                      onClick={() => {
                        setMapPinLocation(null);
                        if (onMapPinUpdate) onMapPinUpdate(null);
                      }}
                      title="Remove pin"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* GLA University Campus Landmarks */}
          {showCampusLandmarks &&
            GLA_CAMPUS_LANDMARKS.map((landmark) => (
              <Marker
                key={`campus-${landmark.id}`}
                position={landmark.coordinates}
                icon={campusIcon}
              >
                <Popup>
                  <div className="popup-container">
                    <div className="popup-header">
                      <h4 className="popup-title">{landmark.name}</h4>
                      <span className="popup-badge badge-campus">{landmark.category}</span>
                    </div>
                    <p className="popup-desc">{landmark.description}</p>
                    <div className="popup-footer">
                      GLA Campus • Lat: {landmark.coordinates[0].toFixed(5)}, Lng:{' '}
                      {landmark.coordinates[1].toFixed(5)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Report markers */}
          {reportGroups.map((group) => {
            const [lng, lat] = group.coordinates;
            const isGroup = group.reports.length > 1;
            const isSpiderfied = Boolean(spiderfiedGroups[group.id]);

            if (!isGroup) {
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
                        <div className="popup-footer">Reported: {formatDate(report.createdAt)}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            }

            if (isSpiderfied) {
              const spiderOffsets = calculateSpiderOffsets(lat, lng, group.reports.length, 35);
              return (
                <Fragment key={group.id}>
                  <Marker position={[lat, lng]} icon={createGroupedReportIcon(group.reports.length)}>
                    <Popup minWidth={280} maxWidth={360}>
                      <GroupedReportPopup
                        reports={group.reports}
                        formatDate={formatDate}
                        isSpiderfied={true}
                        onToggleSpiderfy={() => toggleSpiderfy(group.id)}
                      />
                    </Popup>
                  </Marker>
                  {group.reports.map((report, idx) => {
                    const offset = spiderOffsets[idx];
                    return (
                      <Fragment key={`spider-${report._id || idx}`}>
                        <Polyline
                          positions={[[lat, lng], offset]}
                          pathOptions={{ color: '#ef4444', dashArray: '4 4', weight: 2, opacity: 0.6 }}
                        />
                        <Marker position={offset} icon={createSpiderReportIcon(idx + 1)}>
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

            return (
              <Marker key={group.id} position={[lat, lng]} icon={createGroupedReportIcon(group.reports.length)}>
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

          {/* Event markers */}
          {visibleEvents.map((event) => {
            const coords = event.location?.coordinates;
            if (!coords || coords.length < 2) return null;
            const [lng, lat] = coords;
            return (
              <Marker key={`event-${event._id}`} position={[lat, lng]} icon={eventIcon}>
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

        {/* Map legend */}
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
          {showCampusLandmarks && (
            <div className="legend-item">
              <span className="legend-swatch swatch-campus"></span>
              <span>GLA Campus ({GLA_CAMPUS_LANDMARKS.length})</span>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal (standalone fallback) */}
      {controlledIsOpen === undefined && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          userLocation={userLocation}
          mapPinLocation={mapPinLocation}
          onSuccess={handleReportSuccess}
        />
      )}

      {/* Event Modal (standalone fallback) */}
      {controlledEventIsOpen === undefined && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          userLocation={userLocation}
          mapPinLocation={mapPinLocation}
          onSuccess={handleEventSuccess}
        />
      )}
    </div>
  );
}
