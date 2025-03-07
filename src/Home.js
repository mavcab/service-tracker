import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to <span className="highlight">CableSync</span></h1>
        <p>Reliable cable service at an unbeatable price.</p>

        {user ? (
          <button className="dashboard-btn" onClick={() => navigate("/customer")}>
            Go to Dashboard
          </button>
        ) : (
          <button className="get-started-btn" onClick={() => navigate("/login")}>
            Get Started
          </button>
        )}
      </div>
    </div>
  );
};

export default Home;
