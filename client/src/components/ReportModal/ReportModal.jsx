import { useState, useEffect, useCallback } from 'react';
import { createReport } from '../../services/api';
import './ReportModal.css';

const CIVIC_CATEGORIES = [
  'Pothole',
  'Garbage',
  'Waterlogging',
  'Traffic',
  'Broken Streetlight',
  'Other',
];

/**
 * ReportModal component
 *
 * Allows users to report a civic issue at a chosen location.
 * Location can be:
 *   1. Auto-detected via "Use My Current Location" (browser Geolocation API)
 *   2. Manually selected by clicking the map to drop a pin, then clicking "Use Map Pin"
 *
 * Dev override coordinates (isDevOverride: true) are NEVER silently used as a
 * real user's report location — they appear in the map centering only.
 *
 * GeoJSON coordinate order: [longitude, latitude] — preserved in backend payload.
 */
export default function ReportModal({ isOpen, onClose, userLocation, mapPinLocation, onSuccess }) {
  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [description, setDescription] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Report location chosen by the user { latitude, longitude, source: 'gps'|'map' } | null
  const [reportLocation, setReportLocation] = useState(null);

  // Geolocation detection state
  const [geoFetching, setGeoFetching] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // --- Hooks BEFORE early return (Rules of Hooks) ---

  // Reset / pre-populate on open/close
  useEffect(() => {
    if (!isOpen) {
      // Reset everything when modal closes
      setTitle('');
      setCategory('Pothole');
      setDescription('');
      setErrorMessage(null);
      setGeoError(null);
      setGeoFetching(false);
      setReportLocation(null);
      return;
    }

    // On open: pre-populate from real GPS only — never from dev override
    setGeoError(null);
    setGeoFetching(false);
    if (
      userLocation &&
      !userLocation.isDevOverride &&
      typeof userLocation.latitude === 'number' &&
      typeof userLocation.longitude === 'number'
    ) {
      setReportLocation({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        source: 'gps',
      });
    } else {
      setReportLocation(null);
    }
    // Intentionally excludes userLocation from deps — only run on open/close
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // "Use My Current Location" button handler
  const handleDetectLocation = useCallback(() => {
    setGeoError(null);
    setGeoFetching(true);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setGeoFetching(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setReportLocation({ latitude, longitude, source: 'gps' });
        setGeoFetching(false);
        setGeoError(null);
      },
      (err) => {
        const msgs = {
          [err.PERMISSION_DENIED]:
            'Location permission was denied. Allow access in browser settings, or select a map location.',
          [err.POSITION_UNAVAILABLE]:
            'Your location is currently unavailable. Try again or select from the map.',
          [err.TIMEOUT]:
            'Location request timed out. Please try again or select a map location.',
        };
        setGeoError(msgs[err.code] || err.message || 'Unable to detect your location.');
        setGeoFetching(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  // "Use Map Pin" button handler
  const handleUseMapPin = useCallback(() => {
    if (mapPinLocation && typeof mapPinLocation.latitude === 'number') {
      setReportLocation({ ...mapPinLocation, source: 'map' });
      setGeoError(null);
    }
  }, [mapPinLocation]);

  // --- Early return AFTER all hooks ---
  if (!isOpen) return null;

  const hasMapPin = mapPinLocation && typeof mapPinLocation.latitude === 'number';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setErrorMessage('Please provide a title for the issue.');
      return;
    }
    if (!category) {
      setErrorMessage('Please select a category.');
      return;
    }
    if (!trimmedDescription) {
      setErrorMessage('Please provide a description of the issue.');
      return;
    }
    if (
      !reportLocation ||
      typeof reportLocation.longitude !== 'number' ||
      typeof reportLocation.latitude !== 'number'
    ) {
      setErrorMessage(
        'Please select a location before submitting. Use "Use My Current Location" or close this dialog, click a spot on the map, then reopen.'
      );
      return;
    }

    setSubmitting(true);

    try {
      // GeoJSON coordinates: [longitude, latitude]
      const payload = {
        title: trimmedTitle,
        description: trimmedDescription,
        category,
        location: {
          type: 'Point',
          coordinates: [reportLocation.longitude, reportLocation.latitude],
        },
      };

      const savedReport = await createReport(payload);

      // Reset form fields (location reset happens in the isOpen useEffect on close)
      setTitle('');
      setCategory('Pothole');
      setDescription('');
      setErrorMessage(null);

      if (onSuccess) {
        onSuccess(savedReport);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while submitting the report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  };

  const handleClearLocation = () => {
    setReportLocation(null);
    setGeoError(null);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-wrap">
              <span className="modal-icon">⚠</span>
            </div>
            <h2 id="report-modal-title" className="modal-title">Report an Issue</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Location Section */}
        <div className="modal-location-section">
          {/* Location status badge */}
          {reportLocation ? (
            <div className="modal-location-badge modal-location-badge--set">
              <span className="location-source-icon">
                {reportLocation.source === 'gps' ? '📡' : '📍'}
              </span>
              <div className="location-badge-details">
                <span className="location-source-label">
                  {reportLocation.source === 'gps' ? 'GPS Location' : 'Map Pin Location'}
                </span>
                <span>
                  {reportLocation.latitude.toFixed(5)}° N,{' '}
                  {reportLocation.longitude.toFixed(5)}° E
                </span>
              </div>
              <button
                type="button"
                className="location-clear-btn"
                onClick={handleClearLocation}
                disabled={submitting}
                aria-label="Clear selected location"
                title="Clear location"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="modal-location-badge modal-location-badge--unset" role="alert">
              <span>⚠ No location selected — please choose a location below.</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="location-actions">
            <button
              type="button"
              className="btn-detect-location"
              onClick={handleDetectLocation}
              disabled={submitting || geoFetching}
              title="Detect my current GPS location"
            >
              {geoFetching ? (
                <>
                  <span className="spinner-sm btn-detect-icon"></span>
                  Detecting...
                </>
              ) : (
                <>
                  <span className="btn-detect-icon">📡</span>
                  Use My Current Location
                </>
              )}
            </button>

            {hasMapPin && (
              <button
                type="button"
                className="btn-use-map-pin"
                onClick={handleUseMapPin}
                disabled={submitting}
                title={`Use map pin at ${mapPinLocation.latitude.toFixed(4)}° N, ${mapPinLocation.longitude.toFixed(4)}° E`}
              >
                <span>📍</span>
                Use Map Pin
              </button>
            )}
          </div>

          {/* Map pin hint */}
          {!reportLocation && !hasMapPin && (
            <p className="location-map-hint">
              💡 Close this dialog, click anywhere on the map to drop a pin, then reopen.
            </p>
          )}
          {!reportLocation && hasMapPin && (
            <p className="location-map-hint location-map-hint--available">
              📍 Map pin ready at {mapPinLocation.latitude.toFixed(4)}° N,{' '}
              {mapPinLocation.longitude.toFixed(4)}° E — click &quot;Use Map Pin&quot; above.
            </p>
          )}

          {/* Geolocation error */}
          {geoError && (
            <div className="location-geo-error" role="alert">
              <span>⚠</span>
              <span>{geoError}</span>
            </div>
          )}

          {/* Dev override notice */}
          {userLocation?.isDevOverride && (
            <p className="location-dev-notice">
              ⚙ Dev location override is active (map centering only). Use the button above to
              detect your real GPS location.
            </p>
          )}
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="modal-error-banner" role="alert">
            <span className="error-icon">✕</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="report-title" className="form-label">
              Issue Title <span className="required-star">*</span>
            </label>
            <input
              id="report-title"
              type="text"
              className="form-input"
              placeholder="e.g., Deep pothole near intersection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              maxLength={120}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="report-category" className="form-label">
              Category <span className="required-star">*</span>
            </label>
            <select
              id="report-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
              required
            >
              {CIVIC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="report-description" className="form-label">
              Description <span className="required-star">*</span>
            </label>
            <textarea
              id="report-description"
              className="form-textarea"
              placeholder="Describe the problem, severity, landmarks, or hazard details..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              maxLength={1000}
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting || !reportLocation}
              title={!reportLocation ? 'Select a location first' : undefined}
            >
              {submitting ? (
                <>
                  <span className="spinner-sm"></span>
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
