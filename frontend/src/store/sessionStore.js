// src/store/sessionStore.js
import { create } from 'zustand';

export const useSessionStore = create((set, get) => ({
  currentSession: null,
  timingData: [],
  isLive: false,
  dataRestricted: false,   // true when OpenF1 blocks access and SignalR isn't yet connected
  lastUpdated: null,
  sessionKey: null,
  raceControlMessages: [],
  currentLap: null,
  totalLaps: null,
  streamSource: null,    // 'signalr' | 'openf1' | null

  setSession: (session) =>
    set({
      currentSession:  session,
      isLive:          session?.is_live         ?? false,
      dataRestricted:  session?.data_restricted ?? false,
      sessionKey:      session?.session_key     ?? null,
      currentLap:      session?.current_lap     ?? null,
      totalLaps:       session?.total_laps      ?? null,
      streamSource:    session?.source          ?? null,
    }),

  updateTiming: (data) =>
    set({
      timingData:  data,
      lastUpdated: new Date(),
    }),

  setLive: (isLive) => set({ isLive }),

  addRaceControl: (messages) =>
    set({ raceControlMessages: messages }),

  clearSession: () =>
    set({
      currentSession:      null,
      timingData:          [],
      isLive:              false,
      dataRestricted:      false,
      lastUpdated:         null,
      sessionKey:          null,
      raceControlMessages: [],
      currentLap:          null,
      totalLaps:           null,
      streamSource:        null,
    }),
}));
