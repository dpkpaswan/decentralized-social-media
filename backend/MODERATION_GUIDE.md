# AI Moderation Implementation Guide

## Overview

This backend uses **Google Gemini AI** for content moderation with a **robust fallback strategy** to ensure posts are never blocked due to AI service unavailability.

## Architecture

```
POST /api/post/create
    ↓
moderateText(content)
    ↓
Try: gemini-pro → gemini-1.0-pro → gemini-1.0-pro-latest
    ↓
If all fail → Fallback keyword filter
    ↓
Always return: { approved, reason, moderationType }
    ↓
Post created on IPFS (if approved)
```

## Implementation Details

### 1. **AI Moderation Function** (`services/aiModeration.js`)

```javascript
async function moderateText(content) {
  // Check API key availability
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return simpleKeywordModeration(content);
  }

  // Try multiple stable models in order of preference
  const modelsToTry = [
    'gemini-pro',           // Most stable
    'gemini-1.0-pro',       // Explicit version
    'gemini-1.0-pro-latest' // Latest 1.0
  ];

  for (const modelName of modelsToTry) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `Analyze this post: "${content}"
      Check for: adult content, violence, hate speech, spam.
      Respond with JSON: {"approved": true/false, "reason": "..."}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const moderation = JSON.parse(text.match(/\{[\s\S]*?\}/)[0]);
      
      return {
        approved: moderation.approved,
        reason: moderation.reason,
        moderationType: 'ai'
      };
      
    } catch (error) {
      console.warn(`Model ${modelName} failed, trying next...`);
    }
  }
  
  // All models failed - use fallback
  return simpleKeywordModeration(content);
}
```

### 2. **Fallback Keyword Moderation**

```javascript
function simpleKeywordModeration(content) {
  const restricted = ['nsfw', 'porn', 'xxx', 'kill', 'murder', 'terrorist', 'racist', 'nazi'];
  
  for (const keyword of restricted) {
    if (content.toLowerCase().includes(keyword)) {
      return {
        approved: false,
        reason: `Content contains restricted term: "${keyword}"`,
        moderationType: 'fallback'
      };
    }
  }
  
  return {
    approved: true,
    reason: 'Content passed keyword filter (AI unavailable)',
    moderationType: 'fallback'
  };
}
```

### 3. **Post Creation Flow** (`controllers/postController.js`)

```javascript
async function createPost(req, res, next) {
  const { author, content } = req.body;
  const mediaFile = req.file;

  // Step 1: Moderate content
  const moderation = await moderateContent(content, mediaFile);

  if (!moderation.approved) {
    // Content rejected - return 403
    return res.status(403).json({
      success: false,
      approved: false,
      reason: moderation.reason,
      message: 'Post rejected by content moderation'
    });
  }

  // Step 2: Upload media to IPFS (if exists)
  let mediaIpfsHash = null;
  if (mediaFile) {
    mediaIpfsHash = await uploadFileToIPFS(mediaFile);
  }

  // Step 3: Create post JSON
  const postData = {
    type: 'post',
    author: author,
    content: content,
    media: { type: mediaType, ipfsHash: mediaIpfsHash },
    timestamp: new Date().toISOString(),
    version: '1.0'
  };

  // Step 4: Upload to IPFS
  const postIpfsHash = await uploadJSONToIPFS(postData);

  // Step 5: Return success (ALWAYS if moderation approved)
  res.status(201).json({
    success: true,
    approved: true,
    moderation: moderation.moderationType, // 'ai' or 'fallback'
    reason: moderation.reason,
    postIpfsHash: postIpfsHash,
    mediaIpfsHash: mediaIpfsHash,
    gateway: `https://ipfs.io/ipfs/${postIpfsHash}`,
    verifyUrl: `https://ipfs.io/ipfs/${postIpfsHash}`,
    message: 'Post successfully created and stored on IPFS'
  });
}
```

## Response Format

### Success Response (Post Created)

```json
{
  "success": true,
  "approved": true,
  "moderation": "ai",
  "reason": "Content is appropriate for public platform",
  "postIpfsHash": "QmXYZ...",
  "mediaIpfsHash": "QmABC...",
  "gateway": "https://ipfs.io/ipfs/QmXYZ...",
  "verifyUrl": "https://ipfs.io/ipfs/QmXYZ...",
  "message": "Post successfully created and stored on IPFS",
  "timestamp": "2025-12-19T11:30:00.000Z"
}
```

### Success Response (Fallback Moderation)

```json
{
  "success": true,
  "approved": true,
  "moderation": "fallback",
  "reason": "Content passed keyword filter (AI unavailable)",
  "postIpfsHash": "QmXYZ...",
  "message": "Post successfully created and stored on IPFS"
}
```

### Rejection Response

```json
{
  "success": false,
  "approved": false,
  "reason": "Content contains adult material",
  "message": "Post rejected by content moderation"
}
```

## Frontend Integration

### Correct Frontend Logic

```javascript
async function createPost() {
  try {
    const response = await fetch('http://localhost:5000/api/post/create', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    // ✅ CORRECT: Check success AND approved
    if (result.success && result.approved) {
      // Post created successfully
      console.log('Post created:', result.postIpfsHash);
      console.log('Moderation:', result.moderation); // 'ai' or 'fallback'
      
      // Show in UI
      if (result.moderation === 'fallback') {
        showNotification('Post created (AI moderation unavailable)');
      } else {
        showNotification('Post created and AI approved');
      }
      
    } else {
      // Post rejected by moderation
      showError(`Post rejected: ${result.reason}`);
    }
    
  } catch (error) {
    // Network error - backend unreachable
    showError('Failed to connect to backend');
  }
}
```

### ❌ Wrong Frontend Logic (DO NOT USE)

```javascript
// ❌ WRONG: Treating AI failure as post failure
if (!response.ok) {
  throw new Error("Post failed");
}

// ❌ WRONG: Only checking approved, ignoring success
if (!data.approved) {
  showError("Post failed");
}
```

## Configuration

### Environment Variables (`.env`)

```env
# IPFS via Pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# AI Moderation (Optional - will use fallback if missing)
GEMINI_API_KEY=your_gemini_api_key

# Gateway (optional)
IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### Getting Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy and paste into `.env` file
4. Restart server

## Testing

### Test 1: Normal Post (Should Work)

```bash
curl -X POST http://localhost:5000/api/post/create \
  -F "author=0x1234567890abcdef" \
  -F "content=Hello from IPFS!"
```

**Expected:** `success: true, approved: true, moderation: "ai" or "fallback"`

### Test 2: Inappropriate Content (Should Reject)

```bash
curl -X POST http://localhost:5000/api/post/create \
  -F "author=0x1234567890abcdef" \
  -F "content=This contains porn content"
```

**Expected:** `success: false, approved: false, reason: "..."`

### Test 3: With Media

```bash
curl -X POST http://localhost:5000/api/post/create \
  -F "author=0x1234567890abcdef" \
  -F "content=Check out this image!" \
  -F "file=@test-image.jpg"
```

**Expected:** `success: true, mediaIpfsHash: "Qm..."`

## Troubleshooting

### Issue: "AI moderation failed" in logs

**Cause:** Gemini API key invalid or model unavailable

**Solution:** 
- Verify API key in `.env`
- System automatically falls back to keyword moderation
- Posts still get created successfully

### Issue: All posts rejected

**Cause:** Keyword in content matches restricted list

**Solution:** 
- Check `simpleKeywordModeration()` function
- Adjust keyword list if needed for your use case

### Issue: Frontend shows "Failed to create post"

**Cause:** Frontend checking wrong field

**Solution:**
```javascript
// ✅ Correct
if (result.success && result.approved) { ... }

// ❌ Wrong
if (result.approved) { ... }
```

## Key Principles

1. **Never Fail Post Creation Due to AI Issues**
   - AI failure → fallback moderation
   - Fallback approval → post created
   - Only reject if content actually violates policy

2. **Transparent Moderation**
   - Always return `moderationType: 'ai' | 'fallback'`
   - Frontend can show this to users
   - Builds trust with transparency

3. **Graceful Degradation**
   - Try multiple AI models
   - Fallback to keyword filtering
   - Provide helpful error messages

4. **Correct Response Format**
   - `success: true` = post was created
   - `approved: true` = content passed moderation
   - Both must be true for successful post

## Performance

- **AI Moderation:** ~1-3 seconds
- **Fallback Moderation:** <10ms
- **IPFS Upload:** ~500ms-2s
- **Total:** ~2-5 seconds per post

## Security Notes

⚠️ **This is a hackathon MVP**. For production:

1. Add rate limiting (express-rate-limit)
2. Add signature verification (verify author owns key)
3. Implement CAPTCHA for spam prevention
4. Add IP-based abuse detection
5. Use proper AI vision for media moderation
6. Implement content reporting system

---

**Last Updated:** December 19, 2025  
**Status:** ✅ Production-ready for hackathon demo
