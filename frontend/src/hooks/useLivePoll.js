// src/hooks/useLivePoll.js
import { useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '@/store/userStore';

const API_BASE = 'https://apex-backend-uqtw7bvyla-uc.a.run.app';

/**
 * Polls an API endpoint at a given interval.
 * Automatically attaches Firebase auth token.
 *
 * @param {string} endpoint - e.g. '/api/live/timing'
 * @param {function} onData - callback with the fetched data
 * @param {number} intervalMs - polling interval in ms (default 5000)
 * @param {boolean} enabled - whether to poll (default true)
 */
export function useLivePoll(endpoint, onData, intervalMs = 5000, enabled = true) {
  const idToken = useUserStore((s) => s.idToken);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!idToken || !enabled) return;
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (mountedRef.current) onData(data);
    } catch (err) {
      if (mountedRef.current) console.error(`Poll error [${endpoint}]:`, err.message);
    }
  }, [endpoint, idToken, enabled, onData]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    fetchData(); // immediate first call
    timerRef.current = setInterval(fetchData, intervalMs);

    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [fetchData, intervalMs, enabled]);
}
