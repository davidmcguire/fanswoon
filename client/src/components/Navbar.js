import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from 'react-bootstrap';
import api from '../utils/api';
import SearchUsers from './SearchUsers';
import Logo from './Logo';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (token) {
      fetchUnreadRequests();
      fetchUnreadMessages();

      // Set up polling to check for new messages every minute
      const intervalId = setInterval(() => {
        fetchUnreadMessages();
        fetchUnreadRequests();
      }, 60000); // 60 seconds

      return () => clearInterval(intervalId);
    }
  }, [token]);

  const fetchUnreadRequests = async () => {
    try {
      const response = await api.get('/api/audio-requests/my-orders');
      
      // Get viewed requests from localStorage
      const storedViewedRequests = localStorage.getItem('viewedRequests');
      const viewedRequests = storedViewedRequests ? new Set(JSON.parse(storedViewedRequests)) : new Set();
      
      // Count unread pending requests
      const unreadCount = response.data.filter(
        req => !viewedRequests.has(req._id) && req.status === 'pending'
      ).length;
      
      setUnreadRequests(unreadCount);
    } catch (err) {
      console.error('Error fetching unread requests:', err);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await api.get('/api/messages/unread');
      setUnreadMessages(response.data.count);
    } catch (err) {
      console.error('Error fetching unread messages:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Logo className="navbar-brand" />
      </div>
      
      {token && (
        <div className="navbar-search">
          <SearchUsers />
        </div>
      )}
      
      <div className="navbar-links">
        {!token && (
          <Link to="/login">Login</Link>
        )}
        {token && (
          <>
            <Link to="/upload">Send Audio</Link>
            <Link to="/audio-history">My Audio</Link>
            <Link to="/inbox" className="inbox-link">
              Messages
              {unreadMessages > 0 && (
                <Badge pill bg="danger" className="unread-badge">
                  {unreadMessages}
                </Badge>
              )}
            </Link>
            <Link to="/requests" className="requests-link">
              Requests
              {unreadRequests > 0 && (
                <Badge pill bg="danger" className="unread-badge">
                  {unreadRequests}
                </Badge>
              )}
            </Link>
            <Link to="/profile">My Profile</Link>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 