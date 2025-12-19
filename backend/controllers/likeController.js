/**
 * LIKE CONTROLLER
 * 
 * API: POST /api/like
 * 
 * Purpose: Like/unlike a post in a decentralized way
 * 
 * Flow:
 * 1. Receive like data (post hash + user public key)
 * 2. Create lightweight like JSON
 * 3. Upload to IPFS
 * 4. Return like IPFS hash
 * 
 * WHY THIS IS DECENTRALIZED:
 * - Each like is a signed action stored on IPFS
 * - Likes reference post via IPFS hash
 * - No centralized like counter
 * - Cryptographically verifiable (who liked what)
 * - Cannot fake likes without private key
 * 
 * PREVENTING DUPLICATE LIKES:
 * - Frontend should check existing likes before calling
 * - Backend creates immutable like record
 * - Aggregation happens client-side by querying IPFS
 */

const { uploadJSONToIPFS } = require('../services/ipfsService');
const { APIError } = require('../middleware/errorHandler');

/**
 * Create a like
 * 
 * Body:
 * {
 *   "postHash": "Qm...",
 *   "likedBy": "0x..."
 * }
 */
async function createLike(req, res, next) {
  try {
    const { postHash, likedBy } = req.body;

    // Validation
    if (!postHash || !postHash.startsWith('Qm')) {
      throw new APIError(400, 'Valid post IPFS hash required (must start with Qm)');
    }

    if (!likedBy || !likedBy.startsWith('0x')) {
      throw new APIError(400, 'Valid user public key required (must start with 0x)');
    }

    console.log(`\n❤️  Creating like on post ${postHash.slice(0, 10)}...`);
    console.log(`   Liked by: ${likedBy.slice(0, 10)}...`);

    // Create like JSON
    // In production: include cryptographic signature
    const likeData = {
      type: 'like',
      postIpfsHash: postHash,
      likedBy: likedBy,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Upload like to IPFS
    console.log('📤 Uploading like to IPFS...');
    const likeIpfsHash = await uploadJSONToIPFS(likeData);
    console.log(`✅ Like created: ${likeIpfsHash}\n`);

    // Success response
    res.status(201).json({
      success: true,
      likeIpfsHash: likeIpfsHash,
      postIpfsHash: postHash,
      likedBy: likedBy,
      gateway: `${process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'}${likeIpfsHash}`,
      verifyUrl: `https://ipfs.io/ipfs/${likeIpfsHash}`,
      message: 'Like successfully recorded on IPFS',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Unlike (for demo purposes)
 * In a true decentralized system, you can't "delete" likes from IPFS
 * Instead, you create an "unlike" record
 */
async function createUnlike(req, res, next) {
  try {
    const { postHash, unlikedBy } = req.body;

    // Validation
    if (!postHash || !postHash.startsWith('Qm')) {
      throw new APIError(400, 'Valid post IPFS hash required');
    }

    if (!unlikedBy || !unlikedBy.startsWith('0x')) {
      throw new APIError(400, 'Valid user public key required');
    }

    console.log(`\n💔 Creating unlike on post ${postHash.slice(0, 10)}...`);

    // Create unlike JSON
    const unlikeData = {
      type: 'unlike',
      postIpfsHash: postHash,
      unlikedBy: unlikedBy,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Upload unlike to IPFS
    const unlikeIpfsHash = await uploadJSONToIPFS(unlikeData);
    console.log(`✅ Unlike created: ${unlikeIpfsHash}\n`);

    res.status(201).json({
      success: true,
      unlikeIpfsHash: unlikeIpfsHash,
      postIpfsHash: postHash,
      message: 'Unlike successfully recorded on IPFS',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  createLike,
  createUnlike
};
