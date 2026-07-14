// ১. প্রয়োজনীয় ফাংশনগুলো ইম্পোর্ট করুন
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // এটি যোগ করতে হবে
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCJfX9lD-y76NjsFha3wXkTHFUkS5SYckM",
  authDomain: "zee-care-16af0.firebaseapp.com",
  projectId: "zee-care-16af0",
  storageBucket: "zee-care-16af0.firebasestorage.app",
  messagingSenderId: "131848035809",
  appId: "1:131848035809:web:b8a45c39a48e0e90a206a0",
  measurementId: "G-FWZDXZF445"
};

// ২. Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ৩. Firestore ডেটাবেসটি এক্সপোর্ট করুন (এটি ছাড়া ডেটা রিড/রাইট করা সম্ভব নয়)
export const db = getFirestore(app);