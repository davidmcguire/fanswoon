import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Card, Tabs, Tab, Spinner } from 'react-bootstrap';
import api from '../utils/api';

const PaymentSettings = ({ user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentSettings, setPaymentSettings] = useState({
    acceptsPayments: user?.paymentSettings?.acceptsPayments || false,
    stripeAccountId: user?.paymentSettings?.stripeAccountId || '',
    paypalEmail: user?.paymentSettings?.paypalEmail || '',
    preferredCurrency: user?.paymentSettings?.preferredCurrency || 'USD'
  });

  // Check URL parameters for Stripe success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSuccess = urlParams.get('stripe');
    
    if (stripeSuccess === 'success') {
      setSuccess('Your Stripe account has been connected successfully!');
      // Refresh user data to get updated Stripe account ID
      if (onUpdate) {
        fetchUserData();
      }
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await api.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (onUpdate) {
        onUpdate(response.data);
      }
      
      setPaymentSettings({
        acceptsPayments: response.data?.paymentSettings?.acceptsPayments || false,
        stripeAccountId: response.data?.paymentSettings?.stripeAccountId || '',
        paypalEmail: response.data?.paymentSettings?.paypalEmail || '',
        preferredCurrency: response.data?.paymentSettings?.preferredCurrency || 'USD'
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentSettings({
      ...paymentSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const connectStripe = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to connect with Stripe.');
        setLoading(false);
        return;
      }
      
      console.log('Connecting to Stripe...');
      const response = await api.post(
        '/api/payments/create-stripe-account-link',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('Stripe response:', response.data);
      const { url } = response.data;
      
      if (!url) {
        throw new Error('No redirect URL received from server');
      }
      
      // Redirect to Stripe Connect onboarding
      window.location.href = url;
    } catch (err) {
      console.error('Stripe connect error:', err);
      let errorMessage = 'Failed to connect with Stripe. Please try again.';
      
      if (err.response) {
        console.error('Error response:', err.response.data);
        errorMessage = err.response.data.message || errorMessage;
        if (err.response.data.error) {
          errorMessage += ` (${err.response.data.error})`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const savePaymentSettings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      await api.put(
        '/api/users/payment-settings',
        paymentSettings,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('Payment settings saved successfully!');
      if (onUpdate) onUpdate({ ...user, paymentSettings });
    } catch (err) {
      setError('Failed to save payment settings. Please try again.');
      console.error('Save payment settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Payment Settings</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Form.Check
          type="switch"
          id="accepts-payments"
          label="Accept payments for requests"
          name="acceptsPayments"
          checked={paymentSettings.acceptsPayments}
          onChange={handleChange}
          className="mb-3"
        />
        
        <Form.Group className="mb-3">
          <Form.Label>Preferred Currency</Form.Label>
          <Form.Select
            name="preferredCurrency"
            value={paymentSettings.preferredCurrency}
            onChange={handleChange}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD ($)</option>
            <option value="AUD">AUD ($)</option>
          </Form.Select>
        </Form.Group>
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="stripe" title="Stripe">
            <p>Connect your Stripe account to receive payments directly to your bank account.</p>
            {paymentSettings.stripeAccountId ? (
              <Alert variant="success">
                Your Stripe account is connected! ID: {paymentSettings.stripeAccountId.substring(0, 8)}...
              </Alert>
            ) : (
              <Button 
                variant="primary" 
                onClick={connectStripe}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect with Stripe'
                )}
              </Button>
            )}
          </Tab>
          
          <Tab eventKey="paypal" title="PayPal">
            <p>Enter your PayPal email to receive payments to your PayPal account.</p>
            <Form.Group className="mb-3">
              <Form.Label>PayPal Email</Form.Label>
              <Form.Control
                type="email"
                name="paypalEmail"
                value={paymentSettings.paypalEmail}
                onChange={handleChange}
                placeholder="your-email@example.com"
              />
            </Form.Group>
          </Tab>
        </Tabs>
        
        <Button 
          variant="success" 
          onClick={savePaymentSettings}
          disabled={loading}
          className="mt-3"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            'Save Payment Settings'
          )}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default PaymentSettings; 