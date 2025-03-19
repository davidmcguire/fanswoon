import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FaSearch, FaDollarSign, FaUser, FaMicrophone } from 'react-icons/fa';
import api from '../utils/api';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 1.5rem;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  font-size: 1rem;
  color: ${props => props.theme.colors.text};
  background-color: ${props => props.theme.colors.background};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}20;
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textLight};
`;

const ResultsList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  margin-top: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: ${props => props.theme.shadows.medium};
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.backgroundDark};
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primaryLight};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${props => props.theme.fontWeights.bold};
  margin-right: 1rem;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: ${props => props.theme.fontWeights.medium};
  color: ${props => props.theme.colors.text};
`;

const UserProfession = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textLight};
`;

const UserBio = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme.colors.textLight};
  margin-top: 0.25rem;
`;

const UserActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: ${props => props.theme.colors.textLight};
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const AcceptsRequestsBadge = styled.span`
  color: ${props => props.theme.colors.primary};
  font-size: 0.9rem;
`;

const LoadingMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: ${props => props.theme.colors.textLight};
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: ${props => props.theme.colors.error};
`;

const NoResults = styled.div`
  padding: 1rem;
  text-align: center;
  color: ${props => props.theme.colors.textLight};
`;

const UserSearch = ({ onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

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
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setUsers([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/api/users/search?query=${encodeURIComponent(searchQuery)}`);
        setUsers(response.data);
        setShowResults(true);
      } catch (err) {
        console.error('Error searching users:', err);
        setError('Failed to search users');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowResults(true);
    }
  };

  const handleUserSelect = (user) => {
    onSelectUser(user);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && users.length > 0) {
      handleUserSelect(users[0]);
    }
  };

  return (
    <SearchContainer ref={searchRef}>
      <SearchInputWrapper>
        <SearchIcon />
        <SearchInput
          type="text"
          placeholder="Search users to message..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onKeyDown={handleKeyPress}
        />
      </SearchInputWrapper>
      
      {showResults && (
        <ResultsList>
          {loading ? (
            <LoadingMessage>Searching...</LoadingMessage>
          ) : error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : users.length === 0 ? (
            <NoResults>
              {searchQuery.trim().length >= 2 ? 'No users found' : 'Type at least 2 characters to search'}
            </NoResults>
          ) : (
            users.map((user) => (
              <UserItem key={user._id} onClick={() => handleUserSelect(user)}>
                <UserInfo>
                  {user.picture ? (
                    <UserAvatar
                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${user.picture}`}
                      alt={user.name}
                    />
                  ) : (
                    <AvatarPlaceholder>
                      {user.name.charAt(0)}
                    </AvatarPlaceholder>
                  )}
                  <UserDetails>
                    <UserName>
                      {user.displayName || user.name}
                      {user.acceptsRequests && (
                        <AcceptsRequestsBadge title="Accepts audio requests">
                          <FaMicrophone />
                        </AcceptsRequestsBadge>
                      )}
                    </UserName>
                    {user.profession && (
                      <UserProfession>{user.profession}</UserProfession>
                    )}
                    {user.bio && (
                      <UserBio>
                        {user.bio.substring(0, 60)}{user.bio.length > 60 ? '...' : ''}
                      </UserBio>
                    )}
                  </UserDetails>
                </UserInfo>
                <UserActions>
                  {user.acceptsRequests && user.hasPricingOptions && (
                    <ActionButton
                      title="View pricing options"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/profile/${user._id}#pricing`;
                      }}
                    >
                      <FaDollarSign />
                    </ActionButton>
                  )}
                  <ActionButton
                    title="View profile"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/profile/${user._id}`;
                    }}
                  >
                    <FaUser />
                  </ActionButton>
                </UserActions>
              </UserItem>
            ))
          )}
        </ResultsList>
      )}
    </SearchContainer>
  );
};

export default UserSearch; 