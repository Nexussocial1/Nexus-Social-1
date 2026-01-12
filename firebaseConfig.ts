import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD8pCEwiDHWvb4vju9vtsXvxFvB29SM6VM",
  authDomain: "nexus-social-dce76.firebaseapp.com",
  projectId: "nexus-social-dce76",
  storageBucket: "nexus-social-dce76.firebasestorage.app",
  messagingSenderId: "172694934932",
  appId: "1:172694934932:web:62bb46749dd0c062bfab81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export { serverTimestamp };
