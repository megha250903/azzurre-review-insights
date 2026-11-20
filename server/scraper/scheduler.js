import cron from 'node-cron';
import { scrapeAll } from './bookingScraper.js';
import { runAiAnalysis } from '../routes/scraper.js';

// ─── Run full scrape every day at 3 AM ────────────────────────────────────
export function startScheduler() {
  cron.schedule('0 3 * * *', async () => {
    console.log('\n⏰ Scheduled scrape starting…');
    try {
      await scrapeAll({ maxPages: 5 }); // Only recent pages for daily refresh
      await runAiAnalysis(50);           // Analyze up to 50 unprocessed reviews
      console.log('✅ Scheduled scrape + AI analysis complete');
    } catch (err) {
      console.error('❌ Scheduled scrape failed:', err.message);
    }
  }, { timezone: 'Australia/Sydney' });

  console.log('⏰ Scraper scheduled: daily at 3:00 AM Sydney time');
}
