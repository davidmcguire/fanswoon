import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Card from '../components/Card';
import MessageForm from '../components/MessageForm';
import UserSearch from '../components/UserSearch';
import api from '../utils/api';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const PageTitle = styled.h1`
  margin-bottom: 1.5rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.fontWeights.bold};
`;

const RecipientInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.backgroundDark};
  border-radius: ${props => props.theme.borderRadius.medium};
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
`;

const RecipientName = styled.h3`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.fontWeights.semibold};
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

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme.colors.textLight};
`;

const ComposeMessage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecipient = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/users/${userId}`);
        setRecipient(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching recipient:', err);
        if (err.response) {
          setError(err.response.data.message || 'Failed to load recipient information');
        } else if (err.request) {
          setError('Network error - could not connect to server');
        } else {
          setError(err.message || 'Failed to load recipient information');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecipient();
  }, [userId]);

  const handleMessageSent = () => {
    navigate('/inbox');
  };

  const handleUserSelect = (user) => {
    setRecipient(user);
    setError('');
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingMessage>Loading recipient information...</LoadingMessage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageTitle>New Message</PageTitle>
      
      <Card>
        <Card.Body>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          {!userId && (
            <UserSearch onSelectUser={handleUserSelect} />
          )}
          
          {recipient && (
            <>
              <RecipientInfo>
                <Avatar 
                  src={recipient.profilePicture || '/default-avatar.png'} 
                  alt={recipient.name} 
                />
                <RecipientName>To: {recipient.name}</RecipientName>
              </RecipientInfo>
              
              <MessageForm 
                recipientId={recipient._id} 
                onMessageSent={handleMessageSent}
              />
            </>
          )}
        </Card.Body>
      </Card>
    </PageContainer>
  );
};

export default ComposeMessage; 