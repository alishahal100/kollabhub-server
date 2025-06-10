import Message from "../models/Message.js";

// Send a message
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, campaignId } = req.body;
    const senderId = req.user._id;
    const onlineUsers = req.app.get('onlineUsers');

    const newMessage = await Message.create({
      senderId,
      receiverId,
      content,
      campaignId,
      seen: false,
    });

    // Emit via socket if receiver is online
    const receiverSocketId = onlineUsers?.get(receiverId.toString());
    if (receiverSocketId && req.app.get('io')) {
      req.app.get('io').to(receiverSocketId).emit('receiveMessage', newMessage);
    }

    // Notify sender of delivery
    const senderSocketId = onlineUsers?.get(senderId.toString());
    if (senderSocketId) {
      req.app.get('io').to(senderSocketId).emit('messageDelivered', newMessage._id);
    }

    res.status(201).json(newMessage);
  } catch (err) {
    next(err);
  }
};

// Mark a message as seen
export const markMessageAsSeen = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const onlineUsers = req.app.get('onlineUsers');

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.seen = true;
    await message.save();

    // Notify sender
    const senderSocketId = onlineUsers?.get(message.senderId.toString());
    if (senderSocketId && req.app.get('io')) {
      req.app.get('io').to(senderSocketId).emit('messageSeenUpdate', {
        messageId: message._id,
      });
    }

    res.status(200).json({ message: 'Marked as seen', messageId: message._id });
  } catch (err) {
    next(err);
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

    const result = Array.from(conversationsMap.values());
    return res.json(result);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
};