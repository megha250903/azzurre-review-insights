import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, unique: true },
    name: String,
    location: String,
    country: String,
    bookingUrl: String,
    totalReviews: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    // Category scores (Booking.com provides these)
    scores: {
      cleanliness: Number,
      comfort: Number,
      location: Number,
      facilities: Number,
      staff: Number,
      valueForMoney: Number,
      freeWifi: Number
    },
    sentimentSummary: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 }
    },
    lastFetched: Date
  },
  { timestamps: true }
);

export default mongoose.model('Property', propertySchema);
