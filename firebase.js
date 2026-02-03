// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZ3-9WrlT-kpkhyaQ3DYRktwweylqzow0",
  authDomain: "link-bank24.firebaseapp.com",
  projectId: "link-bank24",
  storageBucket: "link-bank24.firebasestorage.app",
  messagingSenderId: "323673816247",
  appId: "1:323673816247:web:46536164f4291eaa41e132",
  measurementId: "G-KFRG1300RP",
};

// Initialize Firebase (single app instance)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

// Keep user logged in across browser sessions (auto-login)
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Auth persistence failed:", err);
});

export { app, analytics, auth, db };
