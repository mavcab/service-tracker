import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, provider, signInWithPopup, signOut } from "./firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Log state updates (for debugging)
  useEffect(() => {
    console.log("📢 State Updated: showPhoneInput is now", showPhoneInput);
  }, [showPhoneInput]);

  const handleGoogleSignIn = async () => {
    try {
      // Sign out any current user to force a fresh Google Sign-In
      await signOut(auth);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("✅ Google Sign-In Success:", user.email);
      checkUserAndRequestPhone(user);
    } catch (error) {
      console.error("❌ Google Sign-In Error:", error);
      alert(`Google Sign-In Failed: ${error.message}`);
    }
  };

  const checkUserAndRequestPhone = async (user) => {
    if (!user) return;
    console.log("🔍 Checking user in Firestore...");
    // Use email as document ID to perform a direct lookup
    const userDocRef = doc(db, "customers", user.email);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      console.log("🆕 New user detected. Creating Firestore entry...");
      await setDoc(userDocRef, {
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        email: user.email,
        userId: user.uid,
        phone: "", // Empty phone, to be filled later
        status: "No service",
        serviceStartDate: null,
        serviceEndDate: null
      });
      console.log("✅ Firestore entry created. Asking for phone...");
      forcePhonePrompt(user);
    } else {
      console.log("✅ User already exists in Firestore.");
      const existingPhone = userDoc.data().phone;
      if (!existingPhone) {
        console.log("⚠️ User exists but has no phone number. Asking for phone...");
        forcePhonePrompt(user);
      } else {
        console.log("✅ User already has a phone number. Navigating to /customer...");
        navigate("/customer", { replace: true });
      }
    }
  };

  // Force the phone prompt to show
  const forcePhonePrompt = (user) => {
    console.log("📞 Forcing phone prompt.");
    setCurrentUser(user);
    setShowPhoneInput(true);
  };

  // Format phone number as (XXX) XXX-XXXX
  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/\D/g, "");
    const match = input.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    let formatted = "";
    if (match) {
      const [, area, middle, last] = match;
      if (last) formatted = `(${area}) ${middle}-${last}`;
      else if (middle) formatted = `(${area}) ${middle}`;
      else if (area) formatted = `(${area}`;
    }
    setPhoneNumber(formatted);
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      alert("⚠️ Please enter your phone number.");
      return;
    }
    try {
      const userDocRef = doc(db, "customers", currentUser.email);
      await updateDoc(userDocRef, { phone: phoneNumber });
      console.log("✅ Phone number saved:", phoneNumber);
      navigate("/customer", { replace: true });
    } catch (error) {
      console.error("❌ Error saving phone number:", error);
      alert("Error saving phone number. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>CableSync</h1>
        <p>Cable service made easy and affordable.</p>
        {showPhoneInput ? (
          <div className="phone-input">
            <p>Please enter your phone number:</p>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={handlePhoneChange}
            />
            <button onClick={handlePhoneSubmit}>Submit</button>
          </div>
        ) : (
          <button className="google-btn" onClick={handleGoogleSignIn}>
            <img
              src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA"
              alt="Google Logo"
              className="google-logo"
            />
            Sign in/register with Google
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;
