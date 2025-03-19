import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaClock } from 'react-icons/fa';
import api from '../utils/api';
import './RequestConfirmation.css';

const RequestConfirmation = () => {
  const { requestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/audio-requests/${requestId}`);
        setRequest(response.data);
      } catch (err) {
        console.error('Error fetching request:', err);
        setError('Failed to load request details');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="request-confirmation-container text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading request details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="request-confirmation-container">
        <Alert variant="danger">{error}</Alert>
        <div className="text-center mt-4">
          <Link to="/requests" className="btn btn-primary">
            Go to My Requests
          </Link>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="request-confirmation-container">
        <Alert variant="warning">Request not found</Alert>
        <div className="text-center mt-4">
          <Link to="/requests" className="btn btn-primary">
            Go to My Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="request-confirmation-container">
      <div className="confirmation-header">
        <FaCheckCircle className="confirmation-icon" />
        <h1>Request Submitted Successfully!</h1>
        <p>Your request has been sent to {request.creator.name}</p>
      </div>

      <Card className="confirmation-details">
        <Card.Body>
          <Card.Title>Request Details</Card.Title>
          <div className="detail-item">
            <strong>Request ID:</strong> {request._id}
          </div>
          <div className="detail-item">
            <strong>Submitted On:</strong> {formatDate(request.createdAt)}
          </div>
          <div className="detail-item">
            <strong>Status:</strong> <span className="status-badge">{request.status}</span>
          </div>
          <div className="detail-item">
            <strong>Expected Delivery:</strong> {formatDate(request.expectedDeliveryDate)} <FaClock className="delivery-icon" />
          </div>
          <div className="detail-item">
            <strong>Package:</strong> {request.pricingDetails.title}
          </div>
          <div className="detail-item">
            <strong>Price:</strong> ${request.pricingDetails.price.toFixed(2)}
          </div>
          <div className="detail-item">
            <strong>Payment Method:</strong> {request.paymentMethod === 'stripe' ? 'Credit Card' : 'PayPal'}
          </div>
          <div className="detail-item">
            <strong>Payment Status:</strong> <span className={`payment-status ${request.paymentStatus}`}>{request.paymentStatus}</span>
          </div>
        </Card.Body>
      </Card>

      <Card className="confirmation-message mt-4">
        <Card.Body>
          <Card.Title>Your Request</Card.Title>
          <Card.Text>{request.requestDetails}</Card.Text>
          
          {request.occasion && (
            <div className="additional-detail">
              <strong>Occasion:</strong> {request.occasion}
            </div>
          )}
          
          {request.forWhom && (
            <div className="additional-detail">
              <strong>For:</strong> {request.forWhom}
            </div>
          )}
          
          {request.pronunciation && (
            <div className="additional-detail">
              <strong>Pronunciation Notes:</strong> {request.pronunciation}
            </div>
          )}
        </Card.Body>
      </Card>

      <div className="confirmation-actions">
        <Link to="/requests" className="btn btn-primary">
          View All My Requests
        </Link>
        <Link to="/" className="btn btn-outline-secondary">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default RequestConfirmation; 