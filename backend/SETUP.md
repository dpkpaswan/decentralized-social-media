# 🚀 SETUP GUIDE - DecentraSocial Backend

## Prerequisites

- Node.js v16+ installed
- npm or yarn
- Pinata account (free tier works)
- Google Gemini API key (free tier works)

---

## Step 1: Get API Keys

### A. Pinata (IPFS)

1. Go to https://www.pinata.cloud/
2. Sign up for free account
3. Navigate to: Account → API Keys
4. Click "New Key"
5. Enable: `pinFileToIPFS` and `pinJSONToIPFS`
6. Copy your:
   - API Key
   - API Secret

### B. Google Gemini (AI Moderation)

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy your API key

---

## Step 2: Install Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install
```

This will install:
- express (web server)
- cors (cross-origin requests)
- dotenv (environment variables)
- axios (HTTP client)
- multer (file uploads)
- form-data (multipart data)
- @pinata/sdk (IPFS)
- @google/generative-ai (AI moderation)

---

## Step 3: Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Open .env in your editor
notepad .env
# or
code .env
```

Edit `.env` with your API keys:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Pinata IPFS Configuration
PINATA_API_KEY=paste_your_actual_pinata_api_key_here
PINATA_SECRET_KEY=paste_your_actual_pinata_secret_key_here

# Google Gemini AI Configuration
GEMINI_API_KEY=paste_your_actual_gemini_api_key_here

# CORS (Frontend URL)
CORS_ORIGIN=http://localhost:3000

# IPFS Gateway
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

**Important:** Replace the placeholder values with your actual keys!

---

## Step 4: Start Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

---

## Step 5: Verify Installation

Once server is running, you should see:

```
============================================================
🚀 DecentraSocial Backend Server
============================================================
📡 Server running on: http://localhost:5000
🌍 Environment: development
🔗 CORS Origin: http://localhost:3000

📋 Configuration:
   IPFS: ✅ Pinata configured
   AI Moderation: ✅ Gemini configured

🎯 API Endpoints:
   POST /api/moderate - Moderate content
   POST /api/ipfs/upload - Upload JSON to IPFS
   POST /api/ipfs/upload/file - Upload file to IPFS
   GET  /api/ipfs/fetch/:hash - Fetch from IPFS
   POST /api/post/create - Create post
   POST /api/comment/create - Create comment
   POST /api/like - Like post
============================================================
```

---

## Step 6: Test API

### Test 1: Health Check

Open browser and go to: http://localhost:5000

You should see JSON response with server info.

### Test 2: Content Moderation

```bash
# Windows PowerShell
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/moderate" `
  -ContentType "application/json" `
  -Body '{"content":"Hello world!","mediaType":"none"}'
```

```bash
# Linux/Mac (curl)
curl -X POST http://localhost:5000/api/moderate \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello world!","mediaType":"none"}'
```

Expected response:
```json
{
  "success": true,
  "approved": true,
  "reason": "Content is safe...",
  "timestamp": "2025-12-19T..."
}
```

### Test 3: IPFS Upload

```bash
# PowerShell
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/ipfs/upload" `
  -ContentType "application/json" `
  -Body '{"message":"Hello IPFS!","test":true}'
```

Expected response:
```json
{
  "success": true,
  "ipfsHash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "gateway": "https://gateway.pinata.cloud/ipfs/QmXXX...",
  "timestamp": "2025-12-19T..."
}
```

Copy the `ipfsHash` and visit the `gateway` URL to verify!

---

## Troubleshooting

### Problem: "IPFS upload failed"

**Solution:**
- Check your Pinata API keys in `.env`
- Make sure keys are correct (no extra spaces)
- Verify Pinata account is active

### Problem: "AI moderation failed"

**Solution:**
- Check your Gemini API key in `.env`
- Verify you have Gemini API access
- Server will fallback to keyword filtering

### Problem: "Port 5000 already in use"

**Solution:**
- Change PORT in `.env` to another port (e.g., 5001)
- Or stop other service using port 5000

### Problem: Dependencies won't install

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## Next Steps

1. ✅ Backend is running
2. Start frontend (see frontend setup guide)
3. Test complete flow:
   - Login with key
   - Create post
   - Upload media
   - Add comments
   - Like posts

---

## API Testing Tools

### Recommended:
- **Postman** - https://www.postman.com/
- **Insomnia** - https://insomnia.rest/
- **Thunder Client** (VS Code extension)

### Import Collection:
Create a Postman collection with these requests:

1. POST `/api/moderate` - Test moderation
2. POST `/api/ipfs/upload` - Test JSON upload
3. POST `/api/ipfs/upload/file` - Test file upload
4. GET `/api/ipfs/fetch/:hash` - Test fetch
5. POST `/api/post/create` - Test post creation
6. POST `/api/comment/create` - Test comment
7. POST `/api/like` - Test like

---

## Production Deployment

### Option 1: Traditional Hosting
- Deploy to: Heroku, Railway, Render, DigitalOcean
- Set environment variables in platform dashboard
- No file system needed (everything on IPFS)

### Option 2: Decentralized Hosting
- Deploy to: Fleek, Skynet, IPFS
- True decentralization: backend on IPFS too!
- No single point of failure

### Environment Variables for Production:
```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend-domain.com
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
GEMINI_API_KEY=your_key
```

---

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to git
- Keep API keys secret
- Use environment variables in production
- Add rate limiting for production
- Implement request validation

---

## Support

For issues:
1. Check the logs in terminal
2. Verify `.env` configuration
3. Test API keys separately
4. Review backend/README.md

---

## Quick Reference

**Start Server:**
```bash
cd backend
npm start
```

**Check Logs:**
Look at terminal output - server logs all operations

**API Base URL:**
```
http://localhost:5000
```

**Test Endpoint:**
```bash
curl http://localhost:5000
```

---

**Setup complete! 🎉**

Your decentralized social media backend is ready for HackForge'25!
