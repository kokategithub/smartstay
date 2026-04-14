const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const { sendBookingStudentEmail } = require('../utils/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('room', 'title price city sharing');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.status !== 'pending_payment') {
      return res.status(400).json({ message: 'Booking is not approved for payment' });
    }

    const sharing = booking.room.sharing || 1;
    const perPersonPrice = Math.round(booking.room.price / sharing);
    const totalAmount = perPersonPrice * (booking.duration || 1);

    const order = await razorpay.orders.create({
      amount: totalAmount * 100, // Razorpay uses paise
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: bookingId,
        roomTitle: booking.room.title,
        studentName: booking.studentName,
      },
    });

    // Save order_id and set payment expiry (10 minutes)
    booking.order_id = order.id;
    booking.payment_status = 'pending';
    booking.payment_expires_at = new Date(Date.now() + 10 * 60 * 1000);
    await booking.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingId: bookingId,
      roomTitle: booking.room.title,
      studentName: booking.studentName,
      studentEmail: booking.studentEmail,
    });
  } catch (err) {
    console.error('Payment order error:', err.message);
    res.status(500).json({ message: 'Failed to create payment order: ' + err.message });
  }
});

// Verify payment signature
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Payment failed - update status
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'payment_failed',
        payment_status: 'failed',
      });
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Payment successful
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'confirmed',
        payment_status: 'paid',
        payment_id: razorpay_payment_id,
      },
      { new: true }
    ).populate('room', 'title city price sharing');

    // Send confirmation email to student AND admin
    const perPersonPriceForEmail = Math.round(booking.room.price / (booking.room.sharing || 1));

    // Notify student payment success
    Notification.create({
      user: booking.student,
      userModel: 'Student',
      type: 'payment_success',
      title: '💳 Payment Successful!',
      message: `Payment of ₹${(perPersonPriceForEmail * (booking.duration || 1)).toLocaleString('en-IN')} confirmed for ${booking.room.title}. Your booking is now active.`,
      relatedId: booking._id.toString(),
    }).catch(() => {});
    sendBookingStudentEmail({
      studentName: booking.studentName,
      studentEmail: booking.studentEmail,
      roomTitle: booking.room.title,
      city: booking.room.city,
      price: perPersonPriceForEmail,
      duration: booking.duration || 1,
      moveInDate: booking.moveInDate,
      ownerName: 'SmartStay Owner',
    }).catch(err => console.error('Student email error:', err.message));

    // Also send copy to admin
    sendBookingStudentEmail({
      studentName: booking.studentName,
      studentEmail: process.env.ADMIN_EMAIL,
      roomTitle: booking.room.title,
      city: booking.room.city,
      price: perPersonPriceForEmail,
      duration: booking.duration || 1,
      moveInDate: booking.moveInDate,
      ownerName: 'SmartStay Owner',
    }).catch(err => console.error('Admin email error:', err.message));

    res.json({ message: 'Payment successful! Booking confirmed.', booking });
  } catch (err) {
    console.error('Payment verify error:', err.message);
    res.status(500).json({ message: 'Payment verification error' });
  }
});

// Auto-cancel expired payments (called by cron or manually)
router.post('/cancel-expired', async (req, res) => {
  try {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const result = await Booking.updateMany(
      {
        status: 'pending_payment',
        payment_expires_at: { $lt: tenMinsAgo },
        payment_status: 'pending',
      },
      { status: 'cancelled', payment_status: 'failed' }
    );
    res.json({ message: `Cancelled ${result.modifiedCount} expired bookings` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
