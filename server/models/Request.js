const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  details: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  responseAudio: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentDetails: {
    amount: { type: Number },
    currency: { type: String },
    paymentMethod: { type: String },
    paymentId: { type: String },
    paidAt: { type: Date }
  }
}, {
  timestamps: true
});

const Request = mongoose.model('Request', requestSchema);

module.exports = Request; 