import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tab, Tabs, Card, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle, FaEnvelope, FaEnvelopeOpen } from 'react-icons/fa';
import api from '../utils/api';
import './RequestInbox.css';

const RequestInbox = () => {
  const [activeTab, setActiveTab] = useState('received');
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewedRequests, setViewedRequests] = useState(new Set());

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch requests received (as creator)
      const receivedResponse = await api.get('/api/audio-requests/my-orders');
      setReceivedRequests(receivedResponse.data);
      
      // Fetch requests sent (as requester)
      const sentResponse = await api.get('/api/audio-requests/my-requests');
      setSentRequests(sentResponse.data);
      
      // Load viewed requests from localStorage
      const storedViewedRequests = localStorage.getItem('viewedRequests');
      if (storedViewedRequests) {
        setViewedRequests(new Set(JSON.parse(storedViewedRequests)));
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = (requestId) => {
    const updatedViewedRequests = new Set(viewedRequests);
    updatedViewedRequests.add(requestId);
    setViewedRequests(updatedViewedRequests);
    localStorage.setItem('viewedRequests', JSON.stringify([...updatedViewedRequests]));
  };

  const handleStatusChange = async (requestId, status) => {
    try {
      await api.patch(`/api/audio-requests/${requestId}/status`, { status });
      
      // Update the request in the local state
      setReceivedRequests(receivedRequests.map(req => 
        req._id === requestId ? { ...req, status } : req
      ));
    } catch (err) {
      console.error('Error updating request status:', err);
      alert('Failed to update request status');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'accepted':
        return <Badge bg="primary">Accepted</Badge>;
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      case 'cancelled':
        return <Badge bg="secondary">Cancelled</Badge>;
      default:
        return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  const isUnread = (request) => {
    return !viewedRequests.has(request._id) && request.status === 'pending';
  };

  if (loading) {
    return (
      <div className="request-inbox-container text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="request-inbox-container">
      <h1>Request Inbox</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab 
          eventKey="received" 
          title={
            <span>
              Received Requests
              {receivedRequests.filter(req => isUnread(req)).length > 0 && (
                <Badge pill bg="danger" className="ms-2">
                  {receivedRequests.filter(req => isUnread(req)).length}
                </Badge>
              )}
            </span>
          }
        >
          {receivedRequests.length === 0 ? (
            <div className="no-requests">
              <p>You haven't received any requests yet.</p>
            </div>
          ) : (
            <div className="requests-list">
              {receivedRequests.map(request => (
                <Card 
                  key={request._id} 
                  className={`request-card ${isUnread(request) ? 'unread' : ''}`}
                  onClick={() => markAsViewed(request._id)}
                >
                  <Card.Body>
                    <div className="request-header">
                      <div className="request-info">
                        {isUnread(request) ? (
                          <FaEnvelope className="unread-icon" />
                        ) : (
                          <FaEnvelopeOpen className="read-icon" />
                        )}
                        <div>
                          <h3>Request from {request.requesterName}</h3>
                          <p className="request-date">
                            Submitted on {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="request-status">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                    
                    <div className="request-details">
                      <p><strong>Package:</strong> {request.pricingDetails.title}</p>
                      <p><strong>Price:</strong> ${request.pricingDetails.price.toFixed(2)}</p>
                      <p><strong>Expected Delivery:</strong> {formatDate(request.expectedDeliveryDate)}</p>
                      <div className="request-message">
                        <p><strong>Request:</strong></p>
                        <p>{request.requestDetails}</p>
                      </div>
                      
                      {request.occasion && (
                        <p><strong>Occasion:</strong> {request.occasion}</p>
                      )}
                      
                      {request.forWhom && (
                        <p><strong>For:</strong> {request.forWhom}</p>
                      )}
                      
                      {request.pronunciation && (
                        <p><strong>Pronunciation Notes:</strong> {request.pronunciation}</p>
                      )}
                    </div>
                    
                    <div className="request-actions">
                      {request.status === 'pending' && (
                        <>
                          <Button 
                            variant="success" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(request._id, 'accepted');
                            }}
                          >
                            <FaCheckCircle /> Accept
                          </Button>
                          <Button 
                            variant="danger" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(request._id, 'rejected');
                            }}
                          >
                            <FaTimesCircle /> Decline
                          </Button>
                        </>
                      )}
                      
                      {request.status === 'accepted' && (
                        <Button 
                          variant="primary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(request._id, 'completed');
                          }}
                        >
                          <FaCheckCircle /> Mark as Completed
                        </Button>
                      )}
                      
                      <Link 
                        to={`/request/confirmation/${request._id}`} 
                        className="btn btn-outline-secondary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Tab>
        
        <Tab eventKey="sent" title="Sent Requests">
          {sentRequests.length === 0 ? (
            <div className="no-requests">
              <p>You haven't sent any requests yet.</p>
            </div>
          ) : (
            <div className="requests-list">
              {sentRequests.map(request => (
                <Card key={request._id} className="request-card">
                  <Card.Body>
                    <div className="request-header">
                      <div className="request-info">
                        <div>
                          <h3>Request to {request.creator.name}</h3>
                          <p className="request-date">
                            Submitted on {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="request-status">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                    
                    <div className="request-details">
                      <p><strong>Package:</strong> {request.pricingDetails.title}</p>
                      <p><strong>Price:</strong> ${request.pricingDetails.price.toFixed(2)}</p>
                      <p><strong>Expected Delivery:</strong> {formatDate(request.expectedDeliveryDate)}</p>
                      <div className="request-message">
                        <p><strong>Request:</strong></p>
                        <p>{request.requestDetails}</p>
                      </div>
                    </div>
                    
                    <div className="request-actions">
                      <Link 
                        to={`/request/confirmation/${request._id}`} 
                        className="btn btn-primary"
                      >
                        View Details
                      </Link>
                      
                      {request.status === 'completed' && request.completedAudio && (
                        <Button variant="success">
                          <FaCheckCircle /> Download Audio
                        </Button>
                      )}
                      
                      {request.status === 'pending' && (
                        <Button 
                          variant="outline-danger" 
                          onClick={() => handleStatusChange(request._id, 'cancelled')}
                        >
                          <FaTimesCircle /> Cancel Request
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

export default RequestInbox; 