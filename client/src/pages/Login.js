import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import styled from 'styled-components';
import Logo from '../components/Logo';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import api from '../utils/api';

const LoginContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
`;

const LoginBox = styled(Card)`
  width: 100%;
  max-width: 450px;
  box-shadow: ${props => props.theme.shadows.medium};
`;

const LoginHeader = styled(Card.Header)`
  text-align: center;
  border-bottom: none;
  padding-bottom: 0;
`;

const LoginTitle = styled.h1`
  font-size: 1.75rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.fontWeights.bold};
  margin: 0;
`;

const LoginForm = styled.form`
  width: 100%;
`;

const GoogleLoginContainer = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
  
  span {
    padding: 0 1rem;
    color: ${props => props.theme.colors.textLight};
    font-size: 0.9rem;
  }
`;

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: ${props => props.theme.colors.textLight};
  
  a {
    color: ${props => props.theme.colors.primary};
    font-weight: ${props => props.theme.fontWeights.semibold};
    margin-left: 0.5rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  background-color: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: ${props => props.theme.borderRadius.small};
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    try {
      console.log('Attempting login for:', email);
      
      // Validate inputs
      if (!email || !password) {
        setError('Email and password are required');
        return;
      }
      
      const response = await api.post('/api/auth/login', { email, password });
      console.log('Login response status:', response.status);

      // Store the token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      
      console.log('Login successful');
      
      // Redirect to home page
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(err.response.data.error || 'Login failed');
      } else if (err.request) {
        // The request was made but no response was received
        setError('Network error - could not connect to server. Please make sure the server is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(err.message || 'Login failed');
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const response = await api.post('/api/auth/google', {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
        picture: decoded.picture
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      navigate('/');
    } catch (err) {
      console.error('Google login error:', err);
      if (err.response) {
        setError(err.response.data.message || 'Google login failed');
      } else if (err.request) {
        setError('Network error - could not connect to server. Please make sure the server is running.');
      } else {
        setError(err.message || 'Google login failed');
      }
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <LoginContainer>
      <LoginBox>
        <LoginHeader>
          <Logo size="large" />
          <LoginTitle>Sign In</LoginTitle>
        </LoginHeader>
        
        <Card.Body>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <GoogleLoginContainer>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              shape="pill"
              text="signin_with"
              size="large"
              width="250"
            />
          </GoogleLoginContainer>
          
          <Divider>
            <span>OR</span>
          </Divider>
          
          <LoginForm onSubmit={handleSubmit}>
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            
            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth
            >
              Sign In
            </Button>
          </LoginForm>
          
          <RegisterLink>
            Don't have an account?
            <Link to="/register">Sign Up</Link>
          </RegisterLink>
        </Card.Body>
      </LoginBox>
    </LoginContainer>
  );
};

export default Login; 