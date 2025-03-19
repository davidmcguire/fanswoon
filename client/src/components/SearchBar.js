import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Add click event listener to close results when clicking outside
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

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/users/search?query=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to search users');
        }

        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search requests
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setShowResults(true);
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    setShowResults(false);
    setQuery('');
  };

  return (
    <div className="search-container" ref={searchRef}>
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={handleInputChange}
          className="search-input"
          onFocus={() => setShowResults(true)}
        />
        <i className="search-icon">🔍</i>
      </div>
      
      {showResults && (query.trim() || results.length > 0) && (
        <div className="search-results">
          {isLoading ? (
            <div className="search-loading">Loading...</div>
          ) : results.length > 0 ? (
            results.map(user => (
              <div 
                key={user._id} 
                className="search-result-item"
                onClick={() => handleUserClick(user._id)}
              >
                <div className="search-result-avatar">
                  {user.picture ? (
                    <img src={user.picture} alt={`${user.name}'s avatar`} />
                  ) : (
                    <div className="avatar-placeholder">{user.name[0]}</div>
                  )}
                </div>
                <div className="search-result-info">
                  <div className="search-result-name">{user.name}</div>
                  <div className="search-result-bio">{user.bio || 'No bio available'}</div>
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div className="search-no-results">No users found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 