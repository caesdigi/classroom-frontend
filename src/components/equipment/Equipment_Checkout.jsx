import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import moment from 'moment';

const Equipment_Checkout = () => {
  const [pendingCheckouts, setPendingCheckouts] = useState([]);
  const [filteredCheckouts, setFilteredCheckouts] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [returnDates, setReturnDates] = useState({});
  const [useDefaultDate] = useState(true); // Change to false to disable default dates

  // Fetch pending checkout data
  const fetchPendingCheckouts = async () => {
    try {
        setIsLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/equipment/pending-checkout`);
        
        // Initialize return dates conditionally
        const initialReturnDates = {};
        if (useDefaultDate) {
        const defaultReturnDate = new Date('2025-07-17'); //Change this to update the default return date
        response.data.forEach(item => {
            initialReturnDates[item.transaction_id] = defaultReturnDate;
        });
        }

        setPendingCheckouts(response.data);
        setFilteredCheckouts(response.data);
        setReturnDates(initialReturnDates);
        setLastFetchTime(new Date());

    } catch (error) {
        console.error('Error fetching pending checkouts:', error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCheckouts();
  }, []);

  useEffect(() => {
    // Only set defaults if the feature is enabled
    if (useDefaultDate) {
        const newItems = pendingCheckouts.filter(
        item => !returnDates[item.transaction_id]
        );
        
        if (newItems.length > 0) {
        const defaultReturnDate = new Date('2025-07-16');
        const updatedReturnDates = { ...returnDates };
        
        newItems.forEach(item => {
            updatedReturnDates[item.transaction_id] = defaultReturnDate;
        });
        
        setReturnDates(updatedReturnDates);
        }
    }
    }, [pendingCheckouts, useDefaultDate]);

  // Handle equipment filter change
  useEffect(() => {
    let result = pendingCheckouts;

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
    
    setFilteredCheckouts(result);
  }, [selectedEquipment, searchTerm, pendingCheckouts]);

  // Handle checkout process
  const handleCheckout = async (transactionId) => {
    try {
      const returnDate = returnDates[transactionId];
      if (!returnDate) return;
      
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/equipment/checkout/${transactionId}`,
        { returnDate: moment(returnDate).format('YYYY-MM-DD') }
      );
      
      // Update UI to show success
      setPendingCheckouts(prev => prev.map(item => 
        item.transaction_id === transactionId 
            ? { ...item, checkoutStatus: 'success' } 
            : item
        ));
    } catch (error) {
      console.error('Checkout failed:', error);
      // Update UI to show failure
      setPendingCheckouts(prev => prev.map(item => 
        item.transaction_id === transactionId 
          ? { ...item, checkoutStatus: 'failed' } 
          : item
      ));
    }
  };

  // Get unique equipment names for dropdown
  const equipmentOptions = [...new Set(pendingCheckouts.map(item => item.product_name))].sort();

  // Date picker configuration
  const isWeekday = date => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setDate(minDate.getDate() + 90);

  if (isLoading) {
    return <div className="text-center py-8">Loading records...</div>;
  }

  return (
    <div className="max-w-full mx-auto">
      {/* Sticky header container */}
      <div className="sticky top-0 z-50 bg-white py-2">
        {/* Filter controls */}
        <div className="mb-6 flex gap-4 flex-wrap">  {/* Removed margin-bottom from here */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Equipment
            </label>
            <select
              className="w-full rounded-md border border-gray-300 shadow-sm p-2"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
            >
              <option value="all">All equipment pending checkout</option>
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
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>
            {filteredCheckouts.filter(item => item.checkoutStatus !== 'success').length} 
            {filteredCheckouts.filter(item => item.checkoutStatus !== 'success').length === 1 ? ' piece' : ' pieces'} of equipment pending checkout
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
              onClick={fetchPendingCheckouts}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
                Intended Checkout
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Remarks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                Return Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Checkout
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCheckouts.map((item) => (
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
                  {moment(item.checkout_date).format('DD MMM YYYY')}
                </td>
                <td className="px-6 py-4 max-w-[200px] whitespace-normal">
                  {item.remarks || 'N/A'}
                </td>
                <td className="px-6 py-4">
                {item.checkoutStatus === 'success' ? (
                    <div className="w-full rounded-md border border-gray-300 p-2 bg-gray-100">
                    {moment(returnDates[item.transaction_id]).format('YYYY-MM-DD')}
                    </div>
                ) : (
                    <DatePicker
                    selected={returnDates[item.transaction_id]}
                    onChange={(date) => setReturnDates(prev => ({
                        ...prev,
                        [item.transaction_id]: date
                    }))}
                    minDate={minDate}
                    maxDate={maxDate}
                    filterDate={isWeekday}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Select a return date"
                    className="w-full rounded-md border border-gray-300 shadow-sm p-2"
                    dayClassName={date => 
                        isWeekday(date) ? 'text-green-600' : 'text-gray-400'
                    }
                    disabled={item.checkoutStatus === 'success'}
                    />
                )}
                </td>
                <td className="px-6 py-4">
                    {item.checkoutStatus === 'success' ? (
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    ) : item.checkoutStatus === 'failed' ? (
                    <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded">
                      Checkout Failed
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(item.transaction_id)}
                      disabled={!returnDates[item.transaction_id]}
                      className={`px-3 py-1 rounded ${
                        returnDates[item.transaction_id] 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Check out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Equipment_Checkout;
