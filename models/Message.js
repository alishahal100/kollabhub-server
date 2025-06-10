import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true }, // changed from ObjectId
    receiverId: { type: String, required: true }, // changed from ObjectId
    content: { type: String, required: true },
    campaignId: { type: String }, // optional
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
