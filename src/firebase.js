import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABgyU96FMftg0oPXfIJQbGCGupwzvrv90",
  authDomain: "customer-and-admin-interface.firebaseapp.com",
  projectId: "customer-and-admin-interface",
  storageBucket: "customer-and-admin-interface.firebasestorage.app",
  messagingSenderId: "384355216551",
  appId: "1:384355216551:web:d8984aa125342baf65ff82"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
