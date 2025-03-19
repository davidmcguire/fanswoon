import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AudioRecorder from './AudioRecorder';
import './RequestForm.css';
import axios from 'axios';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import PaymentCheckout from './PaymentCheckout';
import api from '../utils/api';

const RequestForm = () => {
  const { userId, optionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creator, setCreator] = useState(null);
  const [pricingOption, setPricingOption] = useState(null);
  const [formData, setFormData] = useState({
    requestDetails: '',
    occasion: '',
    forWhom: '',
    pronunciation: '',
    isPublic: false,
    paymentMethod: 'stripe'
  });
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

  useEffect(() => {
    const fetchCreatorAndOption = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/users/${userId}`);
        setCreator(response.data);
        
        const option = response.data.pricingOptions.find(opt => opt._id === optionId);
        if (!option) {
          setError('Pricing option not found');
        } else {
          setPricingOption(option);
        }
      } catch (err) {
        console.error('Error fetching creator data:', err);
        setError('Failed to load creator information');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorAndOption();
  }, [userId, optionId]);

  const handleRecordingComplete = (blob) => {
    setAudioBlob(blob);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const requestData = {
        creatorId: userId,
        pricingOptionId: optionId,
        ...formData
      };
      
      const response = await api.post('/api/audio-requests', requestData);
      
      // Redirect to payment page or confirmation
      navigate(`/request/confirmation/${response.data._id}`);
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit request. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="request-form-container">Loading...</div>;
  }

  if (error) {
    return <div className="request-form-container error">{error}</div>;
  }

  if (!creator || !pricingOption) {
    return <div className="request-form-container error">Creator or pricing option not found</div>;
  }

  return (
    <div className="request-form-container">
      <h1>Request from {creator.displayName || creator.name}</h1>
      
      <Card className="pricing-option-card mb-4">
        <Card.Body>
          <Card.Title>{pricingOption.title}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">${pricingOption.price.toFixed(2)}</Card.Subtitle>
          <Card.Text>{pricingOption.description}</Card.Text>
          <Card.Text className="delivery-time">Delivery in {pricingOption.deliveryTime} days</Card.Text>
        </Card.Body>
      </Card>
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>What would you like {creator.displayName || creator.name} to say?</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            name="requestDetails"
            value={formData.requestDetails}
            onChange={handleChange}
            placeholder="Be specific about what you want in your personalized audio message"
            required
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>What's the occasion? (optional)</Form.Label>
          <Form.Control
            type="text"
            name="occasion"
            value={formData.occasion}
            onChange={handleChange}
            placeholder="Birthday, Anniversary, Graduation, etc."
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Who is this for? (optional)</Form.Label>
          <Form.Control
            type="text"
            name="forWhom"
            value={formData.forWhom}
            onChange={handleChange}
            placeholder="Name of the recipient"
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Any pronunciation notes? (optional)</Form.Label>
          <Form.Control
            type="text"
            name="pronunciation"
            value={formData.pronunciation}
            onChange={handleChange}
            placeholder="How to pronounce names or specific words"
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Allow this request to be shared publicly (without personal details)"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleChange}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Payment Method</Form.Label>
          <div>
            <Form.Check
              inline
              type="radio"
              label="Credit Card"
              name="paymentMethod"
              value="stripe"
              checked={formData.paymentMethod === 'stripe'}
              onChange={handleChange}
            />
            <Form.Check
              inline
              type="radio"
              label="PayPal"
              name="paymentMethod"
              value="paypal"
              checked={formData.paymentMethod === 'paypal'}
              onChange={handleChange}
            />
          </div>
        </Form.Group>
        
        <div className="d-grid gap-2">
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : `Request for $${pricingOption.price.toFixed(2)}`}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default RequestForm; 