import { initializeApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { 
  getRemoteConfig, 
  fetchAndActivate, 
  getValue, 
  RemoteConfig 
} from 'firebase/remote-config';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

// Configure persistence with robust fallbacks for Safari / Private mode
(async () => {
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
  } catch (e) {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e2) {
      // Last resort to prevent crashes in restricted environments
      await setPersistence(auth, inMemoryPersistence);
    }
  }
})();
export const db: Firestore = getFirestore(app);

// Remote Config setup
export const remoteConfig: RemoteConfig = getRemoteConfig(app);

// Set sensible defaults and fetch behavior
remoteConfig.settings = {
  // Cache Remote Config values for 10 minutes across environments
  minimumFetchIntervalMillis: 10 * 60 * 1000,
  fetchTimeoutMillis: 10_000
};

// Default values to avoid undefined before first fetch
remoteConfig.defaultConfig = {
  is_close: false
};

export async function refreshRemoteConfig(): Promise<boolean> {
  try {
    const activated = await fetchAndActivate(remoteConfig);
    return activated;
  } catch (err) {
    console.warn('Remote Config fetch/activate failed:', err);
    return false;
  }
}

export function getIsCloseFlag(): boolean {
  try {
    return getValue(remoteConfig, 'is_close').asBoolean();
  } catch {
    return false;
  }
}
