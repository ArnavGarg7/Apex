// src/hooks/useUserPrefs.js
import { useUserStore } from '@/store/userStore';

/**
 * Convenience hook to read/write user preferences.
 */
export function useUserPrefs() {
  const { prefs, updatePrefs } = useUserStore();
  return { prefs, updatePrefs };
}
