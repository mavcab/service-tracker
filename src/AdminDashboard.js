import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState({});
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Optionally use a query to exclude placeholder emails on the server side.
        const q = query(
          collection(db, 'customers'),
          where('email', '!=', 'example@gmail.com'),
          orderBy('email')
        );
        const querySnapshot = await getDocs(q);
        const customerList = querySnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          // Ensure 'devices' exists and is an array, otherwise default to an empty array
          return { id: docSnap.id, ...data, devices: data.devices || [] };
        });
        setCustomers(customerList);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  // Filter customers based on filterStatus, name, and email
  const filteredCustomers = customers.filter((customer) => {
    if (filterStatus === 'All' || customer.status === filterStatus) {
      const name = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const email = customer.email.toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || email.includes(term);
    } else {    
      return false;
    }
  });

  useEffect(() => {}, [filterStatus, searchTerm]);


  // Sorting function
  const sortedCustomers = () => {
    if (!sortConfig.key) return filteredCustomers;
    return [...filteredCustomers].sort((a, b) => {
      const aValue = a[sortConfig.key]?.toLowerCase() || '';
      const bValue = b[sortConfig.key]?.toLowerCase() || '';
      return sortConfig.direction === 'ascending'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  // Notification message for canceled status.
  const getNotificationMessage = (status) => {
    if (status === 'Canceled') {
      return 'Process cancellation of service.';
    }
    return '';
  };

  const handleActivate = async (id) => {
    const { startDate, endDate } = selectedDates[id] || {};
    if (!startDate || !endDate) {
      alert('Please select valid dates.');
      return;
    }
    const formatDate = (dateString) => {
      const [yyyy, mm, dd] = dateString.split("-");
      return `${mm}/${dd}/${yyyy}`;
    };
    try {
      const customerRef = doc(db, "customers", id);
      await updateDoc(customerRef, {        status: 'Active',
        serviceStartDate: formatDate(startDate),
        serviceEndDate: formatDate(endDate),
      });
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c.id === id
            ? { 
                ...c,
                status: "Active",
                serviceStartDate: formatDate(startDate),
                serviceEndDate: formatDate(endDate),
              }
            : c
        )
      );
    } catch (error) {
      console.error("Error activating service:", error);
    }
  };

  const handleEndService = async (id) => {
    try {
      const customerRef = doc(db, "customers", id);
      await updateDoc(customerRef, {        status: 'No service',
        serviceStartDate: null,
        serviceEndDate: null,
      });
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c.id === id
            ? { ...c, status: 'No service', serviceStartDate: null, serviceEndDate: null }
            : c
        )
      );
    } catch (error) {
      console.error("Error ending service:", error);
    }
  };

    const handleProcessCancellation = async (id) => {
    if (!window.confirm('Mark this cancellation as processed?')) return;
    try {
      const customerRef = doc(db, "customers", id);
      await updateDoc(customerRef, {
          status: 'Canceled (Processed)',
        });
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c.id === id ? { ...c, status: "Canceled (Processed)" } : c
        )
      );
    } catch (error) {
      console.error("Error processing cancellation:", error);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
      try {
      await deleteDoc(doc(db, "customers", id));
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (loading) return <p className="loading">Loading customer data...</p>;

  return (
    <div className="admin-container">
      <h2>Admin Dashboard</h2>
      <div className="controls-container">
        <div className="filter-container">
          <label htmlFor="filter">Filter by Status: </label>
          <select
            id="filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Pending Activation">Pending Activation</option>
            <option value="Active">Active</option>
            <option value="No service">No service</option>
            <option value="Canceled">Canceled</option>
            <option value="Canceled (Processed)">Canceled (Processed)</option>
          </select>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th onClick={() => requestSort('firstName')}>
              Name
            </th>
            <th onClick={() => requestSort('email')}>
              Email
            </th>
            <th>Phone</th>
            <th>Devices</th>
            <th>Status</th>
            <th>Service Start</th>
            <th>Service End</th>
            <th>Actions</th>
            <th>Notification</th>
            <th></th> {/* Delete column */}

          </tr>
        </thead>
          <tbody>
          {sortedCustomers().map((customer) => (
            <tr key={customer.id}>
              <td>
                {customer.firstName} {customer.lastName}
              </td>
              <td>{customer.email}</td>
              <td>{customer.phone || "Not provided"}</td>
              <td>
                {customer.devices.length > 0 ? (
                  <ul>
                    {customer.devices.map((device, index) => (
                      <li key={index}>MAC: {device.macAddress}, Key: {device.deviceKey}</li>
                    ))}
                  </ul>
                ) : (
                  "No devices registered"
                )}
              </td>
              <td>
                <span
                  className={`status ${
                    customer.status === "Active"
                      ? "active"
                      : customer.status === "Pending Activation"
                      ? "pending"
                      : customer.status.includes("Canceled")
                      ? "canceled"
                      : "inactive"
                  }`}
                >
                  {customer.status.includes('Canceled') ? 'Canceled' : customer.status}
                </span>
              </td>
              <td>{customer.serviceStartDate || 'N/A'}</td>
              <td>{customer.serviceEndDate || 'N/A'}</td>
              <td>
              {(customer.status === 'No service' ||
                customer.status === 'Pending Activation' ||
                customer.status.includes('Canceled')) && (
                <>
                  {customer.status === 'Pending Activation' }
                  <button
                    className="activate"
                    onClick={() => handleActivate(customer.id)}
                  >
                    Mark as Active
                  </button>
                  <br />
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
                </>
              )}
                {customer.status === "Active" && (
                  <button
                    className="end-service"
                    onClick={() => handleEndService(customer.id)}
                  >
                    End Service
                  </button>
                )}
              </td>
              <td>
              {/* Show notification only if status is exactly "Canceled" */}
                {customer.status === "Canceled" && (
                  <div className="notification">
                    {getNotificationMessage(customer.status)}
                    <br />
                    <button
                      className="process-btn"
                      onClick={() => handleProcessCancellation(customer.id)}
                    >
                      Mark as Processed
                    </button>
                  </div>
                )}
              </td>
              <td>
                <button
                  className="delete"
                  onClick={() => handleDeleteCustomer(customer.id)}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
