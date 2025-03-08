import React from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, provider, signInWithPopup, signOut } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import "./AdminLogin.css"; // Import the updated styles

const AdminLogin = () => {
  const navigate = useNavigate();

  const handleAdminSignIn = async () => {
    try {
      await signOut(auth); // Ensure fresh login
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const adminDoc = await getDoc(doc(db, "admins", user.email));
      if (adminDoc.exists()) {
        console.log("Admin verified:", user.email);
        navigate("/admin"); // Redirect to admin dashboard
      } else {
        alert("❌ Access Denied: You are not an admin.");
        await signOut(auth);
      }
    } catch (error) {
      console.error("Admin Sign-In Error:", error);
      alert(`❌ Admin Sign-In Failed: ${error.message}`);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <h1>Admin Portal</h1>
        <p className="admin-description">Secure login for authorized administrators only.</p>
        <button className="admin-google-btn" onClick={handleAdminSignIn}>
          <img
            src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA"
            alt="Google Logo"
            className="admin-google-logo"
          />
          Sign in as Admin
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
