const express = require('express');
const router = express.Router();
const AudioRequest = require('../models/AudioRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/audio-requests';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an audio file! Please upload an audio file.'), false);
    }
  }
});

// Create a new audio request
router.post('/', auth, async (req, res) => {
  try {
    const { 
      creatorId, 
      pricingOptionId, 
      requestDetails, 
      occasion, 
      forWhom, 
      pronunciation, 
      isPublic,
      paymentMethod
    } = req.body;
    
    if (!creatorId || !pricingOptionId || !requestDetails || !paymentMethod) {
      return res.status(400).json({ message: 'Creator ID, pricing option ID, request details, and payment method are required' });
    }
    
    // Find the creator and verify they accept requests
    const creator = await User.findById(creatorId);
    if (!creator || !creator.acceptsRequests) {
      return res.status(400).json({ message: 'Creator not found or does not accept requests' });
    }
    
    // Find the pricing option
    const pricingOption = creator.pricingOptions.id(pricingOptionId);
    if (!pricingOption || !pricingOption.isActive) {
      return res.status(400).json({ message: 'Pricing option not found or not active' });
    }
    
    // Create the audio request
    const audioRequest = new AudioRequest({
      requester: req.user._id,
      requesterName: req.user.name,
      creator: creatorId,
      pricingOption: pricingOptionId,
      pricingDetails: {
        title: pricingOption.title,
        price: pricingOption.price,
        type: pricingOption.type
      },
      requestDetails,
      occasion: occasion || '',
      forWhom: forWhom || '',
      pronunciation: pronunciation || '',
      isPublic: isPublic === 'true',
      paymentMethod,
      expectedDeliveryDate: new Date(Date.now() + (pricingOption.deliveryTime * 24 * 60 * 60 * 1000))
    });
    
    await audioRequest.save();
    
    res.status(201).json(audioRequest);
  } catch (err) {
    console.error('Error creating audio request:', err);
    res.status(500).json({ message: 'Error creating audio request' });
  }
});

// Create a new audio request for non-authenticated users
router.post('/guest', async (req, res) => {
  try {
    const { 
      creatorId, 
      pricingOptionId, 
      requestDetails, 
      occasion, 
      forWhom, 
      pronunciation, 
      isPublic,
      paymentMethod,
      requesterName,
      requesterEmail
    } = req.body;
    
    if (!creatorId || !pricingOptionId || !requestDetails || !paymentMethod || !requesterName || !requesterEmail) {
      return res.status(400).json({ 
        message: 'Creator ID, pricing option ID, request details, payment method, requester name, and requester email are required' 
      });
    }
    
    // Find the creator and verify they accept requests
    const creator = await User.findById(creatorId);
    if (!creator || !creator.acceptsRequests) {
      return res.status(400).json({ message: 'Creator not found or does not accept requests' });
    }
    
    // Find the pricing option
    const pricingOption = creator.pricingOptions.id(pricingOptionId);
    if (!pricingOption || !pricingOption.isActive) {
      return res.status(400).json({ message: 'Pricing option not found or not active' });
    }
    
    // Create the audio request
    const audioRequest = new AudioRequest({
      requesterEmail,
      requesterName,
      creator: creatorId,
      pricingOption: pricingOptionId,
      pricingDetails: {
        title: pricingOption.title,
        price: pricingOption.price,
        type: pricingOption.type
      },
      requestDetails,
      occasion: occasion || '',
      forWhom: forWhom || '',
      pronunciation: pronunciation || '',
      isPublic: isPublic === 'true',
      paymentMethod,
      expectedDeliveryDate: new Date(Date.now() + (pricingOption.deliveryTime * 24 * 60 * 60 * 1000))
    });
    
    await audioRequest.save();
    
    res.status(201).json(audioRequest);
  } catch (err) {
    console.error('Error creating audio request:', err);
    res.status(500).json({ message: 'Error creating audio request' });
  }
});

// Get all audio requests for the authenticated user (as requester)
router.get('/my-requests', auth, async (req, res) => {
  try {
    const audioRequests = await AudioRequest.find({ requester: req.user._id })
      .populate('creator', 'name picture')
      .sort({ createdAt: -1 });
    
    res.json(audioRequests);
  } catch (err) {
    console.error('Error fetching audio requests:', err);
    res.status(500).json({ message: 'Error fetching audio requests' });
  }
});

// Get all audio requests for the authenticated user (as creator)
router.get('/my-orders', auth, async (req, res) => {
  try {
    const audioRequests = await AudioRequest.find({ creator: req.user._id })
      .populate('requester', 'name picture')
      .sort({ createdAt: -1 });
    
    res.json(audioRequests);
  } catch (err) {
    console.error('Error fetching audio requests:', err);
    res.status(500).json({ message: 'Error fetching audio requests' });
  }
});

// Get a specific audio request
router.get('/:requestId', auth, async (req, res) => {
  try {
    const audioRequest = await AudioRequest.findById(req.params.requestId)
      .populate('creator', 'name picture')
      .populate('requester', 'name picture');
    
    if (!audioRequest) {
      return res.status(404).json({ message: 'Audio request not found' });
    }
    
    // Check if the user is authorized to view this request
    if (
      audioRequest.requester && audioRequest.requester._id.toString() !== req.user._id.toString() &&
      audioRequest.creator._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }
    
    res.json(audioRequest);
  } catch (err) {
    console.error('Error fetching audio request:', err);
    res.status(500).json({ message: 'Error fetching audio request' });
  }
});

// Update audio request status (for creators)
router.patch('/:requestId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }
    
    const audioRequest = await AudioRequest.findById(req.params.requestId);
    
    if (!audioRequest) {
      return res.status(404).json({ message: 'Audio request not found' });
    }
    
    // Check if the user is the creator of this request
    if (audioRequest.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    audioRequest.status = status;
    
    // If the status is completed, set the completed date
    if (status === 'completed') {
      audioRequest.completedDate = new Date();
    }
    
    await audioRequest.save();
    
    res.json(audioRequest);
  } catch (err) {
    console.error('Error updating audio request status:', err);
    res.status(500).json({ message: 'Error updating audio request status' });
  }
});

// Upload completed audio for a request
router.post('/:requestId/upload', auth, upload.single('audio'), async (req, res) => {
  try {
    const audioRequest = await AudioRequest.findById(req.params.requestId);
    
    if (!audioRequest) {
      return res.status(404).json({ message: 'Audio request not found' });
    }
    
    // Check if the user is the creator of this request
    if (audioRequest.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send audio for this request' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }
    
    // Update the audio request with the completed audio
    audioRequest.completedAudio = {
      url: '/uploads/audio-requests/' + req.file.filename,
      fileSize: req.file.size,
      fileName: req.file.originalname
    };
    
    audioRequest.status = 'completed';
    audioRequest.completedDate = new Date();
    
    await audioRequest.save();
    
    res.json(audioRequest);
  } catch (err) {
    console.error('Error uploading completed audio:', err);
    res.status(500).json({ message: 'Error uploading completed audio' });
  }
});

// Get public completed requests for a creator
router.get('/public/:creatorId', async (req, res) => {
  try {
    const audioRequests = await AudioRequest.find({
      creator: req.params.creatorId,
      status: 'completed',
      isPublic: true
    })
    .select('-requesterEmail -paymentId')
    .sort({ completedDate: -1 })
    .limit(10);
    
    res.json(audioRequests);
  } catch (err) {
    console.error('Error fetching public audio requests:', err);
    res.status(500).json({ message: 'Error fetching public audio requests' });
  }
});

module.exports = router; 