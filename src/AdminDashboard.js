import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import "./AdminDashboard.css"; // Import the updated styles

const AdminDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState({});

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "customers"));
        const customerList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ✅ Remove "example@gmail.com" from list
        const filteredCustomers = customerList.filter(
          (customer) => customer.email !== "example@gmail.com"
        );

        setCustomers(filteredCustomers);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  const handleActivate = async (id) => {
    try {
      const { startDate, endDate } = selectedDates[id] || {};

      if (!startDate || !endDate) {
        alert("Please select valid start and end dates.");
        return;
      }

      const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const dateParts = dateString.split("-");
        if (dateParts.length === 3) {
          return `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
        }
        return dateString;
      };

      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      const customerRef = doc(db, "customers", id);
      await updateDoc(customerRef, {
        status: "Active",
        serviceStartDate: formattedStartDate,
        serviceEndDate: formattedEndDate,
      });

      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.id === id
            ? {
                ...customer,
                status: "Active",
                serviceStartDate: formattedStartDate,
                serviceEndDate: formattedEndDate,
              }
            : customer
        )
      );
    } catch (error) {
      console.error("Error updating customer status:", error);
    }
  };

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
    <div className="admin-container">
      <h2>Admin Dashboard</h2>
      {customers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <table>
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
                <td>
                  <span className={`status ${
                    customer.status === "Active"
                      ? "active"
                      : customer.status === "Requested Activation"
                      ? "requested"
                      : "inactive"
                  }`}>
                    {customer.status}
                  </span>
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
                    <button className="activate" onClick={() => handleActivate(customer.id)}>Mark as Active</button>
                  ) : (
                    <button className="end-service" onClick={() => handleEndService(customer.id)}>End Service</button>
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
