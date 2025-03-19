const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Create a new audio request
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, details, price } = req.body;

    // Validate request data
    if (!recipientId || !details || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create new request
    const request = new Request({
      sender: req.user._id,
      recipient: recipientId,
      details,
      price,
      status: 'pending'
    });

    await request.save();

    res.status(201).json(request);
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(500).json({ message: 'Error creating request' });
  }
});

// Get requests for the authenticated user (both sent and received)
router.get('/', auth, async (req, res) => {
  try {
    const requests = await Request.find({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    })
    .populate('sender', 'name picture')
    .populate('recipient', 'name picture')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ message: 'Error fetching requests' });
  }
});

module.exports = router; 