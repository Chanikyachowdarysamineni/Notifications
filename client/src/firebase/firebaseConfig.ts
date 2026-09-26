import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAtCxFST6_MFV8wsmGS-7d_2QhQgkBbQNw",
  authDomain: "cse-hub-bd655.firebaseapp.com",
  projectId: "cse-hub-bd655",
  storageBucket: "cse-hub-bd655.firebasestorage.app",
  messagingSenderId: "203681298144",
  appId: "1:203681298144:web:e5cce11293c50a4eac8285",
  measurementId: "G-GKGTL96MML"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
