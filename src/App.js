import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Home from "./Home";
import Login from "./Login";
import AdminLogin from "./AdminLogin"; // NEW: Admin login page
import CustomerDashboard from "./CustomerDashboard";
import AdminDashboard from "./AdminDashboard";
import AccessDenied from "./AccessDenied";

const App = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const adminDoc = await getDoc(doc(db, "admins", currentUser.email));
        setIsAdmin(adminDoc.exists());
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/customer" /> : <Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/customer" element={user ? <CustomerDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user ? (isAdmin ? <AdminDashboard /> : <AccessDenied />) : <Navigate to="/admin-login" />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

// Logout function (if you need to manually test login)
const Logout = () => {
  useEffect(() => {
    signOut(auth);
  }, []);
  return <Navigate to="/login" />;
};

export default App;
