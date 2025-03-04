
import { Link } from 'react-router-dom';
import { getProperties, getRealEstateNews } from '../utils/api';
import './Dashboard.css';

const Dashboard = ({ currentLanguage }) => {
  const [properties, setProperties] = useState([]);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [news, setNews] = useState([]);
  const [statistics, setStatistics] = useState({
    totalProperties: 0,
    featuredProperties: 0,
    newListingsThisWeek: 0,

  });
  const [loading, setLoading] = useState({
    properties: true,
    news: true
  });
  const [error, setError] = useState({
    properties: null,
    news: null
  });
  

    setLoading(prev => ({ ...prev, properties: true }));
    setError(prev => ({ ...prev, properties: null }));
    
    try {
      // Fetch properties from different cities to showcase variety
      const cities = ['New-Delhi', 'Mumbai', 'Bangalore'];
      const propertyPromises = cities.map(city => {
        const searchParams = {
          bedrooms: '2,3',
          city: city
        };
        return getProperties(searchParams);
      });
      
      const responses = await Promise.all(propertyPromises);
      
      // Combine all property results
      let allProperties = [];
      responses.forEach(response => {

        }
      });
      
      // Handle case where no properties were found
      if (allProperties.length === 0) {
        setError(prev => ({ 
          ...prev, 
          properties: 'No properties found across selected cities' 
        }));
        setLoading(prev => ({ ...prev, properties: false }));
        return;
      }
      

      });
      
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        properties: 'Error connecting to property service' 
      }));
      console.error('Property fetch error:', err);
    }
    
    setLoading(prev => ({ ...prev, properties: false }));

    setLoading(prev => ({ ...prev, news: true }));
    setError(prev => ({ ...prev, news: null }));
    
    try {
      const response = await getRealEstateNews(4); // Get 4 news articles
      
      if (response.success) {
        setNews(response.data || []);
      } else {
        setError(prev => ({ 
          ...prev, 
          news: response.message || 'Failed to fetch news' 
        }));
      }
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        news: 'Error connecting to news service' 
      }));
      console.error('News fetch error:', err);
    }
    
    setLoading(prev => ({ ...prev, news: false }));

  
  // Helper to format news publication date
  const formatNewsDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Real Estate Dashboard</h2>
        <div className="dashboard-actions">
          <Link to="/properties" className="action-button">
            View All Properties
          </Link>
        </div>
      </div>
      
      {/* Quick stats section */}
      <section className="stats-section">
        {loading.properties ? (
          <div className="loading-stats">Loading statistics...</div>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-value">{statistics.totalProperties}</div>
              <div className="stat-label">Total Properties</div>
            </div>

            </div>
          </>
        )}
      </section>
      
      <div className="dashboard-grid">
        {/* Featured Properties Section */}
        <section className="dashboard-section featured-properties">
          <h3>Featured Properties</h3>
          {loading.properties ? (
            <div className="loading-indicator">Loading properties...</div>
          ) : error.properties ? (
            <div className="error-message">{error.properties}</div>
          ) : featuredProperties.length === 0 ? (
            <p className="no-data-message">No properties available</p>
          ) : (
            <div className="property-grid">
              {featuredProperties.map((property, index) => (
                <div key={property.id || index} className="property-card">
                  <div className="property-image">
                    {property.imageUrl ? (
                      <img src={property.imageUrl} alt={property.title} onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=Property';
                      }} />
                    ) : (
                      <div className="placeholder-image">No Image</div>
                    )}

                  </div>
                  <div className="property-details">
                    <h4 className="property-title">{property.title}</h4>
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
                    <a 
                      href={property.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="view-property-btn"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="view-all-link">
            <Link to="/properties">View All Properties</Link>
          </div>
        </section>
        
        {/* Latest Properties Section */}
        <section className="dashboard-section latest-properties">
          <h3>Latest Properties</h3>
          {loading.properties ? (
            <div className="loading-indicator">Loading properties...</div>
          ) : error.properties ? (
            <div className="error-message">{error.properties}</div>
          ) : properties.length === 0 ? (
            <p className="no-data-message">No properties available</p>
          ) : (
            <div className="latest-properties-list">
              {properties.slice(4, 10).map((property, index) => (
                <div key={property.id || index} className="latest-property-item">
                  <div className="property-mini-image">
                    {property.imageUrl ? (
                      <img src={property.imageUrl} alt={property.title} onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/80x80?text=Property';
                      }} />
                    ) : (
                      <div className="placeholder-mini-image">No Image</div>
                    )}

                  </div>
                  <div className="latest-property-details">
                    <h4 className="property-title">{property.title}</h4>
                    <p className="property-location">{property.location}</p>
                    <div className="property-mini-features">
                      {property.bedrooms && <span>{property.bedrooms} BHK</span>}
                      {property.area && <span> • {property.area}</span>}
                      {property.price && <span> • {property.price}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Real Estate News Section */}
        <section className="dashboard-section real-estate-news">
          <h3>Real Estate News</h3>
          {loading.news ? (
            <div className="loading-indicator">Loading news...</div>
          ) : error.news ? (
            <div className="error-message">{error.news}</div>
          ) : news.length === 0 ? (
            <p className="no-data-message">No news available</p>
          ) : (
            <div className="news-list">
              {news.map((article, index) => (
                <div key={index} className="news-item">
                  {article.urlToImage && (
                    <div className="news-image">
                      <img 
                        src={article.urlToImage} 
                        alt={article.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/100x100?text=News';
                        }} 
                      />
                    </div>
                  )}
                  <div className="news-content">
                    <h4 className="news-title">
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {article.title}
                      </a>
                    </h4>
                    <p className="news-source">
                      {article.source?.name || 'Unknown source'} • {formatNewsDate(article.publishedAt)}
                    </p>
                    <p className="news-description">{article.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;