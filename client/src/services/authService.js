/**
 * Client Authentication Service for UrbanPulse
 * Production authentication and user profile management connected to MongoDB Atlas.
 */
import {
  getRateLimitStatus,
  recordFailedAttempt,
  resetRateLimit,
  validateEmail,
} from '../utils/security';

export const TOKEN_KEY = 'up_auth_token';
export const USER_KEY = 'up_auth_user';

/**
 * Checks for query parameters passed from external sources:
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
 * Log in with email and password against MongoDB Atlas
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
}

/**
 * Register a new citizen account directly in MongoDB Atlas
 */
export async function register({
  name,
  email,
  password,
  role = 'citizen',
  phone = '',
  address = '',
  city = '',
  state = '',
  pincode = '',
  country = 'India',
  avatar = '',
}) {
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

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      phone: phone ? phone.trim() : undefined,
      address: address ? address.trim() : undefined,
      city: city ? city.trim() : undefined,
      state: state ? state.trim() : undefined,
      pincode: pincode ? pincode.trim() : undefined,
      country: country ? country.trim() : undefined,
      avatar: avatar ? avatar.trim() : undefined,
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
}

/**
 * Fetch authenticated user profile from MongoDB (/api/users/profile)
 */
export async function getProfile() {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch('/api/users/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch user profile.');
  }

  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data.user;
}

/**
 * Update authenticated user profile in MongoDB (/api/users/profile)
 */
export async function updateProfile(profileData) {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update user profile.');
  }

  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data.user;
}

/**
 * Verify current session against backend
 */
export async function verifySession() {
  const token = getAuthToken();
  if (!token) return false;

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

    return true; // Keep local state on transient non-auth server errors
  } catch (err) {
    return true;
  }
}

/**
 * Remove credentials and end session
 */
export function logout() {
  try {
    const token = getAuthToken();
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
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
