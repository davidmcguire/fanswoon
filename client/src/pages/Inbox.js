import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../utils/api';
import { FaEnvelope, FaEnvelopeOpen, FaCheckDouble } from 'react-icons/fa';
import './Inbox.css';

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${props => props.theme.colors.textLight};
`;

const ActionButton = styled(Button)`
  margin-left: 0.5rem;
`;

const ReadIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.read ? props.theme.colors.textLight : props.theme.colors.primary};
  font-size: 0.9rem;
  font-weight: ${props => props.read ? 'normal' : 'bold'};
`;

const MarkAllReadButton = styled(Button)`
  margin-left: auto;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MessageActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ReplyButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${props => props.theme.colors.primaryLight};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.small};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
  }
`;

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/messages');
      setMessages(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (err.response) {
        setError(err.response.data.message || 'Failed to load messages');
      } else if (err.request) {
        setError('Network error - could not connect to server');
      } else {
        setError(err.message || 'Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await api.patch(`/api/messages/${messageId}/read`, {});
      
      // Update the message in the local state
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ));
    } catch (err) {
      console.error('Error marking message as read:', err);
      // Show error toast or notification here if needed
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/api/messages/mark-all-read');
      
      // Update all messages in the local state
      setMessages(messages.map(msg => ({ ...msg, read: true })));
    } catch (err) {
      console.error('Error marking all messages as read:', err);
      // Show error toast or notification here if needed
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

  const handleAcceptRequest = async (messageId) => {
    try {
      // Implement request acceptance logic here
      console.log('Accepting request:', messageId);
      
      // Update the message status in the local state
      setMessages(messages.map(msg => 
        msg._id === messageId ? { 
          ...msg, 
          requestDetails: { 
            ...msg.requestDetails, 
            status: 'ACCEPTED' 
          } 
        } : msg
      ));
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleDeclineRequest = async (messageId) => {
    try {
      // Implement request decline logic here
      console.log('Declining request:', messageId);
      
      // Update the message status in the local state
      setMessages(messages.map(msg => 
        msg._id === messageId ? { 
          ...msg, 
          requestDetails: { 
            ...msg.requestDetails, 
            status: 'DECLINED' 
          } 
        } : msg
      ));
    } catch (err) {
      console.error('Error declining request:', err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const navigateToCompose = () => {
    navigate('/compose');
  };

  const navigateToSent = () => {
    navigate('/sent');
  };

  // Check if there are any unread messages
  const hasUnreadMessages = messages.some(msg => !msg.read);

  const handleReply = (message) => {
    navigate(`/compose/${message.sender._id}`);
  };

  if (loading) {
    return (
      <div className="inbox-container">
        <h1>Inbox</h1>
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>Inbox</h1>
        <div className="inbox-actions">
          <Button $variant="outline" onClick={navigateToSent} style={{ marginRight: '10px' }}>
            Sent Messages
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
              <p>Your inbox is empty</p>
              <Button $variant="primary" onClick={navigateToCompose}>
                Send a Message
              </Button>
            </EmptyState>
          </Card.Body>
        </Card>
      ) : (
        <>
          {hasUnreadMessages && (
            <MarkAllReadButton 
              $variant="outline" 
              $size="small" 
              onClick={markAllAsRead}
            >
              <FaCheckDouble /> Mark All as Read
            </MarkAllReadButton>
          )}
          <div className="messages-list">
            {messages.map((message) => (
              <div 
                key={message._id} 
                className={`message-item ${!message.read ? 'unread' : ''}`}
              >
                <div className="message-header">
                  <img 
                    src={message.sender.picture || '/default-avatar.png'} 
                    alt={message.sender.name} 
                    className="sender-avatar"
                  />
                  <div className="message-info">
                    <h3>{message.sender.name}</h3>
                    <span className="message-date">{formatDate(message.createdAt)}</span>
                  </div>
                  <ReadIndicator read={message.read}>
                    {message.read ? <FaEnvelopeOpen /> : <FaEnvelope />}
                    {message.read ? 'Read' : 'Unread'}
                  </ReadIndicator>
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
                <MessageActions>
                  {!message.read && (
                    <ActionButton 
                      $variant="primary" 
                      $size="small"
                      onClick={() => markAsRead(message._id)}
                    >
                      Mark as Read
                    </ActionButton>
                  )}
                  <ReplyButton
                    onClick={() => handleReply(message)}
                  >
                    <FaEnvelope /> Reply
                  </ReplyButton>
                  {message.type === 'AUDIO_REQUEST' && message.requestDetails?.status === 'PENDING' && (
                    <>
                      <ActionButton 
                        $variant="success" 
                        $size="small"
                        onClick={() => handleAcceptRequest(message._id)}
                      >
                        Accept
                      </ActionButton>
                      <ActionButton 
                        $variant="danger" 
                        $size="small"
                        onClick={() => handleDeclineRequest(message._id)}
                      >
                        Decline
                      </ActionButton>
                    </>
                  )}
                  <ActionButton 
                    $variant="danger" 
                    $size="small"
                    onClick={() => deleteMessage(message._id)}
                  >
                    Delete
                  </ActionButton>
                </MessageActions>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Inbox; 