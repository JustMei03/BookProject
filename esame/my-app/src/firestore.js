import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBZl9dw-0rkgZTgWor49ZhgfVtfK9JOSIY",
  authDomain: "progetto-info-40560.firebaseapp.com",
  projectId: "progetto-info-40560",
  storageBucket: "progetto-info-40560.firebasestorage.app",
  messagingSenderId: "1025489318755",
  appId: "1:1025489318755:web:aea33948d50ec56b415956"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
