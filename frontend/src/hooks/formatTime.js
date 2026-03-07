export function formatTime(date) {
  if (!date) {
    return '';
  }

  const d = new Date(date);
  if (isNaN(d)) {
    return '';
  }

  const now = new Date();
  const diff = (now - d) / 1000; // seconds

  if (diff < 60) {
    return 'just now';
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)} min ago`;
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hour ago`;
  }
  if (diff < 172800) {
    return 'yesterday';
  }

  // Format: Jan 5, 2025 – 14:30
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
