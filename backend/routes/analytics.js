const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Request = require('../models/Request');
const auth = require('../middleware/auth');

// GET /api/analytics/summary — owner overall analytics
router.get('/summary', auth, async (req, res) => {
  try {
    if (req.user.role !== 'owner') return res.status(403).json({ message: 'Owner only' });

    const rooms = await Room.find({ owner: req.user.id });
    const roomIds = rooms.map(r => r._id);

    const totalBookings = await Booking.countDocuments({ room: { $in: roomIds } });
    const confirmedBookings = await Booking.countDocuments({ room: { $in: roomIds }, status: 'confirmed', payment_status: 'paid' });
    const totalRequests = await Request.countDocuments({ room: { $in: roomIds } });
    const totalViews = rooms.reduce((s, r) => s + (r.views || 0), 0);

    // Monthly earnings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const paidBookings = await Booking.find({
      room: { $in: roomIds },
      status: 'confirmed',
      payment_status: 'paid',
      createdAt: { $gte: sixMonthsAgo }
    }).populate('room', 'price sharing');

    const monthlyMap = {};
    paidBookings.forEach(b => {
      const key = new Date(b.createdAt).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const perPerson = Math.round((b.room?.price || 0) / (b.room?.sharing || 1));
      monthlyMap[key] = (monthlyMap[key] || 0) + perPerson * (b.duration || 1);
    });

    const totalEarnings = paidBookings.reduce((s, b) => {
      return s + Math.round((b.room?.price || 0) / (b.room?.sharing || 1)) * (b.duration || 1);
    }, 0);

    // Per-room analytics
    const roomAnalytics = await Promise.all(rooms.map(async (room) => {
      const bookings = await Booking.countDocuments({ room: room._id });
      const paid = await Booking.countDocuments({ room: room._id, payment_status: 'paid' });
      const requests = await Request.countDocuments({ room: room._id });
      return {
        _id: room._id,
        title: room.title,
        city: room.city,
        price: room.price,
        sharing: room.sharing,
        vacancy: room.vacancy,
        views: room.views || 0,
        bookings,
        paidBookings: paid,
        requests,
        averageRating: room.averageRating || 0,
        totalReviews: room.totalReviews || 0,
      };
    }));

    res.json({
      totalRooms: rooms.length,
      totalViews,
      totalBookings,
      confirmedBookings,
      totalRequests,
      totalEarnings,
      monthlyEarnings: monthlyMap,
      roomAnalytics,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/analytics/view/:roomId — increment view count
router.post('/view/:roomId', async (req, res) => {
  try {
    await Room.findByIdAndUpdate(req.params.roomId, { $inc: { views: 1 } });
    res.json({ message: 'View recorded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/tenants — owner tenant management
router.get('/tenants', auth, async (req, res) => {
  try {
    if (req.user.role !== 'owner') return res.status(403).json({ message: 'Owner only' });

    const rooms = await Room.find({ owner: req.user.id }).select('_id title city');
    const roomIds = rooms.map(r => r._id);

    const tenants = await Booking.find({
      room: { $in: roomIds },
      status: 'confirmed',
      payment_status: 'paid'
    }).populate('room', 'title city price sharing').sort({ createdAt: -1 });

    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/analytics/tenants/:bookingId/moveout
router.put('/tenants/:bookingId/moveout', auth, async (req, res) => {
  try {
    if (req.user.role !== 'owner') return res.status(403).json({ message: 'Owner only' });
    const { moveOutDate } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { moveOutDate: moveOutDate || new Date().toISOString().split('T')[0] },
      { new: true }
    );
    // Restore vacancy
    if (booking) {
      const room = await Room.findById(booking.room);
      if (room) { room.vacancy += 1; room.available = true; await room.save(); }
    }
    res.json({ message: 'Move-out recorded', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
