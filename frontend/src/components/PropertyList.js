import React, { useState, useEffect } from 'react';
import { getProperties } from '../utils/api';
import './PropertyList.css';

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    bedrooms: '2,3',
    propertyType: '',
    city: 'New-Delhi'
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    const response = await getProperties(filters);
    
    setLoading(false);
    
    if (response.success) {
      setProperties(response.data.properties || []);
    } else {
      setError(response.message || 'Failed to fetch properties');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  return (
    <div className="property-list-container">
      <h2>Property Listings</h2>
      
      {/* Filters Form */}
      <form className="filters-form" onSubmit={handleFilterSubmit}>
        <div className="filter-group">
          <label>City</label>
          <select name="city" value={filters.city} onChange={handleFilterChange}>
            <option value="New-Delhi">New Delhi</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Pune">Pune</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Bedrooms</label>
          <select name="bedrooms" value={filters.bedrooms} onChange={handleFilterChange}>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
            <option value="2,3">2 & 3 BHK</option>
          </select>
        </div>
        
        <button type="submit" className="search-btn">Search Properties</button>
      </form>
      
      {/* Loading and Error states */}
      {loading && <div className="loading-indicator">Loading properties...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {/* Property Cards */}
      <div className="property-grid">
        {properties.length === 0 && !loading ? (
          <div className="no-results">No properties found matching your criteria</div>
        ) : (
          properties.map(property => (
            <div key={property.id} className="property-card">
              <div className="property-image">
                {property.imageUrl ? (
                  <img src={property.imageUrl} alt={property.title} />
                ) : (
                  <div className="placeholder-image">No Image</div>
                )}
              </div>
              
              <div className="property-details">
                <h3 className="property-title">{property.title}</h3>
                <p className="property-location">{property.location}</p>
                <div className="property-features">
                  {property.bedrooms && (
                    <span className="feature-item">{property.bedrooms} BHK</span>
                  )}
                  {property.area && (
                    <span className="feature-item">{property.area}</span>
                  )}
                </div>
                <div className="property-price">{property.price}</div>
                <a href={property.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                  View on MagicBricks
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PropertyList;