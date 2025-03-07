import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const CustomerDashboard = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!auth.currentUser) {
        console.log("No authenticated user found.");
        navigate("/login");
        return;
      }

      console.log("Fetching customer data for:", auth.currentUser.email);

      try {
        const customerRef = doc(db, "customers", auth.currentUser.email);
        const customerSnap = await getDoc(customerRef);

        if (customerSnap.exists()) {
          console.log("Customer data found:", customerSnap.data());
          setCustomer(customerSnap.data());
        } else {
          console.log("No customer data found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching customer details:", error);
      }

      setLoading(false);
    };

    fetchCustomer();
  }, [navigate]);

  if (loading) return <p>Loading account details...</p>;

  return (
    <div>
      <h2>Your Account</h2>
      {customer ? (
        <>
          <p><strong>Name:</strong> {customer.firstName} {customer.lastName}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          <p><strong>Phone:</strong> {customer.phone || "Not provided"}</p>
          <p><strong>Status:</strong> {customer.status || "No service"}</p>
          {customer.status === "Active" ? (
            <>
              <p><strong>Service Start Date:</strong> {customer.serviceStartDate || "N/A"}</p>
              <p><strong>Service Expiration:</strong> {customer.serviceEndDate || "N/A"}</p>
            </>
          ) : (
            <p>Your service is currently <strong>not active</strong>.</p>
          )}
        </>
      ) : (
        <p>No account details found.</p>
      )}
    </div>
  );
};

export default CustomerDashboard;
