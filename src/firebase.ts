
// src/firebase.ts
// @ts-ignore - Suppressing error: "Module '"firebase/app"' has no exported member 'initializeApp'."
import { initializeApp as initializeAppUntyped, FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Cast the imported function to its expected type
const initializeApp = initializeAppUntyped as (options: FirebaseOptions, name?: string) => FirebaseApp;

// TODO: Replace with your actual Firebase project configuration
// For Vercel deployment, use environment variables:
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // or REACT_APP_FIREBASE_API_KEY
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// **IMPORTANT:** Replace these with your actual Firebase config values or use environment variables.
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyD6Q-a21OKorFz8tKJgpVkx9L8DTqKSfHQ",
  authDomain: "skrbarackholka.firebaseapp.com",
  projectId: "skrbarackholka",
  storageBucket: "skrbarackholka.firebasestorage.app",
  messagingSenderId: "294946515979",
  appId: "1:294946515979:web:86769e1ff8cf2880beab0e"
};


// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
