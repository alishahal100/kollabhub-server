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
import campaignRouter from './routes/campaign.routes.js'; // Assuming you have a campaign router
import messageRouter from './routes/messages.routes.js';// Assuming you have a message router

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
app.use('/api/campaigns',campaignRouter ); // Assuming you have a campaign router
app.use('/api/messages',messageRouter)
// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error Handling
app.use(errorHandler);



// Server Initialization
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // replace with frontend URL in production
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("join", ({ userId }) => {
    socket.join(userId); // Join their own room
  });

  socket.on("sendMessage", (message) => {
    const { receiverId } = message;
    io.to(receiverId).emit("receiveMessage", message); // Send to receiver only
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

connectDB().then(() => {
  server.listen(5000, () => {
    console.log("Server + Socket.IO running on port 5000");
  });
});
