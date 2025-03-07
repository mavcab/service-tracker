import React from "react";
import { auth, db } from "./firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Import styles

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      let firstName = "";
      let lastName = "";
      if (user.displayName) {
        const nameParts = user.displayName.split(" ");
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      }

      const docId = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
      const userDocRef = doc(db, "customers", docId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          firstName,
          lastName,
          email: user.email,
          userId: user.uid,
          phone: "",
          status: "No service",
          serviceStartDate: null,
          serviceEndDate: null
        });
      }

      navigate("/dashboard");
    } catch (error) {
      alert("Google Sign-In Error: " + error.message);
      console.error("Google Auth Error:", error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>CableSync</h1>
        <p>Cable service made easy and affordable.</p>
        <button className="google-btn" onClick={handleGoogleSignIn}>
          <img
            src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA"
            alt="Google Logo"
            className="google-logo"
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
