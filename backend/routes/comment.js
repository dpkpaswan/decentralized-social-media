/**
 * COMMENT ROUTES
 */

const express = require('express');
const router = express.Router();
const { createComment } = require('../controllers/commentController');

// POST /api/comment/create
router.post('/create', createComment);

module.exports = router;
