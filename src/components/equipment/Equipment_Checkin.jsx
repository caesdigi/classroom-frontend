// src/components/equipment/Equipment_Checkin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const Equipment_Checkin = () => {
  const [pendingCheckins, setPendingCheckins] = useState([]);
  const [filteredCheckins, setFilteredCheckins] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch pending check-in data
  const fetchPendingCheckins = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/equipment/pending-checkin`);
      setPendingCheckins(response.data);
      setFilteredCheckins(response.data);
      setLastFetchTime(new Date());
    } catch (error) {
      console.error('Error fetching pending check-ins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCheckins();
  }, []);

  // Handle equipment filter change
  useEffect(() => {
    let result = pendingCheckins;

    // Filter by selected equipment
    if (selectedEquipment !== 'all') {
      result = result.filter(item => item.product_name === selectedEquipment);
    }
    
    // Filter by search term (UID or student name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.uid.includes(term) || 
        item.student_name.toLowerCase().includes(term)
      );
    }
    
    setFilteredCheckins(result);
  }, [selectedEquipment, searchTerm, pendingCheckins]);

  // Handle check-in process
  const handleCheckin = async (transactionId, equipmentId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/equipment/checkin/${transactionId}`
      );
      
      // Update UI to show success
      setPendingCheckins(prev => prev.map(item => 
        item.transaction_id === transactionId 
          ? { ...item, checkinStatus: 'success' } 
          : item
      ));
    } catch (error) {
      console.error('Check-in failed:', error);
      // Update UI to show failure
      setPendingCheckins(prev => prev.map(item => 
        item.transaction_id === transactionId 
          ? { ...item, checkinStatus: 'failed' } 
          : item
      ));
    }
  };

  // Get unique equipment names for dropdown
  const equipmentOptions = [...new Set(pendingCheckins.map(item => item.product_name))].sort();

  if (isLoading) {
    return <div className="text-center py-8">Loading records...</div>;
  }

  return (
    <div className="max-w-full mx-auto">
      {/* Sticky header container */}
      <div className="sticky top-0 z-50 bg-white py-2">
        {/* Filter controls */}
        <div className="mb-6 flex gap-4 flex-wrap">  {/* Removed margin-bottom */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Equipment
            </label>
            <select
              className="w-full rounded-md border border-gray-300 shadow-sm p-2"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
            >
              <option value="all">All equipment pending check-in</option>
              {equipmentOptions.map((name, index) => (
                <option key={index} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by UID or Student Name
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 shadow-sm p-2"
              placeholder="Enter UID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Status bar */}
        <div className="flex justify-between items-center text-sm text-gray-500">  {/* Removed margin-bottom */}
          <span>
            {filteredCheckins.filter(item => item.checkinStatus !== 'success').length} 
            {filteredCheckins.filter(item => item.checkinStatus !== 'success').length === 1 ? ' piece' : ' pieces'} of equipment pending check-in
          </span>
          <div className="flex items-center">
            <span>
              Record fetched at {lastFetchTime ? lastFetchTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              }) : '--:--'} {lastFetchTime ? lastFetchTime.toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              }) : ''}
            </span>
            <button 
              onClick={fetchPendingCheckins}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="CurrentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Equipment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Name, Variant & Tag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Student & UID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Reservation Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Checkout Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Return Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Check-In
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCheckins.map((item) => {
              // Check if return date is in the past
              const returnDate = new Date(item.return_date);
              const isLate = returnDate < new Date();
              
              return (
                <tr key={item.transaction_id}>
                  <td className="px-6 py-4">
                    <img 
                      src={item.image_url} 
                      alt={item.product_name} 
                      className="h-16 w-16 object-contain"
                    />
                  </td>
                  <td className="px-6 py-4 max-w-[200px]">
                    <div className="font-medium text-gray-900 whitespace-normal">
                      {item.product_name}
                    </div>
                    {item.variant && (
                      <div className="text-gray-500 whitespace-normal">
                        {item.variant}
                      </div>
                    )}
                    {item.tag && (
                      <div className="text-gray-500 whitespace-normal">
                        {item.tag}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-[150px]">
                    <div className="font-medium text-gray-900 whitespace-normal">
                      {item.student_name}
                    </div>
                    <div className="text-gray-500 whitespace-normal">
                      {item.uid}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {moment(item.reserve_date).format('HH:mm DD MMM YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {moment(item.checkout_date).format('HH:mm DD MMM YYYY')}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${isLate ? 'text-red-600' : ''}`}>
                    {moment(item.return_date).format('DD MMM YYYY')}
                  </td>
                  <td className="px-6 py-4">
                    {item.checkinStatus === 'success' ? (
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : item.checkinStatus === 'failed' ? (
                      <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded">
                        Check-in Failed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckin(item.transaction_id, item.equipment_id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Check-in
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Equipment_Checkin;