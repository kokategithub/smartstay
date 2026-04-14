const express = require('express');
const router = express.Router();
const axios = require('axios');

// Calculate distance & travel time between two locations
router.post('/distance', async (req, res) => {
  try {
    const { origin, destination } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({ message: 'Origin and destination are required' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      // Fallback mock data
      const mockDistance = (Math.random() * 15 + 0.5).toFixed(1);
      const mockDuration = Math.round(mockDistance * 4);
      return res.json({
        distance: { text: `${mockDistance} km`, value: parseFloat(mockDistance) * 1000 },
        duration: { text: `${mockDuration} mins`, value: mockDuration * 60 },
        stress: classifyStress(mockDuration)
      });
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(origin)}` +
      `&destinations=${encodeURIComponent(destination)}` +
      `&mode=transit` +
      `&key=${apiKey}`;

    let element = null;
    let mode = 'transit';

    // Try transit first
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === 'OK') {
      element = data.rows[0]?.elements[0];
    }

    // If transit fails or API not enabled, try driving
    if (!element || element.status !== 'OK') {
      mode = 'driving';
      const fallbackUrl = `https://maps.googleapis.com/maps/api/distancematrix/json` +
        `?origins=${encodeURIComponent(origin)}` +
        `&destinations=${encodeURIComponent(destination)}` +
        `&mode=driving` +
        `&key=${apiKey}`;
      const fallbackRes = await axios.get(fallbackUrl);
      if (fallbackRes.data.status === 'OK') {
        element = fallbackRes.data.rows[0]?.elements[0];
      }
    }

    // If both fail (API not enabled), return mock data
    if (!element || element.status !== 'OK') {
      const mockDistance = (Math.random() * 15 + 0.5).toFixed(1);
      const mockDuration = Math.round(mockDistance * 4);
      return res.json({
        distance: { text: `~${mockDistance} km`, value: parseFloat(mockDistance) * 1000 },
        duration: { text: `~${mockDuration} mins`, value: mockDuration * 60 },
        stress: classifyStress(mockDuration),
        mode: 'estimated'
      });
    }

    const durationMins = element.duration.value / 60;
    res.json({
      distance: element.distance,
      duration: element.duration,
      stress: classifyStress(durationMins),
      mode
    });

  } catch (err) {
    console.error('Maps API error:', err.message);
    res.status(500).json({ message: 'Failed to calculate distance: ' + err.message });
  }
});

// Geocode an address to lat/lng
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ message: 'Address is required' });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await axios.get(url);
    const result = response.data.results[0];

    if (!result) return res.status(404).json({ message: 'Location not found' });

    res.json({
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted: result.formatted_address
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function classifyStress(durationMins) {
  if (durationMins <= 20) return { level: 'Low Stress', color: '#22c55e', icon: '🟢' };
  if (durationMins <= 45) return { level: 'Medium Stress', color: '#f59e0b', icon: '🟡' };
  return { level: 'High Stress', color: '#ef4444', icon: '🔴' };
}

module.exports = router;
