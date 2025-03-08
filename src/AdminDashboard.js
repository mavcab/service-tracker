import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const AdminDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState({}); // Store selected dates for each customer

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "customers"));
        const customerList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(customerList);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  // ✅ Handle Activation with Custom Dates
  const handleActivate = async (id) => {
    try {
      const { startDate, endDate } = selectedDates[id] || {};
  
      if (!startDate || !endDate) {
        alert("Please select valid start and end dates.");
        return;
      }
  
      // ✅ Convert selected dates to MM/DD/YYYY format before saving
      const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const dateParts = dateString.split("-");
        if (dateParts.length === 3) {
          return `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`; // Convert YYYY-MM-DD to MM/DD/YYYY
        }
        return dateString; // If already formatted, return as is
      };
      
  
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
  
      // ✅ Update Firestore with formatted dates
      const customerRef = doc(db, "customers", id);
      await updateDoc(customerRef, {
        status: "Active",
        serviceStartDate: formattedStartDate,
        serviceEndDate: formattedEndDate,
      });
  
      // ✅ Update UI immediately
      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.id === id
            ? { ...customer, status: "Active", serviceStartDate: formattedStartDate, serviceEndDate: formattedEndDate }
            : customer
        )
      );
    } catch (error) {
      console.error("Error updating customer status:", error);
    }
  };
  

  // ✅ Handle Ending Service
  const handleEndService = async (id) => {
    try {
      const customerRef = doc(db, "customers", id);
      await updateDoc(customerRef, {
        status: "No service",
        serviceStartDate: null,
        serviceEndDate: null,
      });

      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.id === id
            ? { ...customer, status: "No service", serviceStartDate: null, serviceEndDate: null }
            : customer
        )
      );
    } catch (error) {
      console.error("Error ending service:", error);
    }
  };

  if (loading) return <p>Loading customer data...</p>;

  return (
    <div>
      <h2>Admin Dashboard</h2>
      {customers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <table border="1">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Service Start</th>
              <th>Service End</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.firstName} {customer.lastName}</td>
                <td>{customer.email}</td>
                <td>{customer.phone || "Not provided"}</td>
                <td>{customer.status}</td>
                <td>
                  {customer.status !== "Active" ? (
                    <input
                      type="date"
                      onChange={(e) =>
                        setSelectedDates((prev) => ({
                          ...prev,
                          [customer.id]: {
                            ...prev[customer.id],
                            startDate: e.target.value,
                          },
                        }))
                      }
                    />
                  ) : (
                    customer.serviceStartDate || "N/A"
                  )}
                </td>
                <td>
                  {customer.status !== "Active" ? (
                    <input
                      type="date"
                      onChange={(e) =>
                        setSelectedDates((prev) => ({
                          ...prev,
                          [customer.id]: {
                            ...prev[customer.id],
                            endDate: e.target.value,
                          },
                        }))
                      }
                    />
                  ) : (
                    customer.serviceEndDate || "N/A"
                  )}
                </td>
                <td>
                  {customer.status !== "Active" ? (
                    <button onClick={() => handleActivate(customer.id)}>Mark as Active</button>
                  ) : (
                    <button onClick={() => handleEndService(customer.id)}>End Service</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;
