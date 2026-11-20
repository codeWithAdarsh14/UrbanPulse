import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, assessPasswordStrength } from '../../utils/security';
import { DASHBOARD_URL } from '../../config/constants';
import Modal from '../../components/Common/Modal';
import '../LoginPage/LoginPage.css';

export default function RegisterPage({ onNavigate }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Evaluate password strength
  const strength = assessPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Field Validations
    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide your full legal name (minimum 2 characters).');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please provide a valid, well-formed email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the Civic Terms and Conditions to register.');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: 'citizen',
      });

      setSuccess(`Account created successfully for ${result.user?.name || name}! Redirecting to Dashboard...`);
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('app');
        } else {
          window.location.href = '/app';
        }
      }, 600);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="up-auth-page">
      <div className="up-auth-card" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="up-auth-header">
          <div className="up-auth-logo-wrap" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect x="3" y="14" width="5" height="15" rx="1" fill="#7C3AED" />
              <rect x="10" y="6" width="6" height="23" rx="1.5" fill="#A855F7" />
              <rect x="18" y="11" width="5" height="18" rx="1" fill="#22D3EE" />
            </svg>
          </div>
          <h2 className="up-auth-title">Create Citizen Account</h2>
          <p className="up-auth-sub">Join your local municipal civic intelligence network</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="up-auth-alert up-auth-alert--error" style={{ marginBottom: '20px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="up-auth-alert up-auth-alert--success" style={{ marginBottom: '20px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form className="up-auth-form" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="up-form-group">
            <label className="up-form-label" htmlFor="reg-name">
              Full Name
            </label>
            <div className="up-input-wrap">
              <span className="up-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="reg-name"
                type="text"
                className="up-input"
                placeholder="e.g. Ramesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="up-form-group">
            <label className="up-form-label" htmlFor="reg-email">
              Email Address
            </label>
            <div className="up-input-wrap">
              <span className="up-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="reg-email"
                type="email"
                className="up-input"
                placeholder="ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="up-form-group">
            <label className="up-form-label" htmlFor="reg-password">
              <span>Password</span>
              {password && (
                <span style={{ fontSize: '0.78rem', color: strength.color, fontWeight: '700' }}>
                  {strength.label}
                </span>
              )}
            </label>
            <div className="up-input-wrap">
              <span className="up-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="up-input up-input--with-toggle"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="up-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(strength.score / 5) * 100}%`,
                      background: strength.color,
                      transition: 'all 0.3s ease',
                    }}
                  ></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.72rem', color: '#94A3B8' }}>
                  <span style={{ color: strength.rules.length ? '#10B981' : '#64748B' }}>8+ chars</span>
                  <span style={{ color: strength.rules.upper ? '#10B981' : '#64748B' }}>Uppercase</span>
                  <span style={{ color: strength.rules.lower ? '#10B981' : '#64748B' }}>Lowercase</span>
                  <span style={{ color: strength.rules.number ? '#10B981' : '#64748B' }}>Number</span>
                  <span style={{ color: strength.rules.special ? '#10B981' : '#64748B' }}>Symbol</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="up-form-group">
            <label className="up-form-label" htmlFor="reg-confirm-password">
              Confirm Password
            </label>
            <div className="up-input-wrap">
              <span className="up-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="reg-confirm-password"
                type="password"
                className="up-input"
                placeholder="Re-type password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="up-form-options">
            <label className="up-checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
              />
              <span>
                I agree to the{' '}
                <button
                  type="button"
                  className="up-forgot-link"
                  onClick={() => setIsTermsModalOpen(true)}
                >
                  Terms & Conditions
                </button>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="up-btn up-btn--primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="up-pulse-dot" style={{ width: '10px', height: '10px' }}></span>
                Registering Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Footer */}
        <div className="up-auth-footer-link">
          Already have an account?
          <button type="button" onClick={() => onNavigate('login')}>
            Sign In here
          </button>
        </div>
      </div>

      {/* Terms Modal */}
      <Modal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        title="Civic Portal Terms of Use"
      >
        <p style={{ marginBottom: '12px' }}>
          By registering on UrbanPulse, you confirm that you are a resident or authorized civic reporter.
        </p>
        <p style={{ marginBottom: '12px' }}>
          Submitted civic grievance reports are shared with municipal maintenance divisions to initiate repair workflows.
        </p>
        <p>
          False reporting, spamming emergency coordinates, or abusive commentary is strictly prohibited under municipal code.
        </p>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <button
            type="button"
            className="up-btn up-btn--primary"
            onClick={() => {
              setAcceptTerms(true);
              setIsTermsModalOpen(false);
            }}
          >
            Accept & Continue
          </button>
        </div>
      </Modal>
    </div>
  );
}
