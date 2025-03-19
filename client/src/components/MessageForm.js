import React, { useState } from 'react';
import styled from 'styled-components';
import Button from './Button';
import api from '../utils/api';

const FormContainer = styled.div`
  margin-bottom: 2rem;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  font-family: ${props => props.theme.fonts.body};
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(138, 43, 226, 0.2);
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

const SuccessMessage = styled.div`
  color: ${props => props.theme.colors.success};
  background-color: rgba(52, 199, 89, 0.1);
  border: 1px solid rgba(52, 199, 89, 0.2);
  border-radius: ${props => props.theme.borderRadius.small};
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const MessageForm = ({ recipientId, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/api/messages', {
        recipientId,
        content: message,
        type: 'GENERAL'
      });
      
      setSuccess('Message sent successfully!');
      setMessage('');
      
      if (onMessageSent) {
        onMessageSent(response.data);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error sending message:', err);
      if (err.response) {
        setError(err.response.data.message || 'Failed to send message. Please try again.');
      } else if (err.request) {
        setError('Network error - could not connect to server. Please try again.');
      } else {
        setError(err.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <h3>Send Message</h3>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <StyledForm onSubmit={handleSubmit}>
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          required
          disabled={loading}
        />
        
        <Button 
          type="submit" 
          $variant="primary"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </StyledForm>
    </FormContainer>
  );
};

export default MessageForm; 