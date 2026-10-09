require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const { seedData } = require('./seed');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const communityRoutes = require('./routes/communityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const trendingRoutes = require('./routes/trendingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database and auto-seed if empty
const initServer = async () => {
  await connectDB();
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Auto-seeding initial demo data...');
      await seedData(true);
    }
  } catch (err) {
    console.warn('[Server] Auto-seed check notice:', err.message);
  }
};

initServer();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ConnectHub API is operating smoothly.' });
});

// Serve frontend static assets
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// Fallback for HTML pages
app.get('*', (req, res, next) => {
  // If API route or file with extension, skip fallback
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads') || path.extname(req.path)) {
    return next();
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 ConnectHub Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend accessible at http://localhost:${PORT}`);
  console.log(`⚡ API ready on http://localhost:${PORT}/api`);
  console.log(`=============================================`);
});

module.exports = { app, server };
