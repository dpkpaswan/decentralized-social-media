/**
 * IPFS CONTROLLER
 * 
 * Handles direct IPFS operations
 * - Upload JSON
 * - Upload files
 * - Fetch content
 */

const { uploadJSONToIPFS, uploadFileToIPFS, fetchFromIPFS } = require('../services/ipfsService');
const { APIError } = require('../middleware/errorHandler');

/**
 * Upload JSON to IPFS
 * POST /api/ipfs/upload
 */
async function uploadJSON(req, res, next) {
  try {
    const data = req.body;

    if (!data || typeof data !== 'object') {
      throw new APIError(400, 'Request body must be a valid JSON object');
    }

    console.log('📤 Uploading JSON to IPFS...');
    
    const ipfsHash = await uploadJSONToIPFS(data);

    res.json({
      success: true,
      ipfsHash: ipfsHash,
      gateway: `${process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'}${ipfsHash}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Upload file to IPFS
 * POST /api/ipfs/upload/file
 * Multipart form-data with 'file' field
 */
async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      throw new APIError(400, 'No file uploaded. Use multipart/form-data with "file" field.');
    }

    console.log(`📤 Uploading file to IPFS: ${req.file.originalname} (${req.file.mimetype})`);
    
    const ipfsHash = await uploadFileToIPFS(req.file);

    res.json({
      success: true,
      ipfsHash: ipfsHash,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      gateway: `${process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'}${ipfsHash}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Fetch content from IPFS
 * GET /api/ipfs/fetch/:hash
 */
async function fetchContent(req, res, next) {
  try {
    const { hash } = req.params;

    if (!hash) {
      throw new APIError(400, 'IPFS hash is required');
    }

    console.log(`📥 Fetching from IPFS: ${hash}`);
    
    const content = await fetchFromIPFS(hash);

    res.json({
      success: true,
      content: content,
      ipfsHash: hash,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadJSON,
  uploadFile,
  fetchContent
};
