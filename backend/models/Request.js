const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  type: { type: String, enum: ['contact', 'visit'], required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userPhone: { type: String, default: '' },
  message: { type: String, default: '' },
  visitDate: { type: String, default: '' },
  visitTime: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);
