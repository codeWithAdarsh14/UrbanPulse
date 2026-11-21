import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRateLimitStatus } from '../../utils/security';
import { DASHBOARD_URL } from '../../config/constants';
import Modal from '../Common/Modal';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister, onLoginSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lockoutSec, setLockoutSec] = useState(0);

  // Check rate limit on open
  useEffect(() => {
    if (isOpen) {
      const status = getRateLimitStatus();
      if (!status.allowed) {
        setLockoutSec(status.lockoutRemainingSec);
      }
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  // Lockout countdown
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const rateLimit = getRateLimitStatus();
    if (!rateLimit.allowed) {
      setLockoutSec(rateLimit.lockoutRemainingSec);
      setError(`Too many failed attempts. Locked for security. Try again in ${Math.ceil(rateLimit.lockoutRemainingSec / 60)}m.`);
      return;
    }

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await login({ email, password });
      setSuccess(`Authenticated as ${result.user?.name || 'Citizen'}! Redirecting to Dashboard...`);
      setTimeout(() => {
        onClose();
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        } else {
          window.location.href = '/app';
        }
      }, 600);
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
      const updatedStatus = getRateLimitStatus();
      if (!updatedStatus.allowed) {
        setLockoutSec(updatedStatus.lockoutRemainingSec);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign In to UrbanPulse">
      <div style={{ padding: '4px 0' }}>
        <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '18px' }}>
          Access your civic issues, real-time SLA trackers, and neighborhood operations.
        </p>

        {lockoutSec > 0 && (
          <div style={{
            background: 'var(--up-warning-soft)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#FCD34D',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.84rem'
          }}>
            Security Throttling: Locked for {Math.floor(lockoutSec / 60)}m {lockoutSec % 60}s.
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--up-error-soft)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FCA5A5',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.84rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'var(--up-success-soft)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6EE7B7',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span className="up-pulse-dot up-pulse-dot--green"></span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#E2E8F0', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              className="up-input"
              style={{ paddingLeft: '14px' }}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || lockoutSec > 0}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#E2E8F0', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="up-input"
                style={{ paddingLeft: '14px', paddingRight: '40px' }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || lockoutSec > 0}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="up-btn up-btn--primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
            disabled={loading || lockoutSec > 0}
          >
            {loading ? 'Authenticating & Redirecting...' : 'Sign In & Open Dashboard ➔'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.84rem', color: '#94A3B8' }}>
          Don't have an account?{' '}
          <button
            type="button"
            style={{ color: '#22D3EE', fontWeight: '600', cursor: 'pointer' }}
            onClick={() => {
              onClose();
              if (onSwitchToRegister) onSwitchToRegister();
            }}
          >
            Register here
          </button>
        </div>
      </div>
    </Modal>
  );
}
