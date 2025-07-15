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
import authMiddleware from './middlewares/authMiddleware.js';
import connectionRoutes from './routes/connection.routes.js';
import http from 'http';
import { Server } from 'socket.io';
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  'https://kollabhub.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
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

// Database Connection
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
app.use('/api/connections', connectionRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error Handling
app.use(errorHandler);

// Server Initialization
const server = http.createServer(app);


// Socket.IO Authentication


// After your existing imports and middleware
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Simple auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) return next(); // Clerk handles actual auth
  next(new Error("Authentication error"));
});

io.on("connection", (socket) => {
  console.log("🟢 New connection:", socket.id);

  // Join user's personal room
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`✅ User ${userId} joined their room`);
    }
  });

  // Handle messages
  socket.on("sendMessage", (message) => {
    const { receiverId, senderId } = message;
    
    // Broadcast to both parties
    io.to(receiverId).emit("receiveMessage", message);
    io.to(senderId).emit("receiveMessage", message);
    
    console.log(`📩 Message from ${senderId} to ${receiverId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});



connectDB().then(() => {
  server.listen(5000, () => {
    console.log("Server + Socket.IO running on port 5000");
  });
});