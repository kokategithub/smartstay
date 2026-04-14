const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const { sendBookingOwnerEmail, sendBookingStudentEmail } = require('../utils/emailService');

const createNotification = async (userId, userModel, type, title, message, relatedId = '') => {
  try {
    await Notification.create({ user: userId, userModel, type, title, message, relatedId });
  } catch (e) { console.error('Notification error:', e.message); }
};

// Book a room
router.post('/', auth, async (req, res) => {
  try {
    const { roomId, studentName, studentEmail, studentPhone, moveInDate, duration } = req.body;

    if (!roomId || !studentName || !studentEmail || !moveInDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Check vacancy
    if (room.vacancy <= 0) {
      return res.status(400).json({ message: 'No vacancies available for this room' });
    }

    // Check if student already booked this room
    const existing = await Booking.findOne({
      room: roomId,
      student: req.user.id,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already booked this room' });
    }

    // Create booking
    const booking = await Booking.create({
      room: roomId,
      student: req.user.id,
      studentName,
      studentEmail,
      studentPhone: studentPhone || '',
      moveInDate,
      duration: Number(duration) || 1,
    });

    // Decrement vacancy
    room.vacancy -= 1;
    if (room.vacancy === 0) room.available = false;
    await room.save();

    const populated = await Booking.findById(booking._id).populate('room', 'title city address price sharing');

    // Send emails (non-blocking)
    const Owner = require('../models/Owner');
    const ownerDoc = room.owner ? await Owner.findById(room.owner).select('name email') : null;
    const oName = ownerDoc?.name || 'Owner';
    const oEmail = ownerDoc?.email || process.env.ADMIN_EMAIL;

    const perPersonPrice = Math.round(room.price / (room.sharing || 1));

    sendBookingOwnerEmail({
      ownerName: oName,
      ownerEmail: oEmail,
      roomTitle: room.title,
      city: room.city,
      price: perPersonPrice,
      duration: Number(duration) || 1,
      studentName,
      studentEmail,
      studentPhone: studentPhone || '',
      moveInDate,
    }).catch(err => console.error('Owner email error:', err.message));

    sendBookingStudentEmail({
      studentName,
      studentEmail,
      roomTitle: room.title,
      city: room.city,
      price: perPersonPrice,
      duration: Number(duration) || 1,
      moveInDate,
      ownerName: oName,
    }).catch(err => console.error('Student email error:', err.message));

    // Notify owner about new booking
    if (ownerDoc) {
      createNotification(ownerDoc._id, 'Owner', 'new_booking',
        '📋 New Booking Request',
        `${studentName} has requested to book ${room.title}`,
        booking._id.toString()
      );
    }
    // Notify student booking received
    createNotification(req.user.id, 'Student', 'booking_received',
      '✅ Booking Submitted',
      `Your booking request for ${room.title} has been submitted. Waiting for owner approval.`,
      booking._id.toString()
    );

    res.status(201).json({ message: 'Room booked successfully!', booking: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user.id })
      .populate('room', 'title city address price sharing images')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get owner's room bookings
router.get('/owner', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user.id }).select('_id');
    const roomIds = rooms.map(r => r._id);
    const bookings = await Booking.find({ room: { $in: roomIds } })
      .populate('room', 'title city price sharing')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel booking (student)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Restore vacancy
    const room = await Room.findById(booking.room);
    if (room) {
      room.vacancy += 1;
      room.available = true;
      await room.save();
    }

    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update booking status (owner)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.room.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const newStatus = req.body.status;
    // When owner confirms → set to pending_payment so student can pay
    if (newStatus === 'confirmed') {
      booking.status = 'pending_payment';
      booking.payment_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
      createNotification(booking.student, 'Student', 'booking_approved',
        '🎉 Booking Approved!',
        `Your booking for ${booking.room.title} has been approved. Please complete payment within 24 hours.`,
        booking._id.toString()
      );
    } else if (newStatus === 'cancelled') {
      booking.status = newStatus;
      createNotification(booking.student, 'Student', 'booking_rejected',
        '❌ Booking Rejected',
        `Your booking request for ${booking.room.title} was not approved by the owner.`,
        booking._id.toString()
      );
    } else {
      booking.status = newStatus;
    }
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
