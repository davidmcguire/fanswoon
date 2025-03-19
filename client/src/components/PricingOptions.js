import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Card, InputGroup, Alert } from 'react-bootstrap';
import api from '../utils/api';

const PricingOptions = ({ user, onUpdate }) => {
  const [pricingOptions, setPricingOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Initialize pricing options from user data
  useEffect(() => {
    if (user?.pricingOptions) {
      setPricingOptions(user.pricingOptions);
    }
  }, [user]);
  
  // Handle changes to a pricing option field
  const handleOptionChange = useCallback((index, field, value) => {
    setPricingOptions(prevOptions => {
      const updatedOptions = [...prevOptions];
      updatedOptions[index] = {
        ...updatedOptions[index],
        [field]: value
      };
      return updatedOptions;
    });
  }, []);
  
  // Add a new pricing option
  const addPricingOption = useCallback(() => {
    setPricingOptions(prevOptions => [
      ...prevOptions,
      {
        _id: Date.now().toString(),
        title: '',
        description: '',
        price: 0,
        currency: user?.paymentSettings?.preferredCurrency || 'USD',
        isActive: true,
        deliveryTime: 7,
        type: 'personal'
      }
    ]);
  }, [user?.paymentSettings?.preferredCurrency]);
  
  // Remove a pricing option
  const removeOption = useCallback((index) => {
    setPricingOptions(prevOptions => {
      const updatedOptions = [...prevOptions];
      updatedOptions.splice(index, 1);
      return updatedOptions;
    });
  }, []);
  
  // Save pricing options to the server
  const savePricingOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Validate options
      const invalidOptions = pricingOptions.filter(option => !option.title || option.price < 0);
      if (invalidOptions.length > 0) {
        setError('All pricing options must have a title and a valid price');
        return;
      }
      
      const response = await api.put('/api/users/pricing-options', { pricingOptions });
      
      setSuccess('Pricing options saved successfully!');
      if (onUpdate) onUpdate({ ...user, pricingOptions: response.data.pricingOptions });
    } catch (err) {
      console.error('Save pricing options error:', err);
      if (err.response) {
        setError(`Failed to save pricing options: ${err.response.data.message || err.message}`);
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(`Failed to save pricing options: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [pricingOptions, user, onUpdate]);
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Pricing Options</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        {pricingOptions.map((option, index) => (
          <div key={option._id} className="mb-4 p-3 border rounded">
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={option.title}
                onChange={(e) => handleOptionChange(index, 'title', e.target.value)}
                placeholder="e.g., Basic Package, Premium Shoutout"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={option.description}
                onChange={(e) => handleOptionChange(index, 'description', e.target.value)}
                placeholder="Describe what's included in this package"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  value={option.price}
                  onChange={(e) => handleOptionChange(index, 'price', parseFloat(e.target.value))}
                />
                <InputGroup.Text>
                  {option.currency}
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Currency</Form.Label>
              <Form.Select
                value={option.currency}
                onChange={(e) => handleOptionChange(index, 'currency', e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Delivery Time (days)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={option.deliveryTime}
                onChange={(e) => handleOptionChange(index, 'deliveryTime', parseInt(e.target.value))}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Package Type</Form.Label>
              <Form.Select
                value={option.type}
                onChange={(e) => handleOptionChange(index, 'type', e.target.value)}
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="custom">Custom</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Check
              type="switch"
              id={`active-${index}`}
              label="Active"
              checked={option.isActive}
              onChange={(e) => handleOptionChange(index, 'isActive', e.target.checked)}
              className="mb-3"
            />
            
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => removeOption(index)}
            >
              Remove Option
            </Button>
          </div>
        ))}
        
        <div className="d-flex justify-content-between mt-3">
          <Button 
            variant="primary" 
            onClick={addPricingOption}
          >
            Add Pricing Option
          </Button>
          
          <Button 
            variant="success" 
            onClick={savePricingOptions}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Pricing Options'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PricingOptions; 