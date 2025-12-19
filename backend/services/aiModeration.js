/**
 * AI MODERATION SERVICE
 * 
 * PURPOSE:
 * - Content moderation before posting to IPFS
 * - Detect inappropriate content (adult, violence, hate speech)
 * - Uses AI models (Gemini or OpenAI)
 * 
 * WHY AI MODERATION IN DECENTRALIZED SYSTEM?
 * - Cannot rely on central authority for moderation
 * - AI provides automated, transparent content filtering
 * - Users can verify moderation decisions
 * - Prevents IPFS pollution with harmful content
 * 
 * IMPORTANT:
 * - This is a GATEWAY function, not censorship
 * - Content rejected here never reaches IPFS
 * - Users can run their own nodes with different rules
 * - Hackathon demo uses Google Gemini (free tier)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * Moderate text content using AI with fallback strategy
 * 
 * IMPLEMENTATION STRATEGY:
 * 1. Try stable Gemini model with proper error handling
 * 2. If API key is invalid or model unavailable, fallback to keyword filter
 * 3. Never fail post creation - always return a moderation result
 * 
 * @param {string} content - Text content to moderate
 * @returns {Promise<Object>} - { approved: boolean, reason: string, moderationType: string }
 */
async function moderateText(content) {
  // Check if AI moderation is configured
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  No Gemini API key configured. Using fallback moderation.');
    return simpleKeywordModeration(content);
  }

  // Try AI moderation with multiple model fallbacks
  const modelsToTry = [
    'gemini-pro',           // Most stable, widely supported
    'gemini-1.0-pro',       // Explicit version
    'gemini-1.0-pro-latest' // Latest stable 1.0
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`🔍 Trying Gemini model: ${modelName}...`);
      
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });

      // Moderation prompt - short and direct for better reliability
      const prompt = `Analyze this social media post for inappropriate content.

Post: "${content}"

Check for: adult content, violence, hate speech, harassment, spam, illegal activity.

Respond ONLY with JSON:
{"approved": true/false, "reason": "brief explanation"}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }
      
      const moderation = JSON.parse(jsonMatch[0]);
      
      console.log(`✅ AI Moderation successful (${modelName})`);
      console.log(`   Result: ${moderation.approved ? 'Approved' : 'Rejected'}`);
      console.log(`   Reason: ${moderation.reason}`);
      
      return {
        approved: moderation.approved,
        reason: moderation.reason,
        moderationType: 'ai'
      };
      
    } catch (error) {
      // Log error and try next model
      console.warn(`⚠️  Model ${modelName} failed: ${error.message}`);
      
      // If this is the last model, fall back to keyword moderation
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        console.warn('❌ All AI models failed. Using fallback keyword moderation.');
        return simpleKeywordModeration(content);
      }
      // Otherwise, continue to next model
    }
  }
  
  // Fallback if loop completes without success (shouldn't happen)
  return simpleKeywordModeration(content);
}

/**
 * Fallback moderation using keyword filtering
 * 
 * FALLBACK STRATEGY:
 * Used when AI moderation is unavailable or fails. Provides basic content filtering
 * to prevent obvious violations while being permissive for edge cases.
 * 
 * @param {string} content - Text to check
 * @returns {Object} - Moderation result
 */
function simpleKeywordModeration(content) {
  console.log('🔧 Using fallback keyword moderation...');
  
  const lowerContent = content.toLowerCase();
  
  // Basic inappropriate keywords (conservative list to avoid false positives)
  const inappropriateKeywords = [
    'nsfw', 'porn', 'xxx',
    'kill', 'murder', 'terrorist',
    'racist', 'nazi'
  ];
  
  for (const keyword of inappropriateKeywords) {
    if (lowerContent.includes(keyword)) {
      console.log(`❌ Keyword filter rejected: "${keyword}"`);
      return {
        approved: false,
        reason: `Content contains restricted term: "${keyword}"`,
        moderationType: 'fallback'
      };
    }
  }
  
  // Check for excessive caps (spam indicator)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.7 && content.length > 20) {
    console.log('❌ Keyword filter rejected: excessive caps');
    return {
      approved: false,
      reason: 'Excessive use of capital letters (spam indicator)',
      moderationType: 'fallback'
    };
  }
  
  console.log('✅ Keyword filter approved');
  return {
    approved: true,
    reason: 'Content passed keyword filter (AI unavailable)',
    moderationType: 'fallback'
  };
}

/**
 * Moderate media content
 * For hackathon: simplified check based on file type
 * Production: would use AI vision models (Google Cloud Vision, AWS Rekognition)
 * 
 * @param {Object} file - File object
 * @returns {Promise<Object>} - Moderation result
 */
async function moderateMedia(file) {
  try {
    // Basic file validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        approved: false,
        reason: `File type not allowed: ${file.mimetype}. Allowed: images and videos only.`
      };
    }
    
    // Check file size (max 50MB for hackathon demo)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        approved: false,
        reason: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 50MB.`
      };
    }
    
    // For hackathon: approve valid media types
    // Production: use AI vision API for content analysis
    console.log(`🖼️  Media moderation: Approved ${file.mimetype} (${(file.size / 1024).toFixed(2)}KB)`);
    
    return {
      approved: true,
      reason: 'Media file validated. Type and size within limits.'
    };
    
  } catch (error) {
    console.error('❌ Media moderation failed:', error.message);
    return {
      approved: false,
      reason: `Media moderation error: ${error.message}`
    };
  }
}

/**
 * Comprehensive content moderation
 * Checks both text and media if provided
 * 
 * @param {string} textContent - Text content
 * @param {Object|null} mediaFile - Optional media file
 * @returns {Promise<Object>} - Combined moderation result
 */
async function moderateContent(textContent, mediaFile = null) {
  try {
    // Moderate text
    const textModeration = await moderateText(textContent);
    
    if (!textModeration.approved) {
      return textModeration;
    }
    
    // Moderate media if provided
    if (mediaFile) {
      const mediaModeration = await moderateMedia(mediaFile);
      
      if (!mediaModeration.approved) {
        return mediaModeration;
      }
      
      return {
        approved: true,
        reason: 'Text and media content approved.'
      };
    }
    
    return textModeration;
    
  } catch (error) {
    console.error('❌ Content moderation failed:', error.message);
    return {
      approved: false,
      reason: `Moderation error: ${error.message}`
    };
  }
}

module.exports = {
  moderateText,
  moderateMedia,
  moderateContent
};
