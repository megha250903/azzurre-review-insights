import 'dotenv/config';
import mongoose from 'mongoose';
import Review from '../models/Review.js';

await mongoose.connect(process.env.MONGO_URI);
const byProp = await Review.aggregate([
  {
    $group: {
      _id: '$propertyKey',
      total: { $sum: 1 },
      withRealName: {
        $sum: {
          $cond: [
            { $and: [
              { $ne: ['$reviewerName', 'Anonymous'] },
              { $ne: ['$reviewerName', 'Verified Guest'] },
              { $ne: ['$reviewerName', ''] }
            ]}, 1, 0
          ]
        }
      }
    }
  }
]);
console.table(byProp);
const total = await Review.countDocuments();
console.log('TOTAL REVIEWS IN DB:', total);
await mongoose.disconnect();
