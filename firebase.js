// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZ3-9WrlT-kpkhyaQ3DYRktwweylqzow0",
  authDomain: "link-bank24.firebaseapp.com",
  projectId: "link-bank24",
  storageBucket: "link-bank24.firebasestorage.app",
  messagingSenderId: "323673816247",
  appId: "1:323673816247:web:46536164f4291eaa41e132",
  measurementId: "G-KFRG1300RP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);