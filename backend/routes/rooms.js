const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Room = require('../models/Room');
const Student = require('../models/Student');
const Owner = require('../models/Owner');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Get all rooms with filters
router.get('/', async (req, res) => {
  try {
    const { city, minPrice, maxPrice, sharing, available } = req.query;
    const filter = {};
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (sharing) filter.sharing = Number(sharing);
    if (available !== undefined && available !== '') filter.available = available === 'true';

    const rooms = await Room.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100); // show up to 100 rooms
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single room
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('owner', 'name email phone');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create room (owner only)
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    if (req.user.role !== 'owner') return res.status(403).json({ message: 'Only owners can add rooms' });

    // Check for duplicate: same title + address by same owner
    const existing = await Room.findOne({
      owner: req.user.id,
      title: { $regex: `^${req.body.title}$`, $options: 'i' },
      address: { $regex: `^${req.body.address}$`, $options: 'i' }
    });
    if (existing) return res.status(400).json({ message: 'You already have a room with the same title and address. Please edit the existing listing instead.' });

    const images = req.files && req.files.length > 0
      ? req.files.map(f => `/uploads/${f.filename}`)
      : getDefaultImages(req.body.city);

    const amenities = req.body.amenities
      ? req.body.amenities.split(',').map(a => a.trim()).filter(Boolean)
      : [];

    const roomData = {
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      city: req.body.city,
      address: req.body.address,
      lat: req.body.lat ? Number(req.body.lat) : undefined,
      lng: req.body.lng ? Number(req.body.lng) : undefined,
      vacancy: Number(req.body.vacancy),
      sharing: Number(req.body.sharing),
      amenities,
      images,
      available: req.body.available === 'true' || req.body.available === true,
      owner: req.user.id,
      ownerModel: 'Owner'
    };

    const room = await Room.create(roomData);
    const populated = await Room.findById(room._id).populate('owner', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update room
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const updates = { ...req.body };
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(f => `/uploads/${f.filename}`);
    }
    if (updates.amenities && typeof updates.amenities === 'string') {
      updates.amenities = updates.amenities.split(',').map(a => a.trim());
    }

    const updated = await Room.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete room
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get owner's rooms
router.get('/owner/my-rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper: default images by city
function getDefaultImages(city) {
  const cityImages = {
    'Bangalore': [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    'Mumbai': [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
    ],
    'Pune': [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'
    ],
    'Delhi': [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'
    ],
    'Hyderabad': [
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
    ],
    'Chennai': [
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
  };
  return cityImages[city] || [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
  ];
}

module.exports = router;
