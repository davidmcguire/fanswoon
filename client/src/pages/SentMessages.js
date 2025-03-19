import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../utils/api';
import { FaPaperPlane } from 'react-icons/fa';
import './Inbox.css';

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${props => props.theme.colors.textLight};
`;

const ActionButton = styled(Button)`
  margin-left: 0.5rem;
`;

const SentIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.colors.textLight};
  font-size: 0.9rem;
`;

const SentMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSentMessages();
  }, []);

  const fetchSentMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/messages/sent');
      setMessages(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching sent messages:', err);
      if (err.response) {
        setError(err.response.data.message || 'Failed to load sent messages');
      } else if (err.request) {
        setError('Network error - could not connect to server');
      } else {
        setError(err.message || 'Failed to load sent messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/api/messages/${messageId}`);
      
      // Remove the message from the local state
      setMessages(messages.filter(msg => msg._id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      // Show error toast or notification here if needed
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const navigateToCompose = () => {
    navigate('/compose');
  };

  const navigateToInbox = () => {
    navigate('/inbox');
  };

  if (loading) {
    return (
      <div className="inbox-container">
        <h1>Sent Messages</h1>
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>Sent Messages</h1>
        <div className="inbox-actions">
          <Button $variant="outline" onClick={navigateToInbox} style={{ marginRight: '10px' }}>
            Inbox
          </Button>
          <Button $variant="primary" onClick={navigateToCompose}>
            New Message
          </Button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {!error && messages.length === 0 ? (
        <Card>
          <Card.Body>
            <EmptyState>
              <p>You haven't sent any messages yet</p>
              <Button $variant="primary" onClick={navigateToCompose}>
                Send a Message
              </Button>
            </EmptyState>
          </Card.Body>
        </Card>
      ) : (
        <div className="messages-list">
          {messages.map((message) => (
            <div 
              key={message._id} 
              className="message-item"
            >
              <div className="message-header">
                <img 
                  src={message.recipient?.picture || '/default-avatar.png'} 
                  alt={message.recipient?.name} 
                  className="sender-avatar"
                />
                <div className="message-info">
                  <h3>To: {message.recipient?.name}</h3>
                  <span className="message-date">{formatDate(message.createdAt)}</span>
                </div>
                <SentIndicator>
                  <FaPaperPlane />
                  Sent
                </SentIndicator>
                {message.type === 'AUDIO_REQUEST' && (
                  <span className="message-type">Audio Request</span>
                )}
              </div>
              <p className="message-content">{message.content}</p>
              {message.type === 'AUDIO_REQUEST' && message.requestDetails && (
                <div className="request-details">
                  <p>Price: ${message.requestDetails.price}</p>
                  <p>Status: {message.requestDetails.status}</p>
                </div>
              )}
              <div className="message-actions">
                <ActionButton 
                  $variant="danger" 
                  $size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMessage(message._id);
                  }}
                >
                  Delete
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentMessages; 