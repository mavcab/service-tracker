import React from "react";
import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>🚫 Access Denied</h1>
      <p>You do not have permission to view this page.</p>
      <button onClick={() => navigate("/")}>Go to Home</button>
    </div>
  );
};

export default AccessDenied;
