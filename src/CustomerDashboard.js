import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import "./CustomerDashboard.css";

const CustomerDashboard = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("No authenticated user detected.");
        return;
      }

      try {
        const q = query(collection(db, "customers"), where("email", "==", currentUser.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setCustomer({ id: querySnapshot.docs[0].id, ...docData });
        } else {
          console.log("No customer data found.");
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
      }

      setLoading(false);
    };

    fetchCustomer();
  }, []);

  const handleRequestService = async () => {
    if (!customer) return;
  
    try {
      const customerRef = doc(db, "customers", customer.id);
      await updateDoc(customerRef, {
        status: "Requested Activation",
      });
      setRequestSent(true);
      alert("Request sent! Admin will review your request.");
    } catch (error) {
      console.error("Error sending service request:", error);
    }
  };
  

  if (loading) return <p className="loading">Loading account details...</p>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <h2>Welcome, {customer?.firstName}!</h2>
        <p className="status">
          Status:{" "}
          <span className={customer?.status === "Active" ? "active" : "inactive"}>
            {customer?.status || "No service"}
          </span>
        </p>

        {customer?.status === "Active" ? (
          <div className="service-details">
            <p><strong>Service Start Date:</strong> {customer.serviceStartDate || "N/A"}</p>
            <p><strong>Service Expiration:</strong> {customer.serviceEndDate || "N/A"}</p>
          </div>
        ) : (
          <>
            <p className="inactive-message">Your service is currently <strong>not active</strong>.</p>
            {!requestSent ? (
              <button className="request-service-btn" onClick={handleRequestService}>
                Request Service Activation
              </button>
            ) : (
              <p className="request-sent-message">Request Sent! Waiting for Admin Approval.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
