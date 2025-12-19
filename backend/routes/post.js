/**
 * POST ROUTES
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createPost, getPosts } = require('../controllers/postController');

// Configure multer for media uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow only images and videos
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}. Only images and videos are supported.`));
    }
  }
});

// GET /api/post/all - Get all posts
router.get('/all', getPosts);

// POST /api/post/create
router.post('/create', upload.single('file'), createPost);

module.exports = router;
