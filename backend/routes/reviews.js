const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

// Helper: recalculate room average rating
async function updateRoomRating(roomId) {
  const reviews = await Review.find({ room: roomId });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  await Room.findByIdAndUpdate(roomId, {
    averageRating: Math.round(avg * 10) / 10,
    totalReviews: reviews.length
  });
}

// POST /api/reviews — create review (student must have a confirmed+paid booking)
router.post('/', auth, async (req, res) => {
  try {
    const { roomId, rating, comment } = req.body;
    if (!roomId || !rating || !comment) return res.status(400).json({ message: 'All fields required' });

    const booking = await Booking.findOne({
      room: roomId,
      student: req.user.id,
      status: 'confirmed',
      payment_status: 'paid'
    });
    if (!booking) return res.status(403).json({ message: 'You can only review rooms you have booked and paid for' });

    const existing = await Review.findOne({ room: roomId, student: req.user.id });
    if (existing) return res.status(400).json({ message: 'You have already reviewed this room' });

    const review = await Review.create({
      room: roomId,
      student: req.user.id,
      studentName: booking.studentName,
      rating: Number(rating),
      comment,
    });

    await updateRoomRating(roomId);
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/room/:roomId — get all reviews for a room
router.get('/room/:roomId', async (req, res) => {
  try {
    const reviews = await Review.find({ room: req.params.roomId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/my — get student's own reviews
router.get('/my', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ student: req.user.id })
      .populate('room', 'title city images')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.student.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    const roomId = review.room;
    await review.deleteOne();
    await updateRoomRating(roomId);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
