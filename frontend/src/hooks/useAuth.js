// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { useUserStore } from '@/store/userStore';

/**
 * Subscribes to Firebase auth state changes.
 * Updates userStore with current user + ID token.
 * Returns { user, loading, idToken }
 */
export function useAuth() {
  const { user, setUser, clearUser } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken(/* forceRefresh */ false);
          setUser(
            {
              uid:         firebaseUser.uid,
              email:       firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL:    firebaseUser.photoURL,
            },
            idToken
          );
        } catch (err) {
          console.error('Failed to get ID token:', err);
          clearUser();
        }
      } else {
        clearUser();
      }
      setLoading(false);
    });

    // Refresh token every 50 minutes (tokens expire after 60)
    const refreshInterval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken(true);
        setUser(
          {
            uid:         currentUser.uid,
            email:       currentUser.email,
            displayName: currentUser.displayName,
            photoURL:    currentUser.photoURL,
          },
          idToken
        );
      }
    }, 50 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  return { user, loading };
}
