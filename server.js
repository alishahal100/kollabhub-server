import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import onboardingRouter from './routes/onboarding.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import userRouter from './routes/user.routes.js';
import campaignRouter from './routes/campaign.routes.js';
import messageRouter from './routes/messages.routes.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authMiddleware from './middlewares/authMiddleware.js';
import Message from './models/Message.js';

dotenv.config();
const app = express();

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://kollabhub.vercel.app',
    ],
    credentials: true,
  },
});

const onlineUsers = new Map();
app.set('onlineUsers', onlineUsers);

io.on('connection', (socket) => {
  console.log('🟢 New socket connected:', socket.id);

  socket.on('userConnected', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('updateUserStatus', Array.from(onlineUsers.keys()));
  });

  socket.on('sendMessage', async (messageData) => {
    try {
      const message = await Message.create({
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        campaignId: messageData.campaignId,
        seen: false,
      });

      // Notify sender of delivery
      socket.emit('messageDelivered', message._id);

      // Send to receiver if online
      const receiverSocket = onlineUsers.get(message.receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', message);
      }
    } catch (err) {
      console.error('❌ Message error:', err.message);
    }
  });

  socket.on('markMessageAsSeen', async ({ messageId, userId }) => {
    try {
      const updatedMsg = await Message.findByIdAndUpdate(
        messageId,
        { seen: true },
        { new: true }
      );

      const senderSocket = onlineUsers.get(updatedMsg.senderId?.toString());
      if (senderSocket) {
        io.to(senderSocket).emit('messageSeenUpdate', {
          messageId: updatedMsg._id,
        });
      }
    } catch (err) {
      console.error('❌ Seen error:', err.message);
    }
  });

  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', senderId);
    }
  });

  socket.on('stopTyping', ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('stopTyping', senderId);
    }
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('updateUserStatus', Array.from(onlineUsers.keys()));
    console.log('🔴 Socket disconnected:', socket.id);
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ['http://localhost:3000', 'https://kollabhub.vercel.app'].includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// DB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Routes
app.use('/api/users/onboarding', onboardingRouter);
app.use('/api/users', userRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/messages', messageRouter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use(errorHandler);

// Server Start
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
  });
};

startServer();