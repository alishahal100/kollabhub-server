import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "connected", "rejected"],
      default: "pending",
    },
    message: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Connection", connectionSchema);
