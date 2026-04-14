const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  studentPhone: { type: String, default: '' },
  moveInDate: { type: String, required: true },
  duration: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'pending_payment', 'payment_failed'],
    default: 'pending'
  },
  // Payment fields
  payment_status: { type: String, enum: ['unpaid', 'paid', 'failed', 'pending'], default: 'unpaid' },
  payment_id: { type: String, default: '' },
  order_id: { type: String, default: '' },
  payment_expires_at: { type: Date, default: null },
  moveOutDate: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
