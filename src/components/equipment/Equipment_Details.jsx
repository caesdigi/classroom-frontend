import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Equipment_Details = ({ productName, onBack, onReserve }) => {
  const [details, setDetails] = useState([]);
  const [currentVariant, setCurrentVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [variantAvailability, setVariantAvailability] = useState({});

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/equipment/details/${encodeURIComponent(productName)}`);
        setDetails(res.data);
        setCurrentVariant(res.data[0]);
        
        // Calculate availability for each variant
        const availabilityMap = {};
        res.data.forEach(item => {
          if (!availabilityMap[item.variant]) {
            availabilityMap[item.variant] = false;
          }
          if (item.availability) {
            availabilityMap[item.variant] = true;
          }
        });
        setVariantAvailability(availabilityMap);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching equipment details:", error);
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [productName]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!details.length) {
    return (
      <div className="text-center py-8">
        <p>Equipment details not found</p>
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Back to Catalogue
        </button>
      </div>
    );
  }

  const variants = [...new Set(details.map(d => d.variant))];
  const currentDetail = details.find(d => d.equipment_id === currentVariant?.equipment_id) || details[0];
  const isCurrentAvailable = variantAvailability[currentVariant?.variant] || false;

  return (
    <div className="max-w-6xl pt-2">
      <button 
        onClick={() => {
          // Refresh catalogue on back
          window.location.reload();
          onBack();
        }}
        className="flex items-center text-blue-600 mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Catalogue
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ paddingBottom: '100%' }}>
            <img 
                src={currentDetail.image_url} 
                alt={productName} 
                className="absolute inset-0 w-full h-full object-contain p-4"
            />
            </div>
        </div>
        
        <div className="md:w-1/2">
          <div className="mb-4">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {currentDetail.subtype_name}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">{productName}</h1>
          
          {variants.length > 1 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Variants:</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 text-sm rounded flex items-center ${
                      currentVariant?.variant === variant
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={() => {
                      const selected = details.find(d => d.variant === variant);
                      setCurrentVariant(selected);
                    }}
                  >
                    {variant}
                    <span className={`ml-2 w-2 h-2 rounded-full ${
                      variantAvailability[variant] 
                        ? 'bg-green-500' 
                        : 'bg-gray-400'
                    }`}></span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <button
              onClick={() => onReserve(details, currentVariant)}
              className={`w-full py-3 rounded-lg ${
                isCurrentAvailable
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
              disabled={!isCurrentAvailable}
            >
              {isCurrentAvailable ? 'Reserve Equipment' : 'Not Available'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Equipment_Details;