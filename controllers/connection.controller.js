import Connection from "../models/connectionRequest.js";
import User from "../models/User.js";

// Send a connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId)
      return res.status(400).json({ error: "Missing sender or receiver ID" });

    // Find the MongoDB user by Clerk ID
    const receiver = await User.findOne({ clerkUserId: receiverId });
    if (!receiver) {
      return res.status(404).json({ error: "Receiver user not found" });
    }

    // Prevent duplicate pending/connected requests
    const existing = await Connection.findOne({
      senderId,
      receiverId: receiver._id,
      status: { $in: ["pending", "connected"] },
    });

    if (existing) {
      return res.status(409).json({ error: "Request already exists" });
    }

    const connection = await Connection.create({
      senderId,
      receiverId: receiver._id,
      message,
    });

    res.status(201).json(connection);
  } catch (error) {
    console.error("sendConnectionRequest error:", error);
    res.status(500).json({ error: "Failed to send connection request." });
  }
};

// Get all received requests for a user
export const getReceivedRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const connections = await Connection.find({
      receiverId: user._id,
      status: "pending",
    });

    res.status(200).json(connections);
  } catch (error) {
    console.error("getReceivedRequests error:", error);
    res.status(500).json({ error: "Failed to fetch received requests." });
  }
};

// Get sent requests for a user
export const getSentRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const requests = await Connection.find({
      senderId: userId,
      status: "pending",
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error("getSentRequests error:", error);
    res.status(500).json({ error: "Failed to fetch sent requests." });
  }
};

// Get accepted connections
export const getAcceptedConnections = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const connections = await Connection.find({
      status: "connected",
      $or: [{ senderId: userId }, { receiverId: user._id }],
    });

    res.status(200).json(connections);
  } catch (error) {
    console.error("getAcceptedConnections error:", error);
    res.status(500).json({ error: "Failed to fetch accepted connections." });
  }
};

// Update connection status
export const updateConnectionStatus = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { status } = req.body;

    if (!["connected", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updated = await Connection.findByIdAndUpdate(
      connectionId,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Connection not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("updateConnectionStatus error:", error);
    res.status(500).json({ error: "Failed to update connection status." });
  }
};
