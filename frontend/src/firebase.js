// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'PLACEHOLDER',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'localhost',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'apex-dev',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:0:web:0',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || '',
};

const DEV_MODE = import.meta.env.VITE_FIREBASE_API_KEY == null || import.meta.env.VITE_FIREBASE_API_KEY === '';
if (DEV_MODE) {
  console.warn('[APEX] Firebase env vars not set — auth will not work. Copy frontend/.env.example to frontend/.env and fill in your Firebase keys.');
}

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Initialize Analytics only when supported (not in SSR/Node)
analyticsSupported().then((yes) => {
  if (yes && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) getAnalytics(app);
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return signOut(auth);
}

export default app;
