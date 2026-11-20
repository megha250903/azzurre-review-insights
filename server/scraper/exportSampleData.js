import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Review from '../models/Review.js';

await mongoose.connect(process.env.MONGO_URI);
const reviews = await Review.find().sort({ date: -1 }).lean();
console.log(`Exporting ${reviews.length} reviews to sample-data/reviews-sample.json...`);

const targetDir = path.resolve(process.cwd(), '../sample-data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
const targetPath = path.join(targetDir, 'reviews-sample.json');
fs.writeFileSync(targetPath, JSON.stringify(reviews, null, 2), 'utf-8');
console.log('Successfully written to', targetPath);

await mongoose.disconnect();
