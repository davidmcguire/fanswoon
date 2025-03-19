const mongoose = require('mongoose');

const audioRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.requesterEmail; // Only required if requesterEmail is not provided
    }
  },
  requesterEmail: {
    type: String,
    required: function() {
      return !this.requester; // Only required if requester is not provided
    },
    trim: true,
    lowercase: true
  },
  requesterName: {
    type: String,
    required: true,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pricingOption: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  pricingDetails: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  requestDetails: {
    type: String,
    required: true,
    trim: true
  },
  occasion: {
    type: String,
    trim: true
  },
  forWhom: {
    type: String,
    trim: true
  },
  pronunciation: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['paypal', 'stripe', 'other'],
    required: true
  },
  paymentId: {
    type: String
  },
  completedAudio: {
    url: String,
    duration: Number,
    fileSize: Number,
    fileName: String
  },
  expectedDeliveryDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const AudioRequest = mongoose.model('AudioRequest', audioRequestSchema);

module.exports = AudioRequest; 