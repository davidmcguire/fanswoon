import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, isAdmin = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (isAdmin && !user.isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default ProtectedRoute; 