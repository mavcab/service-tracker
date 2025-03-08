import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import "./CustomerDashboard.css";

const CustomerDashboard = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);

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
      setShowPhoneInput(true); // ✅ Only show phone input after requesting activation
    } catch (error) {
      console.error("Error sending service request:", error);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter a valid phone number.");
      return;
    }

    try {
      const customerRef = doc(db, "customers", customer.id);
      await updateDoc(customerRef, { phone: phoneNumber });

      console.log("✅ Phone number saved:", phoneNumber);
      setCustomer((prev) => ({ ...prev, phone: phoneNumber }));
      setShowPhoneInput(false); // Hide input after saving
    } catch (error) {
      console.error("❌ Error saving phone number:", error);
      alert("Error saving phone number. Please try again.");
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
              <p className="request-sent-message">Request Sent! Waiting for Admin To Reach Out!</p>
            )}
          </>
        )}

        {/* Phone Input - Only Show After Requesting Service */}
        {showPhoneInput && (
          <div className="phone-input-container">
            <p className="phone-text">Please enter your phone number so an admin can reach out to you.</p>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button onClick={handlePhoneSubmit}>Submit</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
