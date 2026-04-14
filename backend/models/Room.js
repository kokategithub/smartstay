const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number },
  vacancy: { type: Number, required: true },
  sharing: { type: Number, required: true },
  amenities: [String],
  images: [String],
  owner: { type: mongoose.Schema.Types.ObjectId, refPath: 'ownerModel', required: true },
  ownerModel: { type: String, enum: ['Owner', 'Student'], default: 'Owner' },
  available: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
