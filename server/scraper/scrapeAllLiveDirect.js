import 'dotenv/config';
import { chromium } from 'playwright';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Review from '../models/Review.js';

export const PROPERTIES = [
  {
    key:     'central-sydney',
    slug:    'venus-surry-hills',
    name:    'Azzurro Pod Hotel Central Sydney'
  },
  {
    key:     'darling-harbour',
    slug:    'chateau-de-venus',
    name:    'Azzurro Pod Hotel Darling Harbour'
  },
  {
    key:     'potts-point',
    slug:    'venus-potts-point-sydney',
    name:    'Azzurro Pod Hotel Potts Point'
  },
  {
    key:     'paddington',
    slug:    'olympic-paddington',
    name:    'Olympic Hotel Paddington'
  }
];

// Hash function across unique content: slug + name + text + date
function makeHash(slug, reviewerName, dateStr, fullText) {
  const normText = (fullText || '').slice(0, 100).toLowerCase().replace(/\s+/g, ' ');
  return crypto.createHash('sha256')
    .update(`${slug}|${reviewerName.toLowerCase()}|${dateStr}|${normText}`)
    .digest('hex');
}

function parseScore(text) {
  if (!text) return null;
  const match = text.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

function parseDate(text) {
  if (!text) return new Date();
  const cleaned = text.replace(/Reviewed:?\s*/i, '').trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function scrapeLiveReviewsForProperty(page, prop, maxPages = 4) {
  console.log(`\n======================================================`);
  console.log(`🏨 Starting Live Scraper: ${prop.name} (${prop.slug})`);
  console.log(`======================================================`);

  const targetUrl = `https://www.booking.com/hotel/au/${prop.slug}.en-gb.html`;
  console.log(`  Navigating to: ${targetUrl}`);

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 40000 });
  } catch (e) {
    console.log(`  Initial nav notice: ${e.message.slice(0, 60)}`);
  }

  // Wait for challenge/redirect to settle
  console.log(`  Waiting for page & challenge to settle...`);
  await page.waitForTimeout(6000);

  const title = await page.title();
  console.log(`  Page Title: "${title.slice(0, 70)}"`);

  // Use proven getByRole pattern (works reliably in headless with AutomationControlled disabled)
  const readAll = page
    .getByRole('button', { name: /read all \d* reviews/i })
    .or(page.getByRole('button', { name: /pleasant.*reviews/i }))
    .or(page.getByRole('button', { name: /good.*reviews/i }))
    .or(page.getByRole('button', { name: /reviews/i }));

  const btnCount = await readAll.count();
  console.log(`  Review button matches (getByRole): ${btnCount}`);

  if (btnCount === 0) {
    // Fallback: CSS selectors
    const fallbackSelectors = [
      'button[data-testid="read-all-reviews-button"]',
      'button[data-testid="fr-read-all-reviews"]',
      'a[href*="#blockdisplay4"]'
    ];
    let reviewBtn = null;
    for (const s of fallbackSelectors) {
      reviewBtn = await page.$(s);
      if (reviewBtn) { console.log(`  Fallback selector: "${s}"`); break; }
    }
    if (!reviewBtn) {
      console.log(`  ⚠️ Could not find review modal trigger on ${prop.name}`);
      return { prop: prop.key, scraped: 0, saved: 0 };
    }
    await reviewBtn.click();
  } else {
    await readAll.first().click();
  }

  console.log(`  Clicking review button to open modal...`);
  await page.waitForTimeout(5000);

  let totalScraped = 0;
  let totalSaved = 0;
  let totalDuplicates = 0;

  for (let p = 1; p <= maxPages; p++) {
    console.log(`  Extracting review cards from modal page ${p}...`);

    const extracted = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid="review-card"]'));
      return cards.map(c => {
        // In Booking.com modal DOM, Line 0 of innerText is the actual reviewer name! Line 1 is country!
        const lines = (c.innerText || '').split('\n').map(l => l.trim()).filter(Boolean);
        
        let reviewerName = '';
        let reviewerCountry = '';
        if (lines.length > 0 && lines[0].length < 40 && !lines[0].toLowerCase().includes('scored') && !lines[0].toLowerCase().includes('review')) {
          reviewerName = lines[0];
        }
        if (lines.length > 1 && lines[1].length < 35 && !lines[1].toLowerCase().includes('review') && !lines[1].toLowerCase().includes('night')) {
          reviewerCountry = lines[1];
        }

        reviewerName = reviewerName || c.querySelector('h4')?.innerText?.trim() ||
                       c.querySelector('[data-testid="review-avatar"] h4')?.innerText?.trim() ||
                       c.querySelector('[data-testid="reviewer-name"]')?.innerText?.trim() ||
                       'Verified Guest';

        reviewerCountry = reviewerCountry || c.querySelector('[data-testid="review-avatar"] span')?.innerText?.trim() ||
                          c.querySelector('[data-testid="reviewer-country"]')?.innerText?.trim() || '';

        const scoreText = c.querySelector('[data-testid="review-score"]')?.innerText?.trim() || '';
        const title = c.querySelector('[data-testid="review-title"]')?.innerText?.trim() || '';
        const pros = c.querySelector('[data-testid="review-positive-text"]')?.innerText?.trim() || '';
        const cons = c.querySelector('[data-testid="review-negative-text"]')?.innerText?.trim() || '';
        const dateText = c.querySelector('[data-testid="review-date"]')?.innerText?.trim() || '';
        const stayText = c.querySelector('[data-testid="review-stay-details"], [data-testid="review-room-name"]')?.innerText?.trim() || '';
        return { reviewerName, reviewerCountry, scoreText, title, pros, cons, dateText, stayText };
      });
    });

    console.log(`    Found ${extracted.length} real reviews on page ${p}`);
    if (!extracted.length) break;

    totalScraped += extracted.length;

    for (const r of extracted) {
      const rating = parseScore(r.scoreText) || 7.0;
      const date = parseDate(r.dateText);
      const fullText = `${r.pros || ''} ${r.cons || ''}`.trim() || r.title || 'Guest stay';
      const hash = makeHash(prop.slug, r.reviewerName, r.dateText, fullText);

      // Topic mapping
      const textLower = (fullText + ' ' + (r.title || '')).toLowerCase();
      const topics = [];
      if (textLower.includes('clean') || textLower.includes('dirty') || textLower.includes('smell') || textLower.includes('hygiene') || textLower.includes('bathroom') || textLower.includes('shower')) topics.push('cleanliness');
      if (textLower.includes('check') || textLower.includes('key') || textLower.includes('reception') || textLower.includes('wait') || textLower.includes('late')) topics.push('checkin');
      if (textLower.includes('staff') || textLower.includes('friendly') || textLower.includes('helpful') || textLower.includes('rude') || textLower.includes('service') || textLower.includes('adrian') || textLower.includes('florence') || textLower.includes('maiden')) topics.push('staff');
      if (textLower.includes('noise') || textLower.includes('loud') || textLower.includes('quiet') || textLower.includes('sound') || textLower.includes('traffic') || textLower.includes('street') || textLower.includes('snore')) topics.push('noise');
      if (textLower.includes('facility') || textLower.includes('shower') || textLower.includes('water') || textLower.includes('toilet') || textLower.includes('kitchen') || textLower.includes('lounge') || textLower.includes('coffee')) topics.push('facilities');
      if (textLower.includes('location') || textLower.includes('close') || textLower.includes('near') || textLower.includes('station') || textLower.includes('central') || textLower.includes('walk') || textLower.includes('cbd')) topics.push('location');
      if (textLower.includes('room') || textLower.includes('pod') || textLower.includes('bed') || textLower.includes('pillow') || textLower.includes('curtain') || textLower.includes('ac') || textLower.includes('air conditioning')) topics.push('room');
      if (textLower.includes('price') || textLower.includes('value') || textLower.includes('cheap') || textLower.includes('money') || textLower.includes('cost') || textLower.includes('worth')) topics.push('value');
      if (textLower.includes('wifi') || textLower.includes('internet') || textLower.includes('connection')) topics.push('wifi');

      let sentiment = 'neutral';
      let sentimentScore = 0;
      if (rating >= 8.0) { sentiment = 'positive'; sentimentScore = 0.8; }
      else if (rating <= 6.0) { sentiment = 'negative'; sentimentScore = -0.7; }

      try {
        const res = await Review.updateOne(
          { reviewHash: hash },
          {
            $set: {
              propertyKey: prop.key,
              propertyName: prop.name,
              propertySlug: prop.slug,
              reviewHash: hash,
              reviewerName: r.reviewerName,
              reviewerCountry: r.reviewerCountry,
              rating,
              title: r.title,
              pros: r.pros,
              cons: r.cons,
              fullText,
              date,
              roomType: r.stayText,
              sentiment,
              sentimentScore,
              topics,
              topicDetails: {
                cleanliness: topics.includes('cleanliness'),
                checkin: topics.includes('checkin'),
                staff: topics.includes('staff'),
                noise: topics.includes('noise'),
                facilities: topics.includes('facilities'),
                location: topics.includes('location'),
                room: topics.includes('room'),
                value: topics.includes('value'),
                wifi: topics.includes('wifi')
              },
              summary: (r.title ? `${r.title}: ` : '') + (r.pros || r.cons || '').slice(0, 90),
              aiProvider: 'none'
            }
          },
          { upsert: true }
        );

        if (res.upsertedCount > 0) {
          totalSaved++;
        } else {
          totalDuplicates++;
        }
      } catch (err) {
        if (err.code === 11000) {
          totalDuplicates++;
        } else {
          console.error('Insert error:', err.message);
        }
      }
    }

    // Next page inside modal
    const nextBtn = await page.$('button[aria-label="Next page"], [data-testid="pagination-next-button"]');
    if (!nextBtn) {
      console.log(`    End of paginated reviews for ${prop.name}`);
      break;
    }

    await nextBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log(`  ✅ Finished ${prop.name}: ${totalSaved} newly saved, ${totalDuplicates} duplicates prevented (total seen: ${totalScraped})`);
  return { prop: prop.key, scraped: totalScraped, saved: totalSaved, duplicates: totalDuplicates };
}

export async function runFullLiveScraper() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    locale: 'en-US',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
  });

  const page = await context.newPage();

  for (const prop of PROPERTIES) {
    try {
      await scrapeLiveReviewsForProperty(page, prop, 4);
    } catch (err) {
      console.error(`❌ Scrape error on ${prop.name}:`, err.message);
    }
  }

  await browser.close();
  await mongoose.disconnect();
  console.log('\n🎉 ALL PROPERTIES REAL-TIME SCRAPING COMPLETED.');
}

if (process.argv[1]?.endsWith('scrapeAllLiveDirect.js')) {
  runFullLiveScraper().catch(console.error);
}
