// server.js
// Entry point for the AI Customer Support Platform backend.
// Sets up Express, MongoDB, security middleware, REST routes, and Socket.io.

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const initSocket = require('./socket/socketHandler');

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const chatRoutes = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Connect to MongoDB before starting to accept requests
connectDB();

const app = express();
const server = http.createServer(app);

// --- Security & utility middleware ---
app.use(helmet()); // sets various secure HTTP headers
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '1mb' })); // parse JSON bodies
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined')); // request logging

// Basic rate limiting to protect the API from abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AI Support Platform API is running' });
});

// --- REST API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

// --- Socket.io for live chat ---
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
});
initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
