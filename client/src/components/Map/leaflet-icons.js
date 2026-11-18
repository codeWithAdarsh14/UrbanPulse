/**
 * Leaflet icon configurations and custom markers for UrbanPulse
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths in Vite/bundler environments
import icon2x from 'leaflet/dist/images/marker-icon-2x.png';
import icon from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: icon2x,
  shadowUrl: shadow,
});

/**
 * User Location Marker
 * Glowing pulsating blue dot
 */
export const userLocationIcon = L.divIcon({
  className: 'urban-marker-wrapper user-marker-wrapper',
  html: `
    <div class="user-pulse-marker" title="Your Location">
      <div class="pulse-ring"></div>
      <div class="pulse-core"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

/**
 * Report (Problem) Marker
 * Distinct amber-red teardrop pin with warning icon
 */
export const reportIcon = L.divIcon({
  className: 'urban-marker-wrapper report-marker-wrapper',
  html: `
    <div class="pin-marker report-pin" title="Urban Report">
      <div class="pin-head">
        <svg viewBox="0 0 24 24" class="pin-svg" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <div class="pin-point"></div>
    </div>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -40],
});

/**
 * Grouped Report (Problem) Marker
 * Displays the same teardrop warning pin with a prominent numeric count badge
 * @param {number} count - Total reports grouped at this location
 */
export function createGroupedReportIcon(count) {
  return L.divIcon({
    className: 'urban-marker-wrapper report-marker-wrapper grouped-report-marker',
    html: `
      <div class="pin-marker report-pin grouped-pin" title="${count} problems reported at this location">
        <div class="pin-head">
          <svg viewBox="0 0 24 24" class="pin-svg" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span class="marker-count-badge" aria-label="${count} reports">${count}</span>
        </div>
        <div class="pin-point"></div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -42],
  });
}

/**
 * Spiderfied Individual Report Marker
 * Small numbered pin used when a grouped cluster is fanned out onto the map
 * @param {number} index - Number displayed inside pin head
 */
export function createSpiderReportIcon(index) {
  return L.divIcon({
    className: 'urban-marker-wrapper report-marker-wrapper spider-report-marker',
    html: `
      <div class="pin-marker report-pin spider-pin" title="Report #${index}">
        <div class="pin-head spider-pin-head">
          <span class="spider-index-num">#${index}</span>
        </div>
        <div class="pin-point spider-pin-point"></div>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -34],
  });
}

/**
 * Event Marker
 * Distinct violet-purple teardrop pin with calendar icon
 */
export const eventIcon = L.divIcon({
  className: 'urban-marker-wrapper event-marker-wrapper',
  html: `
    <div class="pin-marker event-pin" title="Community Event">
      <div class="pin-head">
        <svg viewBox="0 0 24 24" class="pin-svg" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      <div class="pin-point"></div>
    </div>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -40],
});
