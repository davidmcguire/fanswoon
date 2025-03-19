import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const LogoContainer = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  font-weight: ${props => props.theme.fontWeights.bold};
  font-size: ${props => props.size === 'large' ? '2.5rem' : '1.5rem'};
  color: ${props => props.theme.colors.text};
`;

const LogoText = styled.span`
  font-family: ${props => props.theme.fonts.heading};
`;

const SLetter = styled.span`
  color: ${props => props.theme.colors.primary};
  font-weight: ${props => props.theme.fontWeights.extrabold};
  position: relative;
  display: inline-block;
  transform: ${props => props.size === 'large' ? 'scale(1.2)' : 'scale(1.1)'};
`;

const Logo = ({ size = 'normal', className }) => {
  return (
    <LogoContainer to="/" className={className} size={size}>
      <LogoText>fan</LogoText>
      <SLetter size={size}>S</SLetter>
      <LogoText>woon</LogoText>
    </LogoContainer>
  );
};

export default Logo; 