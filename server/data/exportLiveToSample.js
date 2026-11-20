import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Review from '../models/Review.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(__dirname, '../../sample-data/reviews-sample.json');

async function exportLive() {
  await mongoose.connect(process.env.MONGO_URI);
  const reviews = await Review.find().lean();
  fs.writeFileSync(dest, JSON.stringify(reviews, null, 2), 'utf8');
  console.log(`✅ Exported ${reviews.length} REAL LIVE reviews from MongoDB Atlas to ${dest}`);
  await mongoose.disconnect();
}

exportLive().catch(console.error);
