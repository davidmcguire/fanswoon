import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FaLink, FaMusic, FaVideo, FaPodcast, FaGlobe, FaTwitter, FaInstagram, FaFacebook, FaYoutube, FaSoundcloud, FaSpotify, FaDollarSign, FaClock, FaEnvelope } from 'react-icons/fa';
import './Profile.css';

const PublicProfile = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You need to be logged in to view this profile');
          setLoading(false);
          return;
        }
        
        // Fetch user data
        const userResponse = await fetch(`http://localhost:5001/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (userResponse.status === 404) {
          setError(`User "${userId}" not found. Please check the username and try again.`);
          setLoading(false);
          return;
        }
        
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.message || 'Failed to fetch user profile');
        }
        
        const userData = await userResponse.json();
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.message || 'Failed to load user profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId]);

  // Scroll to pricing section if hash is present
  useEffect(() => {
    if (location.hash === '#pricing' && !loading && user) {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        setTimeout(() => {
          pricingSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, [location.hash, loading, user]);

  const getIconComponent = (type, icon) => {
    switch (type) {
      case 'music':
        return <FaMusic />;
      case 'video':
        return <FaVideo />;
      case 'podcast':
        return <FaPodcast />;
      case 'social':
        switch (icon) {
          case 'twitter':
            return <FaTwitter />;
          case 'instagram':
            return <FaInstagram />;
          case 'facebook':
            return <FaFacebook />;
          case 'youtube':
            return <FaYoutube />;
          case 'soundcloud':
            return <FaSoundcloud />;
          case 'spotify':
            return <FaSpotify />;
          default:
            return <FaLink />;
        }
      case 'website':
      default:
        return <FaGlobe />;
    }
  };

  const handleSendMessage = () => {
    navigate(`/compose/${userId}`);
  };

  if (loading) {
    return <div className="public-profile-container loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="public-profile-container error">{error}</div>;
  }

  if (!user) {
    return <div className="public-profile-container error">User not found</div>;
  }

  const themeClass = user.profileTheme ? `profile-theme-${user.profileTheme}` : '';

  return (
    <div className={`public-profile-container ${themeClass}`}>
      <div className="public-profile-header">
        <div className="public-profile-image">
          {user.picture ? (
            <img src={`http://localhost:5001${user.picture}`} alt={`${user.name}'s profile`} />
          ) : (
            <div className="public-profile-image-placeholder">
              {user.name.charAt(0)}
            </div>
          )}
        </div>
        <h1 className="public-profile-name">{user.displayName || user.name}</h1>
        {user.profession && <p className="public-profile-profession">{user.profession}</p>}
        {user.location && <p className="public-profile-location">{user.location}</p>}
        {user.bio && <p className="public-profile-bio">{user.bio}</p>}
        
        <div className="public-profile-actions">
          <button 
            className="public-profile-message-button"
            onClick={handleSendMessage}
          >
            <FaEnvelope /> Send Message
          </button>
        </div>
      </div>
      
      <div className="public-profile-links">
        {user.mediaLinks && user.mediaLinks.length > 0 ? (
          user.mediaLinks.map(link => (
            <a 
              key={link._id} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="public-profile-link"
            >
              <div className="public-profile-link-icon">
                {getIconComponent(link.type, link.icon)}
              </div>
              <div className="public-profile-link-content">
                <h3 className="public-profile-link-title">{link.title}</h3>
              </div>
            </a>
          ))
        ) : (
          <p className="no-links">This user hasn't added any links yet.</p>
        )}
      </div>

      {user.acceptsRequests && user.pricingOptions && user.pricingOptions.length > 0 && (
        <div className="public-profile-requests" id="pricing">
          <h2 className="public-profile-section-title">
            {user.requestsInfo?.headline || "Request a personalized audio message"}
          </h2>
          
          {user.requestsInfo?.description && (
            <p className="public-profile-request-description">{user.requestsInfo.description}</p>
          )}
          
          <div className="public-profile-pricing-options">
            {user.pricingOptions.map(option => (
              <div key={option._id} className="public-profile-pricing-option">
                <div className="public-profile-pricing-header">
                  <h3>{option.title}</h3>
                  <div className="public-profile-pricing-price">
                    <FaDollarSign />{option.price.toFixed(2)}
                  </div>
                </div>
                <div className="public-profile-pricing-details">
                  <p className="public-profile-pricing-description">
                    {option.description || 'No description provided'}
                  </p>
                  <p className="public-profile-pricing-delivery">
                    <FaClock /> Delivery in {option.deliveryTime} days
                  </p>
                  <button 
                    className="public-profile-request-button"
                    onClick={() => window.location.href = `/request/${user._id}/${option._id}`}
                  >
                    Request This Option
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile; 