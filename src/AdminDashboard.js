import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const AdminDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleActivate = async (id) => {
    try {
      const customerRef = doc(db, "customers", id);
      const startDate = new Date().toLocaleDateString("en-US");
      const endDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString("en-US");

      await updateDoc(customerRef, {
        status: "Active",
        serviceStartDate: startDate,
        serviceEndDate: endDate,
      });

      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.id === id
            ? { ...customer, status: "Active", serviceStartDate: startDate, serviceEndDate: endDate }
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
                <td>{customer.serviceStartDate || "N/A"}</td>
                <td>{customer.serviceEndDate || "N/A"}</td>
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
