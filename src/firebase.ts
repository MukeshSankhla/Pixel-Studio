import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAI-1QKEvWRCJAK47lgrqqcsF1bRNQQRUM",
  authDomain: "pixel-studio-8a2db.firebaseapp.com",
  projectId: "pixel-studio-8a2db",
  storageBucket: "pixel-studio-8a2db.firebasestorage.app",
  messagingSenderId: "249080408554",
  appId: "1:249080408554:web:09250e6600dca88d412a93"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default db;
