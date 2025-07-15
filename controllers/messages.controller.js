import Message from "../models/Message.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, campaignId } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = new Message({ senderId, receiverId, content, campaignId });
    await message.save();

    // Convert to plain JS object and normalize ID
    const messageObj = message.toObject();
    messageObj.id = messageObj._id.toString();
    delete messageObj._id;
    
    return res.status(201).json(messageObj);
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
};

// Get messages between two users
export const getMessagesBetweenUsers = async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });

    // Normalize IDs for frontend
    const normalized = messages.map(msg => ({
      ...msg.toObject(),
      id: msg._id.toString()
    }));

    return res.json(normalized);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Get conversations list for a user
export const getUserConversations = async (req, res) => {
  const userId = req.params.userId.trim();

  try {
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    const conversationsMap = new Map();

    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: msg.content,
          createdAt: msg.createdAt,
          campaignId: msg.campaignId,
        });
      }
    }

    return res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
};