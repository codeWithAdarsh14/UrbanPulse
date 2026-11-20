import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fetchReports } from '../../services/reportService';
import { fetchEvents } from '../../services/eventService';
import { formatDate } from '../../utils/formatters';

// Custom SVG Icons for dark map
const createCustomIcon = (color, glyph) => {
  return L.divIcon({
    className: 'up-map-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 14px ${color};
        border: 2px solid #FFFFFF;
      ">
        <span style="transform: rotate(45deg); color: #FFF; font-size: 13px; font-weight: bold;">
          ${glyph}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const reportIcon = createCustomIcon('#7C3AED', '!');
const resolvedIcon = createCustomIcon('#10B981', '✓');
const eventIcon = createCustomIcon('#22D3EE', '★');

export default function LiveMapPreview({ onSelectIssue }) {
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mathura coordinates default
  const defaultCenter = [27.4924, 77.6737];

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [repRes, evRes] = await Promise.all([
          fetchReports({ limit: 30 }),
          fetchEvents({ limit: 10 }),
        ]);
        if (isMounted) {
          setReports(repRes.reports || []);
          setEvents(evRes.events || []);
        }
      } catch (err) {
        console.error('Error loading map preview data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(11, 16, 32, 0.85)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div className="up-pulse-dot" style={{ width: '16px', height: '16px' }}></div>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Loading Live Civic Telemetry...</span>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', background: '#080B18' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Real Reports Markers */}
        {reports.map((rep) => {
          if (!rep.location?.coordinates || rep.location.coordinates.length !== 2) return null;
          const [lng, lat] = rep.location.coordinates;
          const isResolved = (rep.status || '').toLowerCase() === 'resolved';

          return (
            <Marker
              key={rep._id || `rep-${lng}-${lat}`}
              position={[lat, lng]}
              icon={isResolved ? resolvedIcon : reportIcon}
            >
              <Popup>
                <div style={{ color: '#0B1020', minWidth: '180px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isResolved ? '#10B981' : '#7C3AED',
                      color: '#FFF'
                    }}>
                      {rep.status || 'Active'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {formatDate(rep.createdAt)}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600' }}>{rep.title}</h4>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#475569' }}>{rep.category}</p>
                  {onSelectIssue && (
                    <button
                      onClick={() => onSelectIssue(rep)}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: '#7C3AED',
                        color: '#FFF',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      View Details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Real Events Markers */}
        {events.map((ev) => {
          if (!ev.location?.coordinates || ev.location.coordinates.length !== 2) return null;
          const [lng, lat] = ev.location.coordinates;

          return (
            <Marker
              key={ev._id || `ev-${lng}-${lat}`}
              position={[lat, lng]}
              icon={eventIcon}
            >
              <Popup>
                <div style={{ color: '#0B1020', minWidth: '180px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#22D3EE',
                    color: '#06101E',
                    display: 'inline-block',
                    marginBottom: '4px'
                  }}>
                    Community Event
                  </span>
                  <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600' }}>{ev.title}</h4>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#475569' }}>📍 {ev.venue}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
