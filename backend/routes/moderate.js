/**
 * MODERATION ROUTES
 */

const express = require('express');
const router = express.Router();
const { moderate } = require('../controllers/moderateController');

// POST /api/moderate
router.post('/', moderate);

module.exports = router;
