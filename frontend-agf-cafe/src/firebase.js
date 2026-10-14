// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5op5lZ48qOWrt1xaUieVBhbhXnWHgx7k",
  authDomain: "theagfcafe.firebaseapp.com",
  projectId: "theagfcafe",
  storageBucket: "theagfcafe.firebasestorage.app",
  messagingSenderId: "50574389862",
  appId: "1:50574389862:web:55e9708bd67e125d1273a7",
  measurementId: "G-0W6XMV9CCD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;