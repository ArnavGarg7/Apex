// src/hooks/useRaceData.js
// Fixed: added useEffect to auto-fetch when immediate=true, and refetch on URL change
import { useState, useCallback, useEffect, useRef } from 'react';
import { useUserStore } from '@/store/userStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

/**
 * Generic fetch hook for authenticated API calls.
 * Returns { data, loading, error, refetch }
 * 
 * Options:
 *   immediate: boolean  — auto-fetch on mount (and when idToken becomes available)
 *   deps: any[]         — extra dependencies that trigger a re-fetch when changed
 */
export function useRaceData(endpoint, { immediate = false, deps = [] } = {}) {
  const idToken  = useUserStore((s) => s.idToken);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [currentUrl, setCurrentUrl] = useState(endpoint);

  // If the endpoint drastically changes (user clicked another track), immediately wipe old data
  if (endpoint !== currentUrl) {
    setData(null);
    setCurrentUrl(endpoint);
  }

  // Track whether we've done the initial fetch
  const hasFetched = useRef(false);

  const fetch_ = useCallback(async () => {
    if (!idToken || !endpoint) return null;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}${endpoint}`);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      setData(json);
      return json;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, idToken]);

  // Auto-fetch when:
  //   1. immediate=true and idToken is available (first time)
  //   2. deps change (e.g., year, circuit, etc.)
  useEffect(() => {
    if (!immediate) return;
    if (!idToken) return;
    fetch_();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, idToken, endpoint, ...deps]);

  return { data, loading, error, refetch: fetch_ };
}
