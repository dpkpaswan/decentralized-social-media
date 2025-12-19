/**
 * POST CONTROLLER
 * 
 * API: POST /api/post/create
 * 
 * Purpose: Create a decentralized post
 * 
 * Flow:
 * 1. Receive post data (text + optional media)
 * 2. Moderate content using AI
 * 3. If approved:
 *    - Upload media to IPFS (if exists)
 *    - Create post JSON with metadata
 *    - Upload post JSON to IPFS
 *    - Return IPFS hash
 * 4. If rejected:
 *    - Return rejection reason
 * 
 * WHY THIS IS DECENTRALIZED:
 * - Post stored on IPFS, not a database
 * - Content is immutable and verifiable
 * - Anyone can host/pin the content
 * - No central authority controls posts
 */

const { moderateContent } = require('../services/aiModeration');
const { uploadFileToIPFS, uploadJSONToIPFS } = require('../services/ipfsService');
const { APIError } = require('../middleware/errorHandler');

// In-memory posts storage (for demo - in production, use a database)
const posts = [];

/**
 * Get all posts
 */
async function getPosts(req, res, next) {
  try {
    // Return posts in reverse chronological order
    const sortedPosts = [...posts].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    res.status(200).json({
      success: true,
      posts: sortedPosts,
      count: sortedPosts.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new post
 * 
 * Body (multipart/form-data):
 * - author: public key (0x...)
 * - content: post text
 * - file: optional media file
 */
async function createPost(req, res, next) {
  try {
    const { author, content } = req.body;
    const mediaFile = req.file;

    // Validation
    if (!author || !author.startsWith('0x')) {
      throw new APIError(400, 'Valid author public key required (must start with 0x)');
    }

    if (!content || typeof content !== 'string') {
      throw new APIError(400, 'Post content is required');
    }

    if (content.trim().length === 0) {
      throw new APIError(400, 'Post content cannot be empty');
    }

    if (content.length > 5000) {
      throw new APIError(400, 'Post content too long. Max 5000 characters.');
    }

    console.log(`\n📝 Creating post from ${author.slice(0, 10)}...`);
    console.log(`   Content: ${content.slice(0, 50)}${content.length > 50 ? '...' : ''}`);
    console.log(`   Media: ${mediaFile ? mediaFile.originalname : 'none'}`);

    // Step 1: Moderate content
    console.log('🔍 Step 1: Moderating content...');
    const moderation = await moderateContent(content, mediaFile);

    if (!moderation.approved) {
      console.log(`❌ Content rejected: ${moderation.reason}`);
      return res.status(403).json({
        success: false,
        approved: false,
        reason: moderation.reason,
        message: 'Post rejected by content moderation'
      });
    }

    console.log(`✅ Content approved: ${moderation.reason}`);

    // Step 2: Upload media to IPFS (if exists)
    let mediaIpfsHash = null;
    let mediaType = null;
    const moderationType = moderation.moderationType || 'ai';

    if (mediaFile) {
      console.log('📤 Step 2: Uploading media to IPFS...');
      mediaIpfsHash = await uploadFileToIPFS(mediaFile);
      mediaType = mediaFile.mimetype.startsWith('image/') ? 'image' : 'video';
      console.log(`✅ Media uploaded: ${mediaIpfsHash}`);
    }

    // Step 3: Create post JSON
    console.log('📦 Step 3: Creating post JSON...');
    const postData = {
      type: 'post',
      author: author,
      content: content,
      media: {
        type: mediaType || 'none',
        ipfsHash: mediaIpfsHash || null
      },
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Step 4: Upload post JSON to IPFS
    console.log('📤 Step 4: Uploading post to IPFS...');
    const postIpfsHash = await uploadJSONToIPFS(postData);
    console.log(`✅ Post created: ${postIpfsHash}\n`);

    // Store post metadata in memory for retrieval
    const postMetadata = {
      id: Date.now(),
      author: author,
      content: content,
      timestamp: postData.timestamp,
      ipfsHash: postIpfsHash,
      mediaType: mediaType,
      mediaIpfsHash: mediaIpfsHash,
      likes: [],
      comments: []
    };
    posts.push(postMetadata);

    // Success response with fastest gateway options
    res.status(201).json({
      success: true,
      approved: true,
      moderation: moderationType,
      reason: moderation.reason,
      postIpfsHash: postIpfsHash,
      mediaIpfsHash: mediaIpfsHash,
      gateway: `https://ipfs.io/ipfs/${postIpfsHash}`,
      verifyUrl: `https://ipfs.io/ipfs/${postIpfsHash}`,
      alternateGateways: [
        `https://dweb.link/ipfs/${postIpfsHash}`,
        `https://ipfs.filebase.io/ipfs/${postIpfsHash}`,
        `https://cloudflare-ipfs.com/ipfs/${postIpfsHash}`
      ],
      message: 'Post successfully created and stored on IPFS',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPost,
  getPosts
};
