const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const Recording = require('../models/Recording');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/profile';
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
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image file.'), false);
    }
  }
});

// Get featured users
router.get('/featured', auth, async (req, res) => {
  try {
    // Get users who have at least one recording
    const usersWithRecordings = await User.aggregate([
      {
        $lookup: {
          from: 'recordings',
          localField: '_id',
          foreignField: 'user',
          as: 'recordings'
        }
      },
      {
        $match: {
          'recordings.0': { $exists: true } // At least one recording
        }
      },
      {
        $project: {
          _id: 1,
          username: '$name',
          bio: 1,
          avatar: '$picture',
          recordingsCount: { $size: '$recordings' }
        }
      },
      {
        $sort: { recordingsCount: -1 } // Sort by number of recordings
      },
      {
        $limit: 8 // Limit to 8 featured users
      }
    ]);

    res.json(usersWithRecordings);
  } catch (err) {
    console.error('Error fetching featured users:', err);
    res.status(500).json({ message: 'Error fetching featured users' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile
router.patch('/profile', auth, upload.single('picture'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio) updates.bio = req.body.bio;
    if (req.body.displayName) updates.displayName = req.body.displayName;
    if (req.body.location) updates.location = req.body.location;
    if (req.body.profession) updates.profession = req.body.profession;
    if (req.body.profileTheme) updates.profileTheme = req.body.profileTheme;
    if (req.body.acceptsRequests !== undefined) updates.acceptsRequests = req.body.acceptsRequests === 'true';
    
    // Handle request info if provided
    if (req.body.requestsInfo) {
      try {
        updates.requestsInfo = JSON.parse(req.body.requestsInfo);
      } catch (e) {
        console.error('Error parsing requestsInfo:', e);
      }
    }
    
    // Handle custom colors if provided
    if (req.body.customColors) {
      try {
        updates.customColors = JSON.parse(req.body.customColors);
      } catch (e) {
        console.error('Error parsing customColors:', e);
      }
    }
    
    if (req.file) {
      updates.picture = '/uploads/profile/' + req.file.filename;
      
      // Delete old profile picture if it exists
      if (req.user.picture) {
        const oldPicturePath = path.join(__dirname, '..', req.user.picture);
        if (fs.existsSync(oldPicturePath)) {
          fs.unlinkSync(oldPicturePath);
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: 'Error updating user profile' });
  }
});

// Add a media link to user profile
router.post('/profile/media-links', auth, async (req, res) => {
  try {
    const { title, url, type, icon } = req.body;
    
    if (!title || !url) {
      return res.status(400).json({ message: 'Title and URL are required' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.mediaLinks.push({
      title,
      url,
      type: type || 'website',
      icon: icon || 'link'
    });
    
    await user.save();
    
    res.status(201).json(user.mediaLinks[user.mediaLinks.length - 1]);
  } catch (err) {
    console.error('Error adding media link:', err);
    res.status(500).json({ message: 'Error adding media link' });
  }
});

// Update a media link
router.patch('/profile/media-links/:linkId', auth, async (req, res) => {
  try {
    const { title, url, type, icon } = req.body;
    const linkId = req.params.linkId;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const linkIndex = user.mediaLinks.findIndex(link => link._id.toString() === linkId);
    
    if (linkIndex === -1) {
      return res.status(404).json({ message: 'Media link not found' });
    }
    
    if (title) user.mediaLinks[linkIndex].title = title;
    if (url) user.mediaLinks[linkIndex].url = url;
    if (type) user.mediaLinks[linkIndex].type = type;
    if (icon) user.mediaLinks[linkIndex].icon = icon;
    
    await user.save();
    
    res.json(user.mediaLinks[linkIndex]);
  } catch (err) {
    console.error('Error updating media link:', err);
    res.status(500).json({ message: 'Error updating media link' });
  }
});

// Delete a media link
router.delete('/profile/media-links/:linkId', auth, async (req, res) => {
  try {
    const linkId = req.params.linkId;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const linkIndex = user.mediaLinks.findIndex(link => link._id.toString() === linkId);
    
    if (linkIndex === -1) {
      return res.status(404).json({ message: 'Media link not found' });
    }
    
    user.mediaLinks.splice(linkIndex, 1);
    
    await user.save();
    
    res.json({ message: 'Media link deleted successfully' });
  } catch (err) {
    console.error('Error deleting media link:', err);
    res.status(500).json({ message: 'Error deleting media link' });
  }
});

// Reorder media links
router.patch('/profile/media-links/reorder', auth, async (req, res) => {
  try {
    const { linkIds } = req.body;
    
    if (!Array.isArray(linkIds)) {
      return res.status(400).json({ message: 'linkIds must be an array' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create a map of existing links by ID
    const linksMap = {};
    user.mediaLinks.forEach(link => {
      linksMap[link._id.toString()] = link;
    });
    
    // Create a new array of links in the specified order
    const reorderedLinks = [];
    for (const linkId of linkIds) {
      const link = linksMap[linkId];
      if (link) {
        reorderedLinks.push(link);
      }
    }
    
    // Make sure we didn't lose any links
    if (reorderedLinks.length !== user.mediaLinks.length) {
      return res.status(400).json({ message: 'All existing links must be included in the reordering' });
    }
    
    user.mediaLinks = reorderedLinks;
    
    await user.save();
    
    res.json(user.mediaLinks);
  } catch (err) {
    console.error('Error reordering media links:', err);
    res.status(500).json({ message: 'Error reordering media links' });
  }
});

// Add a new route to search users by name
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Search for users whose name or displayName contains the query (case insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    })
    .select('_id name displayName picture bio profession acceptsRequests')
    .limit(10);
    
    // Add a flag indicating if the user has pricing options
    const usersWithPricingInfo = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      if (user.acceptsRequests) {
        const fullUser = await User.findById(user._id).select('pricingOptions');
        userObj.hasPricingOptions = fullUser.pricingOptions && fullUser.pricingOptions.length > 0;
      } else {
        userObj.hasPricingOptions = false;
      }
      
      return userObj;
    }));
    
    res.json(usersWithPricingInfo);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Get a specific user's profile
router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    let user;
    
    // First try to find by ID
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId)
        .select('_id name picture bio displayName location profession profileTheme acceptsRequests requestsInfo pricingOptions mediaLinks');
    }
    
    // If not found by ID, try to find by display name
    if (!user) {
      user = await User.findOne({ displayName: userId })
        .select('_id name picture bio displayName location profession profileTheme acceptsRequests requestsInfo pricingOptions mediaLinks');
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Filter out inactive pricing options for non-owners
    if (req.user._id.toString() !== user._id.toString()) {
      user.pricingOptions = user.pricingOptions.filter(option => option.isActive);
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Add a pricing option
router.post('/profile/pricing-options', auth, async (req, res) => {
  try {
    const { title, description, price, deliveryTime, type } = req.body;
    
    if (!title || price === undefined) {
      return res.status(400).json({ message: 'Title and price are required' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.pricingOptions.push({
      title,
      description: description || '',
      price: parseFloat(price),
      deliveryTime: deliveryTime ? parseInt(deliveryTime) : 7,
      type: type || 'personal',
      isActive: true
    });
    
    await user.save();
    
    res.status(201).json(user.pricingOptions[user.pricingOptions.length - 1]);
  } catch (err) {
    console.error('Error adding pricing option:', err);
    res.status(500).json({ message: 'Error adding pricing option' });
  }
});

// Update a pricing option
router.patch('/profile/pricing-options/:optionId', auth, async (req, res) => {
  try {
    const { title, description, price, deliveryTime, type, isActive } = req.body;
    const optionId = req.params.optionId;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const optionIndex = user.pricingOptions.findIndex(option => option._id.toString() === optionId);
    
    if (optionIndex === -1) {
      return res.status(404).json({ message: 'Pricing option not found' });
    }
    
    if (title) user.pricingOptions[optionIndex].title = title;
    if (description !== undefined) user.pricingOptions[optionIndex].description = description;
    if (price !== undefined) user.pricingOptions[optionIndex].price = parseFloat(price);
    if (deliveryTime) user.pricingOptions[optionIndex].deliveryTime = parseInt(deliveryTime);
    if (type) user.pricingOptions[optionIndex].type = type;
    if (isActive !== undefined) user.pricingOptions[optionIndex].isActive = isActive === 'true';
    
    await user.save();
    
    res.json(user.pricingOptions[optionIndex]);
  } catch (err) {
    console.error('Error updating pricing option:', err);
    res.status(500).json({ message: 'Error updating pricing option' });
  }
});

// Delete a pricing option
router.delete('/profile/pricing-options/:optionId', auth, async (req, res) => {
  try {
    const optionId = req.params.optionId;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const optionIndex = user.pricingOptions.findIndex(option => option._id.toString() === optionId);
    
    if (optionIndex === -1) {
      return res.status(404).json({ message: 'Pricing option not found' });
    }
    
    user.pricingOptions.splice(optionIndex, 1);
    
    await user.save();
    
    res.json({ message: 'Pricing option deleted successfully' });
  } catch (err) {
    console.error('Error deleting pricing option:', err);
    res.status(500).json({ message: 'Error deleting pricing option' });
  }
});

// Reorder pricing options
router.patch('/profile/pricing-options/reorder', auth, async (req, res) => {
  try {
    const { optionIds } = req.body;
    
    if (!Array.isArray(optionIds)) {
      return res.status(400).json({ message: 'optionIds must be an array' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create a map of existing options by ID
    const optionsMap = {};
    user.pricingOptions.forEach(option => {
      optionsMap[option._id.toString()] = option;
    });
    
    // Create a new array of options in the specified order
    const reorderedOptions = [];
    for (const optionId of optionIds) {
      const option = optionsMap[optionId];
      if (option) {
        reorderedOptions.push(option);
      }
    }
    
    // Make sure we didn't lose any options
    if (reorderedOptions.length !== user.pricingOptions.length) {
      return res.status(400).json({ message: 'All existing pricing options must be included in the reordering' });
    }
    
    user.pricingOptions = reorderedOptions;
    
    await user.save();
    
    res.json(user.pricingOptions);
  } catch (err) {
    console.error('Error reordering pricing options:', err);
    res.status(500).json({ message: 'Error reordering pricing options' });
  }
});

// Update requests info
router.patch('/profile/requests-info', auth, async (req, res) => {
  try {
    const { headline, description, responseTime, paymentMethods } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize requestsInfo if it doesn't exist
    if (!user.requestsInfo) {
      user.requestsInfo = {};
    }
    
    if (headline) user.requestsInfo.headline = headline;
    if (description !== undefined) user.requestsInfo.description = description;
    if (responseTime) user.requestsInfo.responseTime = parseInt(responseTime);
    
    // Handle payment methods
    if (paymentMethods) {
      try {
        const parsedPaymentMethods = JSON.parse(paymentMethods);
        
        if (!user.requestsInfo.paymentMethods) {
          user.requestsInfo.paymentMethods = {};
        }
        
        if (parsedPaymentMethods.paypal !== undefined) {
          user.requestsInfo.paymentMethods.paypal = parsedPaymentMethods.paypal;
        }
        
        if (parsedPaymentMethods.stripe !== undefined) {
          user.requestsInfo.paymentMethods.stripe = parsedPaymentMethods.stripe;
        }
        
        if (parsedPaymentMethods.paypalEmail) {
          user.requestsInfo.paymentMethods.paypalEmail = parsedPaymentMethods.paypalEmail;
        }
        
        if (parsedPaymentMethods.stripeAccountId) {
          user.requestsInfo.paymentMethods.stripeAccountId = parsedPaymentMethods.stripeAccountId;
        }
      } catch (e) {
        console.error('Error parsing paymentMethods:', e);
      }
    }
    
    await user.save();
    
    res.json(user.requestsInfo);
  } catch (err) {
    console.error('Error updating requests info:', err);
    res.status(500).json({ message: 'Error updating requests info' });
  }
});

// Update user payment settings
router.put('/payment-settings', auth, async (req, res) => {
  try {
    const { acceptsPayments, stripeAccountId, paypalEmail, preferredCurrency } = req.body;
    
    // Update user payment settings
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        paymentSettings: {
          acceptsPayments: acceptsPayments || false,
          stripeAccountId: stripeAccountId || req.user.paymentSettings?.stripeAccountId,
          paypalEmail: paypalEmail || req.user.paymentSettings?.paypalEmail,
          preferredCurrency: preferredCurrency || 'USD'
        }
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'Payment settings updated successfully',
      paymentSettings: user.paymentSettings
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({ message: 'Failed to update payment settings' });
  }
});

// Update user pricing options
router.put('/pricing-options', auth, async (req, res) => {
  try {
    const { pricingOptions } = req.body;
    
    // Validate pricing options
    if (!Array.isArray(pricingOptions)) {
      return res.status(400).json({ message: 'Invalid pricing options format' });
    }
    
    // Update user pricing options
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { pricingOptions },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'Pricing options updated successfully',
      pricingOptions: user.pricingOptions
    });
  } catch (error) {
    console.error('Error updating pricing options:', error);
    res.status(500).json({ message: 'Failed to update pricing options' });
  }
});

module.exports = router; 