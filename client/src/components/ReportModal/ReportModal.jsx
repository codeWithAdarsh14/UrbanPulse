import { useState } from 'react';
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
 * Allows users to report a civic issue at their current/active map location.
 */
export default function ReportModal({ isOpen, onClose, userLocation, onSuccess }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

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

    if (!userLocation || typeof userLocation.longitude !== 'number' || typeof userLocation.latitude !== 'number') {
      setErrorMessage('Location coordinates are not available yet. Please wait for location to resolve or retry.');
      return;
    }

    setSubmitting(true);

    try {
      // Format GeoJSON coordinates [longitude, latitude]
      const payload = {
        title: trimmedTitle,
        description: trimmedDescription,
        category,
        location: {
          type: 'Point',
          coordinates: [userLocation.longitude, userLocation.latitude],
        },
      };

      const savedReport = await createReport(payload);

      // Reset form
      setTitle('');
      setCategory('Pothole');
      setDescription('');
      setErrorMessage(null);

      // Trigger success callback
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

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">⚠</span>
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

        {/* Location Context Badge */}
        <div className="modal-location-badge">
          <div className="location-badge-icon">📍</div>
          <div className="location-badge-text">
            {userLocation ? (
              <>
                <span>Location: </span>
                <strong>
                  {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
                </strong>
                {userLocation.isDevOverride && (
                  <span className="location-dev-tag">Dev Location</span>
                )}
              </>
            ) : (
              <span className="location-warning">Location pending. Acquiring coordinates...</span>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="modal-error-banner" role="alert">
            <span className="error-icon">✕</span>
            <span>{errorMessage}</span>
          </div>
        )}

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
              disabled={submitting || !userLocation}
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
