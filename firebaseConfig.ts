import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD8pCEwiDHWvb4vju9vtsXvxFvB29SM6VM",
  authDomain: "nexus-social-dce76.firebaseapp.com",
  projectId: "nexus-social-dce76",
  storageBucket: "nexus-social-dce76.appspot.com",
  messagingSenderId: "172694934932",
  appId: "1:172694934932:web:62bb46749dd0c062bfab81"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
