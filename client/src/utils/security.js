/**
 * UrbanPulse Security & Validation Utilities
 * Enforces client-side rate-limiting, password strength assessment, and input sanitization.
 */

const RATE_LIMIT_KEY = 'up_auth_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Gets remaining attempts and lockout state for client-side rate limiting
 */
export function getRateLimitStatus() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { allowed: true, remaining: MAX_ATTEMPTS, lockoutRemainingSec: 0 };

    const data = JSON.parse(raw);
    const now = Date.now();

    // Check if lockout period has expired
    if (data.lockoutUntil && now < data.lockoutUntil) {
      const remainingSec = Math.ceil((data.lockoutUntil - now) / 1000);
      return { allowed: false, remaining: 0, lockoutRemainingSec: remainingSec };
    }

    // Reset if window has elapsed
    if (data.firstAttemptTime && now - data.firstAttemptTime > LOCKOUT_DURATION_MS) {
      localStorage.removeItem(RATE_LIMIT_KEY);
      return { allowed: true, remaining: MAX_ATTEMPTS, lockoutRemainingSec: 0 };
    }

    const remaining = Math.max(0, MAX_ATTEMPTS - (data.count || 0));
    return {
      allowed: remaining > 0,
      remaining,
      lockoutRemainingSec: 0,
    };
  } catch {
    return { allowed: true, remaining: MAX_ATTEMPTS, lockoutRemainingSec: 0 };
  }
}

/**
 * Records a failed attempt; triggers lockout if threshold is exceeded
 */
export function recordFailedAttempt() {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    let data = raw ? JSON.parse(raw) : { count: 0, firstAttemptTime: now };

    if (!data.firstAttemptTime || now - data.firstAttemptTime > LOCKOUT_DURATION_MS) {
      data = { count: 1, firstAttemptTime: now };
    } else {
      data.count = (data.count || 0) + 1;
    }

    if (data.count >= MAX_ATTEMPTS) {
      data.lockoutUntil = now + LOCKOUT_DURATION_MS;
    }

    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    return getRateLimitStatus();
  } catch {
    return { allowed: true, remaining: MAX_ATTEMPTS, lockoutRemainingSec: 0 };
  }
}

/**
 * Clears rate limit upon successful login
 */
export function resetRateLimit() {
  try {
    localStorage.removeItem(RATE_LIMIT_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Validates email format strictly
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email.trim());
}

/**
 * Evaluates password strength and returns score & rules met
 */
export function assessPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: 'Empty', color: '#64748B', rules: { length: false, upper: false, lower: false, number: false, special: false } };
  }

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(rules).filter(Boolean).length;

  let label = 'Weak';
  let color = '#EF4444';

  if (score >= 5) {
    label = 'Very Strong';
    color = '#10B981';
  } else if (score === 4) {
    label = 'Strong';
    color = '#22D3EE';
  } else if (score === 3) {
    label = 'Medium';
    color = '#F59E0B';
  }

  return { score, label, color, rules };
}

/**
 * Basic sanitization to prevent XSS in rendered text
 */
export function sanitizeInput(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
