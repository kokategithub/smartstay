const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  phone: { type: String, default: '' },
  bio: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  createdAt: { type: Date, default: Date.now }
}, { collection: 'students' });

module.exports = mongoose.model('Student', studentSchema);
