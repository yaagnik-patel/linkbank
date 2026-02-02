import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVfrdbYMjI8HmaXUJo_DaJ7mUrRcLMge8",
  authDomain: "link-bank24.firebaseapp.com",
  projectId: "link-bank24",
  storageBucket: "link-bank24.firebasestorage.app",
  messagingSenderId: "323673816247",
  appId: "1:323673816247:web:XXXX"
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const firebaseAuth = getAuth(app);
