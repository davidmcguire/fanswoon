import React from 'react';
import { Routes, Route, Navigate, createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from 'styled-components';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import UploadResult from './pages/UploadResult';
import AudioHistory from './pages/AudioHistory';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import AdminDashboard from './pages/AdminDashboard';
import RequestForm from './components/RequestForm';
import RequestConfirmation from './pages/RequestConfirmation';
import RequestInbox from './pages/RequestInbox';
import Inbox from './pages/Inbox';
import SentMessages from './pages/SentMessages';
import ComposeMessage from './pages/ComposeMessage';
import './App.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || ''; // You'll need to add your client ID to .env file

// Theme configuration
const theme = {
  colors: {
    primary: '#8A2BE2', // Bright purple
    primaryLight: '#9D4EDD',
    primaryDark: '#6A0DAD',
    text: '#333333',
    textLight: '#666666',
    background: '#FFFFFF',
    backgroundDark: '#F5F5F5',
    border: '#E0E0E0',
    error: '#FF3B30',
    success: '#34C759'
  },
  fonts: {
    body: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    heading: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    round: '50%'
  },
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.05)',
    large: '0 10px 15px rgba(0, 0, 0, 0.05)'
  }
};

// Layout component that includes Navbar
const Layout = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

// Create router with future flags enabled
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "login",
        element: <Login />
      },
      {
        path: "register",
        element: <Register />
      },
      {
        path: "upload",
        element: <Upload />
      },
      {
        path: "upload/result",
        element: <UploadResult />
      },
      {
        path: "audio-history",
        element: <AudioHistory />
      },
      {
        path: "profile",
        element: <Profile />
      },
      {
        path: "profile/:userId",
        element: <PublicProfile />
      },
      {
        path: "user/:userId",
        element: <PublicProfile />
      },
      {
        path: "request/confirmation/:requestId",
        element: <RequestConfirmation />
      },
      {
        path: "request/:userId/:optionId",
        element: <RequestForm />
      },
      {
        path: "requests",
        element: <RequestInbox />
      },
      {
        path: "inbox",
        element: <Inbox />
      },
      {
        path: "sent",
        element: <SentMessages />
      },
      {
        path: "compose",
        element: <ComposeMessage />
      },
      {
        path: "compose/:userId",
        element: <ComposeMessage />
      },
      {
        path: "admin/dashboard",
        element: <AdminDashboard />
      },
      {
        path: "*",
        element: <Navigate to="/" replace />
      }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App; 