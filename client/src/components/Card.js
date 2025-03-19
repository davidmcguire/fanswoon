import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  background-color: white;
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.small};
  overflow: hidden;
  margin-bottom: 1.5rem;
  border: 1px solid ${props => props.theme.colors.border};
`;

const CardHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: white;
  font-weight: ${props => props.theme.fontWeights.semibold};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardBody = styled.div`
  padding: 1.5rem;
`;

const CardFooter = styled.div`
  padding: 1.25rem 1.5rem;
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.backgroundDark};
`;

const Card = ({ children, className }) => {
  return <CardContainer className={className}>{children}</CardContainer>;
};

Card.Header = ({ children, className }) => {
  return <CardHeader className={className}>{children}</CardHeader>;
};

Card.Body = ({ children, className }) => {
  return <CardBody className={className}>{children}</CardBody>;
};

Card.Footer = ({ children, className }) => {
  return <CardFooter className={className}>{children}</CardFooter>;
};

export default Card; 