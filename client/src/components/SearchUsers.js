import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaDollarSign, FaUser, FaMicrophone } from 'react-icons/fa';
import api from '../utils/api';
import './SearchUsers.css';

const SearchUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  // Memoize the performSearch function
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/users/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
      setShowResults(true);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Debounce search to avoid too many API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, performSearch]);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowResults(true);
    }
  };
  
  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    setShowResults(false);
    setSearchQuery('');
  };
  
  const handlePricingClick = (userId, e) => {
    e.stopPropagation(); // Prevent triggering the parent click
    navigate(`/profile/${userId}#pricing`);
    setShowResults(false);
    setSearchQuery('');
  };
  
  // Add this new function to handle key press events
  const handleKeyPress = (e) => {
    // If Enter key is pressed and we have search results
    if (e.key === 'Enter' && searchResults.length > 0) {
      // Navigate to the first result's profile
      handleUserClick(searchResults[0]._id);
    }
  };
  
  return (
    <div className="search-users-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search users..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onKeyDown={handleKeyPress}
        />
      </div>
      
      {showResults && (
        <div className="search-results">
          {isLoading ? (
            <div className="search-loading">Searching...</div>
          ) : error ? (
            <div className="search-error">{error}</div>
          ) : searchResults.length === 0 ? (
            <div className="search-no-results">
              {searchQuery.trim().length >= 2 ? 'No users found' : 'Type at least 2 characters to search'}
            </div>
          ) : (
            <ul className="search-results-list">
              {searchResults.map(user => (
                <li 
                  key={user._id} 
                  className="search-result-item"
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="search-result-user">
                    {user.picture ? (
                      <img 
                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${user.picture}`} 
                        alt={user.name} 
                        className="search-result-avatar"
                      />
                    ) : (
                      <div className="search-result-avatar-placeholder">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div className="search-result-info">
                      <div className="search-result-name">
                        {user.displayName || user.name}
                        {user.acceptsRequests && (
                          <span className="accepts-requests-badge" title="Accepts audio requests">
                            <FaMicrophone />
                          </span>
                        )}
                      </div>
                      {user.profession && (
                        <div className="search-result-profession">{user.profession}</div>
                      )}
                      {user.bio && (
                        <div className="search-result-bio">{user.bio.substring(0, 60)}{user.bio.length > 60 ? '...' : ''}</div>
                      )}
                    </div>
                  </div>
                  <div className="search-result-actions">
                    {user.acceptsRequests && user.hasPricingOptions && (
                      <button 
                        className="search-result-pricing-btn"
                        onClick={(e) => handlePricingClick(user._id, e)}
                        title="View pricing options"
                      >
                        <FaDollarSign />
                      </button>
                    )}
                    <button 
                      className="search-result-profile-btn"
                      onClick={() => handleUserClick(user._id)}
                      title="View profile"
                    >
                      <FaUser />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchUsers; 