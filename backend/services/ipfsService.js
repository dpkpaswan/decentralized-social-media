/**
 * IPFS SERVICE - Decentralized Content Storage
 * 
 * WHY IPFS?
 * - Content-addressed storage (immutable)
 * - Distributed across multiple nodes
 * - No central server controls the data
 * - Cryptographically verifiable
 * - Censorship-resistant
 * 
 * This service handles all interactions with IPFS for:
 * - Uploading post JSON
 * - Uploading media files (images/videos)
 * - Uploading comments and likes
 * - Fetching content via IPFS gateways
 * 
 * For hackathon: Using Pinata (IPFS pinning service)
 * Production: Can use local IPFS node or web3.storage
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

/**
 * Upload JSON data to IPFS
 * Used for: posts, comments, likes
 * 
 * @param {Object} jsonData - The data to upload
 * @returns {Promise<string>} - IPFS hash (CID)
 */
async function uploadJSONToIPFS(jsonData) {
  try {
    const PINATA_API_KEY = process.env.PINATA_API_KEY;
    const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error('Pinata API keys not configured. Check .env file.');
    }

    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    
    const response = await axios.post(url, jsonData, {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    });

    const ipfsHash = response.data.IpfsHash;
    console.log(`✅ JSON uploaded to IPFS: ${ipfsHash}`);
    
    return ipfsHash;
  } catch (error) {
    console.error('❌ IPFS JSON upload failed:', error.message);
    throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
  }
}

/**
 * Upload file (image/video) to IPFS
 * 
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} - IPFS hash (CID)
 */
async function uploadFileToIPFS(file) {
  try {
    const PINATA_API_KEY = process.env.PINATA_API_KEY;
    const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error('Pinata API keys not configured. Check .env file.');
    }

    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    
    const formData = new FormData();
    
    // If file has a buffer (from memory storage)
    if (file.buffer) {
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    } 
    // If file has a path (from disk storage)
    else if (file.path) {
      formData.append('file', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype
      });
    } else {
      throw new Error('Invalid file object');
    }

    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const ipfsHash = response.data.IpfsHash;
    console.log(`✅ File uploaded to IPFS: ${ipfsHash}`);
    
    // Clean up temp file if it exists
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    return ipfsHash;
  } catch (error) {
    console.error('❌ IPFS file upload failed:', error.message);
    
    // Clean up temp file on error
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    throw new Error(`Failed to upload file to IPFS: ${error.message}`);
  }
}

/**
 * Fetch content from IPFS via gateway
 * 
 * @param {string} ipfsHash - The IPFS hash (CID) to fetch
 * @returns {Promise<Object>} - The content from IPFS
 */
async function fetchFromIPFS(ipfsHash) {
  try {
    const gateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
    const url = `${gateway}${ipfsHash}`;
    
    const response = await axios.get(url, {
      timeout: 10000 // 10 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ IPFS fetch failed:', error.message);
    throw new Error(`Failed to fetch from IPFS: ${error.message}`);
  }
}

/**
 * Verify IPFS hash exists and is accessible
 * 
 * @param {string} ipfsHash - The IPFS hash to verify
 * @returns {Promise<boolean>} - True if accessible
 */
async function verifyIPFSHash(ipfsHash) {
  try {
    await fetchFromIPFS(ipfsHash);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  uploadJSONToIPFS,
  uploadFileToIPFS,
  fetchFromIPFS,
  verifyIPFSHash
};
