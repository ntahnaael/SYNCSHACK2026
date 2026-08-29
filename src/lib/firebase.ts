import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() ?? '',
};

let db: Firestore | null | undefined;

export function isLiveConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

function firestoreFor(app: FirebaseApp) {
  try {
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    return getFirestore(app);
  }
}

export function getLiveDb(): Firestore | null {
  if (!isLiveConfigured()) return null;
  if (db) return db;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = firestoreFor(app);
  return db;
}
