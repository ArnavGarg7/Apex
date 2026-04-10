// src/utils/formatLap.js

/**
 * Format a lap time in seconds to M:SS.mmm
 * @param {number|null} seconds
 * @returns {string}
 */
export function formatLapTime(seconds) {
  if (seconds == null || isNaN(seconds)) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const s = Math.floor(secs).toString().padStart(2, '0');
  const ms = Math.round((secs % 1) * 1000).toString().padStart(3, '0');
  return `${mins}:${s}.${ms}`;
}

/**
 * Format a gap string (e.g. "+1.234" or "1 LAP")
 */
export function formatGap(gap) {
  if (!gap || gap === '0') return 'LEADER';
  if (typeof gap === 'string' && gap.includes('LAP')) return gap;
  const n = parseFloat(gap);
  if (isNaN(n)) return gap;
  return n > 0 ? `+${n.toFixed(3)}` : n.toFixed(3);
}

/**
 * Format sector time delta (e.g. +0.123 in green/red)
 */
export function formatSectorDelta(delta) {
  if (delta == null) return '--';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(3)}`;
}

/**
 * Convert lap time string "1:23.456" to seconds
 */
export function lapTimeToSeconds(str) {
  if (!str) return null;
  const parts = str.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(str);
}

/**
 * Format position number with ordinal suffix
 */
export function formatPosition(pos) {
  const n = parseInt(pos);
  if (isNaN(n)) return '--';
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}
