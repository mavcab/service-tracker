import { initializeApp } from "firebase/app";
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABgyU96FMftg0oPXfIJQbGCGupwzvrv90",
  authDomain: "customer-and-admin-interface.firebaseapp.com",
  projectId: "customer-and-admin-interface",
  storageBucket: "customer-and-admin-interface.appspot.com",
  messagingSenderId: "384355216551",
  appId: "1:384355216551:web:d8984aa125342baf65ff82"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Ensure authentication persists across page refreshes
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence enabled.");
  })
  .catch((error) => {
    console.error("Error enabling auth persistence:", error);
  });

export { auth, db, provider, signInWithPopup, signInWithRedirect, getRedirectResult };
