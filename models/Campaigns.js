import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
  brandId: {
    type: String,
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number },
  category: { type: String, required: true },
  deliverables: [{ type: String }],
  applicationDeadline: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  applications: [
    {
      creatorId: { type: String, required: true },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
      },
      appliedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export default mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

