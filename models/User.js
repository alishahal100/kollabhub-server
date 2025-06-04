import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkUserId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['creator', 'brand'], required: true },
  onboarded: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  creatorProfile: {
    name: String,
    instagram: String,
    followers: Number,
    niche: String,
    portfolio: [String],
    campaignsApplied: { type: Number, default: 0 },
    
    verifiedBadge: { type: Boolean, default: false }
  },
  brandProfile: {
    name: String,
    logo: String,
    website: String,
    category: String,
    campaignsPosted: { type: Number, default: 0 },
    pastCollaborations: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);