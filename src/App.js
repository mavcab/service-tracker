import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

import { auth, db } from "./firebase";
import Home from "./Home";
import Login from "./Login";
import AdminLogin from "./AdminLogin";
import CustomerDashboard from "./CustomerDashboard";
import AdminDashboard from "./AdminDashboard";

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
    <PayPalScriptProvider
      options={{
        "client-id": "AX9pu4nBZjKWh2R1ue_hnjJId_U7tpBoSsC5NEwJJs1LJgxspcrxcxBDsWHKhuDk5OYUUa60yz6vUynP", // Sandbox ID
        vault: true,
        intent: "subscription",
        disableFunding: "paylater",
        currency: "USD"
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/customer" /> : <Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/customer" element={user ? <CustomerDashboard /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? (isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" />) : <Navigate to="/admin-login" />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </PayPalScriptProvider>
  );
};

const Logout = () => {
  useEffect(() => {
    signOut(auth);
  }, []);
  return <Navigate to="/login" />;
};

export default App;
