import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';
import { loadStripe } from '@stripe/stripe-js';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import axios from 'axios';

// Initialize Stripe with your public key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentCheckout = ({ request, pricingOption, podcasterId, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stripe');
  const [clientSecret, setClientSecret] = useState('');
  const [feeBreakdown, setFeeBreakdown] = useState({
    total: 0,
    platformFee: 0,
    creatorAmount: 0
  });
  
  useEffect(() => {
    // Create payment intent when component mounts
    if (activeTab === 'stripe') {
      createStripePaymentIntent();
    }
  }, [activeTab]);
  
  const createStripePaymentIntent = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(
        'http://localhost:5001/api/payments/create-stripe-payment-intent',
        {
          amount: pricingOption.price,
          podcasterId: podcasterId,
          pricingOptionId: pricingOption.id
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      setClientSecret(response.data.clientSecret);
      setFeeBreakdown({
        total: pricingOption.price / 100,
        platformFee: response.data.applicationFeeAmount / 100,
        creatorAmount: response.data.creatorAmount / 100
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payment intent. Please try again.');
      console.error('Stripe payment intent error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStripePayment = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would use Stripe Elements
      // For now, we'll simulate a successful payment
      setTimeout(() => {
        if (onPaymentComplete) onPaymentComplete();
        setLoading(false);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };
  
  const createPayPalOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5001/api/payments/create-paypal-order',
        {
          amount: pricingOption.price,
          currency: pricingOption.currency || 'USD',
          requestId: request._id,
          podcasterId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      return response.data.orderId;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create PayPal order. Please try again.');
      console.error('PayPal order error:', err);
      return null;
    }
  };
  
  const renderFeeBreakdown = () => {
    if (feeBreakdown.total === 0) return null;
    
    return (
      <div className="fee-breakdown">
        <h4>Payment Breakdown</h4>
        <div className="breakdown-item">
          <span>Total Payment:</span>
          <span>${feeBreakdown.total.toFixed(2)}</span>
        </div>
        <div className="breakdown-item">
          <span>Platform Fee (40%):</span>
          <span>${feeBreakdown.platformFee.toFixed(2)}</span>
        </div>
        <div className="breakdown-item">
          <span>Creator Receives:</span>
          <span>${feeBreakdown.creatorAmount.toFixed(2)}</span>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Complete Payment</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="mb-3">
          <h6>Payment Summary</h6>
          <p><strong>Service:</strong> {pricingOption.title}</p>
          <p><strong>Price:</strong> {pricingOption.price} {pricingOption.currency || 'USD'}</p>
          <p><strong>Description:</strong> {pricingOption.description}</p>
        </div>
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="stripe" title="Credit Card (Stripe)">
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
                <p className="mt-2">Processing payment...</p>
              </div>
            ) : clientSecret ? (
              <div>
                <p>Enter your card details to complete the payment:</p>
                {/* In a real implementation, you would use Stripe Elements here */}
                <div className="p-3 border rounded mb-3">
                  <p className="mb-2">Card details would go here in production</p>
                  <div className="mb-2">
                    <input type="text" className="form-control" placeholder="Card number" disabled />
                  </div>
                  <div className="row">
                    <div className="col">
                      <input type="text" className="form-control" placeholder="MM/YY" disabled />
                    </div>
                    <div className="col">
                      <input type="text" className="form-control" placeholder="CVC" disabled />
                    </div>
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  onClick={handleStripePayment}
                  disabled={loading}
                  className="mt-3"
                >
                  {loading ? 'Processing...' : 'Pay Now'}
                </Button>
              </div>
            ) : (
              <Button 
                variant="primary" 
                onClick={createStripePaymentIntent}
                disabled={loading}
              >
                Initialize Payment
              </Button>
            )}
          </Tab>
          
          <Tab eventKey="paypal" title="PayPal">
            <p>Click the PayPal button to complete your payment:</p>
            <PayPalScriptProvider options={{ 
              "client-id": "test", // Use your PayPal client ID in production
              currency: pricingOption.currency || 'USD'
            }}>
              <PayPalButtons
                createOrder={() => {
                  // For demo purposes, create a simple order
                  return "demo-order-id";
                  // In production, use the createPayPalOrder function
                  // return createPayPalOrder();
                }}
                onApprove={(data, actions) => {
                  // Payment approved
                  if (onPaymentComplete) onPaymentComplete();
                  return Promise.resolve();
                }}
                onError={(err) => {
                  setError('PayPal payment failed. Please try again.');
                  console.error('PayPal error:', err);
                }}
                style={{ layout: 'horizontal' }}
              />
            </PayPalScriptProvider>
          </Tab>
        </Tabs>
        {renderFeeBreakdown()}
      </Card.Body>
    </Card>
  );
};

export default PaymentCheckout; 