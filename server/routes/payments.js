const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Request = require('../models/Request');
const Payment = require('../models/Payment');
const AudioRequest = require('../models/AudioRequest');

// Initialize Stripe with the API key from environment variables
// Use a valid test key that works with the Stripe API
const STRIPE_SECRET_KEY = '';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || STRIPE_SECRET_KEY);

// PayPal setup
const paypal = require('@paypal/checkout-server-sdk');
let environment;
if (process.env.NODE_ENV === 'production') {
  environment = new paypal.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID || 'test',
    process.env.PAYPAL_CLIENT_SECRET || 'test'
  );
} else {
  environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID || 'test',
    process.env.PAYPAL_CLIENT_SECRET || 'test'
  );
}
const paypalClient = new paypal.core.PayPalHttpClient(environment);

// Create Stripe Connect account link for onboarding
router.post('/create-stripe-account-link', auth, async (req, res) => {
  try {
    console.log('Creating Stripe account link for user:', req.user._id);
    
    // Check if user already has a Stripe account
    let stripeAccountId = req.user.paymentSettings?.stripeAccountId;
    
    // If no account exists, create one
    if (!stripeAccountId) {
      console.log('No Stripe account found, creating a new one');
      
      const account = await stripe.accounts.create({
        type: 'express',
        country: req.body.country || 'US',
        email: req.user.email,
        capabilities: {
          card_payments: {requested: true},
          transfers: {requested: true},
        },
        business_type: 'individual',
        business_profile: {
          url: process.env.CLIENT_URL || 'http://localhost:3000',
        },
        metadata: {
          userId: req.user._id.toString()
        }
      });
      
      stripeAccountId = account.id;
      console.log('Created Stripe account with ID:', stripeAccountId);
      
      // Save the Stripe account ID to the user
      await User.findByIdAndUpdate(req.user._id, {
        'paymentSettings.stripeAccountId': stripeAccountId
      });
    } else {
      console.log('Using existing Stripe account ID:', stripeAccountId);
    }
    
    // Create an account link for the user to onboard with Stripe
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    console.log('Using client URL for redirects:', clientUrl);
    
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${clientUrl}/settings?tab=payments`,
      return_url: `${clientUrl}/settings?tab=payments&stripe=success`,
      type: 'account_onboarding',
    });
    
    console.log('Created Stripe account link:', accountLink.url);
    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating Stripe account link:', error);
    // Send more detailed error information
    res.status(500).json({ 
      message: 'Failed to create Stripe account link', 
      error: error.message,
      type: error.type
    });
  }
});

// Create Stripe payment intent with application fee
router.post('/create-stripe-payment-intent', auth, async (req, res) => {
  try {
    const { amount, podcasterId, pricingOptionId } = req.body;
    
    // Find the podcaster to get their Stripe account ID
    const podcaster = await User.findById(podcasterId);
    
    if (!podcaster || !podcaster.paymentSettings || !podcaster.paymentSettings.stripeAccountId) {
      return res.status(400).json({ message: 'This podcaster has not set up Stripe payments' });
    }
    
    // Calculate the application fee (40% of the total amount)
    const applicationFeeAmount = Math.round(amount * 0.4);
    
    // Create a payment intent with the application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: podcaster.paymentSettings.stripeAccountId,
      },
      metadata: {
        podcasterId: podcasterId,
        customerId: req.user._id.toString(),
        pricingOptionId: pricingOptionId
      }
    });
    
    // Return the client secret to the frontend
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      applicationFeeAmount: applicationFeeAmount,
      creatorAmount: amount - applicationFeeAmount
    });
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Create PayPal order with platform fee
router.post('/create-paypal-order', auth, async (req, res) => {
  try {
    const { amount, podcasterId, pricingOptionId } = req.body;
    
    // Find the podcaster to get their PayPal email
    const podcaster = await User.findById(podcasterId);
    
    if (!podcaster || !podcaster.paymentSettings || !podcaster.paymentSettings.paypalEmail) {
      return res.status(400).json({ message: 'This podcaster has not set up PayPal payments' });
    }
    
    // Calculate the platform fee (40% of the total amount)
    const platformFee = Math.round(amount * 0.4) / 100; // Convert cents to dollars
    const creatorAmount = (amount / 100) - platformFee; // Convert cents to dollars
    
    // Create a PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: (amount / 100).toFixed(2), // Convert cents to dollars with 2 decimal places
        },
        custom_id: `${req.user._id.toString()}_${podcasterId}_${pricingOptionId}`,
        description: `Audio service payment (Platform fee: $${platformFee.toFixed(2)}, Creator: $${creatorAmount.toFixed(2)})`
      }],
      application_context: {
        brand_name: 'AudioZoom',
        shipping_preference: 'NO_SHIPPING'
      }
    });
    
    const order = await paypalClient.execute(request);
    
    // Store the order details in your database for later processing
    const paymentRecord = new Payment({
      orderId: order.result.id,
      amount: amount,
      platformFee: platformFee * 100, // Store in cents
      creatorAmount: creatorAmount * 100, // Store in cents
      podcasterId: podcasterId,
      customerId: req.user._id,
      pricingOptionId: pricingOptionId,
      paymentMethod: 'paypal',
      status: 'pending'
    });
    
    await paymentRecord.save();
    
    res.json({ 
      orderId: order.result.id,
      platformFee: platformFee,
      creatorAmount: creatorAmount
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ message: 'Failed to create PayPal order' });
  }
});

// Webhook for Stripe payment completion
router.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the payment_intent.succeeded event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // Record the payment in your database
    const payment = new Payment({
      orderId: paymentIntent.id,
      amount: paymentIntent.amount,
      platformFee: paymentIntent.application_fee_amount,
      creatorAmount: paymentIntent.amount - paymentIntent.application_fee_amount,
      podcasterId: paymentIntent.metadata.podcasterId,
      customerId: paymentIntent.metadata.customerId,
      pricingOptionId: paymentIntent.metadata.pricingOptionId,
      paymentMethod: 'stripe',
      status: 'completed',
      completedAt: new Date()
    });
    
    await payment.save();
    
    // Update the request status
    await Request.findOneAndUpdate(
      { pricingOptionId: paymentIntent.metadata.pricingOptionId },
      { 
        status: 'paid',
        paymentDetails: {
          paymentId: paymentIntent.id,
          paymentMethod: 'stripe',
          amount: paymentIntent.amount,
          platformFee: paymentIntent.application_fee_amount,
          creatorAmount: paymentIntent.amount - paymentIntent.application_fee_amount
        }
      }
    );
  }
  
  res.status(200).json({received: true});
});

// Webhook for PayPal payment completion
router.post('/paypal-webhook', async (req, res) => {
  try {
    // Verify the webhook signature (implementation depends on PayPal SDK)
    const event = req.body;
    
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource;
      const orderId = resource.supplementary_data.related_ids.order_id;
      
      // Find the payment record
      const payment = await Payment.findOne({ orderId: orderId });
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment record not found' });
      }
      
      // Update the payment status
      payment.status = 'completed';
      payment.completedAt = new Date();
      await payment.save();
      
      // Update the request status
      await Request.findOneAndUpdate(
        { pricingOptionId: payment.pricingOptionId },
        { 
          status: 'paid',
          paymentDetails: {
            paymentId: orderId,
            paymentMethod: 'paypal',
            amount: payment.amount,
            platformFee: payment.platformFee,
            creatorAmount: payment.creatorAmount
          }
        }
      );
      
      // For PayPal, you need to manually transfer the creator's portion
      // This could be done via PayPal's payout API or by recording the obligation
      // and making manual transfers periodically
    }
    
    res.status(200).json({received: true});
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
});

module.exports = router;
