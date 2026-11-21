import React, { useState, useEffect } from 'react';
import { login, register } from '../../services/authService';
import { getRateLimitStatus } from '../../utils/security';
import './AuthGate.css';

export default function AuthGate({ onLoginSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lockoutSec, setLockoutSec] = useState(0);

  // Monitor lockout countdown
  useEffect(() => {
    const status = getRateLimitStatus();
    if (!status.allowed) {
      setLockoutSec(status.lockoutRemainingSec);
    }
  }, []);

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

    if (lockoutSec > 0) {
      setError(`Security lockout active. Try again in ${Math.ceil(lockoutSec / 60)} minutes.`);
      return;
    }

    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await login({ email, password });
        setSuccess(`Welcome back, ${res.user?.name || 'Citizen'}! Unlocking console...`);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(res.user);
          }
        }, 500);
      } else {
        const res = await register({ name, email, password, phone });
        setSuccess(`Account registered! Unlocking console...`);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(res.user);
          }
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      const status = getRateLimitStatus();
      if (!status.allowed) {
        setLockoutSec(status.lockoutRemainingSec);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="up-authgate-overlay" role="dialog" aria-modal="true" aria-labelledby="authgate-title">
      <div className="up-authgate-container">
        {/* Header */}
        <div className="up-authgate-header">
          <div className="up-authgate-badge">
            <span className="up-authgate-pulse"></span>
            Restricted Operations Console
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="up-gate-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7838F5" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
              <rect x="3" y="14" width="5" height="15" rx="1" fill="url(#up-gate-grad)" fillOpacity="0.8" />
              <rect x="10" y="6" width="6" height="23" rx="1.5" fill="url(#up-gate-grad)" />
              <rect x="18" y="11" width="5" height="18" rx="1" fill="url(#up-gate-grad)" fillOpacity="0.85" />
              <rect x="25" y="16" width="4" height="13" rx="1" fill="url(#up-gate-grad)" fillOpacity="0.7" />
              <circle cx="13" cy="10" r="1.2" fill="#FFFFFF" />
              <circle cx="13" cy="14" r="1.2" fill="#FFFFFF" />
              <circle cx="20.5" cy="15" r="1.2" fill="#FFFFFF" />
            </svg>
          </div>

          <h1 id="authgate-title" className="up-authgate-title">UrbanPulse Console</h1>
          <p className="up-authgate-sub">
            Please verify your credentials to access municipal geospatial intelligence, incident response, and civic reporting.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="up-authgate-tabs">
          <button
            type="button"
            className={`up-authgate-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login');
              setError('');
              setSuccess('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`up-authgate-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setTab('register');
              setError('');
              setSuccess('');
            }}
          >
            Register Account
          </button>
        </div>

        {/* Alerts */}
        {lockoutSec > 0 && (
          <div className="up-authgate-alert up-authgate-alert--error">
            Security Throttling: Locked for {Math.floor(lockoutSec / 60)}m {lockoutSec % 60}s.
          </div>
        )}

        {error && (
          <div className="up-authgate-alert up-authgate-alert--error">
            {error}
          </div>
        )}

        {success && (
          <div className="up-authgate-alert up-authgate-alert--success">
            {success}
          </div>
        )}

        {/* Form */}
        <form className="up-authgate-form" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="up-authgate-field">
              <label className="up-authgate-label" htmlFor="gate-name">Full Name</label>
              <input
                id="gate-name"
                type="text"
                className="up-authgate-input"
                placeholder="e.g. Ramesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading || lockoutSec > 0}
              />
            </div>
          )}

          <div className="up-authgate-field">
            <label className="up-authgate-label" htmlFor="gate-email">Email Address</label>
            <input
              id="gate-email"
              type="email"
              className="up-authgate-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || lockoutSec > 0}
            />
          </div>

          <div className="up-authgate-field">
            <label className="up-authgate-label" htmlFor="gate-password">
              <span>Password</span>
              {tab === 'register' && <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Min 8 chars</span>}
            </label>
            <div className="up-authgate-input-wrap">
              <input
                id="gate-password"
                type={showPassword ? 'text' : 'password'}
                className="up-authgate-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || lockoutSec > 0}
              />
              <button
                type="button"
                className="up-authgate-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div className="up-authgate-field">
              <label className="up-authgate-label" htmlFor="gate-phone">Phone (Optional)</label>
              <input
                id="gate-phone"
                type="tel"
                className="up-authgate-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading || lockoutSec > 0}
              />
            </div>
          )}

          <button
            type="submit"
            className="up-authgate-submit"
            disabled={loading || lockoutSec > 0}
          >
            {loading ? (
              'Verifying Credentials...'
            ) : tab === 'login' ? (
              'Authorize & Enter Console ➔'
            ) : (
              'Create Account & Enter Console ➔'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
