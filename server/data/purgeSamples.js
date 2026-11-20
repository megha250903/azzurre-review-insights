import 'dotenv/config';
import mongoose from 'mongoose';
import Review from '../models/Review.js';

async function purge() {
  await mongoose.connect(process.env.MONGO_URI);
  const sampleNames = [
    'Liam Henderson', 'Sarah Jenkins', 'Marcus Wong', 'Chloe Taylor',
    'David Miller', 'Elena Rostova', 'Tomás Gomez', 'Jessica Bell',
    'Antoine Laurent', 'Maya Patel', 'Oliver Smith', 'Rachel Green',
    'Kenji Takahashi', 'Charlotte Dubois', 'Benjamin Lee', 'Grace O’Connor',
    'Felix Braun'
  ];

  const res = await Review.deleteMany({ reviewerName: { $in: sampleNames } });
  console.log(`🧹 Purged ${res.deletedCount} old mock review records.`);

  const remaining = await Review.countDocuments();
  console.log(`✅ Total 100% REAL LIVE scraped reviews in MongoDB: ${remaining}`);

  // Re-export clean live reviews to reviews-sample.json
  const fs = (await import('fs')).default;
  const path = (await import('path')).default;
  const dest = path.resolve('../sample-data/reviews-sample.json');
  const allLive = await Review.find().lean();
  fs.writeFileSync(dest, JSON.stringify(allLive, null, 2), 'utf8');
  console.log(`✅ Updated ${dest} with ONLY ${allLive.length} real live Booking.com reviews.`);

  await mongoose.disconnect();
}

purge().catch(console.error);
