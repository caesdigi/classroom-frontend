import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactModal from 'react-modal';

const Equipment_Reserve = ({ equipment, variant, onBack, onSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    uid: '',
    checkoutDate: '',
    remarks: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservationStatus, setReservationStatus] = useState(null);
  const [dateOptions, setDateOptions] = useState([]);

  // Generate date options (today + next 14 days)
  useEffect(() => {
    const options = ['Please select the intended checkout date'];
    const today = new Date();
    
    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      options.push(date.toISOString().split('T')[0]);
    }
    
    setDateOptions(options);
  }, []);

  // Validation functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    return /^[0-9+]{8,15}$/.test(phone);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    if (!formData.uid) {
      newErrors.uid = 'UID is required';
    } else if (!/^\d{10}$/.test(formData.uid)) {
      newErrors.uid = 'UID must be 10 digits';
    }
    if (!formData.checkoutDate) {
      newErrors.checkoutDate = 'Checkout date is required';
    } else if (formData.checkoutDate === dateOptions[0]) {
      newErrors.checkoutDate = 'Please select a valid date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/equipment/reserve`, {
        product_name: equipment[0].product_name,
        variant: variant?.variant || null,
        student_name: formData.name,
        student_email: formData.email,
        student_phone: formData.phone,
        uid: formData.uid,
        checkout_date: formData.checkoutDate,
        remarks: formData.remarks
      });
      
      if (response.data.success) {
        setReservationStatus('success');
      } else {
        setReservationStatus('error');
      }
    } catch (error) {
      console.error('Reservation failed:', error);
      setReservationStatus('error');
    } finally {
      setIsModalOpen(true);
      setIsSubmitting(false);
    }
  };

  const resetFormAndClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      uid: '',
      checkoutDate: '',
      remarks: ''
    });
    setIsModalOpen(false);
  };

  if (!equipment || !variant) {
    return (
      <div className="max-w-4xl pt-2">
        <p>No equipment selected. Please go back to the catalogue.</p>
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Back to Catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl pt-2">
      <button 
        onClick={onBack}
        className="flex items-center text-blue-600 mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Catalogue
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left: Equipment Image */}
          <div className="md:w-2/5 p-6 bg-gray-50 flex items-center justify-center">
            <img 
              src={variant.image_url} 
              alt={equipment[0].product_name} 
              className="max-h-80 object-contain"
            />
          </div>
          
          {/* Right: Product Info and Form */}
          <div className="md:w-3/5 p-6">
            <h1 className="text-2xl font-bold mb-2">
              {equipment[0].product_name}
            </h1>
            
            {variant.variant && (
              <p className="text-gray-600 mb-6">Variant: {variant.variant}</p>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className={`w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} shadow-sm`}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className={`w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} shadow-sm`}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  className={`w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} shadow-sm`}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              
              {/* UID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UID (10 digits)
                </label>
                <input
                  type="text"
                  className={`w-full rounded-md border ${errors.uid ? 'border-red-500' : 'border-gray-300'} shadow-sm`}
                  value={formData.uid}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      setFormData({...formData, uid: e.target.value.slice(0, 10)})
                    }
                  }}
                />
                {errors.uid && <p className="text-red-500 text-sm mt-1">{errors.uid}</p>}
              </div>
              
              {/* Checkout Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intended Checkout Date
                </label>
                <select
                  className={`w-full rounded-md border ${errors.checkoutDate ? 'border-red-500' : 'border-gray-300'} shadow-sm`}
                  value={formData.checkoutDate}
                  onChange={(e) => setFormData({...formData, checkoutDate: e.target.value})}
                >
                  {dateOptions.map((date, index) => (
                    <option key={index} value={date}>
                      {index === 0 ? date : index === 1 ? `${date} (Today)` : date}
                    </option>
                  ))}
                </select>
                {errors.checkoutDate && <p className="text-red-500 text-sm mt-1">{errors.checkoutDate}</p>}
              </div>
              
              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks (optional)
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 shadow-sm min-h-[100px]"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md ${
                    isSubmitting 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Reservation Modal */}
      <ReactModal
        isOpen={isModalOpen}
        onRequestClose={() => {}}
        className="modal"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
        shouldCloseOnOverlayClick={false}
      >
        <div className="bg-white rounded-lg p-8 max-w-md mx-auto text-center">
          {reservationStatus === 'success' ? (
            <>
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Equipment Successfully Reserved!</h3>
              <p className="mb-6">Your reservation has been confirmed.</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    resetFormAndClose();
                    onBack();
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Back to Catalogue
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('reservationUid', formData.uid.slice(-5));
                    resetFormAndClose();
                    onSuccess();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  See My Reservations
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Reservation Failed</h3>
              <p className="mb-4">Sorry, this piece of equipment is no longer available for checkout.</p>
              <button
                onClick={() => {
                  resetFormAndClose();
                  onBack();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Back to Catalogue
              </button>
            </>
          )}
        </div>
      </ReactModal>
    </div>
  );
};

export default Equipment_Reserve;