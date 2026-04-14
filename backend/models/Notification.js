const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  userModel: { type: String, enum: ['Student', 'Owner'], default: 'Student' },
  type: { type: String, required: true }, // booking_confirmed, payment_received, booking_rejected, visit_accepted, review_posted
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: String, default: '' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
