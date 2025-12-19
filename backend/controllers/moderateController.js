/**
 * MODERATION CONTROLLER
 * 
 * API: POST /api/moderate
 * 
 * Purpose: Moderate text and media content before posting
 * Uses AI to detect inappropriate content
 */

const { moderateText, moderateMedia, moderateContent } = require('../services/aiModeration');
const { APIError } = require('../middleware/errorHandler');

/**
 * Moderate content endpoint
 * 
 * Body:
 * {
 *   "content": "text to moderate",
 *   "mediaType": "image" | "video" | "none"
 * }
 */
async function moderate(req, res, next) {
  try {
    const { content, mediaType } = req.body;

    // Validation
    if (!content || typeof content !== 'string') {
      throw new APIError(400, 'Content is required and must be a string');
    }

    if (content.trim().length === 0) {
      throw new APIError(400, 'Content cannot be empty');
    }

    if (content.length > 5000) {
      throw new APIError(400, 'Content too long. Max 5000 characters.');
    }

    console.log(`🔍 Moderating content (${content.length} chars, media: ${mediaType || 'none'})`);

    // Perform moderation
    const result = await moderateText(content);

    res.json({
      success: true,
      approved: result.approved,
      reason: result.reason,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  moderate
};
