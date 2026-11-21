import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchAllReports, fetchAllEvents } from '../../services/api';
import './LiveMapPreview.css';

// ════════════════════════════════════════════════════════════════════
// DEFAULT FALLBACK LOCATIONS (Pre-cached before backend response)
// ════════════════════════════════════════════════════════════════════
const DEFAULT_LOCATIONS = [
  {
    id: 'default-mathura',
    city: 'Mathura, India',
    location: 'Holi Gate Market, Mathura',
    lat: 27.4924,
    lng: 77.6737,
    type: 'EVENT',
    category: 'Cultural Festival',
    title: 'Braj Heritage Mahotsav',
    status: 'Upcoming',
    description: 'Traditional folk performances, Raas Leela, and artisan displays in historic bazaar.',
    coordsText: '27.4924° N, 77.6737° E',
  },
  {
    id: 'default-delhi',
    city: 'New Delhi, India',
    location: 'Connaught Place, New Delhi',
    lat: 28.6315,
    lng: 77.2167,
    type: 'EVENT',
    category: 'Clean Air Initiative',
    title: 'Central Delhi Clean Air Corridor',
    status: 'Active',
    description: 'Metropolitan air quality sensor grid verification and electric transit trials.',
    coordsText: '28.6315° N, 77.2167° E',
  },
  {
    id: 'default-mumbai',
    city: 'Mumbai, India',
    location: 'Marine Drive Promenade, Mumbai',
    lat: 18.9438,
    lng: 72.8232,
    type: 'ISSUE',
    category: 'Coastal Drainage',
    title: 'Stormwater Sluice Gate Calibration',
    status: 'In Progress',
    description: 'Sea wall stormwater conduit inspection ahead of high-tide advisory.',
    coordsText: '18.9438° N, 72.8232° E',
  },
  {
    id: 'default-lucknow',
    city: 'Lucknow, India',
    location: 'Hazratganj Boulevard, Lucknow',
    lat: 26.8526,
    lng: 80.9416,
    type: 'ISSUE',
    category: 'Road Repair',
    title: 'Arterial Road Settlement',
    status: 'Active',
    description: 'Pavement subsidence along heritage commercial stretch. Municipal road crew assigned.',
    coordsText: '26.8526° N, 80.9416° E',
  },
  {
    id: 'default-bengaluru',
    city: 'Bengaluru, India',
    location: 'MG Road Metro Concourse, Bengaluru',
    lat: 12.9756,
    lng: 77.6066,
    type: 'EVENT',
    category: 'Smart Mobility',
    title: 'Pedestrian Plaza & EV Micro-Transit',
    status: 'Scheduled',
    description: 'Demonstration of smart pedestrian crossing sensors and neighborhood e-shuttles.',
    coordsText: '12.9756° N, 77.6066° E',
  },
];

/**
 * Resolve city and regional jurisdiction from geographic coordinates
 */
function resolveCityName(lat, lng, defaultVenue) {
  if (Math.abs(lat - 27.50) < 0.25 && Math.abs(lng - 77.68) < 0.25) return 'Mathura, India';
  if (Math.abs(lat - 27.60) < 0.25 && Math.abs(lng - 77.60) < 0.25) return 'GLA Campus, Mathura';
  if (Math.abs(lat - 27.58) < 0.25 && Math.abs(lng - 77.70) < 0.25) return 'Vrindavan, India';
  if (Math.abs(lat - 28.63) < 0.5 && Math.abs(lng - 77.22) < 0.5) return 'New Delhi, India';
  if (Math.abs(lat - 26.85) < 0.5 && Math.abs(lng - 80.94) < 0.5) return 'Lucknow, India';
  if (Math.abs(lat - 18.94) < 0.5 && Math.abs(lng - 72.82) < 0.5) return 'Mumbai, India';
  if (Math.abs(lat - 12.97) < 0.5 && Math.abs(lng - 77.60) < 0.5) return 'Bengaluru, India';
  if (Math.abs(lat - 51.50) < 0.5 && Math.abs(lng - (-0.12)) < 0.5) return 'London, United Kingdom';
  if (Math.abs(lat - 40.75) < 0.5 && Math.abs(lng - (-73.98)) < 0.5) return 'New York, United States';
  if (Math.abs(lat - 1.28) < 0.5 && Math.abs(lng - 103.85) < 0.5) return 'Singapore';

  if (defaultVenue && defaultVenue.includes(',')) {
    return defaultVenue.split(',').slice(-2).join(', ').trim();
  }
  return defaultVenue || 'Civic Jurisdiction';
}

/** Utility to generate random next index avoiding immediate repeat */
function getNextRandomIndex(currIdx, length) {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  while (next === currIdx) {
    next = Math.floor(Math.random() * length);
  }
  return next;
}

/**
 * Creates custom HTML divIcon for Leaflet with animated marker & floating popup card
 */
function createCinematicIcon(loc, isMarkerVisible, isPopupVisible) {
  const isEvent = loc.type === 'EVENT';
  const markerClass = isMarkerVisible ? 'marker-in' : 'marker-out';
  const popupClass = isPopupVisible ? 'popup-visible' : 'popup-hidden';
  const ringClass = isMarkerVisible ? 'pulse-active' : '';

  const pinSvg = isEvent
    ? `<svg viewBox="0 0 24 24" class="pin-svg" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>`
    : `<svg viewBox="0 0 24 24" class="pin-svg" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`;

  const html = `
    <div class="up-cine-anchor">
      <!-- Glowing Pulse Ripple -->
      <div class="up-cine-pulse-ring ${isEvent ? 'event-ring' : 'issue-ring'} ${ringClass}"></div>

      <!-- Teardrop Pin Marker -->
      <div class="pin-marker ${isEvent ? 'event-pin' : 'report-pin'} ${markerClass}">
        <div class="pin-head">
          ${pinSvg}
        </div>
        <div class="pin-point"></div>
      </div>

      <!-- Floating Information Popup -->
      <div class="up-cine-popup-card ${popupClass}">
        <div class="up-cine-popup-header">
          <span class="up-cine-badge ${isEvent ? 'up-cine-badge--event' : 'up-cine-badge--issue'}">
            ${loc.type}
          </span>
          <span class="up-cine-status ${isEvent ? 'status--event' : 'status--issue'}">
            ● ${loc.status}
          </span>
        </div>
        <h4 class="up-cine-popup-title">${loc.title}</h4>
        <div class="up-cine-popup-meta">
          <span style="color: ${isEvent ? '#22D3EE' : '#F87171'}">📍</span>
          <span>${loc.location}</span>
        </div>
        <p class="up-cine-popup-desc">${loc.description}</p>
        <div class="up-cine-popup-footer">
          <span>${loc.category}</span>
          <span>${loc.coordsText}</span>
        </div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'up-cine-marker-container',
    html,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });
}

/**
 * CinematicDirector — orchestrates automated camera movements between locations
 */
function CinematicDirector({ locations, onLocationChange, isHovered }) {
  const map = useMap();
  const locationsRef = useRef(locations);
  const currentIndexRef = useRef(0);
  const [activeLoc, setActiveLoc] = useState(locations[0]);
  const [isMarkerVisible, setIsMarkerVisible] = useState(true);
  const [isPopupVisible, setIsPopupVisible] = useState(true);

  // Keep ref in sync when backend API loads new items
  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  const isHoveredRef = useRef(isHovered);
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Set initial map position and sync title
  useEffect(() => {
    if (!map) return;
    map.invalidateSize();
    const init = locations[0];
    map.setView([init.lat, init.lng], 15);
    if (onLocationChange) {
      onLocationChange(init.city);
    }
  }, [map]);

  // Automated Cinematic Camera Loop
  useEffect(() => {
    if (!map || locations.length === 0) return;

    let isDisposed = false;
    let timerId = null;

    const scheduleNextFlight = () => {
      if (isDisposed) return;

      // STEP 6: Keep marker & popup visible for ~3.5s
      timerId = setTimeout(() => {
        if (isDisposed) return;

        // If hovered by user, delay until unhovered
        if (isHoveredRef.current) {
          timerId = setTimeout(scheduleNextFlight, 1000);
          return;
        }

        // STEP 7: Fade out popup and marker
        setIsPopupVisible(false);
        setIsMarkerVisible(false);

        // Allow 300ms for smooth fade out
        timerId = setTimeout(() => {
          if (isDisposed) return;

          const currentList = locationsRef.current;
          if (!currentList || currentList.length === 0) return;

          // Pick random next location from backend dataset
          const nextIdx = getNextRandomIndex(currentIndexRef.current, currentList.length);
          currentIndexRef.current = nextIdx;
          const nextLoc = currentList[nextIdx];

          // STEPS 2, 3, 4: Native smooth camera flight (Zoom out -> Camera slide -> Zoom in)
          map.flyTo([nextLoc.lat, nextLoc.lng], 15, {
            duration: 3.5,
            easeLinearity: 0.25,
          });

          const onFlightArrival = () => {
            if (isDisposed) return;

            setActiveLoc(nextLoc);

            // STEP 5: Marker appearance (Scale 0 to 1 with pulsing ripple)
            setIsMarkerVisible(true);

            // STEP 6: Information popup slides up with smooth fade-in
            timerId = setTimeout(() => {
              if (isDisposed) return;
              setIsPopupVisible(true);
              if (onLocationChange) {
                onLocationChange(nextLoc.city);
              }

              // Continue the continuous cinematic sequence!
              scheduleNextFlight();
            }, 300);
          };

          map.once('moveend', onFlightArrival);
        }, 300);
      }, 3600);
    };

    // Begin sequence
    scheduleNextFlight();

    return () => {
      isDisposed = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [map, onLocationChange]);

  const markerIcon = useMemo(() => {
    return createCinematicIcon(activeLoc, isMarkerVisible, isPopupVisible);
  }, [activeLoc, isMarkerVisible, isPopupVisible]);

  return (
    <>
      <Marker
        key={`${activeLoc.id}-${isMarkerVisible}-${isPopupVisible}`}
        position={[activeLoc.lat, activeLoc.lng]}
        icon={markerIcon}
      />
    </>
  );
}

/**
 * LiveMapPreview — Real Geographical Map with Cinematic Camera Animation
 * Directly connects to backend API: /api/reports and /api/events (MongoDB)
 */
export default function LiveMapPreview({ onLocationChange }) {
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [isHovered, setIsHovered] = useState(false);
  const [apiSource, setApiSource] = useState('SYNCING');
  const initialLoc = locations[0];

  // Fetch real incidents from backend APIs (/api/reports and /api/events)
  useEffect(() => {
    let isMounted = true;

    async function loadDataFromBackend() {
      try {
        const [reportsRes, eventsRes] = await Promise.all([
          fetchAllReports(1, 50).catch((err) => {
            console.warn('Reports API notice:', err);
            return { data: [] };
          }),
          fetchAllEvents(1, 50).catch((err) => {
            console.warn('Events API notice:', err);
            return { data: [] };
          }),
        ]);

        const rawReports = reportsRes.data || [];
        const rawEvents = eventsRes.data || [];

        const mappedReports = rawReports
          .filter((r) => r.location?.coordinates && r.location.coordinates.length === 2)
          .map((r) => {
            const lng = r.location.coordinates[0];
            const lat = r.location.coordinates[1];
            const city = resolveCityName(lat, lng, r.venue);
            const isResolved = (r.status || '').toLowerCase() === 'resolved';

            return {
              id: `db-rep-${r._id}`,
              city,
              location: r.venue || (r.title.includes('near') ? r.title : `${r.title}, ${city}`),
              lat,
              lng,
              type: 'ISSUE',
              category: r.category || 'Public Issue',
              title: r.title,
              status: isResolved ? 'Resolved' : 'Active',
              description: r.description || 'Verified citizen report fetched from backend MongoDB database.',
              coordsText: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
            };
          });

        const mappedEvents = rawEvents
          .filter((e) => e.location?.coordinates && e.location.coordinates.length === 2)
          .map((e) => {
            const lng = e.location.coordinates[0];
            const lat = e.location.coordinates[1];
            const city = resolveCityName(lat, lng, e.venue);

            return {
              id: `db-ev-${e._id}`,
              city,
              location: e.venue || `${e.title}, ${city}`,
              lat,
              lng,
              type: 'EVENT',
              category: e.category || 'Community Event',
              title: e.title,
              status: 'Upcoming',
              description: e.description || 'Community event fetched from backend MongoDB database.',
              coordsText: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
            };
          });

        const combined = [...mappedReports, ...mappedEvents];
        if (isMounted && combined.length > 0) {
          setLocations(combined);
          setApiSource(`LIVE API • ${combined.length} INCIDENTS`);
        }
      } catch (err) {
        console.error('Error fetching backend API incidents:', err);
      }
    }

    loadDataFromBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className="up-real-map-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="UrbanPulse Real Geographical Map connected to Backend API"
    >
      <MapContainer
        center={[initialLoc.lat, initialLoc.lng]}
        zoom={15}
        minZoom={4}
        maxZoom={19}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        dragging={false}
        attributionControl={true}
        className="up-leaflet-map-canvas"
      >
        {/* Real OpenStreetMap Geographical Tiles (Zero API key required, zero watermarks) */}
        <TileLayer
          key="osm-tiles"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={4}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        />

        {/* Cinematic Camera Controller */}
        <CinematicDirector
          locations={locations}
          onLocationChange={onLocationChange}
          isHovered={isHovered}
        />
      </MapContainer>

      {/* Top Status Pill displaying Backend API connection status */}
      <div className="up-real-map-status-pill">
        <span className="up-real-map-pulse-dot" />
        <span>{apiSource}</span>
      </div>

      {/* Bottom Subtle Overlay */}
      <div className="up-real-map-bottom-tag">
        <span>📍 Real OpenStreetMap Streets & Backend MongoDB Incidents</span>
      </div>
    </div>
  );
}
