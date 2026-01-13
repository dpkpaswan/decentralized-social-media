// Vercel Serverless Function Handler
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler, notFoundHandler } = require('../backend/middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ================================================================
// MIDDLEWARE
// ================================================================

// CORS - Allow frontend to connect
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'https://dpkpaswan.github.io'
    ];
    
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ================================================================
// ROUTES
// ================================================================

// Health check
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'DecentraSocial API Server',
    version: '1.0.0',
    hackathon: 'HackForge\'25',
    status: 'running',
    decentralized: true,
    features: {
      authentication: 'Key-based (no passwords)',
      storage: 'IPFS (distributed)',
      moderation: 'AI-powered',
      database: 'None (stateless)'
    },
    endpoints: {
      moderation: 'POST /api/moderate',
      ipfs: {
        uploadJSON: 'POST /api/ipfs/upload',
        uploadFile: 'POST /api/ipfs/upload/file',
        fetch: 'GET /api/ipfs/fetch/:hash'
      },
      posts: 'POST /api/post/create',
      comments: 'POST /api/comment/create',
      likes: 'POST /api/like'
    }
  });
});

// API Routes
app.use('/api/moderate', require('../backend/routes/moderate'));
app.use('/api/ipfs', require('../backend/routes/ipfs'));
app.use('/api/post', require('../backend/routes/post'));
app.use('/api/comment', require('../backend/routes/comment'));
app.use('/api/like', require('../backend/routes/like'));

// ================================================================
// ERROR HANDLING
// ================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Export for Vercel
module.exports = app;
