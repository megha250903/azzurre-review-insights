import express from 'express';
import Review from '../models/Review.js';
import { scrapeLiveReviewsForProperty, PROPERTIES } from '../scraper/scrapeAllLiveDirect.js';
import { analyzeReview } from '../services/aiService.js';
import { chromium } from 'playwright';

const router = express.Router();

// ─── POST /api/scraper/run — real-time scrape across Azzurro properties ───
router.post('/run', async (req, res) => {
  res.json({ message: 'Live Booking.com real-time scrape started in background.' });
  
  (async () => {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
    });

    for (const prop of PROPERTIES) {
      // Fresh context per property with EXACT viewport — critical for getByRole to work
      const ctx = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        locale: 'en-US',
        viewport: { width: 1366, height: 768 },
        extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
      });
      const page = await ctx.newPage();
      try {
        const maxPages = prop.key === 'paddington' ? 15 : (req.body?.maxPages || 6);
        await scrapeLiveReviewsForProperty(page, prop, maxPages);
      } catch (e) {
        console.error(`Scrape error on ${prop.name}:`, e.message);
      }
      await ctx.close();
    }

    await browser.close();
    console.log('✅ Background real-time scrape finished.');
  })().catch(e => console.error('Scrape job error:', e.message));
});

// ─── POST /api/scraper/analyze — run AI on unanalyzed reviews ─────────────
export async function runAiAnalysis(limit = 50) {
  const unanalyzed = await Review.find({ aiProvider: 'none', fullText: { $ne: '' } }).limit(limit);
  console.log(`🤖 Running AI on ${unanalyzed.length} live reviews…`);
  let done = 0;
  for (const review of unanalyzed) {
    try {
      const analysis = await analyzeReview(review.fullText);
      await Review.findByIdAndUpdate(review._id, { $set: analysis });
      done++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error(`AI error on review ${review._id}:`, e.message);
    }
  }
  return done;
}

router.post('/analyze', async (req, res) => {
  const limit = parseInt(req.body?.limit) || 50;
  res.json({ message: `AI analysis started for up to ${limit} reviews…` });
  runAiAnalysis(limit)
    .then((n) => console.log(`✅ AI analyzed ${n} reviews`))
    .catch((e) => console.error('❌ AI analysis error:', e.message));
});

// ─── GET /api/scraper/status — review counts per property ─────────────────
router.get('/status', async (req, res) => {
  const counts = await Review.aggregate([
    {
      $group: {
        _id: '$propertyKey',
        total:      { $sum: 1 },
        analyzed:   { $sum: { $cond: [{ $ne: ['$aiProvider', 'none'] }, 1, 0] } },
        unanalyzed: { $sum: { $cond: [{ $eq: ['$aiProvider', 'none']  }, 1, 0] } },
        latest:     { $max: '$date' }
      }
    }
  ]);
  res.json(counts);
});

export default router;
