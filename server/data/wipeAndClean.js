import 'dotenv/config';
import mongoose from 'mongoose';
import Review from '../models/Review.js';

async function wipeAll() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  // Drop any broken indexes and ensure unique reviewHash index
  try {
    await Review.collection.dropIndex('reviewHash_1');
  } catch (e) {}

  // Delete all existing data (samples, duplicates, everything)
  const del = await Review.deleteMany({});
  console.log(`🧹 Deleted all ${del.deletedCount} existing records from database.`);

  // Create unique index on reviewHash
  await Review.collection.createIndex({ reviewHash: 1 }, { unique: true });
  console.log('✅ Created strict UNIQUE index on reviewHash');

  await mongoose.disconnect();
  console.log('✅ Database is clean and ready for ONLY 100% real scraped reviews.');
}

wipeAll().catch(console.error);
