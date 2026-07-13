// CDN থেকে Firebase SDK ইম্পোর্ট (ইনস্টলেশন ঝামেলা ছাড়া সরাসরি এডিটরের জন্য)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBoI7w6g0WuJy9L3L_6l7F-rlAgh8OPfOI",
  authDomain: "doc-care-4fe26.firebaseapp.com",
  projectId: "doc-care-4fe26",
  storageBucket: "doc-care-4fe26.firebasestorage.app",
  messagingSenderId: "876136814358",
  appId: "1:876136814358:web:d9d4456530cdad9b976237",
  measurementId: "G-N058SGEX3W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore Database
export const db = getFirestore(app);
