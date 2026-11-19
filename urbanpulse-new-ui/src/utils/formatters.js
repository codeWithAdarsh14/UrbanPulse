/**
 * UrbanPulse Formatting Utilities
 */

export function formatTimeAgo(dateInput) {
  if (!dateInput) return 'recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'recently';

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function formatDate(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEventDateTime(dateInput) {
  if (!dateInput) return 'Date TBA';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Date TBA';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function truncate(text, length = 120) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}
