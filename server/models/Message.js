const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['AUDIO_REQUEST', 'GENERAL'],
    default: 'GENERAL'
  },
  content: {
    type: String,
    required: true
  },
  requestDetails: {
    price: Number,
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED'],
      default: 'PENDING'
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 