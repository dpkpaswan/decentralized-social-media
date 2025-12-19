# Testing Guide - DecentraSocial Frontend + Backend Integration

## ✅ Setup Complete

Your frontend is now fully connected to the Express backend running at `http://localhost:5000`.

## 🧪 Testing Steps

### 1. **Start the Backend Server** (if not already running)
```bash
cd backend
node server.js
```
You should see: `✅ Server running on http://localhost:5000`

### 2. **Open the Frontend**
- Open `index.html` in your browser (right-click > Open with > Browser)
- Or serve it with a simple HTTP server:
```bash
python -m http.server 3000
```
Then visit `http://localhost:3000`

### 3. **Test Key Generation & Login**

#### Test New Key Generation:
1. Click "Generate New Key" button
2. Verify your cryptographic key pair is displayed
3. Download or copy the key
4. Click "Continue to App"
5. ✅ You should be logged in

#### Test Existing Key Login:
1. Logout if logged in
2. Click "Use Existing Key"
3. Paste a previously copied key
4. Click "Login"
5. ✅ You should be logged in

### 4. **Test Post Creation with Backend**

#### Test Text Post:
1. Go to Home tab
2. Type "Hello from IPFS!" in the compose box
3. Click "Post"
4. ✅ Watch for:
   - "Publishing to IPFS..." message
   - Console log: `✅ Post created: <IPFS_HASH>`
   - Console log: `🔗 Verify at: https://ipfs.io/ipfs/<IPFS_HASH>`
   - Post appears in feed with real IPFS hash
   - Activity feed shows "Post created on IPFS"

#### Test Post with Image:
1. Click the 📷 icon to attach media
2. Select an image from your computer
3. Add text: "Testing image upload to IPFS"
4. Click "Post"
5. ✅ Watch for:
   - Image preview before posting
   - Backend processes image upload
   - Post appears with image stored on IPFS
   - Media IPFS hash displayed below image

#### Test AI Moderation (Rejection):
1. Try creating a post with inappropriate content (e.g., "This is violent content")
2. Click "Post"
3. ✅ Watch for:
   - Post gets rejected by AI moderation
   - Activity feed shows "Post rejected: <reason>"
   - Alert shows rejection reason

### 5. **Test Comments with Backend**

1. Find any post in the feed
2. Click the 💬 comment button
3. Type "Great post!" in the comment box
4. Click "Post" comment button
5. ✅ Watch for:
   - Button shows "Creating..."
   - Console log: `✅ Comment created on IPFS: <IPFS_HASH>`
   - Comment appears below post
   - Comment shows IPFS hash in metadata
   - Comment counter updates

### 6. **Test Likes with Backend**

1. Find any post in the feed
2. Click the 🤍 like button
3. ✅ Watch for:
   - Button changes to ❤️
   - Console log: `✅ Like created on IPFS: <IPFS_HASH>`
   - Like counter increments
   - Like is stored on IPFS

4. Click ❤️ again to unlike
5. ✅ Button returns to 🤍 (unlike is local only)

### 7. **Test Create Post Tab**

1. Go to "Create Post" tab from sidebar
2. Type a post: "Testing from Create Post tab"
3. Add media (optional)
4. Click "Publish"
5. ✅ Same behavior as Home compose:
   - Backend moderation
   - IPFS storage
   - Real-time feedback

### 8. **Test IPFS Verification**

1. Create any post
2. Copy the IPFS hash from console or post card
3. Click "Verify on IPFS" button on the post
4. ✅ Opens `https://ipfs.io/ipfs/<YOUR_HASH>` in new tab
5. You should see the JSON data of your post

## 🔍 What to Watch in Browser Console

Open DevTools (F12) and check Console tab for:
- `✅ Post created: Qm...` (IPFS hash)
- `✅ Comment created on IPFS: Qm...`
- `✅ Like created on IPFS: Qm...`
- `🔗 Verify at: https://ipfs.io/ipfs/...`

## 🔍 What to Watch in Backend Terminal

Your backend terminal should show:
```
POST /api/post/create - Moderating post...
✅ Post approved and uploaded to IPFS
POST /api/comment/create - Comment created
POST /api/like - Like recorded on IPFS
```

## ⚠️ Common Issues

### Issue: "Failed to connect to backend"
**Solution:**
- Verify backend is running: `cd backend && node server.js`
- Check backend URL in browser console
- Ensure CORS is enabled (already configured)

### Issue: "POST 404 error"
**Solution:**
- Verify all 7 backend routes are registered
- Check `backend/server.js` has all route handlers
- Restart backend server

### Issue: Images not loading from IPFS
**Solution:**
- Wait 30-60 seconds for IPFS propagation
- Try different IPFS gateways:
  - `https://ipfs.io/ipfs/<hash>`
  - `https://gateway.pinata.cloud/ipfs/<hash>`
  - `https://cloudflare-ipfs.com/ipfs/<hash>`

### Issue: AI moderation not working
**Solution:**
- Check `.env` file has valid `GEMINI_API_KEY`
- Backend falls back to keyword filtering if Gemini fails
- Check backend terminal for moderation errors

## 📊 Backend API Endpoints

All connected and working:

1. **POST `/api/moderation/moderate-text`** - AI text moderation
2. **POST `/api/moderation/moderate-media`** - AI media moderation
3. **POST `/api/ipfs/upload/json`** - Upload JSON to IPFS
4. **POST `/api/ipfs/upload/file`** - Upload files to IPFS
5. **GET `/api/ipfs/fetch/:hash`** - Fetch from IPFS
6. **POST `/api/post/create`** - Create post with moderation + IPFS
7. **POST `/api/comment/create`** - Create comment on IPFS
8. **POST `/api/like`** - Create like on IPFS

## 🎉 Success Criteria

Your integration is working if:
- ✅ Posts show real IPFS hashes (Qm... format)
- ✅ Console logs show successful IPFS uploads
- ✅ Comments and likes create IPFS records
- ✅ AI moderation rejects inappropriate content
- ✅ All actions work without errors
- ✅ Data persists on IPFS (verifiable via IPFS gateway)

## 🚀 Next Steps

1. **Test extensively** with different content types
2. **Verify IPFS hashes** by visiting gateway URLs
3. **Check moderation** with various test cases
4. **Test error handling** (disconnect backend, try posting)
5. **Prepare demo** for HackForge'25!

---

**Note:** This is a hackathon MVP. For production:
- Add signature verification on backend
- Implement proper key management
- Add rate limiting
- Use Pinata pinning policy
- Add ENS/DNS naming system
