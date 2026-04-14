const express = require('express');
const router = express.Router();
const { sendOwnerEmail, sendStudentConfirmation } = require('../utils/emailService');
const Room = require('../models/Room');

router.post('/contact', async (req, res) => {
  try {
    const { roomId, userName, userEmail, message } = req.body;

    if (!roomId || !userName || !userEmail || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const room = await Room.findById(roomId).populate('owner', 'name email');
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const ownerName = room.owner?.name || 'Owner';
    // Use owner's actual email - falls back to admin email if not set
    const ownerEmail = room.owner?.email || process.env.ADMIN_EMAIL;

    // Send email to owner
    await sendOwnerEmail({
      ownerName,
      ownerEmail,
      roomTitle: room.title,
      city: room.city,
      price: room.price,
      userName,
      userEmail,
      message,
    });

    // Send confirmation to student
    await sendStudentConfirmation({
      userName,
      userEmail,
      roomTitle: room.title,
      city: room.city,
      ownerName,
    });

    res.json({ message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Email error:', err.message);
    console.error('Full error:', JSON.stringify(err.response?.body || err, null, 2));
    res.status(500).json({ message: 'Failed to send email: ' + (err.response?.body?.message || err.message) });
  }
});

module.exports = router;
