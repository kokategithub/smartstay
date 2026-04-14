const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Owner = require('../models/Owner');

// Helper: get model by role
const getModel = (role) => role === 'owner' ? Owner : Student;

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const Model = getModel(role);

    // Check both collections for duplicate email
    const existsInStudents = await Student.findOne({ email });
    const existsInOwners = await Owner.findOne({ email });
    if (existsInStudents || existsInOwners) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await Model.create({ name, email, password: hashed, role: role || 'user' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Search in both collections
    let user = await Student.findOne({ email });
    if (!user) user = await Owner.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
