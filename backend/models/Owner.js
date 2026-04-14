const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'owner' },
  phone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'owners' });

module.exports = mongoose.model('Owner', ownerSchema);
