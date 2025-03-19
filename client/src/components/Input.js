import React from 'react';
import styled from 'styled-components';

const InputContainer = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: ${props => props.theme.fontWeights.semibold};
  color: ${props => props.theme.colors.text};
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  font-family: ${props => props.theme.fonts.body};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(138, 43, 226, 0.15);
  }
  
  &::placeholder {
    color: #aaa;
  }
  
  ${props => props.error && `
    border-color: ${props.theme.colors.error};
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.15);
    }
  `}
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const HelperText = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const Input = ({ 
  label, 
  id, 
  error, 
  helperText, 
  className,
  ...props 
}) => {
  return (
    <InputContainer className={className}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <StyledInput id={id} error={error} {...props} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {helperText && !error && <HelperText>{helperText}</HelperText>}
    </InputContainer>
  );
};

export default Input; 