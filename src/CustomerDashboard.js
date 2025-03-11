import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from "firebase/firestore";
import { PayPalButtons } from "@paypal/react-paypal-js";
import "./CustomerDashboard.css";

const CustomerDashboard = () => {
  const [customer, setCustomer] = useState(null); // Customer record or temporary auth info
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      try {
        // Try to fetch an existing customer record
        const q = query(
          collection(db, "customers"),
          where("email", "==", currentUser.email)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setCustomer({ id: querySnapshot.docs[0].id, ...docData });
        } else {
          // No record exists yet; create a temporary customer object
          setCustomer({
            id: currentUser.email, // using email as document ID
            firstName: currentUser.displayName ? currentUser.displayName.split(" ")[0] : "Customer",
            email: currentUser.email,
            status: "No service"
          });
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
      }
      
      setLoading(false);
    };

    fetchCustomer();
  }, []);

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

  // On subscription success, create/update the customer record in Firestore.
  const handleSubscriptionSuccess = async (subscriptionID) => {
    setPaymentSuccess(true);
    try {
      await setDoc(
        doc(db, "customers", customer.id),
        {
          firstName: customer.firstName,
          email: customer.email,
          phone: phoneNumber,
          macAddress,
          deviceKey,
          status: "Pending Activation",
          subscriptionID, // store subscription ID for reference
        },
        { merge: true }
      );
      console.log("✅ Customer record created/updated with subscription info.");
      setCustomer((prev) => ({
        ...prev,
        phone: phoneNumber,
        macAddress,
        deviceKey,
        status: "Pending Activation",
        subscriptionID,
      }));
    } catch (error) {
      console.error("Error saving customer record:", error);
    }
  };

  // Form is complete when MAC, Device Key, and a 10-digit phone number are provided.
  const isFormComplete =
    macAddress.trim() &&
    deviceKey.trim() &&
    phoneNumber.replace(/\D/g, "").length === 10;

  if (loading) return <p className="loading">Loading account details...</p>;

  // If customer record exists (status not "No service"), lock the form.
  if (customer && customer.status !== "No service") {
    return (
      <div className="dashboard-container">
        <div className="dashboard-box">
          <h2>Welcome, {customer.firstName}!</h2>
          <p className="status">
            Status:{" "}
            <span
              className={
                customer.status === "Active"
                  ? "active"
                  : customer.status === "Pending Activation"
                  ? "pending"
                  : "inactive"
              }
            >
              {customer.status}
            </span>
          </p>
          <div className="locked-message">
            <p>
              Your subscription is active. Please allow us 1-2 business days to activate your service.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the subscription form for new customers.
  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <h2>Welcome, {customer?.firstName || "Customer"}!</h2>
        <p className="status">
          Status:{" "}
          <span className={customer?.status === "Active" ? "active" : "inactive"}>
            {customer?.status || "No service"}
          </span>
        </p>
        <p className="inactive-message">Your service is currently not active.</p>

        {/* Step 1: Download the App */}
        <div className="section-box">
          <h4>📱 Step 1: Download the App</h4>
          <ul className="app-links">
            <li>
              <a
                href="https://play.google.com/store/apps/details?id=com.ibopro.player"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="platform-logo"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Android_robot.svg/511px-Android_robot.svg.png?20180121030125"
                  alt="Android"
                />
                Android (Google Play Store)
              </a>
            </li>
            <li>
              <a
                href="https://apps.apple.com/us/app/ibo-pro-player/id6449647925"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="platform-logo"
                  src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
                  alt="Apple"
                />
                Apple (App Store)
              </a>
            </li>
          </ul>
          <button
            className="instruction-toggle-btn"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            {showInstructions ? "Hide TV Setup Instructions" : "Show TV Setup Instructions"}
          </button>
          {showInstructions && (
            <div className="tv-instructions">
              <ol>
                <li>Open your Smart TV’s App Store.</li>
                <li>Search for <strong>"IBO Pro Player"</strong>.</li>
                <li>Install and open the app.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Step 2: Enter MAC IP & Device Key */}
        <div className="section-box">
          <h4>🔑 Step 2: Enter MAC IP and Device Key</h4>
          <input
            type="text"
            placeholder="Enter MAC Address"
            value={macAddress}
            onChange={(e) => setMacAddress(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Device Key"
            value={deviceKey}
            onChange={(e) => setDeviceKey(e.target.value)}
          />
        </div>

        {/* Step 3: Enter Phone Number */}
        <div className="section-box">
          <h4>📞 Step 3: Enter Phone Number</h4>
          <input
            type="tel"
            placeholder="(123) 456-7890"
            value={phoneNumber}
            onChange={handlePhoneChange}
          />
        </div>

        {/* Step 4: Subscribe via PayPal */}
        {isFormComplete && (
          <div className="section-box">
            <h4>💳 Step 4: Subscribe via PayPal</h4>
            <PayPalButtons
              style={{ layout: "vertical", label: "subscribe", tagline: false }}
              createSubscription={(data, actions) =>
                actions.subscription.create({
                  plan_id: "P-58V95958EU803901VM7HV4EA" // Replace with your actual plan ID
                })
              }
              onApprove={(data, actions) => {
                console.log("Subscription completed with ID:", data.subscriptionID);
                handleSubscriptionSuccess(data.subscriptionID);
              }}
              onError={(err) => console.error("PayPal Subscription Error:", err)}
            />
          </div>
        )}

        {paymentSuccess && (
          <p className="success-message">
            ✅ Subscription Successful! An admin will activate your service shortly.
          </p>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
