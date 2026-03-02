// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, connectAuthEmulator } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2Uap69VOJnH8pW5PYnU7zO-1MxRn2fhE",
  authDomain: "studybuddy-a1da4.firebaseapp.com",
  projectId: "studybuddy-a1da4",
  storageBucket: "studybuddy-a1da4.appspot.com",
  messagingSenderId: "351351215534",
  appId: "1:351351215534:web:c2035249e39cf83cc0243f",
  measurementId: "G-ZK4NKDJC3Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize analytics only when supported (prevents issues in Jest/Node)
let analytics = null;
try {
  if (typeof window !== 'undefined') {
    const analyticsModule = require('firebase/analytics');
    if (analyticsModule && analyticsModule.isSupported) {
      analyticsModule.isSupported().then(supported => {
        if (supported) analytics = analyticsModule.getAnalytics(app);
      }).catch(() => { analytics = null; });
    } else if (analyticsModule && analyticsModule.getAnalytics) {
      analytics = analyticsModule.getAnalytics(app);
    }
  }
} catch (error) {
  analytics = null;
}

// Initialize and export commonly used services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// If requested via env, connect client SDKs to local Firebase emulators
// Enable by adding REACT_APP_USE_FIREBASE_EMULATORS=true to your .env file
// Otherwise, attempt a short autodiscovery by pinging common emulator endpoints
const _tryConnectToEmulators = async () => {
  const force = process.env.REACT_APP_USE_FIREBASE_EMULATORS === 'true';
  const isBrowser = typeof window !== 'undefined' && typeof fetch === 'function';

  // If explicitly requested, connect immediately
  if (force) {
    const firestoreHost = process.env.REACT_APP_FIRESTORE_EMULATOR_HOST || 'localhost';
    const firestorePort = Number(process.env.REACT_APP_FIRESTORE_EMULATOR_PORT || 8080);
    console.warn('[firebase] Connecting Firestore client to emulator', firestoreHost, firestorePort);
    connectFirestoreEmulator(db, firestoreHost, firestorePort);

    const authUrl = process.env.REACT_APP_AUTH_EMULATOR_URL || 'http://localhost:9099';
    console.warn('[firebase] Connecting Auth client to emulator', authUrl);
    connectAuthEmulator(auth, authUrl);

    const storageHost = process.env.REACT_APP_STORAGE_EMULATOR_HOST || 'localhost';
    const storagePort = Number(process.env.REACT_APP_STORAGE_EMULATOR_PORT || 9199);
    console.warn('[firebase] Connecting Storage client to emulator', storageHost, storagePort);
    connectStorageEmulator(storage, storageHost, storagePort);

    return;
  }

  // Autodiscover only in the browser to avoid Node/test side-effects
  if (!isBrowser) return;

  // Helper to perform a quick fetch with timeout
  const quickFetch = async (url, timeoutMs = 800) => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (e) {
      return null;
    }
  };

  // Firestore emulator default
  try {
    const firestoreHost = process.env.REACT_APP_FIRESTORE_EMULATOR_HOST || 'localhost';
    const firestorePort = Number(process.env.REACT_APP_FIRESTORE_EMULATOR_PORT || 8080);
    const firestoreUrl = `http://${firestoreHost}:${firestorePort}/`;
    const res = await quickFetch(firestoreUrl);
    if (res) {
      console.warn('[firebase] Detected Firestore emulator at', firestoreUrl, '- connecting.');
      connectFirestoreEmulator(db, firestoreHost, firestorePort);
    }
  } catch (e) { /* ignore */ }

  // Auth emulator default
  try {
    const authUrl = process.env.REACT_APP_AUTH_EMULATOR_URL || 'http://localhost:9099';
    const res = await quickFetch(authUrl);
    if (res) {
      console.warn('[firebase] Detected Auth emulator at', authUrl, '- connecting.');
      connectAuthEmulator(auth, authUrl);
    }
  } catch (e) { /* ignore */ }

  // Storage emulator default
  try {
    const storageHost = process.env.REACT_APP_STORAGE_EMULATOR_HOST || 'localhost';
    const storagePort = Number(process.env.REACT_APP_STORAGE_EMULATOR_PORT || 9199);
    const storageUrl = `http://${storageHost}:${storagePort}/`;
    const res = await quickFetch(storageUrl);
    if (res) {
      console.warn('[firebase] Detected Storage emulator at', storageUrl, '- connecting.');
      connectStorageEmulator(storage, storageHost, storagePort);
    }
  } catch (e) { /* ignore */ }
};

// Kick off detection (non-blocking)
_tryConnectToEmulators();


// Sync auth -> firestore: create or update user doc automatically on sign-in
// Returns an unsubscribe function from the auth listener so callers can stop it when needed.
// By default, it will only set minimal fields and will never overwrite richer data (uses merge).
const syncAuthToFirestore = (options = {}) => {
  const { defaultRole = 'student' } = options;
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const existing = snap.exists() ? snap.data() : {};

      const data = {
        uid: user.uid,
        email: user.email || existing.email || '',
        name: user.displayName || existing.name || '',
        role: existing.role || defaultRole,
        lastSignInAt: serverTimestamp(),
        // keep createdAt if existing (don't overwrite), otherwise set now
        createdAt: existing.createdAt || serverTimestamp()
      };

      // Merge so registration flows can add richer fields without being overwritten
      await setDoc(userRef, data, { merge: true });
    } catch (err) {
      // Non-fatal; log for debugging
      // console.error('Error syncing auth to firestore:', err);
    }
  });
  return unsubscribe;
};

export { app, analytics, auth, db, storage, syncAuthToFirestore };