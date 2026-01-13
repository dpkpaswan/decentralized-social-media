// Vercel Serverless Function Handler
const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();

// CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check - root of /api
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DecentraSocial API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Try to load backend routes
try {
  const moderateRoute = require('../backend/routes/moderate');
  const ipfsRoute = require('../backend/routes/ipfs');
  const postRoute = require('../backend/routes/post');
  const commentRoute = require('../backend/routes/comment');
  const likeRoute = require('../backend/routes/like');

  app.use('/moderate', moderateRoute);
  app.use('/ipfs', ipfsRoute);
  app.use('/post', postRoute);
  app.use('/comment', commentRoute);
  app.use('/like', likeRoute);
} catch (error) {
  console.error('Error loading routes:', error);
  
  // Fallback routes if backend routes fail
  app.use('*', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Backend routes not loaded',
      message: error.message,
      path: req.path
    });
  });
}

// Export for Vercel
module.exports = app;
