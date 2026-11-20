import express from 'express';
import Property from '../models/Property.js';
import { PROPERTIES, fetchPropertyDetail } from '../services/bookingApi.js';

const router = express.Router();

// GET /api/properties — list all 4 properties
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find();
    // If DB is empty, return config list
    if (!properties.length) {
      return res.json(
        Object.entries(PROPERTIES).map(([key, val]) => ({ key, ...val }))
      );
    }
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties/sync — refresh property details from Booking.com
router.post('/sync', async (req, res) => {
  try {
    const results = [];
    for (const [key, prop] of Object.entries(PROPERTIES)) {
      const detail = await fetchPropertyDetail(prop.id);
      const updated = await Property.findOneAndUpdate(
        { hotelId: prop.id },
        { hotelId: prop.id, name: prop.name, location: prop.location, ...detail, lastFetched: new Date() },
        { upsert: true, new: true }
      );
      results.push(updated);
    }
    res.json({ message: 'Properties synced', count: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
