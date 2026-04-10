// src/store/sessionStore.js
import { create } from 'zustand';

export const useSessionStore = create((set, get) => ({
  currentSession: null,
  timingData: [],
  isLive: false,
  lastUpdated: null,
  sessionKey: null,
  raceControlMessages: [],

  setSession: (session) =>
    set({
      currentSession: session,
      isLive: session?.is_live ?? false,
      sessionKey: session?.session_key ?? null,
    }),

  updateTiming: (data) =>
    set({
      timingData: data,
      lastUpdated: new Date(),
    }),

  setLive: (isLive) => set({ isLive }),

  addRaceControl: (messages) =>
    set({ raceControlMessages: messages }),

  clearSession: () =>
    set({
      currentSession: null,
      timingData: [],
      isLive: false,
      lastUpdated: null,
      sessionKey: null,
      raceControlMessages: [],
    }),
}));
