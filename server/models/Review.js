import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    // Source
    propertyKey:    { type: String, required: true, index: true },
    propertyName:   String,
    propertySlug:   String,

    // Dedup — SHA256 hash of (slug + reviewerName + date + rating)
    reviewHash:     { type: String, unique: true, index: true },

    // Review content
    reviewerName:   { type: String, default: 'Anonymous' },
    reviewerCountry:String,
    rating:         { type: Number, min: 0, max: 10 },
    title:          String,
    pros:           String,
    cons:           String,
    fullText:       String,          // pros + cons combined
    date:           { type: Date, index: true },
    roomType:       String,
    tripType:       String,          // couple, family, solo, business, group
    language:       { type: String, default: 'en' },

    // AI-generated fields
    sentiment:      { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    sentimentScore: { type: Number, default: 0 }, // -1 to 1
    topics:         [String],        // ['cleanliness','staff','noise', ...]
    topicDetails: {
      cleanliness:  Boolean,
      checkin:      Boolean,
      staff:        Boolean,
      noise:        Boolean,
      facilities:   Boolean,
      location:     Boolean,
      room:         Boolean,
      value:        Boolean,
      breakfast:    Boolean,
      wifi:         Boolean
    },
    summary:        String,          // 15-word AI summary
    aiProvider:     { type: String, enum: ['groq', 'gemini', 'none'], default: 'none' }
  },
  { timestamps: true }
);

// Compound index for fast weekly queries
reviewSchema.index({ propertyKey: 1, date: -1 });
reviewSchema.index({ propertyKey: 1, sentiment: 1 });
reviewSchema.index({ propertyKey: 1, topics: 1 });

export default mongoose.model('Review', reviewSchema);
