import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRateLimitStatus } from '../../utils/security';
import { DASHBOARD_URL } from '../../config/constants';
import Modal from '../../components/Common/Modal';
import './LoginPage.css';

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lockoutSec, setLockoutSec] = useState(0);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Check rate limit on mount
  useEffect(() => {
    const status = getRateLimitStatus();
    if (!status.allowed) {
      setLockoutSec(status.lockoutRemainingSec);
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSec <= 0) return;
    const interval = setInterval(() => {
      setLockoutSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSec]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check rate limit before sending
    const rateLimit = getRateLimitStatus();
    if (!rateLimit.allowed) {
      setLockoutSec(rateLimit.lockoutRemainingSec);
      setError(`Maximum failed attempts exceeded. Locked for security. Try again later.`);
      return;
    }

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);

    try {
      const result = await login({ email, password });
      setSuccess(`Welcome back, ${result.user?.name || 'Citizen'}! Authenticated successfully. Redirecting to Dashboard...`);
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('app');
        } else {
          window.location.href = '/app';
        }
      }, 600);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
      const updatedStatus = getRateLimitStatus();
      if (!updatedStatus.allowed) {
        setLockoutSec(updatedStatus.lockoutRemainingSec);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="up-auth-page">
      <div className="up-auth-card">
        {/* Header */}
        <div className="up-auth-header">
          <div className="up-auth-logo-wrap" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect x="3" y="14" width="5" height="15" rx="1" fill="#C62852" />
              <rect x="10" y="6" width="6" height="23" rx="1.5" fill="#F7A6B7" />
              <rect x="18" y="11" width="5" height="18" rx="1" fill="#C62852" />
            </svg>
          </div>
          <h2 className="up-auth-title">Welcome Back</h2>
          <p className="up-auth-sub">Sign in to your UrbanPulse citizen portal</p>
        </div>

        {/* Lockout Warning */}
        {lockoutSec > 0 && (
          <div className="up-auth-alert up-auth-alert--warning" style={{ marginBottom: '20px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <strong>Security Throttling Active:</strong>
              <div>Too many failed attempts. Login locked for {Math.floor(lockoutSec / 60)}m {lockoutSec % 60}s.</div>
            </div>
          </div>
        )}

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
          {/* Email */}
          <div className="up-form-group">
            <label className="up-form-label" htmlFor="login-email">
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
                id="login-email"
                type="email"
                className="up-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || lockoutSec > 0}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="up-form-group">
            <label className="up-form-label" htmlFor="login-password">
              <span>Password</span>
            </label>
            <div className="up-input-wrap">
              <span className="up-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="up-input up-input--with-toggle"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || lockoutSec > 0}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="up-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          </div>

          {/* Options: Remember me & Forgot Password */}
          <div className="up-form-options">
            <label className="up-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="up-forgot-link"
              onClick={() => setIsForgotModalOpen(true)}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="up-btn up-btn--primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
            disabled={loading || lockoutSec > 0}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="up-pulse-dot" style={{ width: '10px', height: '10px' }}></span>
                Verifying Credentials...
              </span>
            ) : (
              'Sign In to UrbanPulse'
            )}
          </button>
        </form>

        {/* Register Footer */}
        <div className="up-auth-footer-link">
          Don't have an account yet?
          <button type="button" onClick={() => onNavigate('register')}>
            Register here
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Password Recovery"
      >
        <p style={{ marginBottom: '14px' }}>
          For security and account integrity, password resets require municipal identity verification.
        </p>
        <p style={{ marginBottom: '14px' }}>
          Please contact the <strong>Mathura Urban Civic Cell Administration</strong> at <code style={{ color: 'var(--up-accent)' }}>admin@urbanpulse.org</code> or visit your local Ward municipal office with government photo ID to reset your credentials.
        </p>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <button
            type="button"
            className="up-btn up-btn--secondary"
            onClick={() => setIsForgotModalOpen(false)}
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
