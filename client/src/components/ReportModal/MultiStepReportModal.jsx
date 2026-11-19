import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { createReport } from '../../services/api';
import './MultiStepReportModal.css';

/**
 * 6 Visual Civic Categories with Custom Inline SVGs
 */
const CATEGORIES = [
  {
    id: 'Pothole',
    label: 'Pothole',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19L8 5" />
        <path d="M20 19L16 5" />
        <path d="M12 5v4" />
        <path d="M12 15v4" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
  {
    id: 'Garbage',
    label: 'Garbage',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    ),
  },
  {
    id: 'Waterlogging',
    label: 'Waterlogging',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    id: 'Traffic',
    label: 'Traffic',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="9" rx="2" />
        <path d="M5 11l2.5-6h9l2.5 6" />
        <circle cx="7.5" cy="16" r="1.5" />
        <circle cx="16.5" cy="16" r="1.5" />
      </svg>
    ),
  },
  {
    id: 'Broken Streetlight',
    label: 'Broken Streetlight',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: 'Other',
    label: 'Other',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

const STEPS = [
  { num: 1, label: 'Issue Details' },
  { num: 2, label: 'Evidence' },
  { num: 3, label: 'Location' },
  { num: 4, label: 'Review & Submit' },
];

/**
 * MultiStepReportModal Component
 *
 * A 4-step premium report submission modal for UrbanPulse 2.0.
 *
 * Steps:
 * 1. Issue Details: title, category grid, description
 * 2. Evidence: drag-and-drop / file upload for photos (max 3, optional)
 * 3. Select Location: GPS detection or map pin selection
 * 4. Review & Submit: summary preview, validation, and submission
 */
export default function MultiStepReportModal({
  isOpen,
  onClose,
  userLocation,
  mapPinLocation,
  onSuccess,
}) {
  // --- RULES OF HOOKS: All hooks called unconditionally before any early return ---

  // Step state (1-4)
  const [step, setStep] = useState(1);

  // Step 1: Issue Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pothole');

  // Step 2: Evidence (array of base64 data URLs, max 3)
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Step 3: Location { latitude, longitude, source: 'gps'|'map' } | null
  const [reportLocation, setReportLocation] = useState(null);
  const [geoFetching, setGeoFetching] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Step 4: Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validation / step error alert
  const [stepError, setStepError] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const successTimerRef = useRef(null);

  // Reset or pre-populate whenever modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all internal state when closed
      setStep(1);
      setTitle('');
      setDescription('');
      setCategory('Pothole');
      setImages([]);
      setIsDragging(false);
      setReportLocation(null);
      setGeoFetching(false);
      setGeoError(null);
      setSubmitting(false);
      setSubmitError(null);
      setSubmitSuccess(false);
      setStepError(null);

      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
      return;
    }

    // On open: start at step 1 and pre-populate from real GPS only (never dev override)
    setStep(1);
    setSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
    setStepError(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: Escape closes modal if not currently submitting
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

  // Geolocation detector
  const handleDetectLocation = useCallback(() => {
    setGeoError(null);
    setStepError(null);
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
          1: 'Location permission was denied. Allow access in browser settings, or select a map location.',
          2: 'Your location is currently unavailable. Try again or select from the map.',
          3: 'Location request timed out. Please try again or select a map location.',
        };
        setGeoError(msgs[err.code] || err.message || 'Unable to detect your location.');
        setGeoFetching(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  // Map pin selector
  const handleUseMapPin = useCallback(() => {
    if (
      mapPinLocation &&
      typeof mapPinLocation.latitude === 'number' &&
      typeof mapPinLocation.longitude === 'number'
    ) {
      setReportLocation({
        latitude: mapPinLocation.latitude,
        longitude: mapPinLocation.longitude,
        source: 'map',
      });
      setGeoError(null);
      setStepError(null);
    }
  }, [mapPinLocation]);

  // Clear selected location
  const handleClearLocation = useCallback(() => {
    setReportLocation(null);
    setGeoError(null);
  }, []);

  // Process and downscale images via canvas to ensure fast uploads and prevent payload limit errors
  const processImageFile = useCallback((file) => {
    return new Promise((resolve) => {
      if (file.size > 15 * 1024 * 1024) {
        setStepError('File size too large (max 15MB).');
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
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
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } catch {
            resolve(e.target.result);
          }
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  // File processing for Step 2
  const handleFiles = useCallback((fileList) => {
    if (!fileList || !fileList.length) return;

    const imageFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setStepError('Please upload image files only (PNG, JPG, WebP, etc.).');
      return;
    }

    setStepError(null);
    const availableSlots = 3 - images.length;
    if (availableSlots <= 0) {
      setStepError('Maximum 3 images reached. Remove an image to add another.');
      return;
    }

    const filesToRead = imageFiles.slice(0, availableSlots);

    Promise.all(filesToRead.map((file) => processImageFile(file))).then((dataUrls) => {
      const validUrls = dataUrls.filter(Boolean);
      setImages((prev) => [...prev, ...validUrls].slice(0, 3));
    });
  }, [images.length, processImageFile]);

  const handleRemoveImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setStepError(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Validation for step navigation
  const validateStep = useCallback((stepNumber) => {
    if (stepNumber === 1) {
      const trimmedTitle = title.trim();
      const trimmedDesc = description.trim();

      if (!trimmedTitle) {
        setStepError('Please provide a title for the issue.');
        return false;
      }
      if (!category) {
        setStepError('Please select a category.');
        return false;
      }
      if (!trimmedDesc) {
        setStepError('Please provide a description of the issue.');
        return false;
      }
      if (trimmedDesc.length < 20) {
        setStepError(`Description must be at least 20 characters (currently ${trimmedDesc.length}).`);
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      // Evidence is optional
      return true;
    }

    if (stepNumber === 3) {
      if (
        !reportLocation ||
        typeof reportLocation.latitude !== 'number' ||
        typeof reportLocation.longitude !== 'number'
      ) {
        setStepError('Please select a location (via GPS or map pin) before proceeding to review.');
        return false;
      }
      return true;
    }

    return true;
  }, [title, description, category, reportLocation]);

  const handleNext = useCallback(() => {
    if (!validateStep(step)) return;
    setStepError(null);
    setStep((prev) => Math.min(prev + 1, 4));
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    setStepError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSkipEvidence = useCallback(() => {
    setStepError(null);
    setStep(3);
  }, []);

  // Submit report handler (Step 4)
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;

    if (
      !reportLocation ||
      typeof reportLocation.latitude !== 'number' ||
      typeof reportLocation.longitude !== 'number'
    ) {
      setSubmitError('Location is missing. Please go back to Step 3 and select a location.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: {
          type: 'Point',
          coordinates: [reportLocation.longitude, reportLocation.latitude],
        },
        images: images || [],
      };

      const savedReport = await createReport(payload);
      setSubmitSuccess(true);

      successTimerRef.current = setTimeout(() => {
        if (onSuccess) {
          onSuccess(savedReport);
        }
        onClose();
      }, 2000);
    } catch (err) {
      setSubmitError(err.message || 'An error occurred while submitting the report.');
      setSubmitting(false);
    }
  }, [submitting, reportLocation, title, description, category, images, onSuccess, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  };

  // --- EARLY RETURN ONLY AFTER ALL HOOKS ---
  if (!isOpen) return null;

  const hasMapPin = mapPinLocation && typeof mapPinLocation.latitude === 'number';
  const selectedCategoryObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  return (
    <div
      className="msrm-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="msrm-dialog-title"
    >
      <div className="msrm-card">
        {/* Header */}
        <div className="msrm-header">
          <div className="msrm-header-left">
            <div className="msrm-header-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="msrm-header-text">
              <h2 id="msrm-dialog-title" className="msrm-title">Report an Issue</h2>
              <span className="msrm-step-indicator">
                {submitSuccess ? 'Completed' : `Step ${step} of 4 — ${STEPS[step - 1].label}`}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="msrm-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Step Progress Bar (hidden on final success overlay) */}
        {!submitSuccess && (
          <div className="msrm-steps">
            {STEPS.map((s, idx) => {
              const stepNum = s.num;
              const isDone = step > stepNum;
              const isActive = step === stepNum;
              return (
                <Fragment key={stepNum}>
                  {idx > 0 && (
                    <div className={`step-line ${step >= stepNum ? 'step-line--active' : ''}`} />
                  )}
                  <div
                    className={`step-dot ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                    title={`Step ${stepNum}: ${s.label}`}
                  >
                    {isDone ? (
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span>{stepNum}</span>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}

        {/* Success Overlay View */}
        {submitSuccess ? (
          <div className="msrm-success-overlay">
            <div className="msrm-success-icon-wrap">
              <svg className="msrm-success-svg" viewBox="0 0 52 52">
                <circle className="msrm-success-circle" cx="26" cy="26" r="24" fill="none" />
                <path className="msrm-success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h3 className="msrm-success-title">Report Submitted!</h3>
            <p className="msrm-success-desc">
              Your report has been successfully recorded and dispatched to civic services. Thank you for making our city safer.
            </p>
            <div className="msrm-success-status">
              <span className="msrm-spinner" />
              <span>Updating live map in a moment...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Issue Details */}
            {step === 1 && (
              <div className="msrm-step-content" key="step-1">
                <div className="msrm-step-header">
                  <h3 className="msrm-step-title">Describe the Problem</h3>
                  <p className="msrm-step-desc">
                    Provide clear details about the civic issue so responders can locate and address it quickly.
                  </p>
                </div>

                {stepError && (
                  <div className="msrm-error-banner" role="alert">
                    <span className="msrm-error-icon">✕</span>
                    <span>{stepError}</span>
                  </div>
                )}

                <div className="msrm-form-group">
                  <label htmlFor="msrm-title-input" className="msrm-label">
                    <span>Issue Title <span className="msrm-required">*</span></span>
                    <span className="msrm-char-count">{title.length}/120</span>
                  </label>
                  <input
                    id="msrm-title-input"
                    type="text"
                    className="msrm-input"
                    placeholder="e.g., Deep pothole causing tire damage near intersection"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="msrm-form-group">
                  <label className="msrm-label">
                    <span>Category <span className="msrm-required">*</span></span>
                  </label>
                  <div className="msrm-category-grid">
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`cat-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setCategory(cat.id)}
                          disabled={submitting}
                        >
                          <span className="cat-card-icon">{cat.icon}</span>
                          <span className="cat-card-label">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="msrm-form-group">
                  <label htmlFor="msrm-desc-input" className="msrm-label">
                    <span>Description <span className="msrm-required">*</span></span>
                    <span
                      className={`msrm-char-count ${
                        description.trim().length > 0 && description.trim().length < 20
                          ? 'msrm-char-count--warn'
                          : ''
                      }`}
                    >
                      {description.length}/1000 (min 20 chars)
                    </span>
                  </label>
                  <textarea
                    id="msrm-desc-input"
                    className="msrm-textarea"
                    placeholder="Provide specific details about the issue, nearby landmarks, or hazards..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Evidence (Optional Photos) */}
            {step === 2 && (
              <div className="msrm-step-content" key="step-2">
                <div className="msrm-step-header">
                  <h3 className="msrm-step-title">Add Evidence (Optional)</h3>
                  <p className="msrm-step-desc">
                    Photos help civic authorities verify the report and determine priority. You can upload up to 3 images.
                  </p>
                </div>

                {stepError && (
                  <div className="msrm-error-banner" role="alert">
                    <span className="msrm-error-icon">✕</span>
                    <span>{stepError}</span>
                  </div>
                )}

                {/* Drop Zone */}
                <div
                  className={`msrm-drop-zone ${isDragging ? 'dragging' : ''} ${
                    images.length >= 3 ? 'disabled' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (images.length < 3) {
                      fileInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (images.length < 3) fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="msrm-drop-icon">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="msrm-drop-main-text">
                    {images.length >= 3
                      ? 'Maximum 3 images reached'
                      : 'Drop images here or click to browse'}
                  </p>
                  <p className="msrm-drop-subtext">
                    Accepts PNG, JPG, JPEG, WebP (up to 3 images total)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    // Reset input value so same file can be re-selected if removed
                    e.target.value = '';
                  }}
                />

                {/* Thumbnail Preview Grid */}
                {images.length > 0 && (
                  <div>
                    <div className="msrm-preview-header">
                      <span className="msrm-preview-title">Uploaded Evidence</span>
                      <span className="msrm-preview-count">{images.length}/3 images</span>
                    </div>
                    <div className="msrm-preview-grid">
                      {images.map((imgSrc, idx) => (
                        <div key={idx} className="msrm-preview-item">
                          <img
                            src={imgSrc}
                            alt={`Evidence thumbnail ${idx + 1}`}
                            className="msrm-preview-img"
                          />
                          <button
                            type="button"
                            className="msrm-preview-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            title="Remove image"
                            aria-label={`Remove image ${idx + 1}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Location */}
            {step === 3 && (
              <div className="msrm-step-content" key="step-3">
                <div className="msrm-step-header">
                  <h3 className="msrm-step-title">Select Issue Location</h3>
                  <p className="msrm-step-desc">
                    Pinpoint the location of the problem. You can auto-detect your GPS coordinates or use a point selected on the map.
                  </p>
                </div>

                {stepError && (
                  <div className="msrm-error-banner" role="alert">
                    <span className="msrm-error-icon">✕</span>
                    <span>{stepError}</span>
                  </div>
                )}

                {/* Location Badge */}
                {reportLocation ? (
                  <div className="msrm-location-badge msrm-location-badge--set">
                    <span className="msrm-location-source-icon">
                      {reportLocation.source === 'gps' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
                          <path d="M7.76 16.24a6 6 0 0 1 0-8.48" />
                          <circle cx="12" cy="12" r="2" />
                          <path d="M16.24 7.76a6 6 0 0 1 0 8.48" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      )}
                    </span>
                    <div className="msrm-location-badge-details">
                      <span className="msrm-location-source-label">
                        {reportLocation.source === 'gps' ? 'GPS Location Selected' : 'Map Pin Selected'}
                      </span>
                      <span className="msrm-location-coords">
                        {reportLocation.latitude.toFixed(5)}° N, {reportLocation.longitude.toFixed(5)}° E
                      </span>
                    </div>
                    <button
                      type="button"
                      className="msrm-location-clear-btn"
                      onClick={handleClearLocation}
                      disabled={submitting}
                      title="Clear location"
                      aria-label="Clear location"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="msrm-location-badge msrm-location-badge--unset" role="alert">
                    <span className="msrm-error-icon">⚠</span>
                    <span>No location selected — please detect GPS or use a map pin below.</span>
                  </div>
                )}

                {/* Location Action Buttons */}
                <div className="msrm-location-actions">
                  <button
                    type="button"
                    className="btn-detect-location"
                    onClick={handleDetectLocation}
                    disabled={submitting || geoFetching}
                    title="Detect GPS location"
                  >
                    {geoFetching ? (
                      <>
                        <span className="msrm-spinner" />
                        <span>Detecting GPS...</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
                          <path d="M7.76 16.24a6 6 0 0 1 0-8.48" />
                          <circle cx="12" cy="12" r="2" />
                          <path d="M16.24 7.76a6 6 0 0 1 0 8.48" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                        <span>Use My Current Location</span>
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>Use Map Pin</span>
                    </button>
                  )}
                </div>

                {/* Location Hints */}
                {!reportLocation && !hasMapPin && (
                  <p className="msrm-location-hint">
                    💡 Close this dialog, click anywhere on the map to drop a pin, then reopen.
                  </p>
                )}
                {!reportLocation && hasMapPin && (
                  <p className="msrm-location-hint msrm-location-hint--ready">
                    📍 Map pin ready at {mapPinLocation.latitude.toFixed(4)}° N,{' '}
                    {mapPinLocation.longitude.toFixed(4)}° E — click &quot;Use Map Pin&quot; above.
                  </p>
                )}

                {/* Geolocation error */}
                {geoError && (
                  <div className="msrm-error-banner" role="alert">
                    <span className="msrm-error-icon">⚠</span>
                    <span>{geoError}</span>
                  </div>
                )}

                {/* Dev location override notice */}
                {userLocation?.isDevOverride && (
                  <p className="msrm-dev-notice">
                    ⚙ Dev location override is active (map centering only). Use the button above to detect your real GPS location.
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === 4 && (
              <div className="msrm-step-content" key="step-4">
                <div className="msrm-step-header">
                  <h3 className="msrm-step-title">Review & Submit</h3>
                  <p className="msrm-step-desc">
                    Please review your report details before final submission.
                  </p>
                </div>

                {submitError && (
                  <div className="msrm-error-banner" role="alert">
                    <span className="msrm-error-icon">✕</span>
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="msrm-review-card">
                  {/* Title & Category */}
                  <div className="msrm-review-row">
                    <span className="msrm-review-label">Issue & Category</span>
                    <h4 className="msrm-review-title">{title || 'Untitled Issue'}</h4>
                    <div className="msrm-review-chip">
                      <span>{selectedCategoryObj.icon}</span>
                      <span>{category}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="msrm-review-row">
                    <span className="msrm-review-label">Description</span>
                    <p className="msrm-review-desc">{description || 'No description provided.'}</p>
                  </div>

                  {/* Location */}
                  <div className="msrm-review-row">
                    <span className="msrm-review-label">Report Location</span>
                    {reportLocation ? (
                      <div className="msrm-review-location msrm-review-location--valid">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>
                          {reportLocation.latitude.toFixed(5)}° N, {reportLocation.longitude.toFixed(5)}° E{' '}
                          ({reportLocation.source === 'gps' ? 'GPS' : 'Map Pin'})
                        </span>
                      </div>
                    ) : (
                      <div className="msrm-review-location msrm-review-location--invalid" role="alert">
                        <span>⚠ No location chosen. Please go back to Step 3.</span>
                      </div>
                    )}
                  </div>

                  {/* Evidence Images */}
                  <div className="msrm-review-row">
                    <span className="msrm-review-label">
                      Attached Photos ({images.length})
                    </span>
                    {images.length > 0 ? (
                      <div className="msrm-review-images">
                        {images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Review thumbnail ${i + 1}`}
                            className="msrm-review-thumb"
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="msrm-step-desc">No photos attached.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="msrm-footer">
              <div className="msrm-footer-left">
                {step > 1 && (
                  <button
                    type="button"
                    className="btn-msrm-back"
                    onClick={handleBack}
                    disabled={submitting}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back
                  </button>
                )}
              </div>

              <div className="msrm-footer-right">
                {step === 2 && (
                  <button
                    type="button"
                    className="msrm-skip-link"
                    onClick={handleSkipEvidence}
                    disabled={submitting}
                  >
                    Skip for now
                  </button>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    className="btn-msrm-next"
                    onClick={handleNext}
                    disabled={submitting}
                  >
                    <span>{step === 3 ? 'Review Report' : 'Next'}</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-msrm-submit"
                    onClick={handleSubmit}
                    disabled={submitting || !reportLocation}
                    title={!reportLocation ? 'A location must be selected before submitting' : undefined}
                  >
                    {submitting ? (
                      <>
                        <span className="msrm-spinner" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        <span>Submit Report</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
