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

    return res.status(201).json(message);
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

    return res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Get conversations list for a user
export const getUserConversations = async (req, res) => {
  const userId = req.params.userId.trim(); // trim in case of accidental space

  try {
    console.log("Searching conversations for:", userId);

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    console.log("Found messages:", messages.length);

    const conversationsMap = new Map();

    for (const msg of messages) {
      const otherUserId =
        msg.senderId === userId ? msg.receiverId : msg.senderId;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: msg.content,
          createdAt: msg.createdAt,
          campaignId: msg.campaignId,
        });
      }
    }

    const result = Array.from(conversationsMap.values());
    console.log("Returning conversations:", result.length);

    return res.json(result);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
};
