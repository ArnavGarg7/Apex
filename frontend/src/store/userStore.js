// src/store/userStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      prefs: {
        favoriteDriver: null,
        favoriteTeam: null,
        theme: 'dark',
        notifications: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      gpuTier: null,
      idToken: null,

      setUser: (user, idToken) => set({ user, idToken }),

      clearUser: () => set({ user: null, idToken: null }),

      setGpuTier: (tier) => set({ gpuTier: tier }),

      updatePrefs: (prefs) =>
        set((state) => ({
          prefs: { ...state.prefs, ...prefs },
        })),

      getIdToken: () => get().idToken,
    }),
    {
      name: 'apex-user-store',
      partialize: (state) => ({ prefs: state.prefs }),
    }
  )
);
