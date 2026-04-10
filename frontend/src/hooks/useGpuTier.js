// src/hooks/useGpuTier.js
import { useEffect } from 'react';
import { getGPUTier } from 'detect-gpu';
import { useUserStore } from '@/store/userStore';

/**
 * Detects GPU tier on mount and stores in userStore.
 * Tier 0-1 = low-end (disable Three.js scenes)
 * Tier 2-3 = high-end (enable all animations)
 * Returns the current tier from the store.
 */
export function useGpuTier() {
  const { gpuTier, setGpuTier } = useUserStore();

  useEffect(() => {
    if (gpuTier !== null) return; // Already detected

    getGPUTier()
      .then((result) => {
        setGpuTier(result.tier ?? 0);
      })
      .catch(() => {
        setGpuTier(1); // Conservative default on error
      });
  }, []);

  return gpuTier;
}
