import React, { useState, useEffect } from 'react';
import './SettingsModal.css';

/**
 * SettingsModal Component — Citizen Profile, Location, & Notification Controls
 * Manages citizen display name, street address, 6-digit postal pincode,
 * and event alert preferences.
 */
export default function SettingsModal({ isOpen, onClose, user, onUpdateUser, onLogout }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('Civil Lines, Mathura');
  const [pincode, setPincode] = useState('281001');
  const [alertNearbyEvents, setAlertNearbyEvents] = useState(true);
  const [alertCivic, setAlertCivic] = useState(true);
  const [alertUpdates, setAlertUpdates] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync state with current user
  useEffect(() => {
    if (user) {
      setName(user.name || 'Urban Citizen');
      setEmail(user.email || 'citizen@urbanpulse.org');
      setPhone(user.phone || '');
      if (user.address) setAddress(user.address);
      if (user.pincode) setPincode(user.pincode);
      if (user.preferences?.alertNearbyEvents !== undefined) {
        setAlertNearbyEvents(user.preferences.alertNearbyEvents);
      }
      if (user.preferences?.alertCivic !== undefined) {
        setAlertCivic(user.preferences.alertCivic);
      }
      if (user.preferences?.alertUpdates !== undefined) {
        setAlertUpdates(user.preferences.alertUpdates);
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    if (pincode && pincode.trim().length !== 6) {
      setError('Pincode must be exactly 6 digits (e.g. 281001).');
      return;
    }

    const updatedUser = {
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      pincode: pincode.trim(),
      preferences: {
        alertNearbyEvents,
        alertCivic,
        alertUpdates,
      },
    };

    // Save to local storage
    try {
      localStorage.setItem('up_auth_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to save user in storage:', err);
    }

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setSuccess('Profile and settings updated successfully!');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleLogoutClick = () => {
    if (window.confirm('Are you sure you want to log out of UrbanPulse?')) {
      try {
        localStorage.removeItem('up_auth_token');
        localStorage.removeItem('up_auth_user');
      } catch (e) {}

      if (onLogout) {
        onLogout();
      } else {
        window.location.href = 'http://localhost:5174';
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
            {/* Live User Card */}
            <div className="up-settings-user-preview">
              <div className="up-settings-avatar-big">{initial}</div>
              <div className="up-settings-user-info">
                <h4>{name || 'Citizen'}</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="up-settings-user-badge">
                    ● {user?.role ? user.role.toUpperCase() : 'CITIZEN'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                    {email}
                  </span>
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
                  Full Display Name
                </label>
                <input
                  id="settings-name"
                  type="text"
                  className="up-settings-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
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
                />
              </div>

              <div className="up-settings-group">
                <label className="up-settings-label" htmlFor="settings-phone">
                  Phone Number (Optional)
                </label>
                <input
                  id="settings-phone"
                  type="tel"
                  className="up-settings-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Location & Address */}
            <div>
              <div className="up-settings-section-title">
                Location & Address
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
                  placeholder="e.g. 14, Civil Lines, Mathura"
                  required
                />
              </div>

              <div className="up-settings-group">
                <label className="up-settings-label" htmlFor="settings-pincode">
                  Pincode / Postal Code (6 Digits)
                </label>
                <input
                  id="settings-pincode"
                  type="text"
                  maxLength="6"
                  className="up-settings-input"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 281001"
                  required
                />
                <span style={{ fontSize: '0.74rem', color: '#22D3EE', marginTop: '4px', display: 'block' }}>
                  Used to alert you about new community events and emergencies in your locality.
                </span>
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
              >
                Cancel
              </button>
              <button
                type="submit"
                className="up-btn-save"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
