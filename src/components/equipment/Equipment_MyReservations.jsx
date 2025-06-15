import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const Equipment_MyReservations = () => {
  const [uid, setUid] = useState('');
  const [studentName, setStudentName] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [reservations, setReservations] = useState({
    pending: [],
    checkedout: [],
    checkedin: [],
    cancelled: [] // Add cancelled state
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Check if UID is coming from reservation success
  useEffect(() => {
    const reservationUid = sessionStorage.getItem('reservationUid');
    if (reservationUid) {
      setUid(reservationUid);
      sessionStorage.removeItem('reservationUid');
      handleUidValidation(reservationUid).then(isValid => {
        if (isValid) fetchReservations(reservationUid);
        setIsInitialLoad(false);
      });
    } else {
      setIsInitialLoad(false);
    }
  }, []);

  const handleUidValidation = async (uidToValidate) => {
    try {
      const validationResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/equipment/check-uid/${uidToValidate}`
      );
      
      if (!validationResponse.data.uid_exists) {
        setFormError('No reservations found for this UID');
        setIsSubmitted(false);
        return false;
      }
      return true;
    } catch (err) {
      setError('Error validating UID. Please try again.');
      return false;
    }
  };

  const fetchReservations = async (uidParam) => {
    setIsLoading(true);
    setError('');

    try {
      const targetUid = uidParam || uid;
      const isValidUid = await handleUidValidation(targetUid);
      
      if (!isValidUid) {
        setIsLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/equipment/reservations/${targetUid}`
      );
      
      setStudentName(response.data.studentName);
      setReservations(response.data.reservations);
      setIsSubmitted(true);
    } catch (err) {
      setError('Error fetching reservations. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUidSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setError('');
    
    // Validate UID
    if (!uid || uid.length !== 5 || !/^\d+$/.test(uid)) {
      setFormError('Please enter exactly 5 digits');
      return;
    }
    
    fetchReservations();
  };

  // Handle reservation cancellation
  const handleCancelReservation = async (transactionId) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/equipment/cancel-reservation/${transactionId}`);
      
      // Update UI without refreshing
      setReservations(prev => {
        // Find and update the reservation in pending
        const updatedPending = prev.pending.map(res => {
          if (res.transaction_id === transactionId) {
            return { ...res, checkout_date: null, isCancelled: true };
          }
          return res;
        });
        
        // Find the cancelled reservation to add to cancelled tab
        const cancelledReservation = prev.pending.find(res => 
          res.transaction_id === transactionId
        );
        
        return {
          ...prev,
          pending: updatedPending,
          cancelled: cancelledReservation ? 
            [{ ...cancelledReservation, checkout_date: null }, ...prev.cancelled] : 
            prev.cancelled
        };
      });
    } catch (err) {
      console.error('Cancellation failed:', err);
      setError('Failed to cancel reservation. Please try again.');
    }
  };

  // Render pending table with cancellation button
  const renderPendingTable = () => {
    if (reservations.pending.length === 0) {
      return <p className="text-center py-4">No pending reservations</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Equipment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Name & Variant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Reservation Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Intended Checkout
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Remarks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.pending.map((res) => (
              <tr key={res.transaction_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img 
                    src={res.image_url} 
                    alt={res.product_name} 
                    className="h-16 w-16 object-contain"
                  />
                </td>
                <td className="px-6 py-4 max-w-[200px]">
                  <div className="font-medium text-gray-900 whitespace-normal">
                    {res.product_name}
                  </div>
                  {res.variant && (
                    <div className="text-gray-500 whitespace-normal">
                      {res.variant}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {moment(res.reserve_date).format('HH:mm DD MMM YYYY')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {res.checkout_date && !res.isCancelled ? (
                    moment(res.checkout_date).format('DD MMM YYYY')
                  ) : 'N/A'}
                </td>
                <td className="px-6 py-4 max-w-[200px] whitespace-normal">
                  {res.remarks || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  {res.checkout_date && !res.isCancelled ? (
                    <button
                      onClick={() => handleCancelReservation(res.transaction_id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Cancel Reservation
                    </button>
                  ) : (
                    <span className="text-gray-600">Reservation cancelled</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render the cancelled reservations table
  const renderCancelledTable = () => {
    if (reservations.cancelled.length === 0) {
      return <p className="text-center py-4">No cancelled reservations</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Equipment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Name & Variant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Reservation Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.cancelled.map((res) => (
              <tr key={res.transaction_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img 
                    src={res.image_url} 
                    alt={res.product_name} 
                    className="h-16 w-16 object-contain"
                  />
                </td>
                <td className="px-6 py-4 max-w-[200px]">
                  <div className="font-medium text-gray-900 whitespace-normal">
                    {res.product_name}
                  </div>
                  {res.variant && (
                    <div className="text-gray-500 whitespace-normal">
                      {res.variant}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {moment(res.reserve_date).format('HH:mm DD MMM YYYY')}
                </td>
                <td className="px-6 py-4 max-w-[200px] whitespace-normal">
                  {res.remarks || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render table for checked out and checked in reservations
  const renderTable = (reservations, tabType) => {
    if (reservations.length === 0) {
      return <p className="text-center py-4">No reservations found</p>;
    }
  
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Equipment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Name & Variant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                {tabType === 'pending' ? 'Reservation Date' : 
                 tabType === 'checkedout' ? 'Reservation Date' : 'Reservation Date'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                {tabType === 'pending' ? 'Intended Checkout' : 
                 tabType === 'checkedout' ? 'Checkout Date' : 'Checkout Date'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                {tabType === 'pending' ? 'Remarks' : 
                 tabType === 'checkedout' ? 'Return Date' : 'Check-in Date'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.map((res) => (
              <tr key={res.transaction_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img 
                    src={res.image_url} 
                    alt={res.product_name} 
                    className="h-16 w-16 object-contain"
                  />
                </td>
                <td className="px-6 py-4 max-w-[200px]">
                  <div className="font-medium text-gray-900 whitespace-normal">
                    {res.product_name}
                  </div>
                  {res.variant && (
                    <div className="text-gray-500 whitespace-normal">
                      {res.variant}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {moment(res.reserve_date).format('HH:mm DD MMM YYYY')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tabType === 'pending' ? (
                    moment(res.checkout_date).format('DD MMM YYYY')
                  ) : tabType === 'checkedout' ? (
                    moment(res.checkout_date).format('HH:mm DD MMM YYYY')
                  ) : (
                    moment(res.checkout_date).format('HH:mm DD MMM YYYY')
                  )}
                </td>
                <td className="px-6 py-4 max-w-[200px]">
                  {tabType === 'pending' ? (
                    <div className="whitespace-normal">
                      {res.remarks || 'N/A'}
                    </div>
                  ) : tabType === 'checkedout' ? (
                    moment(res.return_date).format('DD MMM YYYY')
                  ) : (
                    moment(res.checkin_date).format('HH:mm DD MMM YYYY')
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="max-w-full mx-auto">
      {isLoading ? (
        <div className="text-center py-8">Loading reservations...</div>
      ) : isSubmitted ? (
        // Reservations display
        <div>
          <h2 className="text-2xl font-bold mb-2 py-2">
            {getGreeting()}, {studentName || 'User'}!
          </h2>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-3 px-6 font-medium ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Checkout
            </button>
            <button
              className={`py-3 px-6 font-medium ${
                activeTab === 'checkedout'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('checkedout')}
            >
              Checked Out
            </button>
            <button
              className={`py-3 px-6 font-medium ${
                activeTab === 'checkedin'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('checkedin')}
            >
              Checked In
            </button>
            <button
              className={`py-3 px-6 font-medium ${
                activeTab === 'cancelled'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled Reservations
            </button>
          </div>
          
          {/* Tab Content */}
          {isLoading ? (
            <div className="text-center py-8">Loading reservations...</div>
          ) : (
            <div>
              {activeTab === 'pending' && renderPendingTable()}
              {activeTab === 'checkedout' && renderTable(reservations.checkedout, 'checkedout')}
              {activeTab === 'checkedin' && renderTable(reservations.checkedin, 'checkedin')}
              {activeTab === 'cancelled' && renderCancelledTable()}
            </div>
          )}
          
          <div className="mt-8">
            <button
              onClick={() => {
                setUid('');
                setStudentName('');
                setReservations({ pending: [], checkedout: [], checkedin: [], cancelled: [] });
                setError('');
                setIsSubmitted(false);
              }}
              className="flex items-center text-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Search Another UID
            </button>
          </div>
        </div>
      ) : (
        // Show form only if not initial load with UID
        !(isInitialLoad && uid) && (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">View My Reservations</h2>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            <form onSubmit={handleUidSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Last 5 Digits of UID
                </label>
                <input
                  type="text"
                  className={`w-full rounded-md border ${
                    formError ? 'border-red-500' : 'border-gray-300'
                  } shadow-sm px-4 py-2`}
                  value={uid}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setUid(value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g., 12345"
                />
                {formError && (
                  <p className="text-red-500 text-sm mt-1">{formError}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'View Reservations'}
              </button>
            </form>
          </div>
        )
      )}

      {/* Show loading if initial load with UID */}
      {isInitialLoad && uid && (
        <div className="text-center py-8">Loading your reservations...</div>
      )}
    </div>
  );
};

export default Equipment_MyReservations;
