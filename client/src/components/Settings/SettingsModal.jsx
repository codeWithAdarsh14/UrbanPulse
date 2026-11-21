import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../services/authService';
import './SettingsModal.css';

/**
 * SettingsModal Component — Citizen Profile & Preferences
 * Real MongoDB-backed user profile view & edit modal.
 */
export default function SettingsModal({ isOpen, onClose, user, onUpdateUser, onLogout }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [alertNearbyEvents, setAlertNearbyEvents] = useState(true);
  const [alertCivic, setAlertCivic] = useState(true);
  const [alertUpdates, setAlertUpdates] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch real user data from MongoDB Atlas on modal open
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setSuccess('');

    // Pre-populate with current local user if available
    if (user) {
      populateFields(user);
    }

    // Then fetch fresh data from MongoDB
    let isMounted = true;
    setLoadingProfile(true);

    getProfile()
      .then((freshUser) => {
        if (isMounted && freshUser) {
          populateFields(freshUser);
        }
      })
      .catch((err) => {
        // Fall back to passed user prop if network blip
        if (isMounted && user) {
          populateFields(user);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  const populateFields = (userData) => {
    setName(userData.name || '');
    setEmail(userData.email || 'Not provided');
    setPhone(userData.phone || '');
    setAvatar(userData.avatar || '');
    setAddress(userData.address || '');
    setCity(userData.city || '');
    setState(userData.state || '');
    setPincode(userData.pincode || '');
    setCountry(userData.country || 'India');

    if (userData.preferences) {
      if (userData.preferences.alertNearbyEvents !== undefined) {
        setAlertNearbyEvents(userData.preferences.alertNearbyEvents);
      }
      if (userData.preferences.alertCivic !== undefined) {
        setAlertCivic(userData.preferences.alertCivic);
      }
      if (userData.preferences.alertUpdates !== undefined) {
        setAlertUpdates(userData.preferences.alertUpdates);
      }
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Display name must be at least 2 characters long.');
      return;
    }

    if (pincode && pincode.trim().length !== 6) {
      setError('Postal PIN code must be exactly 6 digits (e.g. 281001).');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country.trim() || 'India',
        preferences: {
          alertNearbyEvents,
          alertCivic,
          alertUpdates,
        },
      };

      // Real MongoDB update via PUT /api/users/profile
      const updatedUser = await updateProfile(payload);

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setSuccess('Profile updated and saved to MongoDB successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save profile changes to MongoDB.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutClick = () => {
    if (window.confirm('Are you sure you want to log out of UrbanPulse?')) {
      if (onLogout) {
        onLogout();
      }
    }
  };

  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="up-settings-backdrop" onClick={onClose}>
      <div className="up-settings-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="up-settings-header">
          <div className="up-settings-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Citizen Profile & Preferences</span>
          </div>
          <button type="button" className="up-settings-close-btn" onClick={onClose} aria-label="Close settings">
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave}>
          <div className="up-settings-body">
            {/* Live User Preview Card */}
            <div className="up-settings-user-preview">
              <div className="up-settings-avatar-big">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name || 'Avatar'}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="up-settings-user-info">
                <h4>{name || 'Citizen'}</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="up-settings-user-badge">
                    ● {user?.role ? user.role.toUpperCase() : 'CITIZEN'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    {email}
                  </span>
                  {loadingProfile && (
                    <span style={{ fontSize: '0.74rem', color: '#22D3EE' }}>
                      (Refreshing from MongoDB...)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#6EE7B7',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                {success}
              </div>
            )}

            {/* Profile Info */}
            <div>
              <div className="up-settings-section-title">
                Personal Information
              </div>

              <div className="up-settings-group">
                <label className="up-settings-label" htmlFor="settings-name">
                  Full Name
                </label>
                <input
                  id="settings-name"
                  type="text"
                  className="up-settings-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="up-settings-group">
                <label className="up-settings-label" htmlFor="settings-email">
                  Registered Email Address (Locked)
                </label>
                <input
                  id="settings-email"
                  type="email"
                  className="up-settings-input"
                  value={email}
                  disabled
                  title="Email is protected and cannot be modified here."
                />
              </div>

              <div className="up-settings-group">
                <label className="up-settings-label" htmlFor="settings-phone">
                  Phone Number
                </label>
                <input
                  id="settings-phone"
                  type="tel"
                  className="up-settings-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210 (Not provided)"
                />
              </div>

              <div className="up-settings-group">
                <label className="up-settings-label" htmlFor="settings-avatar">
                  Profile Image URL (Optional)
                </label>
                <input
                  id="settings-avatar"
                  type="url"
                  className="up-settings-input"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/photo.jpg (Not provided)"
                />
              </div>
            </div>

            {/* Location & Address */}
            <div>
              <div className="up-settings-section-title">
                Location & Residential Address
              </div>

              <div className="up-settings-group">
                <label className="up-settings-label" htmlFor="settings-address">
                  Street Address / Locality
                </label>
                <input
                  id="settings-address"
                  type="text"
                  className="up-settings-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House No. 42, Civil Lines (Not provided)"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="up-settings-group">
                  <label className="up-settings-label" htmlFor="settings-city">
                    City
                  </label>
                  <input
                    id="settings-city"
                    type="text"
                    className="up-settings-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mathura"
                  />
                </div>

                <div className="up-settings-group">
                  <label className="up-settings-label" htmlFor="settings-state">
                    State
                  </label>
                  <input
                    id="settings-state"
                    type="text"
                    className="up-settings-input"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Uttar Pradesh"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="up-settings-group">
                  <label className="up-settings-label" htmlFor="settings-pincode">
                    PIN / Postal Code (6 Digits)
                  </label>
                  <input
                    id="settings-pincode"
                    type="text"
                    maxLength="6"
                    className="up-settings-input"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 281001"
                  />
                </div>

                <div className="up-settings-group">
                  <label className="up-settings-label" htmlFor="settings-country">
                    Country
                  </label>
                  <input
                    id="settings-country"
                    type="text"
                    className="up-settings-input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India"
                  />
                </div>
              </div>
            </div>

            {/* Civic & Event Notifications */}
            <div>
              <div className="up-settings-section-title">
                Notification Preferences
              </div>

              <div className="up-settings-toggle-row">
                <div className="up-toggle-desc">
                  <span className="up-toggle-title">Nearby Event Notifications</span>
                  <span className="up-toggle-sub">Get notified when new community events or townhalls are scheduled near your address & pincode</span>
                </div>
                <label className="up-switch">
                  <input
                    type="checkbox"
                    checked={alertNearbyEvents}
                    onChange={(e) => setAlertNearbyEvents(e.target.checked)}
                  />
                  <span className="up-slider"></span>
                </label>
              </div>

              <div className="up-settings-toggle-row">
                <div className="up-toggle-desc">
                  <span className="up-toggle-title">Critical Civic Alerts</span>
                  <span className="up-toggle-sub">Instant push notifications for water breaks and road hazards</span>
                </div>
                <label className="up-switch">
                  <input
                    type="checkbox"
                    checked={alertCivic}
                    onChange={(e) => setAlertCivic(e.target.checked)}
                  />
                  <span className="up-slider"></span>
                </label>
              </div>

              <div className="up-settings-toggle-row">
                <div className="up-toggle-desc">
                  <span className="up-toggle-title">Weekly Civic Digest</span>
                  <span className="up-toggle-sub">Summary of resolved municipal reports in your area</span>
                </div>
                <label className="up-switch">
                  <input
                    type="checkbox"
                    checked={alertUpdates}
                    onChange={(e) => setAlertUpdates(e.target.checked)}
                  />
                  <span className="up-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="up-settings-footer">
            <button
              type="button"
              className="up-btn-logout"
              onClick={handleLogoutClick}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="up-btn-cancel"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="up-btn-save"
                disabled={isSaving}
              >
                {isSaving ? 'Saving to Database...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
