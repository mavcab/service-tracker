import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import CustomerDashboard from "./CustomerDashboard"; // Make sure this is imported
import AdminDashboard from "./AdminDashboard";
import Navbar from "./Navbar"; // Import the Navbar

function App() {
  return (
    <Router>
      <Navbar /> {/* Navbar appears on all pages */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<CustomerDashboard />} /> {/* Ensures correct routing */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
