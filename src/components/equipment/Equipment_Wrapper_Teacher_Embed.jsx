import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Equipment_Catalogue from './Equipment_Catalogue';
import Equipment_Reserve from './Equipment_Reserve';
import Equipment_MyReservations from './Equipment_MyReservations';
import Equipment_Checkout from './Equipment_Checkout';
import Equipment_Checkin from './Equipment_Checkin';

const Equipment_Wrapper = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('catalogue');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Reset selected equipment when changing tabs
  const handleTabChange = (tab) => {
    if (tab !== 'reserve') {
      setSelectedEquipment(null);
      setSelectedVariant(null);
    }
    setActiveTab(tab);
  };

  // Add this useEffect to clear UID when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('reservationUid');
    };
  }, []);

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-1">
        <button
          className={`py-4 px-6 font-medium text-sm ${
            activeTab === 'catalogue'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('catalogue')}
        >
          Equipment Catalogue
        </button>
        <button
          className={`py-4 px-6 font-medium text-sm ${
            activeTab === 'reserve'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('reserve')}
        >
          Reserve
        </button>
        <button
          className={`py-4 px-6 font-medium text-sm ${
            activeTab === 'myreservations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('myreservations')}
        >
          My Reservations
        </button>
        <button
          className={`py-4 px-6 font-medium text-sm ${
            activeTab === 'checkout'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('checkout')}
        >
          Checkout
        </button>
        <button
          className={`py-4 px-6 font-medium text-sm whitespace-nowrap ${
            activeTab === 'checkin'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('checkin')}
        >
          Check-In
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-1 pt-4">
        {activeTab === 'catalogue' ? (
          <Equipment_Catalogue 
            onSelectEquipment={setSelectedEquipment}
            onReserve={(equipment, variant) => {
              setSelectedEquipment(equipment);
              setSelectedVariant(variant);
              setActiveTab('reserve');
            }}
          />
        ) : activeTab === 'reserve' ? (
          <Equipment_Reserve 
            equipment={selectedEquipment} 
            variant={selectedVariant}
            onBack={() => {
              setSelectedEquipment(null);
              setSelectedVariant(null);
              setActiveTab('catalogue');
            }}
            onSuccess={() => {
              setSelectedEquipment(null);
              setSelectedVariant(null);
              setActiveTab('myreservations');
            }}
          />
        ) : activeTab === 'myreservations' ? (
          <Equipment_MyReservations />
        ) : activeTab === 'checkout' ? (
          <Equipment_Checkout />
        ) : (
          <Equipment_Checkin />
        )}
      </div>
    </div>
  );
};

export default Equipment_Wrapper;