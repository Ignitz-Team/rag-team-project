import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQuI6U_QwJzZ3gYbteUbvhtgC4whmfnOA",
  authDomain: "life-len-ai.firebaseapp.com",
  projectId: "life-len-ai",
  storageBucket: "life-len-ai.firebasestorage.app",
  messagingSenderId: "745062864556",
  appId: "1:745062864556:web:a691dbda76b8ffa8d6f109",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();