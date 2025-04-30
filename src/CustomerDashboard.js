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
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [devices, setDevices] = useState([]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const newDevice = () => ({ macAddress: "", deviceKey: "" });

  useEffect(() => {
    const fetchCustomer = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      try {
        // Use the email as the document ID for a direct read.
        const docRef = doc(db, "customers", currentUser.email);
        const docSnap = await getDocs(query(collection(db, "customers"), where("email", "==", currentUser.email)));
        // If a document exists (based on our query) then use it. Otherwise, create a temporary object.
        if (!docSnap.empty) {
          // Using the first matching document
          const docData = docSnap.docs[0].data();
          setCustomer({ id: docSnap.docs[0].id, ...docData });
          if (docData.phone) setPhoneNumber(docData.phone);
          //If the user has a device saved populate it.
          if (docData.devices && Array.isArray(docData.devices)) {
            setDevices(docData.devices);
          }
        } else {
          // No record exists; create a temporary customer object
          setCustomer({
            id: currentUser.email, // using email as document ID
            firstName: currentUser.displayName
              ? currentUser.displayName.split(" ")[0]
              : "Customer",
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
          devices: devices,
          status: "Pending Activation",
          subscriptionID // store subscription ID for reference
        },
        { merge: true }
      );
      console.log("✅ Customer record created/updated with subscription info.");
      setCustomer((prev) => ({
        ...prev,
        phone: phoneNumber,        
        devices: devices,
        status: "Pending Activation",
        subscriptionID
      }));
    } catch (error) {
      console.error("Error saving customer record:", error);
    }
  };  
  // Handle device changes
  const handleDeviceChange = (index, field, value) => {
    const updatedDevices = [...devices];
    updatedDevices[index][field] = value;
    setDevices(updatedDevices);
  };
  // Handle adding a device
  const handleAddDevice = () => {
    setDevices([...devices, newDevice()]);
  };

  // Handle removing a device
  const handleRemoveDevice = (index) => {
    const updatedDevices = [...devices];
    updatedDevices.splice(index, 1);
    setDevices(updatedDevices);
  };

  // check if all the devices have a device key and mac address
  const isAllDevicesComplete = () => {
    if (devices.length === 0) {
      return false; // No devices added
    }

    return devices.every((device) => {
      return (
        device.macAddress &&
        device.macAddress.trim() !== "" &&
        device.deviceKey &&
        device.deviceKey.trim() !== ""
      );
    });
  };
  const isFormComplete =
    macAddress.trim() &&
    deviceKey.trim() &&
    phoneNumber.replace(/\D/g, "").length === 10;

  if (loading) return <p className="loading">Loading account details...</p>;

  // For display, treat any status that includes "Canceled" as "Canceled" in the UI.
  const displayStatus =
    customer && customer.status.includes("Canceled")
      ? "Canceled"
      : customer && customer.status;

  // If customer exists and their status is Active or Pending Activation (i.e. they've already subscribed),
  // show a locked view with custom messages.
  if (customer && customer.status !== "No service" && !customer.status.includes("Canceled")) {
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
              {displayStatus || "No service"}
            </span>
          </p>
          <div className="locked-message">
            {customer.status === "Active" ? (
              <p>
                StreamSync has been activated on your device! If you have any questions or concerns, please reach out to our team at <a href="mailto:streamsyncUS@gmail.com">streamsyncUS@gmail.com</a>.
              </p>
            ) : customer.status === "Pending Activation" ? (
              <p>
                Your payment has been received and your subscription is pending activation. Please allow 1-2 business days for activation. If you have any questions, please contact our team at <a href="mailto:streamsyncUS@gmail.com">streamsyncUS@gmail.com</a>.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // If the customer's status includes "Canceled", show a reactivation view.
  if (customer && customer.status.includes("Canceled")) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-box">
          <h2>Welcome, {customer.firstName}!</h2>
          <p className="status">
            Status: <span className="canceled status">{displayStatus}</span>
          </p>
          <div className="locked-message">
            <p>
              You canceled your PayPal subscription. Please reactivate your subscription to resume service. If you have questions, email <a href="mailto:streamsyncUS@gmail.com">streamsyncUS@gmail.com</a>.
            </p>
          </div>
          {isFormComplete && (
            <div className="section-box paypal-container">
              <h4>💳 Reactivate via PayPal</h4>
              <PayPalButtons
                style={{ layout: "vertical", label: "subscribe", tagline: false }}
                createSubscription={(data, actions) =>
                  actions.subscription.create({
                    plan_id: "P-58V95958EU803901VM7HV4EA" // Replace with your actual plan ID
                  })
                }
                onApprove={(data, actions) => {
                  console.log("Reactivation completed with ID:", data.subscriptionID);
                  handleSubscriptionSuccess(data.subscriptionID);
                }}
                onError={(err) => console.error("PayPal Subscription Error:", err)}
              />
            </div>
          )}
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
            {displayStatus || "No service"}
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
          <h4>🔑 Step 2: Enter Device Details</h4>
          {devices.map((device, index) => (
            <div key={index} className="device-inputs">
              <input
                type="text"
                placeholder="Enter MAC Address"
                value={device.macAddress}
                onChange={(e) =>
                  handleDeviceChange(index, "macAddress", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Enter Device Key"
                value={device.deviceKey}
                onChange={(e) =>
                  handleDeviceChange(index, "deviceKey", e.target.value)
                }
              />
               {devices.length > 1 && (
                <button onClick={() => handleRemoveDevice(index)}>-</button>
              )}
            </div>
          ))}
              <button onClick={handleAddDevice}>Add Device</button>
          {/* Step 3: Enter Phone Number */}




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
        {phoneNumber.replace(/\D/g, "").length === 10 && isAllDevicesComplete() && (
          <div className="section-box paypal-container">
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
