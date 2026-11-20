import express from 'express';
import Review from '../models/Review.js';
import { PROPERTIES } from '../scraper/bookingScraper.js';
import { TOPICS } from '../services/aiService.js';

const router = express.Router();

// ─── Helpers ───────────────────────────────────────────────────────────────
const weekRange = (weeksAgo = 0) => {
  const now = Date.now();
  const end   = new Date(now - weeksAgo * 7 * 86400_000);
  const start = new Date(now - (weeksAgo + 1) * 7 * 86400_000);
  return { start, end };
};

async function weekStats(propertyKey, weeksAgo = 0) {
  const { start, end } = weekRange(weeksAgo);
  const match = { date: { $gte: start, $lt: end } };
  if (propertyKey !== 'all') match.propertyKey = propertyKey;

  const agg = await Review.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        avgRating:  { $avg: '$rating' },
        count:      { $sum: 1 },
        positive:   { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
        negative:   { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } }
      }
    }
  ]);
  return agg[0] || { avgRating: null, count: 0, positive: 0, negative: 0 };
}

// ─── GET /api/analytics/:propertyKey ──────────────────────────────────────
router.get('/:propertyKey', async (req, res) => {
  try {
    const { propertyKey } = req.params;
    const propConfig = PROPERTIES.find((p) => p.key === propertyKey);
    if (!propConfig && propertyKey !== 'all')
      return res.status(404).json({ error: 'Property not found' });

    const matchBase = propertyKey === 'all' ? {} : { propertyKey };

    // ── Week-over-week ─────────────────────────────────────────────────────
    const [thisWeek, prevWeek] = await Promise.all([
      weekStats(propertyKey, 0),
      weekStats(propertyKey, 1)
    ]);

    const ratingDelta =
      thisWeek.avgRating && prevWeek.avgRating
        ? parseFloat((thisWeek.avgRating - prevWeek.avgRating).toFixed(2))
        : null;

    // ── Overall stats ──────────────────────────────────────────────────────
    const overallAgg = await Review.aggregate([
      { $match: matchBase },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
    ]);
    const overall = overallAgg[0] || { avgRating: 0, total: 0 };

    // ── Sentiment breakdown ────────────────────────────────────────────────
    const sentimentAgg = await Review.aggregate([
      { $match: matchBase },
      { $group: { _id: '$sentiment', count: { $sum: 1 } } }
    ]);
    const sentiment = { positive: 0, neutral: 0, negative: 0 };
    sentimentAgg.forEach((s) => { if (s._id) sentiment[s._id] = s.count; });

    // ── Rating trend — monthly last 12 months ──────────────────────────────
    const trend = await Review.aggregate([
      {
        $match: {
          ...matchBase,
          date: { $gte: new Date(Date.now() - 365 * 86400_000) }
        }
      },
      {
        $group: {
          _id:       { year: { $year: '$date' }, month: { $month: '$date' } },
          avgRating: { $avg: '$rating' },
          count:     { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // ── Topic insights (operational) ───────────────────────────────────────
    const totalReviews = overall.total || 1;
    const topicAgg = await Review.aggregate([
      { $match: matchBase },
      { $unwind: '$topics' },
      {
        $group: {
          _id:      '$topics',
          total:    { $sum: 1 },
          positive: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const topics = topicAgg.map((t) => ({
      topic:         t._id,
      total:         t.total,
      positive:      t.positive,
      negative:      t.negative,
      negPct:        Math.round((t.negative / totalReviews) * 100),
      posPct:        Math.round((t.positive / totalReviews) * 100),
      totalPct:      Math.round((t.total    / totalReviews) * 100)
    }));

    // ── Top keywords ───────────────────────────────────────────────────────
    // (placeholder — extend later with NLP keyword extraction)

    // ── Trip type breakdown ────────────────────────────────────────────────
    const tripTypes = await Review.aggregate([
      { $match: matchBase },
      { $group: { _id: '$tripType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      propertyKey,
      propertyName: propConfig?.name || 'All Properties',
      location:     propConfig?.url || '',
      overall,
      weekOverWeek: { thisWeek, prevWeek, ratingDelta },
      sentiment,
      trend: trend.map((t) => ({
        month:     `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
        avgRating: Math.round(t.avgRating * 10) / 10,
        count:     t.count
      })),
      topics,
      tripTypes: tripTypes.map((t) => ({ type: t._id || 'unknown', count: t.count }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/compare/all ───────────────────────────────────────
router.get('/compare/all', async (req, res) => {
  try {
    const data = await Promise.all(
      PROPERTIES.map(async (prop) => {
        const [thisWeek, prevWeek, overall, sentiment] = await Promise.all([
          weekStats(prop.key, 0),
          weekStats(prop.key, 1),
          Review.aggregate([
            { $match: { propertyKey: prop.key } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
          ]).then((r) => r[0] || {}),
          Review.aggregate([
            { $match: { propertyKey: prop.key } },
            { $group: { _id: '$sentiment', count: { $sum: 1 } } }
          ])
        ]);
        const s = { positive: 0, neutral: 0, negative: 0 };
        sentiment.forEach((x) => { if (x._id) s[x._id] = x.count; });
        return {
          key:          prop.key,
          name:         prop.name,
          avgRating:    overall.avgRating || 0,
          total:        overall.total     || 0,
          sentiment:    s,
          thisWeek,
          prevWeek,
          ratingDelta:  thisWeek.avgRating && prevWeek.avgRating
            ? parseFloat((thisWeek.avgRating - prevWeek.avgRating).toFixed(2))
            : null
        };
      })
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
