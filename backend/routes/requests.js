const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Room = require('../models/Room');
const Owner = require('../models/Owner');
const auth = require('../middleware/auth');

// Send contact or visit request
router.post('/', auth, async (req, res) => {
  try {
    const { type, roomId, message, visitDate, visitTime, userPhone, userName, userEmail } = req.body;

    if (!type || !roomId) {
      return res.status(400).json({ message: 'type and roomId are required' });
    }

    const room = await Room.findById(roomId).populate('owner', 'name email');
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Prevent owner from requesting their own room
    if (room.owner._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot request your own room' });
    }

    // Prevent duplicate pending requests
    const existing = await Request.findOne({
      room: roomId,
      user: req.user.id,
      type,
      status: 'pending'
    });
    if (existing) return res.status(400).json({ message: `You already have a pending ${type} request for this room` });

    const request = await Request.create({
      type,
      room: roomId,
      owner: room.owner._id,
      user: req.user.id,
      userName: userName || 'Unknown',
      userEmail: userEmail || '',
      userPhone: userPhone || '',
      message: message || '',
      visitDate: visitDate || '',
      visitTime: visitTime || '',
    });

    res.status(201).json({ message: `${type === 'contact' ? 'Contact' : 'Visit'} request sent successfully!`, request });
  } catch (err) {
    console.error('Request error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get all requests sent by the logged-in student
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user.id })
      .populate('room', 'title city address price images')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all requests for owner's rooms
router.get('/owner', auth, async (req, res) => {
  try {
    // Find all rooms belonging to this owner
    const ownerRooms = await Room.find({ owner: req.user.id }).select('_id');
    const roomIds = ownerRooms.map(r => r._id);

    // Query by both owner field and room ownership (handles legacy data)
    const requests = await Request.find({
      $or: [
        { owner: req.user.id },
        { room: { $in: roomIds } }
      ]
    })
      .populate('room', 'title city address price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update request status (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    request.status = req.body.status;
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
