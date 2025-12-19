# DecentraSocial Backend API

## 🎯 HackForge'25 - Decentralized Social Media Platform

### Architecture Overview

This is a **stateless gateway server** for a truly decentralized social media platform. It does NOT act as a traditional backend with databases and user management.

```
┌─────────────┐
│   Frontend  │ (Key-based auth, MetaMask)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Backend   │ (Stateless Gateway)
│   Express   │ • AI Moderation
│             │ • IPFS Bridge
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    IPFS     │ (Decentralized Storage)
│  Distributed│ • Posts
│   Network   │ • Media
│             │ • Comments
│             │ • Likes
└─────────────┘
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Get free Pinata API keys: https://www.pinata.cloud/
PINATA_API_KEY=your_actual_pinata_key
PINATA_SECRET_KEY=your_actual_pinata_secret

# Get free Gemini API key: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_actual_gemini_key

# Server config
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

Server runs on: `http://localhost:5000`

## 📡 API Endpoints

### 1. **Health Check**

```http
GET /
```

**Response:**
```json
{
  "success": true,
  "message": "DecentraSocial API Server",
  "status": "running",
  "decentralized": true,
  "endpoints": { /* all available endpoints */ }
}
```

---

### 2. **Content Moderation**

```http
POST /api/moderate
Content-Type: application/json
```

**Purpose:** Moderate text content before posting

**Request Body:**
```json
{
  "content": "This is my post content",
  "mediaType": "image" | "video" | "none"
}
```

**Response (Approved):**
```json
{
  "success": true,
  "approved": true,
  "reason": "Content is safe and appropriate",
  "timestamp": "2025-12-19T..."
}
```

**Response (Rejected):**
```json
{
  "success": true,
  "approved": false,
  "reason": "Content contains adult/inappropriate material",
  "timestamp": "2025-12-19T..."
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/moderate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, this is a test post!",
    "mediaType": "none"
  }'
```

---

### 3. **Upload JSON to IPFS**

```http
POST /api/ipfs/upload
Content-Type: application/json
```

**Purpose:** Upload any JSON data to IPFS

**Request Body:** Any valid JSON

**Response:**
```json
{
  "success": true,
  "ipfsHash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "gateway": "https://gateway.pinata.cloud/ipfs/QmXXX...",
  "timestamp": "2025-12-19T..."
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/ipfs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello IPFS!",
    "author": "0x1234..."
  }'
```

---

### 4. **Upload File to IPFS**

```http
POST /api/ipfs/upload/file
Content-Type: multipart/form-data
```

**Purpose:** Upload images/videos to IPFS

**Request:** Form-data with `file` field

**Response:**
```json
{
  "success": true,
  "ipfsHash": "QmYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 524288,
  "gateway": "https://gateway.pinata.cloud/ipfs/QmYYY...",
  "timestamp": "2025-12-19T..."
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/ipfs/upload/file \
  -F "file=@./photo.jpg"
```

---

### 5. **Fetch from IPFS**

```http
GET /api/ipfs/fetch/:hash
```

**Purpose:** Retrieve content from IPFS

**Response:**
```json
{
  "success": true,
  "content": { /* IPFS content */ },
  "ipfsHash": "QmXXX...",
  "timestamp": "2025-12-19T..."
}
```

**Example:**
```bash
curl http://localhost:5000/api/ipfs/fetch/QmXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 6. **Create Post**

```http
POST /api/post/create
Content-Type: multipart/form-data
```

**Purpose:** Create a decentralized post with optional media

**Request Form Data:**
- `author` (string): User's public key (0x...)
- `content` (string): Post text content
- `file` (file, optional): Image or video

**Flow:**
1. Moderates content using AI
2. Uploads media to IPFS (if provided)
3. Creates post JSON with metadata
4. Uploads post JSON to IPFS
5. Returns IPFS hash

**Response (Success):**
```json
{
  "success": true,
  "approved": true,
  "postIpfsHash": "QmZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
  "mediaIpfsHash": "QmYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
  "gateway": "https://gateway.pinata.cloud/ipfs/QmZZZ...",
  "verifyUrl": "https://ipfs.io/ipfs/QmZZZ...",
  "message": "Post successfully created and stored on IPFS",
  "timestamp": "2025-12-19T..."
}
```

**Response (Rejected):**
```json
{
  "success": false,
  "approved": false,
  "reason": "Content contains restricted material",
  "message": "Post rejected by content moderation"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/post/create \
  -F "author=0x1234567890abcdef" \
  -F "content=Check out this amazing photo!" \
  -F "file=@./photo.jpg"
```

**Post JSON Structure on IPFS:**
```json
{
  "type": "post",
  "author": "0x1234567890abcdef",
  "content": "Check out this amazing photo!",
  "media": {
    "type": "image",
    "ipfsHash": "QmYYY..."
  },
  "timestamp": "2025-12-19T10:30:00.000Z",
  "version": "1.0"
}
```

---

### 7. **Create Comment**

```http
POST /api/comment/create
Content-Type: application/json
```

**Purpose:** Add a comment to a post

**Request Body:**
```json
{
  "postHash": "QmXXX...",
  "author": "0x1234567890abcdef",
  "content": "Great post!"
}
```

**Response:**
```json
{
  "success": true,
  "approved": true,
  "commentIpfsHash": "QmCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
  "postIpfsHash": "QmXXX...",
  "gateway": "https://gateway.pinata.cloud/ipfs/QmCCC...",
  "verifyUrl": "https://ipfs.io/ipfs/QmCCC...",
  "message": "Comment successfully created and stored on IPFS",
  "timestamp": "2025-12-19T..."
}
```

**Comment JSON Structure:**
```json
{
  "type": "comment",
  "postIpfsHash": "QmXXX...",
  "author": "0x1234567890abcdef",
  "content": "Great post!",
  "timestamp": "2025-12-19T10:35:00.000Z",
  "version": "1.0"
}
```

---

### 8. **Like Post**

```http
POST /api/like
Content-Type: application/json
```

**Purpose:** Like a post (creates immutable like record on IPFS)

**Request Body:**
```json
{
  "postHash": "QmXXX...",
  "likedBy": "0x1234567890abcdef"
}
```

**Response:**
```json
{
  "success": true,
  "likeIpfsHash": "QmLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL",
  "postIpfsHash": "QmXXX...",
  "likedBy": "0x1234567890abcdef",
  "gateway": "https://gateway.pinata.cloud/ipfs/QmLLL...",
  "verifyUrl": "https://ipfs.io/ipfs/QmLLL...",
  "message": "Like successfully recorded on IPFS",
  "timestamp": "2025-12-19T..."
}
```

**Like JSON Structure:**
```json
{
  "type": "like",
  "postIpfsHash": "QmXXX...",
  "likedBy": "0x1234567890abcdef",
  "timestamp": "2025-12-19T10:40:00.000Z",
  "version": "1.0"
}
```

---

## 🔐 Decentralization Principles

### No User Database
- Users identified by public keys (0x...)
- No user registration or login on backend
- Frontend handles key-based auth

### No Content Database
- All content stored on IPFS
- Posts, comments, likes = IPFS hashes
- Backend just facilitates upload

### Stateless Server
- No sessions
- No cookies
- Each request independent
- Server can be replaced anytime

### Verifiable Content
Every action returns IPFS hash:
```
Post: https://ipfs.io/ipfs/QmXXX...
Media: https://ipfs.io/ipfs/QmYYY...
Comment: https://ipfs.io/ipfs/QmCCC...
Like: https://ipfs.io/ipfs/QmLLL...
```

Anyone can verify content exists and is unchanged.

## 🛠️ Technical Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Storage:** IPFS (via Pinata)
- **AI:** Google Gemini
- **File Upload:** Multer
- **Environment:** dotenv

## 📁 Project Structure

```
backend/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── .env.example              # Environment template
├── controllers/              # Request handlers
│   ├── moderateController.js
│   ├── ipfsController.js
│   ├── postController.js
│   ├── commentController.js
│   └── likeController.js
├── routes/                   # API routes
│   ├── moderate.js
│   ├── ipfs.js
│   ├── post.js
│   ├── comment.js
│   └── like.js
├── services/                 # Business logic
│   ├── ipfsService.js       # IPFS interactions
│   └── aiModeration.js      # AI content filtering
└── middleware/               # Express middleware
    └── errorHandler.js      # Error handling
```

## 🎓 For Judges: Why This is Decentralized

### 1. **No Central Control**
- Backend is just a gateway
- Can be run by anyone
- Multiple gateways can coexist
- Users not locked to one server

### 2. **Immutable Content**
- Once on IPFS, content is permanent
- IPFS hash = cryptographic proof
- Cannot be altered or deleted
- Content-addressed, not location-addressed

### 3. **Transparent Operations**
- All IPFS hashes public
- Anyone can verify content
- No hidden data manipulation
- Open source by design

### 4. **User Ownership**
- Users own their keys
- Keys = identity (not server accounts)
- Can move to any gateway
- Export data anytime (it's already public)

## 🚦 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional context (dev mode only)"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created (post/comment/like)
- `400` - Bad Request (validation error)
- `403` - Forbidden (moderation rejected)
- `404` - Not Found
- `500` - Server Error

## 🧪 Testing

### Test Moderation
```bash
curl -X POST http://localhost:5000/api/moderate \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello world!", "mediaType": "none"}'
```

### Test IPFS Upload
```bash
curl -X POST http://localhost:5000/api/ipfs/upload \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Test Post Creation
```bash
curl -X POST http://localhost:5000/api/post/create \
  -F "author=0xTEST1234567890" \
  -F "content=My first decentralized post!"
```

## 📝 License

MIT - HackForge'25

## 🤝 Contributing

This is a hackathon MVP. For production:
- Add signature verification
- Implement rate limiting
- Add request authentication
- Deploy to decentralized hosting (IPFS, Skynet)
- Add caching layer
- Implement WebSockets for real-time updates

---

**Built with 💙 for HackForge'25**

*Decentralization isn't just a feature - it's the foundation.*
