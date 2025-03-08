import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { FaDollarSign, FaTv } from "react-icons/fa"; // Icons for visual appeal

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <h1>Welcome to <span className="highlight">CableSync</span></h1>
        <p>Reliable cable service at an unbeatable price.</p>
        <button className="get-started-btn" onClick={() => navigate("/login")}>
          Get Started
        </button>
      </div>

      {/* Pricing Comparison Section */}
      <div className="pricing-section">
        <h2>Why Choose CableSync?</h2>
        <div className="pricing-content">
          <div className="pricing-card">
            <FaDollarSign className="icon" />
            <h3>Affordable Pricing</h3>
            <p>
              Other providers charge <span className="highlight-text">$70 - $120 per month</span>.  
              With CableSync, you get <span className="highlight-text">premium service</span> for just  
              <span className="highlight-text"> $30 per month</span>.
            </p>
          </div>
          <div className="pricing-card">
            <FaTv className="icon" />
            <h3>Quality Service</h3>
            <p>
              Enjoy <span className="highlight-text">crystal-clear channels</span> and <span className="highlight-text">fast streaming </span>  
              without overpaying for your cable service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
