import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    content: { type: String, required: true },
    campaignId: { type: String },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);