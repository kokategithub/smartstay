const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// GET /api/wishlist
router.get('/', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).populate('wishlist', 'title city price sharing vacancy images available averageRating totalReviews');
    res.json(student?.wishlist || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/wishlist/:roomId — toggle (add if not present, remove if present)
router.post('/:roomId', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const idx = student.wishlist.indexOf(req.params.roomId);
    if (idx === -1) {
      student.wishlist.push(req.params.roomId);
      await student.save();
      res.json({ saved: true, message: 'Added to wishlist' });
    } else {
      student.wishlist.splice(idx, 1);
      await student.save();
      res.json({ saved: false, message: 'Removed from wishlist' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
