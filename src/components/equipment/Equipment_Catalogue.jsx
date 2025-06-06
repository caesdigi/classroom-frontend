import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Equipment_Details from './Equipment_Details';

const Equipment_Catalogue = ({ onSelectEquipment, onReserve }) => {
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [types, setTypes] = useState([]);
  const [subtypes, setSubtypes] = useState([]);
  const [nonEmptySubtypes, setNonEmptySubtypes] = useState([]);
  const [filters, setFilters] = useState({
    typeId: '',
    subtypeId: '',
    itemsPerPage: 4,
    currentPage: 1
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch equipment types (alphabetical order)
        const typesRes = await axios.get(`${import.meta.env.VITE_API_URL}/equipment-types`);
        const sortedTypes = [...typesRes.data].sort((a, b) => 
          a.type_name.localeCompare(b.type_name)
        );
        setTypes(sortedTypes);
        
        // Fetch non-empty subtypes (alphabetical order)
        const subtypesRes = await axios.get(`${import.meta.env.VITE_API_URL}/equipment/non-empty-subtypes`);
        const sortedSubtypes = [...subtypesRes.data].sort((a, b) => 
          a.subtype_name.localeCompare(b.subtype_name)
        );
        setNonEmptySubtypes(sortedSubtypes);
        
        // Set initial subtypes to all non-empty subtypes
        setSubtypes(sortedSubtypes);
        
        // Fetch equipment grouped by product_name (alphabetical order)
        const eqRes = await axios.get(`${import.meta.env.VITE_API_URL}/equipment/catalogue`);
        const sortedEquipment = [...eqRes.data].sort((a, b) => 
          a.product_name.localeCompare(b.product_name)
        );
        setEquipment(sortedEquipment);
        setFilteredEquipment(sortedEquipment);
      } catch (error) {
        console.error("Error fetching equipment data:", error);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    // Filter equipment based on type/subtype
    let filtered = [...equipment];
    
    if (filters.typeId) {
      filtered = filtered.filter(item => item.type_id == filters.typeId);
    }
    
    if (filters.subtypeId) {
      filtered = filtered.filter(item => item.subtype_id == filters.subtypeId);
    }
    
    setFilteredEquipment(filtered);
  }, [filters.typeId, filters.subtypeId, equipment]);

  const handleTypeChange = async (e) => {
    const typeId = e.target.value;
    setFilters({ ...filters, typeId, subtypeId: '' });
    
    if (typeId) {
      // Filter subtypes for selected type
      const typeSubtypes = nonEmptySubtypes.filter(s => s.type_id == typeId);
      setSubtypes(typeSubtypes);
    } else {
      // Show all non-empty subtypes when "All Types" is selected
      setSubtypes(nonEmptySubtypes);
    }
  };

  const paginatedEquipment = filteredEquipment.slice(
    (filters.currentPage - 1) * filters.itemsPerPage,
    filters.currentPage * filters.itemsPerPage
  );

  return (
    <div>
      {selectedProduct ? (
        <Equipment_Details 
          productName={selectedProduct} 
          onBack={() => setSelectedProduct(null)}
          onReserve={onReserve}
        />
      ) : (
        <>
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Items per page</label>
              <select
                className="rounded-md border-gray-300 shadow-sm"
                value={filters.itemsPerPage}
                onChange={e => setFilters({...filters, itemsPerPage: parseInt(e.target.value), currentPage: 1})}
              >
                {[4, 8, 12, 16, 20].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Type</label>
              <select
                className="rounded-md border-gray-300 shadow-sm min-w-[150px]"
                value={filters.typeId}
                onChange={handleTypeChange}
              >
                <option value="">All Types</option>
                {types.map(type => (
                  <option key={type.type_id} value={type.type_id}>
                    {type.type_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Subtype</label>
              <select
                className="rounded-md border-gray-300 shadow-sm min-w-[150px]"
                value={filters.subtypeId}
                onChange={e => setFilters({...filters, subtypeId: e.target.value})}
              >
                <option value="">All Subtypes</option>
                {subtypes.map(subtype => (
                  <option key={subtype.subtype_id} value={subtype.subtype_id}>
                    {subtype.subtype_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedEquipment.map(item => (
              <div 
                key={item.product_name} 
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProduct(item.product_name)}
              >
                <div className="h-48 overflow-hidden flex items-center justify-center bg-gray-100">
                  <img 
                    src={item.image_url} 
                    alt={item.product_name} 
                    className="max-h-full max-w-full object-contain p-2"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-lg mb-2">{item.product_name}</h3>
                  <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                    item.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {item.available ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8">
            {Array.from({ length: Math.ceil(filteredEquipment.length / filters.itemsPerPage) }, (_, i) => (
              <button
                key={i}
                className={`mx-1 px-3 py-1 rounded ${
                  filters.currentPage === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                onClick={() => setFilters({...filters, currentPage: i + 1})}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

<<<<<<< HEAD
export default Equipment_Catalogue;
=======
export default Equipment_Catalogue;
>>>>>>> 1adc8cc3a332a1af960cb61ad278c8b85a8fb5f3
