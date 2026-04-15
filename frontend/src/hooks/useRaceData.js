// src/hooks/useRaceData.js
// Fixed: added useEffect to auto-fetch when immediate=true, and refetch on URL change
import { useState, useCallback, useEffect, useRef } from 'react';
import { useUserStore } from '@/store/userStore';

// In production, we leave API_BASE empty so browser requests are relative and routed via Nginx /api proxy.
// In dev, we use either the explicit env var or fallback to the local dev port 8001.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8001');

/**
 * Generic fetch hook for authenticated API calls.
 * Returns { data, loading, error, refetch }
 * 
 * Options:
 *   immediate: boolean  — auto-fetch on mount (and when idToken becomes available)
 *   deps: any[]         — extra dependencies that trigger a re-fetch when changed
 */
export function useRaceData(endpoint, { immediate = false, deps = [], cacheKey = null, cacheTTL = 86400000 } = {}) {
  const idToken  = useUserStore((s) => s.idToken);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [currentUrl, setCurrentUrl] = useState(endpoint);

  // If the endpoint drastically changes (user clicked another track), immediately wipe old data
  if (endpoint !== currentUrl) {
    // Only reset if we are not reading from cache, or handles it inside fetch
    setCurrentUrl(endpoint);
  }

  // Track whether we've done the initial fetch
  const hasFetched = useRef(false);

  const fetch_ = useCallback(async (forceRefresh = false) => {
    if (!idToken || !endpoint) return null;
    
    // Check localStorage cache first
    if (cacheKey && !forceRefresh) {
      try {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (Date.now() - parsed.timestamp < cacheTTL) {
            setData(parsed.data);
            return parsed.data;
          }
        }
      } catch (e) {
        console.warn('Cache error', e);
      }
    }

    setLoading(true);
    setError(null);
    try {
      // Use standard relative fetch which is most robust in both dev and prod
      const fullUrl = `${API_BASE}${endpoint}`;
      
      const res = await fetch(fullUrl, {
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Accept': 'application/json'
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      
      // Save to cache if requested (and not fallback data)
      const isFallback = json?.articles?.some(a => a.title?.includes("Hamilton's Ferrari"));
      if (cacheKey && !isFallback) {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: json
        }));
      }
      
      setData(json);
      return json;
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, idToken, cacheKey, cacheTTL]);

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
