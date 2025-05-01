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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const q = query(
          collection(db, 'customers'),
          where('email', '!=', 'example@gmail.com'),
          orderBy('email')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(docSnap => {
          const data = docSnap.data();
          return { id: docSnap.id, ...data, devices: data.devices || [] };
        });
        setCustomers(list);
      } catch (e) {
        console.error('Error fetching customers:', e);
      }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
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
      await updateDoc(customerRef, {        
        status: 'Active',
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
      await updateDoc(customerRef, {        
        status: 'No service',
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
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
      try {
      // Delete the document from Firestore
      await deleteDoc(doc(db, 'customers', id));

      // Update the local state to remove the customer
      setCustomers(prevCustomers =>
        prevCustomers.filter(customer => customer.id !== id)
      );

      console.log(`Customer with ID ${id} has been deleted.`);
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer.');
    }
  };
  const getNotificationMessage = (status) => {
    if (status === 'Canceled') return 'Process cancellation of service.';
    return '';
  };
  // --- filtering, sorting, notifications, and handlers omitted for brevity ---
  // assume all your existing handleActivate, handleEndService, etc. here

  // Filter and sort customers
  const filtered = customers.filter(c => {
    const name = `${c.firstName} ${c.lastName}`.toLowerCase();
    return (
      name.includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  const sorted = () => {
    if (!sortConfig.key) return filtered;
    return [...filtered].sort((a, b) => {
      const aV = (a[sortConfig.key] || '').toString().toLowerCase();
      const bV = (b[sortConfig.key] || '').toString().toLowerCase();
      return sortConfig.direction === 'ascending'
        ? aV.localeCompare(bV)
        : bV.localeCompare(aV);
    });
  };

  if (loading) return <p className="loading">Loading customer data...</p>;

  return (
    <div className="admin-container">
      <h2>Admin Dashboard</h2>
      <div className="controls-container">
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th onClick={() => requestSort('firstName')}>Name</th>
            <th onClick={() => requestSort('email')}>Email</th>
            <th>Phone</th>
            <th>Devices</th>
            <th>Status</th>
            <th>Service Start</th>
            <th>Service End</th>
            <th>Actions</th>
            <th></th> {/* delete column */}
          </tr>
        </thead>

        <tbody>
          {sorted().map(customer => (
            <tr key={customer.id}>
              <td>{customer.firstName} {customer.lastName}</td>
              <td>{customer.email}</td>
              <td>{customer.phone || 'Not provided'}</td>
              <td>
                {customer.devices.length
                  ? (
                    <ul>
                      {customer.devices.map((d, i) => (
                        <li key={i}>
                          MAC: {d.macAddress}, Key: {d.deviceKey}
                        </li>
                      ))}
                    </ul>
                  )
                  : 'No devices registered'
                }
              </td>
              <td>
                <span className={`status ${
                  customer.status === 'Active' ? 'active' :
                  customer.status === 'Pending Activation' ? 'pending' :
                  customer.status.includes('Canceled') ? 'canceled' :
                  'inactive'
                }`}>
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
                    <button
                      className="activate"
                      onClick={() => handleActivate(customer.id)}
                    >
                      Mark as Active
                    </button>
                    <br/>
                    <input
                      type="date"
                      onChange={e => setSelectedDates(prev => ({
                        ...prev,
                        [customer.id]: { ...prev[customer.id], startDate: e.target.value }
                      }))}
                    />
                    <input
                      type="date"
                      onChange={e => setSelectedDates(prev => ({
                        ...prev,
                        [customer.id]: { ...prev[customer.id], endDate: e.target.value }
                      }))}
                    />
                  </>
                )}
                {customer.status === 'Active' && (
                  <button
                    className="end-service"
                    onClick={() => handleEndService(customer.id)}
                  >
                    End Service
                  </button>
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
