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
import messageRouter from './routes/messages.routes.js'; // Assuming you have a message router
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
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
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();