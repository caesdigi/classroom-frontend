import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Self-Access Portal
        </h1>
        <div className="space-y-6">
          <Link 
            to="/classroom" 
            className="block bg-blue-600 hover:bg-blue-700 text-white text-center py-4 px-6 rounded-lg transition-colors duration-300 shadow-md"
          >
            <h2 className="text-xl font-semibold">Classroom Reservation</h2>
            <p className="mt-2 text-blue-100">Reserve a classroom for your learning activities</p>
          </Link>
          
          <Link 
            to="/equipment" 
            className="block bg-blue-600 hover:bg-blue-700 text-white text-center py-4 px-6 rounded-lg transition-colors duration-300 shadow-md"
          >
            <h2 className="text-xl font-semibold">Equipment Reservation</h2>
            <p className="mt-2 text-blue-100">Reserve equipment for your learning activities</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;