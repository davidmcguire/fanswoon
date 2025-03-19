const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  artworkUrl: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalRecording: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recording'
  },
  isCompressed: {
    type: Boolean,
    default: false
  },
  isShared: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Recording = mongoose.model('Recording', recordingSchema);

module.exports = Recording; 