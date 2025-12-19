# 🌐 DecentraSocial - Decentralized Social Media Platform

> **HackForge'25 MVP** - A fully decentralized social media platform with key-based identity, IPFS storage, and AI moderation.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://dpkpaswan.github.io/decentralized-social-media/)
[![Backend API](https://img.shields.io/badge/API-running-blue)](https://decentralized-social-media.onrender.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🚀 Live Application

- **Frontend:** [https://dpkpaswan.github.io/decentralized-social-media/](https://dpkpaswan.github.io/decentralized-social-media/)
- **Backend API:** [https://decentralized-social-media.onrender.com](https://decentralized-social-media.onrender.com)

## 🔐 Authentication System

### No Email. No Password. No Centralized Auth.

This application uses **cryptographic key-based identity** instead of traditional authentication:

- **Client-side key generation** using Web Crypto API (ECDSA P-256)
- Keys never leave the user's device
- Public key = your identity
- Private key = your authentication

### Two Login Flows

#### FLOW 1: Generate New Key

1. User clicks "Generate New Secure Key"
2. Confirmation modal explains the process
3. Cryptographic keypair is generated on-device
4. Public key is displayed in a code-style box
5. User can:
   - 📋 Copy public key to clipboard
   - 💾 Download key file (JSON format)
6. Warning: "Save this key. You'll need it on other devices."
7. User explicitly clicks "Continue to App"

**Why this is decentralized:**
- No server creates or stores keys
- No email verification
- No password recovery (you ARE your key)
- User has complete control

#### FLOW 2: Login With Existing Key

1. User pastes their private/public key
2. System validates key format
3. Public key is derived if needed
4. User logs in with that identity

**Implementation:** Client-side validation and key derivation using Web Crypto API

## 📱 Core Features

### 1. Image & Video Posts

**How it works:**
```javascript
// User selects media file
→ File is uploaded to IPFS (simulated with mock hash)
→ Post JSON includes:
  - author: public key
  - content: text
  - mediaType: "image" | "video"
  - mediaIpfsHash: IPFS CID
  - timestamp
  - ipfsHash: post content hash
```

**Why IPFS?**
- Decentralized storage (no central server)
- Content-addressed (immutable)
- Censorship-resistant
- Verifiable through IPFS gateways

**Display:**
- Images/videos load from IPFS gateways
- Shows "Media stored on IPFS: [hash]"
- Fallback placeholder if IPFS unreachable

### 2. Comments System

**Architecture:**
```
Post (IPFS Hash A)
  ├─ Comment 1 (IPFS Hash B) → references Hash A
  ├─ Comment 2 (IPFS Hash C) → references Hash A
  └─ Comment 3 (IPFS Hash D) → references Hash A
```

**Each comment is:**
- A separate JSON object
- Stored on IPFS
- References parent post IPFS hash
- Signed by commenter's public key
- Timestamped

**Why decentralized:**
- Comments stored separately on IPFS
- No central database
- All actions linked to public keys
- Verifiable chain: Post → Comments

### 3. Likes System

**How likes work:**
```javascript
Like = {
  postIpfsHash: "Qm...",
  liker: "0x123...",
  timestamp: "2025-12-19T...",
  signature: "..." // In full implementation
}
```

**Prevents double-liking:**
- Checks if user's public key already in `likes[]`
- Each like is a signed action
- Stored as lightweight JSON on IPFS

**Why decentralized:**
- No central like counter
- Each like is cryptographically signed
- Verifiable: "This key liked this post at this time"
- Cannot be faked without private key

## 🏗️ Technical Architecture

### Client-Side Only

```
┌─────────────────┐
│   Web Browser   │
├─────────────────┤
│  - Key Gen      │  ← Web Crypto API
│  - Local Store  │  ← localStorage/IndexedDB
│  - IPFS Upload  │  ← Mock (real: ipfs-http-client)
└─────────────────┘
         ↕
┌─────────────────┐
│   IPFS Network  │
│  (Distributed)  │
└─────────────────┘
```

**No Backend Servers:**
- Authentication: Browser crypto
- Storage: IPFS
- State: Client-side only
- Identity: Public key

### Data Flow

**Creating a Post:**
```
1. User writes post + attaches image
2. Image uploaded to IPFS → Get CID
3. Post JSON created with image CID
4. Post JSON uploaded to IPFS → Get post CID
5. Post CID displayed in feed
6. All verifiable via IPFS
```

**Liking a Post:**
```
1. User clicks like
2. Create like object with public key
3. Sign with private key (cryptographic proof)
4. Upload like object to IPFS
5. Update post's likes array
6. Anyone can verify signature
```

**Commenting:**
```
1. User writes comment
2. Create comment object referencing post IPFS hash
3. Sign with user's key
4. Upload comment to IPFS → Get comment CID
5. Link comment CID to parent post
6. Display under post
```

## 🔍 Verifiability

Everything is verifiable:

1. **Posts:** Visit `https://ipfs.io/ipfs/[postHash]`
2. **Media:** Visit `https://ipfs.io/ipfs/[mediaHash]`
3. **Identity:** Public key in every action
4. **Signatures:** Can verify authorship cryptographically

## 🚀 Production Considerations

### Current (Prototype)
- Mock IPFS upload (generates hash)
- localStorage for key storage
- Simplified key validation
- Client-side only

### Production Implementation
```javascript
// Real IPFS upload
import { create } from 'ipfs-http-client'
const ipfs = create({ url: 'https://ipfs.infura.io:5001' })

async function uploadToIPFS(file) {
  const added = await ipfs.add(file)
  return added.cid.toString()
}

// Secure key storage
- Use IndexedDB with encryption
- Consider Web3 wallet integration (MetaMask)
- Hardware security keys for private key

// Content verification
- Verify signatures on all actions
- Check IPFS content integrity
- Implement peer discovery
```

## 🎯 Hackathon-Safe Features

✅ **No External Dependencies:**
- Pure JavaScript (no build step)
- Web Crypto API (browser native)
- No backend server required

✅ **Demo-Ready:**
- Works offline (mock IPFS)
- Instant key generation
- Visual feedback on all actions

✅ **Judge-Friendly:**
- Clear explanations in UI
- Comments explain decentralization
- Easy to understand flow

## � Quick Start

### Prerequisites
- **Python 3.x** (for local server)
- **Node.js v18+** (for backend)
- **Git**
- **MetaMask extension** (optional) - [metamask.io](https://metamask.io)

---

### 1️⃣ Clone Repository

```bash
git clone https://github.com/dpkpaswan/decentralized-social-media.git
cd decentralized-social-media
```

---

### 2️⃣ Start Backend Server

Open terminal #1:

```bash
cd backend
npm install
npm start
```

Backend runs at: `http://localhost:5000` ✅

---

### 3️⃣ Start Frontend Server

Open terminal #2:

```bash
# Navigate to project root
cd decentralized-social-media

# Start Python HTTP server (required for MetaMask)
python -m http.server 8080
```

**⚠️ Important:** MetaMask only works with `http://` URLs, not `file://`

---

### 4️⃣ Open Application

Open browser and go to:
```
http://localhost:8080/index.html
```

**✅ App is now running!**

---

## 🧪 Test MetaMask

Before using the main app, test MetaMask:

1. Open: `http://localhost:8080/test-metamask.html`
2. Click "Check if MetaMask is Installed"
3. Click "Connect to MetaMask"
4. Approve popup
5. See your wallet address ✅

---

## 📁 File Structure

```
decentralized-social-media/
├── index.html              # Main entry point
├── app.js                  # 1,580 lines - Full app logic
├── styles.css              # Instagram/Twitter-style UI
├── test-metamask.html      # MetaMask connection test
│
├── backend/                # Express API Gateway
│   ├── server.js           # Main server (174 lines)
│   ├── package.json        # Dependencies
│   ├── .env               # API keys (not in git)
│   │
│   ├── controllers/        # Request handlers
│   ├── routes/             # API endpoints
│   ├── services/           # IPFS + AI logic
│   └── middleware/         # Error handling
│
├── api/                    # Serverless wrapper
│   └── index.js
│
├── README.md               # This file
├── vercel.json            # Vercel config
├── render.yaml            # Render.com config
└── package.json           # Root package
```

## 🔑 Key Highlights

### Why This is Truly Decentralized

1. **Identity:**
   - No central authority issues identities
   - You generate your own keypair
   - Public key = username
   - Private key = password

2. **Storage:**
   - Posts on IPFS (not server database)
   - Media on IPFS (not AWS S3)
   - Comments on IPFS (not SQL rows)

3. **Actions:**
   - All signed by private key
   - Verifiable by anyone with public key
   - Cannot be faked or spoofed

4. **Censorship Resistance:**
   - No central server to shut down
   - Content distributed across IPFS nodes
   - Keys controlled by users

### Production Deployment

To deploy for real:

1. **Connect Real IPFS:**
   ```javascript
   // Use Pinata, Infura, or own IPFS node
   const pinata = new PinataClient(apiKey, secretKey)
   ```

2. **Implement Signature Verification:**
   ```javascript
   async function verifySignature(data, signature, publicKey) {
     // Use Web Crypto subtle.verify()
   }
   ```

3. **Add Content Discovery:**
   - IPNS for mutable pointers
   - DHT for peer discovery
   - OrbitDB for distributed database

4. **Security Enhancements:**
   - Encrypt private keys
   - Key derivation (BIP39 mnemonic)
   - Hardware wallet support

## 🎨 User Experience

### Clear Step-by-Step Flow
- ✅ No sudden auto-login
- ✅ User sees and acknowledges key
- ✅ Explicit "Continue to App" button
- ✅ Professional social media feel

### Real-World UI
- Modern card-based design
- Responsive layout
- Smooth transitions
- Clear visual hierarchy

### Educational
- Inline explanations
- "Why decentralized?" comments in code
- IPFS hash visibility
- Key-based identity front and center

## 🏆 Judge Demo Script

1. **Start:** Show login page with two flows
2. **Generate Key:** Click → Modal → Generate → Display key
3. **Copy Key:** Demonstrate copy to clipboard
4. **Download:** Show downloaded JSON file
5. **Login:** Paste key back to login
6. **Create Post:** Add text + image
7. **Show IPFS:** Point out IPFS hashes
8. **Like:** Click like, show public key added
9. **Comment:** Add comment with IPFS hash
10. **Verify:** Click "Verify on IPFS" button

## 📝 Code Comments

All major functions include comments explaining:
- Why this approach is decentralized
- How IPFS is used
- Why keys matter
- Production considerations

## 🔒 Security Notes

- Private keys stored in localStorage (prototype only)
- In production: use encrypted IndexedDB or hardware wallets
- All actions should be signed (full implementation needed)
- Content validation before IPFS upload

## � Deployment

### Frontend → GitHub Pages
1. Push code to GitHub
2. Settings → Pages → Source: `main` branch  
3. Live at: `https://dpkpaswan.github.io/decentralized-social-media/`

### Backend → Render.com
1. Sign up at [render.com](https://render.com)
2. New Web Service → Connect GitHub repo
3. **Settings:**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. **Environment Variables:**
   - `PINATA_API_KEY`
   - `PINATA_SECRET_KEY`
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
5. Deploy! 🚀

---

## 🌐 Browser Support

- ✅ Chrome/Edge (Web Crypto API + MetaMask)
- ✅ Firefox (Web Crypto API + MetaMask)
- ✅ Brave (Web Crypto API + MetaMask)
- ⚠️ Safari (Limited MetaMask support)
- ❌ Internet Explorer (Not supported)

## 📖 Learn More

- [IPFS Documentation](https://docs.ipfs.io/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Public Key Cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography)
- [Content Addressing](https://docs.ipfs.io/concepts/content-addressing/)

---

**Built with:** Vanilla JavaScript, Web Crypto API, IPFS concepts
**Status:** Hackathon-ready MVP
**License:** MIT
