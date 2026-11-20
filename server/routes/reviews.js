import express from 'express';
import Review from '../models/Review.js';
import { PROPERTIES } from '../scraper/bookingScraper.js';

const router = express.Router();

// ─── GET /api/reviews/:propertyKey ────────────────────────────────────────
router.get('/:propertyKey', async (req, res) => {
  try {
    const { propertyKey } = req.params;
    const {
      page = 1, limit = 15,
      sentiment, topic,
      dateFrom, dateTo,
      sort = 'date'
    } = req.query;

    if (propertyKey !== 'all' && !PROPERTIES.find((p) => p.key === propertyKey))
      return res.status(404).json({ error: 'Property not found' });

    const filter = {};
    if (propertyKey !== 'all') filter.propertyKey = propertyKey;
    if (sentiment)             filter.sentiment = sentiment;
    if (topic)                 filter.topics    = topic;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo)   filter.date.$lte = new Date(dateTo);
    }

    const sortMap = {
      date:      { date: -1 },
      rating:    { rating: -1 },
      sentiment: { sentimentScore: -1 }
    };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort(sortMap[sort] || { date: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments(filter)
    ]);

    res.json({ reviews, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
