// src/hooks/useEventStream.js
// Server-Sent Events hook for real-time F1 timing data.
// When a live session is detected, this hook opens an SSE connection to
// /api/live/stream and pushes updates into the Zustand session store.
// Falls back silently to polling if SSE is unavailable.

import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';

const API_BASE = 'https://apex-backend-uqtw7bvyla-uc.a.run.app';

/**
 * Opens an SSE connection to /api/live/stream when isLive is true.
 * Automatically closes and reopens on disconnect.
 *
 * @param {boolean} isLive - Only connect when a session is live
 */
export function useEventStream(isLive) {
  const idToken = useUserStore((s) => s.idToken);
  const { setSession, updateTiming, setLive } = useSessionStore();
  const esRef       = useRef(null);
  const retryTimer  = useRef(null);
  const mountedRef  = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isLive || !idToken) {
      // Close any existing connection when session ends
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      return;
    }

    const connect = () => {
      if (!mountedRef.current) return;
      if (esRef.current) {
        esRef.current.close();
      }

      // EventSource doesn't support custom headers, so we pass the token
      // as a query param.  The backend validates it via require_auth.
      const url = `${API_BASE}/api/live/stream?token=${encodeURIComponent(idToken)}`;

      try {
        const es = new EventSource(url);
        esRef.current = es;

        // ── Full snapshot on connect ───────────────────────────────────
        es.addEventListener('snapshot', (e) => {
          if (!mountedRef.current) return;
          try {
            const { session, timing } = JSON.parse(e.data);
            if (session) { setSession(session); setLive(session.is_live ?? false); }
            if (timing)  { updateTiming(timing); }
          } catch (_) {}
        });

        // ── Incremental SignalR updates ────────────────────────────────
        es.addEventListener('update', (e) => {
          if (!mountedRef.current) return;
          try {
            const msg = JSON.parse(e.data);
            // We receive raw { category, data } pairs from the SignalR stream.
            // Re-requesting /session and /timing from the poller every 2-5 s
            // will pick up the accumulated state; this handler is a bonus
            // for immediate reaction to SessionStatus changes.
            if (msg.category === 'SessionStatus') {
              const live = msg.data?.Status === 'Started';
              setLive(live);
            }
          } catch (_) {}
        });

        // ── Heartbeat (keep-alive comment from server) ─────────────────
        es.onmessage = () => {}; // default message handler — ignore

        es.onerror = () => {
          if (!mountedRef.current) return;
          es.close();
          esRef.current = null;
          // Reconnect after 5 s
          retryTimer.current = setTimeout(connect, 5000);
        };

      } catch (err) {
        console.warn('[SSE] EventSource not supported or connection failed:', err);
      }
    };

    connect();

    return () => {
      clearTimeout(retryTimer.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [isLive, idToken, setSession, updateTiming, setLive]);
}
