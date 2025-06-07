import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Equipment_Catalogue from './Equipment_Catalogue';
import Equipment_Reserve from './Equipment_Reserve';
import Equipment_MyReservations from './Equipment_MyReservations';

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
      {/* Top Bar */}
      <div className="bg-gray-800 text-white py-3 px-4 shadow-md sticky top-0 z-50">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-blue-300 hover:text-white transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">Back to Home</span>
          </button>
          
          <h1 className="text-lg md:text-xl font-bold text-white">
            Equipment Reservation System
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4">
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
      </div>

      {/* Tab Content */}
      <div className="p-4">
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
        ) : (
          <Equipment_MyReservations />
        )}
      </div>
    </div>
  );
};

export default Equipment_Wrapper;