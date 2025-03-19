import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';

const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const WelcomeSection = styled.div`
  text-align: center;
  margin: 4rem 0;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.fontWeights.bold};
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: 2.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const CTAButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const FeaturesSection = styled.div`
  margin: 5rem 0;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const FeatureCard = styled(Card)`
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.theme.shadows.medium};
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.primary};
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.fontWeights.semibold};
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme.colors.textLight};
  line-height: 1.6;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.fontWeights.bold};
  position: relative;
  display: inline-block;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 3px;
    background-color: ${props => props.theme.colors.primary};
  }
`;

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <HomeContainer>
      <WelcomeSection>
        <Logo size="large" />
        <Title>Connect With Your Favorite Creators</Title>
        <Subtitle>
          A modern platform for fans to connect with their favorite content creators, 
          influencers, and celebrities. Get personalized messages and exclusive content.
        </Subtitle>
        
        <CTAButtons>
          <Button 
            variant="primary" 
            size="large" 
            onClick={() => navigate('/upload')}
          >
            Send Request
          </Button>
          <Button 
            variant="outline" 
            size="large" 
            onClick={() => navigate('/audio-history')}
          >
            My Messages
          </Button>
        </CTAButtons>
      </WelcomeSection>

      <FeaturesSection>
        <SectionContainer>
          <SectionTitle>Why Choose fanSwoon?</SectionTitle>
        </SectionContainer>
        
        <FeaturesGrid>
          <FeatureCard>
            <Card.Body>
              <FeatureIcon>🌟</FeatureIcon>
              <FeatureTitle>Personalized Messages</FeatureTitle>
              <FeatureDescription>
                Get custom messages from your favorite creators just for you.
              </FeatureDescription>
            </Card.Body>
          </FeatureCard>
          
          <FeatureCard>
            <Card.Body>
              <FeatureIcon>🔒</FeatureIcon>
              <FeatureTitle>Secure Platform</FeatureTitle>
              <FeatureDescription>
                Your messages and personal information are encrypted and secure.
              </FeatureDescription>
            </Card.Body>
          </FeatureCard>
          
          <FeatureCard>
            <Card.Body>
              <FeatureIcon>💬</FeatureIcon>
              <FeatureTitle>Easy Requests</FeatureTitle>
              <FeatureDescription>
                Simple request system to connect with creators in just a few clicks.
              </FeatureDescription>
            </Card.Body>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>
    </HomeContainer>
  );
};

export default Home; 