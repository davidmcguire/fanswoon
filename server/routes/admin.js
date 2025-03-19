const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Payment = require('../models/Payment');

// Get platform revenue statistics
router.get('/revenue', [auth, admin], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Get total platform revenue
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed', ...query } },
      { $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalPlatformFee: { $sum: '$platformFee' },
        totalCreatorAmount: { $sum: '$creatorAmount' },
        count: { $sum: 1 }
      }}
    ]);
    
    // Get revenue by payment method
    const revenueByMethod = await Payment.aggregate([
      { $match: { status: 'completed', ...query } },
      { $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$amount' },
        totalPlatformFee: { $sum: '$platformFee' },
        count: { $sum: 1 }
      }}
    ]);
    
    // Get daily revenue for the period
    const dailyRevenue = await Payment.aggregate([
      { $match: { status: 'completed', ...query } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalAmount: { $sum: '$amount' },
        totalPlatformFee: { $sum: '$platformFee' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      totalRevenue: totalRevenue[0] || { totalAmount: 0, totalPlatformFee: 0, totalCreatorAmount: 0, count: 0 },
      revenueByMethod,
      dailyRevenue
    });
  } catch (error) {
    console.error('Error fetching revenue statistics:', error);
    res.status(500).json({ message: 'Failed to fetch revenue statistics' });
  }
});

module.exports = router; 