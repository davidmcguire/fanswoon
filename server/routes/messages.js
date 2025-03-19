const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get all messages for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user._id })
      .populate('sender', 'name picture')
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Get all sent messages for the authenticated user
router.get('/sent', auth, async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user._id })
      .populate('recipient', 'name picture')
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (err) {
    console.error('Error fetching sent messages:', err);
    res.status(500).json({ message: 'Error fetching sent messages' });
  }
});

// Get unread message count
router.get('/unread', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      read: false
    });
    
    res.json({ count });
  } catch (err) {
    console.error('Error counting unread messages:', err);
    res.status(500).json({ message: 'Error counting unread messages' });
  }
});

// Mark message as read
router.patch('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.messageId, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ message: 'Error marking message as read' });
  }
});

// Mark all messages as read
router.post('/mark-all-read', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ message: 'All messages marked as read' });
  } catch (err) {
    console.error('Error marking all messages as read:', err);
    res.status(500).json({ message: 'Error marking all messages as read' });
  }
});

// Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({
      _id: req.params.messageId,
      $or: [
        { recipient: req.user._id },
        { sender: req.user._id }
      ]
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Send a new message
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, content, type, requestDetails } = req.body;

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content,
      type,
      requestDetails
    });

    await message.save();

    // Populate sender info before sending response
    await message.populate('sender', 'name picture');

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error sending message' });
  }
});

module.exports = router; 