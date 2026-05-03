// src/store/sessionStore.js
import { create } from 'zustand';

export const useSessionStore = create((set, get) => ({
  currentSession: null,
  timingData: [],
  isLive: false,
  dataRestricted: false,   // true when OpenF1 blocks access during a live race
  lastUpdated: null,
  sessionKey: null,
  raceControlMessages: [],

  setSession: (session) =>
    set({
      currentSession: session,
      isLive: session?.is_live ?? false,
      dataRestricted: session?.data_restricted ?? false,
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
      dataRestricted: false,
      lastUpdated: null,
      sessionKey: null,
      raceControlMessages: [],
    }),
}));
