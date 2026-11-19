/**
 * Authentication Service
 * Communicates with backend authentication endpoints when available.
 * Implements token storage, session management, and rate-limiting safeguards.
 */
import { request } from './api';
import {
  getRateLimitStatus,
  recordFailedAttempt,
  resetRateLimit,
  validateEmail,
} from '../utils/security';

const TOKEN_KEY = 'up_auth_token';
const USER_KEY = 'up_auth_user';
const LOCAL_USERS_KEY = 'up_local_registered_users';

export async function login({ email, password }) {
  // 1. Verify Rate Limiter
  const rateLimit = getRateLimitStatus();
  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.lockoutRemainingSec / 60);
    throw new Error(
      `Too many failed login attempts. Account temporarily locked for security. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
    );
  }

  // 2. Validate input formats
  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    recordFailedAttempt();
    throw new Error('Invalid email or password.');
  }

  // 3. Attempt Backend /api/auth/login
  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    // Successful backend authentication
    resetRateLimit();
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
    }
    if (res.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return { success: true, user: res.user, token: res.token, mode: 'backend' };
  } catch (err) {
    // If backend returns a genuine auth error (401, 400, 429)
    if (err.status === 401 || err.status === 400) {
      recordFailedAttempt();
      // Generic invalid credential message to avoid account enumeration
      throw new Error('Invalid email or password.');
    }
    if (err.status === 429) {
      throw new Error('Too many requests. Please wait before trying again.');
    }

    // If backend returns 404 (endpoint not mounted yet on server):
    // Provide a secure client-side demo account or verify with local registered users
    if (err.status === 404) {
      console.warn('Backend /api/auth/login endpoint returned 404. Checking local demo store.');

      // Check registered users in local storage
      const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
      const normalizedEmail = email.trim().toLowerCase();
      const match = localUsers.find((u) => u.email === normalizedEmail);

      if (match && match.password === password) {
        resetRateLimit();
        const authenticatedUser = {
          id: match.id || 'usr_demo_1',
          name: match.name || 'Citizen User',
          email: match.email,
          role: match.role || 'citizen',
        };
        const token = `up_sim_jwt_${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
        return { success: true, user: authenticatedUser, token, mode: 'client_simulation' };
      }

      // Built-in verified demo user for immediate testing
      if (normalizedEmail === 'citizen@urbanpulse.org' && password === 'UrbanPulse2026!') {
        resetRateLimit();
        const demoUser = {
          id: 'usr_demo_verified',
          name: 'Mathura Citizen',
          email: 'citizen@urbanpulse.org',
          role: 'citizen',
        };
        const token = `up_sim_jwt_${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
        return { success: true, user: demoUser, token, mode: 'client_simulation' };
      }

      recordFailedAttempt();
      throw new Error('Invalid email or password.');
    }

    // Other unexpected network errors
    throw err;
  }
}

export async function register({ name, email, password, role = 'citizen' }) {
  if (!name || name.trim().length < 2) {
    throw new Error('Please enter your full name (minimum 2 characters).');
  }
  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Attempt Backend /api/auth/register
  try {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
      }),
    });

    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
    }
    if (res.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return { success: true, user: res.user, token: res.token, mode: 'backend' };
  } catch (err) {
    if (err.status === 409 || err.status === 400) {
      throw new Error(err.message || 'An account with this email address already exists.');
    }
    if (err.status === 429) {
      throw new Error('Too many registration attempts. Please try again later.');
    }

    // If backend returns 404 (endpoint not mounted yet):
    if (err.status === 404) {
      console.warn('Backend /api/auth/register endpoint returned 404. Registering in local store.');
      const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
      if (localUsers.some((u) => u.email === normalizedEmail)) {
        throw new Error('An account with this email address already exists.');
      }

      const newUser = {
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        password, // In real backend, this will be hashed with bcrypt
        role,
        createdAt: new Date().toISOString(),
      };

      localUsers.push(newUser);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));

      const safeUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
      const token = `up_sim_jwt_${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));

      return { success: true, user: safeUser, token, mode: 'client_simulation' };
    }

    throw err;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getAuthToken() && !!getCurrentUser();
}
