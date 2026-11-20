import { useState, useEffect, useCallback, useRef } from 'react';
import { createEvent } from '../../services/api';
import './EventModal.css';

const EVENT_CATEGORIES = [
  'Cleanup Drive',
  'Tree Plantation',
  'Town Hall',
  'Awareness Campaign',
  'Civic Meetup',
  'Workshop',
  'Health & Sanitation Camp',
  'Other',
];

/**
 * EventModal Component
 *
 * Dedicated modal for reporting and hosting community civic events.
 * Captures all required fields: title, description, category, venue,
 * location (GeoJSON [longitude, latitude]), startDate, endDate, and optional image.
 */
export default function EventModal({
  isOpen,
  onClose,
  userLocation,
  mapPinLocation,
  onSuccess,
}) {
  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Cleanup Drive');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [image, setImage] = useState(null);

  // Location state: { latitude, longitude, source: 'gps' | 'map' } | null
  const [eventLocation, setEventLocation] = useState(null);
  const [geoFetching, setGeoFetching] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // File input ref & timer ref
  const fileInputRef = useRef(null);
  const successTimerRef = useRef(null);

  // Reset or pre-populate on open/close
  useEffect(() => {
    if (!isOpen) {
      queueMicrotask(() => {
        setTitle('');
        setCategory('Cleanup Drive');
        setVenue('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setImage(null);
        setEventLocation(null);
        setGeoFetching(false);
        setGeoError(null);
        setSubmitting(false);
        setErrorMessage(null);
        setSubmitSuccess(false);
      });

      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
      return;
    }

    queueMicrotask(() => {
      setSubmitting(false);
      setErrorMessage(null);
      setSubmitSuccess(false);
      setGeoError(null);

      // Pre-populate location from mapPin if selected, or userLocation (real GPS only)
      if (
        mapPinLocation &&
        typeof mapPinLocation.latitude === 'number' &&
        typeof mapPinLocation.longitude === 'number'
      ) {
        setEventLocation({
          latitude: mapPinLocation.latitude,
          longitude: mapPinLocation.longitude,
          source: 'map',
        });
      } else if (
        userLocation &&
        !userLocation.isDevOverride &&
        typeof userLocation.latitude === 'number' &&
        typeof userLocation.longitude === 'number'
      ) {
        setEventLocation({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          source: 'gps',
        });
      } else {
        setEventLocation(null);
      }
    });
  }, [isOpen, mapPinLocation, userLocation]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  // Detect GPS Location
  const handleDetectLocation = useCallback(() => {
    setGeoError(null);
    setErrorMessage(null);
    setGeoFetching(true);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setGeoFetching(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setEventLocation({ latitude, longitude, source: 'gps' });
        setGeoFetching(false);
        setGeoError(null);
      },
      (err) => {
        const msgs = {
          1: 'Location permission was denied. Please allow location access or select from map.',
          2: 'Location information unavailable.',
          3: 'Location request timed out. Please try again.',
        };
        setGeoError(msgs[err.code] || err.message || 'Unable to detect location.');
        setGeoFetching(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  // Use map pin location
  const handleUseMapPin = useCallback(() => {
    if (
      mapPinLocation &&
      typeof mapPinLocation.latitude === 'number' &&
      typeof mapPinLocation.longitude === 'number'
    ) {
      setEventLocation({
        latitude: mapPinLocation.latitude,
        longitude: mapPinLocation.longitude,
        source: 'map',
      });
      setGeoError(null);
      setErrorMessage(null);
    }
  }, [mapPinLocation]);

  // File upload and canvas compression for event banner
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image size must be under 15MB.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setImage(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          setImage(loadEvent.target.result);
        }
      };
      img.onerror = () => setImage(loadEvent.target.result);
      img.src = loadEvent.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  // Form submission handler
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitting) return;

      const trimmedTitle = title.trim();
      const trimmedVenue = venue.trim();
      const trimmedDesc = description.trim();

      if (!trimmedTitle) {
        setErrorMessage('Please provide an event title.');
        return;
      }

      if (!category) {
        setErrorMessage('Please select a category.');
        return;
      }

      if (!trimmedVenue) {
        setErrorMessage('Please specify the event venue or meeting point.');
        return;
      }

      if (!startDate) {
        setErrorMessage('Please choose a start date and time.');
        return;
      }

      if (!endDate) {
        setErrorMessage('Please choose an end date and time.');
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setErrorMessage('Please enter valid start and end dates.');
        return;
      }

      if (end <= start) {
        setErrorMessage('End date and time must be later than the start date and time.');
        return;
      }

      if (!trimmedDesc) {
        setErrorMessage('Please provide event details and description.');
        return;
      }

      if (trimmedDesc.length < 15) {
        setErrorMessage(`Description should be at least 15 characters (currently ${trimmedDesc.length}).`);
        return;
      }

      if (
        !eventLocation ||
        typeof eventLocation.latitude !== 'number' ||
        typeof eventLocation.longitude !== 'number'
      ) {
        setErrorMessage('Please specify the event location (via GPS or map pin).');
        return;
      }

      setSubmitting(true);
      setErrorMessage(null);

      try {
        const payload = {
          title: trimmedTitle,
          description: trimmedDesc,
          category,
          venue: trimmedVenue,
          location: {
            type: 'Point',
            coordinates: [eventLocation.longitude, eventLocation.latitude],
          },
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          image: image || null,
        };

        const savedEvent = await createEvent(payload);
        setSubmitSuccess(true);

        successTimerRef.current = setTimeout(() => {
          if (onSuccess) {
            onSuccess(savedEvent);
          }
          onClose();
        }, 1800);
      } catch (err) {
        setErrorMessage(err.message || 'An error occurred while publishing the event.');
        setSubmitting(false);
      }
    },
    [submitting, title, category, venue, startDate, endDate, description, eventLocation, image, onSuccess, onClose]
  );

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="event-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div className="event-modal-card">
        {/* Header */}
        <div className="event-modal-header">
          <div className="event-modal-title-group">
            <div className="event-modal-icon-wrap" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h2 id="event-modal-title" className="event-modal-title">Host a Community Event</h2>
              <p className="event-modal-subtitle">Organize cleanups, plantation drives, and townhalls in your ward</p>
            </div>
          </div>
          <button
            type="button"
            className="event-modal-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close event modal"
          >
            ✕
          </button>
        </div>

        {/* Success Banner */}
        {submitSuccess ? (
          <div className="event-modal-success-card">
            <div className="event-modal-success-icon">✓</div>
            <h3 className="event-modal-success-title">Event Published Successfully!</h3>
            <p className="event-modal-success-desc">
              Your community event has been registered and is now live on the UrbanPulse neighborhood map and schedule.
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="event-modal-form" noValidate>
            {/* Error Banner */}
            {errorMessage && (
              <div className="event-modal-error-banner" role="alert">
                <span className="event-modal-error-icon">⚠</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Field: Title */}
            <div className="event-form-group">
              <label htmlFor="ev-title" className="event-form-label">
                Event Title <span className="event-required-star">*</span>
              </label>
              <input
                id="ev-title"
                type="text"
                className="event-form-input"
                placeholder="e.g., Yamuna Ghat Cleanup & Waste Segregation Drive"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                disabled={submitting}
                required
              />
            </div>

            {/* Category & Venue Row */}
            <div className="event-form-row">
              <div className="event-form-group">
                <label htmlFor="ev-category" className="event-form-label">
                  Category <span className="event-required-star">*</span>
                </label>
                <select
                  id="ev-category"
                  className="event-form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={submitting}
                  required
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="event-form-group">
                <label htmlFor="ev-venue" className="event-form-label">
                  Venue / Meeting Spot <span className="event-required-star">*</span>
                </label>
                <input
                  id="ev-venue"
                  type="text"
                  className="event-form-input"
                  placeholder="e.g., Vishram Ghat Entrance, Mathura"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  maxLength={120}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* Schedule (Start & End Date/Time) */}
            <div className="event-form-row">
              <div className="event-form-group">
                <label htmlFor="ev-start" className="event-form-label">
                  Start Date & Time <span className="event-required-star">*</span>
                </label>
                <input
                  id="ev-start"
                  type="datetime-local"
                  className="event-form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="event-form-group">
                <label htmlFor="ev-end" className="event-form-label">
                  End Date & Time <span className="event-required-star">*</span>
                </label>
                <input
                  id="ev-end"
                  type="datetime-local"
                  className="event-form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* Field: Description */}
            <div className="event-form-group">
              <label htmlFor="ev-description" className="event-form-label">
                Event Description & Activities <span className="event-required-star">*</span>
              </label>
              <textarea
                id="ev-description"
                className="event-form-textarea"
                rows={3}
                placeholder="Explain the agenda, instructions for volunteers, tools provided, and target neighborhood impact..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Field: Location Pinpoint */}
            <div className="event-form-group">
              <label className="event-form-label">
                Event Location Coordinates <span className="event-required-star">*</span>
              </label>

              {eventLocation ? (
                <div className="event-location-badge event-location-badge--set">
                  <span className="event-location-icon">📍</span>
                  <div className="event-location-details">
                    <span className="event-location-source">
                      {eventLocation.source === 'gps' ? 'Live GPS Location' : 'Selected Map Pin'}
                    </span>
                    <span className="event-location-coords">
                      Lat: {eventLocation.latitude.toFixed(5)}, Lng: {eventLocation.longitude.toFixed(5)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="event-location-clear-btn"
                    onClick={() => setEventLocation(null)}
                    disabled={submitting}
                    title="Change location"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="event-location-badge event-location-badge--unset">
                  <span>No location selected. Use a button below to choose coordinates.</span>
                </div>
              )}

              {geoError && (
                <div className="event-geo-error">
                  ⚠ {geoError}
                </div>
              )}

              <div className="event-location-actions">
                <button
                  type="button"
                  className="event-btn-action"
                  onClick={handleDetectLocation}
                  disabled={submitting || geoFetching}
                >
                  {geoFetching ? 'Detecting GPS...' : '📍 Use My Current Location'}
                </button>

                {mapPinLocation && typeof mapPinLocation.latitude === 'number' && (
                  <button
                    type="button"
                    className="event-btn-action event-btn-action--cyan"
                    onClick={handleUseMapPin}
                    disabled={submitting}
                  >
                    📌 Use Map Pin ({mapPinLocation.latitude.toFixed(3)}, {mapPinLocation.longitude.toFixed(3)})
                  </button>
                )}
              </div>
            </div>

            {/* Field: Optional Image/Banner */}
            <div className="event-form-group">
              <label className="event-form-label">
                Event Banner / Poster <span className="event-optional-text">(Optional)</span>
              </label>

              {image ? (
                <div className="event-image-preview-wrap">
                  <img src={image} alt="Event banner preview" className="event-image-preview" />
                  <button
                    type="button"
                    className="event-image-remove-btn"
                    onClick={() => setImage(null)}
                    disabled={submitting}
                    title="Remove image"
                  >
                    ✕ Remove Banner
                  </button>
                </div>
              ) : (
                <div
                  className="event-image-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Click to upload event banner (JPG, PNG, WebP)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="event-modal-actions">
              <button
                type="button"
                className="event-btn event-btn--cancel"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="event-btn event-btn--submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="event-spinner" />
                    <span>Publishing Event...</span>
                  </>
                ) : (
                  <>
                    <span>Publish Event</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
