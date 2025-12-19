/**
 * COMMENT CONTROLLER
 * 
 * API: POST /api/comment/create
 * 
 * Purpose: Add a comment to a post
 * 
 * Flow:
 * 1. Receive comment data
 * 2. Moderate comment content
 * 3. If approved:
 *    - Create comment JSON referencing parent post
 *    - Upload to IPFS
 *    - Return comment IPFS hash
 * 
 * WHY THIS IS DECENTRALIZED:
 * - Each comment is a separate IPFS object
 * - Comments reference parent post via IPFS hash
 * - No centralized comment database
 * - Comments are immutable and verifiable
 * - Anyone can query comments by post hash
 */

const { moderateText } = require('../services/aiModeration');
const { uploadJSONToIPFS, verifyIPFSHash } = require('../services/ipfsService');
const { APIError } = require('../middleware/errorHandler');

/**
 * Create a new comment
 * 
 * Body:
 * {
 *   "postHash": "Qm...",
 *   "author": "0x...",
 *   "content": "comment text"
 * }
 */
async function createComment(req, res, next) {
  try {
    const { postHash, author, content } = req.body;

    // Validation
    if (!postHash || !postHash.startsWith('Qm')) {
      throw new APIError(400, 'Valid post IPFS hash required (must start with Qm)');
    }

    if (!author || !author.startsWith('0x')) {
      throw new APIError(400, 'Valid author public key required (must start with 0x)');
    }

    if (!content || typeof content !== 'string') {
      throw new APIError(400, 'Comment content is required');
    }

    if (content.trim().length === 0) {
      throw new APIError(400, 'Comment cannot be empty');
    }

    if (content.length > 1000) {
      throw new APIError(400, 'Comment too long. Max 1000 characters.');
    }

    console.log(`\n💬 Creating comment on post ${postHash.slice(0, 10)}...`);
    console.log(`   Author: ${author.slice(0, 10)}...`);
    console.log(`   Content: ${content.slice(0, 50)}${content.length > 50 ? '...' : ''}`);

    // Step 1: Moderate comment
    console.log('🔍 Step 1: Moderating comment...');
    const moderation = await moderateText(content);

    if (!moderation.approved) {
      console.log(`❌ Comment rejected: ${moderation.reason}`);
      return res.status(403).json({
        success: false,
        approved: false,
        reason: moderation.reason,
        message: 'Comment rejected by content moderation'
      });
    }

    console.log(`✅ Comment approved: ${moderation.reason}`);

    // Step 2: Create comment JSON
    console.log('📦 Step 2: Creating comment JSON...');
    const commentData = {
      type: 'comment',
      postIpfsHash: postHash,
      author: author,
      content: content,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Step 3: Upload comment to IPFS
    console.log('📤 Step 3: Uploading comment to IPFS...');
    const commentIpfsHash = await uploadJSONToIPFS(commentData);
    console.log(`✅ Comment created: ${commentIpfsHash}\n`);

    // Success response
    res.status(201).json({
      success: true,
      approved: true,
      commentIpfsHash: commentIpfsHash,
      postIpfsHash: postHash,
      gateway: `${process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'}${commentIpfsHash}`,
      verifyUrl: `https://ipfs.io/ipfs/${commentIpfsHash}`,
      message: 'Comment successfully created and stored on IPFS',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComment
};
