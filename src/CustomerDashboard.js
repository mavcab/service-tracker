import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

const CustomerDashboard = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!auth.currentUser) return;

      try {
        const customerRef = doc(db, "customers", auth.currentUser.email);
        const customerSnap = await getDoc(customerRef);

        if (customerSnap.exists()) {
          setCustomer(customerSnap.data());
        } else {
          console.log("No customer data found.");
        }
      } catch (error) {
        console.error("Error fetching customer details:", error);
      }

      setLoading(false);
    };

    fetchCustomer();
  }, []);

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
