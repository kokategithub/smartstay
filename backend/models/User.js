const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'owner'], default: 'user' },
  phone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'students' }); // All users stored in 'students' collection

module.exports = mongoose.model('User', userSchema);
