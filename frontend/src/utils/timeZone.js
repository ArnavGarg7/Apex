// src/utils/timeZone.js
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format, differenceInSeconds } from 'date-fns';

/**
 * Format a UTC date string in a specific timezone
 */
export function formatEventTime(dateStr, tz = 'UTC', fmt = 'dd MMM HH:mm') {
  if (!dateStr) return '--';
  try {
    const date = new Date(dateStr);
    return formatInTimeZone(date, tz, fmt);
  } catch {
    return '--';
  }
}

/**
 * Time remaining until a target date
 * Returns { days, hours, minutes, seconds, total } or null if in the past
 */
export function timeUntil(targetDateStr) {
  if (!targetDateStr) return null;
  const now = new Date();
  const target = new Date(targetDateStr);
  const totalSeconds = differenceInSeconds(target, now);

  if (totalSeconds <= 0) return null;

  return {
    days:    Math.floor(totalSeconds / 86400),
    hours:   Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    total:   totalSeconds,
  };
}

/**
 * Format countdown as "DDd HH:MM:SS"
 */
export function formatCountdown(remaining) {
  if (!remaining) return '--d --:--:--';
  const { days, hours, minutes, seconds } = remaining;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${days}d ${hh}:${mm}:${ss}`;
}

/**
 * Check if a race is happening now (within 3 hours of start)
 */
export function isRaceWeekend(sessionDateStr) {
  if (!sessionDateStr) return false;
  const now = new Date();
  const sessionDate = new Date(sessionDateStr);
  const diffH = (sessionDate - now) / 3600000;
  return diffH >= -3 && diffH <= 24;
}

/**
 * Get local timezone
 */
export function getLocalTz() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
