/**
 * IPFS ROUTES
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadJSON, uploadFile, fetchContent } = require('../controllers/ipfsController');

// Configure multer for file uploads
// Using memory storage for simplicity (files stored in RAM before IPFS upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

// POST /api/ipfs/upload - Upload JSON
router.post('/upload', uploadJSON);

// POST /api/ipfs/upload/file - Upload file
router.post('/upload/file', upload.single('file'), uploadFile);

// GET /api/ipfs/fetch/:hash - Fetch content
router.get('/fetch/:hash', fetchContent);

module.exports = router;
