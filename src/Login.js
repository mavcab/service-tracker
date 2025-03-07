import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, provider, signInWithPopup } from "./firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("User already signed in:", user.email);
        await checkAndAddUser(user);
      }
    });
  }, [navigate]);

  const checkAndAddUser = async (user) => {
    const userDocRef = doc(db, "customers", user.email);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log("New user detected. Prompting for phone number...");
      setShowPhonePrompt(true);
    } else {
      console.log("User already exists in Firestore.");
      navigate("/customer");
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phone.trim()) {
      alert("Please enter a valid phone number.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "customers", user.email);
    await setDoc(userDocRef, {
      firstName: user.displayName?.split(" ")[0] || "",
      lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
      email: user.email,
      userId: user.uid,
      phone: phone,
      status: "No service",
      serviceStartDate: null,
      serviceEndDate: null,
    });

    console.log("User added to Firestore with phone:", phone);
    setShowPhonePrompt(false);
    navigate("/customer");
  };

  const handleGoogleSignIn = async () => {
    console.log("Redirecting to Google Sign-In...");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google Sign-In Success:", user.email);
      await checkAndAddUser(user);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert(`Google Sign-In Failed: ${error.message}`);
    }
  };

  if (showPhonePrompt) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>Enter Your Phone Number</h2>
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button onClick={handlePhoneSubmit}>Submit</button>
        </div>
      </div>
    );
  }

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
