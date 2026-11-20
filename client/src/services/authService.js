/**
 * Client Authentication Service for UrbanPulse
 * Handles token storage, session management, URL token extraction from Portal (:5174),
 * and communication with /api/auth endpoints.
 */
import {
  getRateLimitStatus,
  recordFailedAttempt,
  resetRateLimit,
  validateEmail,
} from '../utils/security';

export const TOKEN_KEY = 'up_auth_token';
export const USER_KEY = 'up_auth_user';
export const LOCAL_USERS_KEY = 'up_local_registered_users';

/**
 * Checks for query parameters passed from Portal (port 5174):
 * e.g. ?auth_token=...&user=...
 * If present, saves them to localStorage and removes them from the URL cleanly.
 */
export function handleUrlAuthTokens() {
  if (typeof window === 'undefined') return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('auth_token');
    const userParam = urlParams.get('user');

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);

      let parsedUser = null;
      if (userParam) {
        try {
          parsedUser = JSON.parse(decodeURIComponent(userParam));
          localStorage.setItem(USER_KEY, JSON.stringify(parsedUser));
        } catch (e) {
          console.warn('Failed to parse user param:', e);
        }
      }

      // Clean query params from the browser address bar without reload
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      return {
        token,
        user: parsedUser || getCurrentUser(),
      };
    }
  } catch (err) {
    console.error('Error handling URL auth tokens:', err);
  }

  return null;
}

/**
 * Log in with email and password
 */
export async function login({ email, password }) {
  const rateLimit = getRateLimitStatus();
  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.lockoutRemainingSec / 60);
    throw new Error(
      `Too many failed login attempts. Account temporarily locked for security. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
    );
  }

  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password || password.length < 6) {
    recordFailedAttempt();
    throw new Error('Password must be at least 6 characters.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      recordFailedAttempt();
      throw new Error(data.message || 'Invalid email or password.');
    }

    resetRateLimit();

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return { success: true, user: data.user, token: data.token };
  } catch (err) {
    // Fallback simulation for verified demo account or local accounts if backend is unreachable
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
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
        return { success: true, user: demoUser, token };
      }

      const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
      const match = localUsers.find((u) => u.email === normalizedEmail);
      if (match && match.password === password) {
        resetRateLimit();
        const authUser = {
          id: match.id || 'usr_local',
          name: match.name,
          email: match.email,
          role: match.role || 'citizen',
        };
        const token = `up_sim_jwt_${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        return { success: true, user: authUser, token };
      }
    }

    throw err;
  }
}

/**
 * Register a new citizen account
 */
export async function register({ name, email, password, role = 'citizen', phone = '' }) {
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

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
        phone: phone.trim() || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed. Please check your details.');
    }

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return { success: true, user: data.user, token: data.token };
  } catch (err) {
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
      if (localUsers.some((u) => u.email === normalizedEmail)) {
        throw new Error('An account with this email address already exists.');
      }
      const newUser = {
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
        phone: phone.trim() || null,
        createdAt: new Date().toISOString(),
      };
      localUsers.push(newUser);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));

      const safeUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
      const token = `up_sim_jwt_${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
      return { success: true, user: safeUser, token };
    }

    throw err;
  }
}

/**
 * Verify current session against backend
 */
export async function verifySession() {
  const token = getAuthToken();
  if (!token) return false;

  // If simulation token, consider valid
  if (token.startsWith('up_sim_jwt_')) {
    return !!getCurrentUser();
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      logout();
      return false;
    }

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
      return true;
    }

    return true; // Keep local state on non-auth server errors
  } catch (err) {
    // Network offline; keep local token
    return true;
  }
}

/**
 * Remove credentials and end session
 */
export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Logout error:', e);
  }
}

/**
 * Get current stored user
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get current stored token
 */
export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Check if session credentials exist
 */
export function isAuthenticated() {
  return !!getAuthToken() && !!getCurrentUser();
}
