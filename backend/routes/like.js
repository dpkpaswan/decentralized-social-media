/**
 * LIKE ROUTES
 */

const express = require('express');
const router = express.Router();
const { createLike, createUnlike } = require('../controllers/likeController');

// POST /api/like
router.post('/', createLike);

// POST /api/unlike (optional - for demo)
router.post('/unlike', createUnlike);

module.exports = router;
