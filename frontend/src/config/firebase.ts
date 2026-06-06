import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration using Vite environment variables.
// Fallback empty values are provided to ensure the app compiles even if the variables are not set yet.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-project-id.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

// Check if keys are placeholders
const isConfigured = firebaseConfig.apiKey !== "dummy-api-key" && import.meta.env.VITE_FIREBASE_API_KEY;

if (!isConfigured) {
  console.warn("Firebase config env variables are missing. Firebase Auth calls will fail until configured in .env.development / .env.production");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');
