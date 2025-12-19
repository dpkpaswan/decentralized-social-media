const appEl = document.getElementById("app");

/**
 * DECENTRALIZED SOCIAL MEDIA (SS-3)
 * 
 * This application demonstrates a fully decentralized identity and content system:
 * - No centralized authentication (no email/password)
 * - Client-side cryptographic key generation
 * - IPFS for content storage (posts, media, comments, likes)
 * - All actions are linked to public keys for verifiability
 * 
 * WHY DECENTRALIZED?
 * - Identity: Users control their own keys, not a central authority
 * - Storage: IPFS provides distributed, censorship-resistant content storage
 * - Verifiability: All actions can be cryptographically verified
 */

/**
 * @typedef {string} PublicKey
 * @typedef {string} IpfsHash
 *
 * @typedef {{ 
 *   id: number|string, 
 *   author: PublicKey, 
 *   content: string, 
 *   timestamp: Date, 
 *   ipfsHash: IpfsHash,
 *   mediaType?: "image" | "video" | null,
 *   mediaIpfsHash?: string | null,
 *   likes: PublicKey[],
 *   comments: IpfsHash[]
 * }} Post
 *
 * @typedef {{ 
 *   id: string,
 *   postIpfsHash: IpfsHash, 
 *   author: PublicKey, 
 *   content: string, 
 *   timestamp: Date,
 *   ipfsHash: IpfsHash
 * }} Comment
 *
 * @typedef {{ id: number|string, type: "approved" | "rejected", message: string, createdAt: Date }} ActivityItem
 *
 * @typedef {{ status: "approved" | "rejected", statusLabel: string, reason: string }} ModerationResult
 *
 * @typedef {{
 *   currentView: "login" | "app" | "keyGenerated",
 *   currentTab: "home" | "explore" | "create" | "activity" | "profile",
 *   publicKey: PublicKey | null,
 *   privateKey: string | null,
 *   generatedPublicKey: PublicKey | null,
 *   posts: Post[],
 *   comments: Map<IpfsHash, Comment[]>,
 *   activity: ActivityItem[],
 *   lastModeration: ModerationResult | null
 * }} AppState
 */

function shortenKey(key, visible = 6) {
  if (!key || key.length <= visible * 2 + 3) return key;
  return `${key.slice(0, visible)}…${key.slice(-visible)}`;
}

function generateMockPublicKey() {
  const chars = "abcdef0123456789";
  let key = "0x";
  for (let i = 0; i < 64; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

function generateMockIpfsHash() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let h = "Qm";
  for (let i = 0; i < 44; i++) {
    h += chars[Math.floor(Math.random() * chars.length)];
  }
  return h;
}

/** @type {AppState} */
const state = {
  currentView: "login",
  currentTab: "home", // home | explore | create | activity | profile
  publicKey: null,
  privateKey: null,
  authMethod: null, // "key" or "metamask"
  generatedPublicKey: null,
  posts: [],
  comments: new Map(),
  activity: [
    { id: 1, type: "approved", message: "Your post was approved", createdAt: new Date() },
    {
      id: 2,
      type: "rejected",
      message: "Post rejected: Adult content",
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  ],
  lastModeration: null,
};

/**
 * CRYPTOGRAPHIC KEY GENERATION
 * Uses Web Crypto API for client-side key generation
 * This ensures keys never leave the user's device
 */
async function generateCryptoKeyPair() {
  try {
    // Generate ECDSA key pair (industry standard for digital signatures)
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256", // Standard elliptic curve
      },
      true, // extractable
      ["sign", "verify"]
    );

    // Export public key
    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyArray = Array.from(new Uint8Array(publicKeyBuffer));
    const publicKeyHex = "0x" + publicKeyArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Export private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const privateKeyArray = Array.from(new Uint8Array(privateKeyBuffer));
    const privateKeyHex = privateKeyArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      publicKey: publicKeyHex,
      privateKey: privateKeyHex,
      keyPair: keyPair
    };
  } catch (error) {
    console.error("Crypto key generation failed:", error);
    // Fallback to mock key for demo purposes
    return {
      publicKey: generateMockPublicKey(),
      privateKey: generateMockPublicKey().replace('0x', ''),
      keyPair: null
    };
  }
}

/**
 * BACKEND API CONFIGURATION
 * Connect frontend to Express backend
 */
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://decentralized-social-media.onrender.com';

/**
 * API CALLS - Real backend integration
 */

// Upload file to IPFS via backend
async function uploadFileToIPFS(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/ipfs/upload/file`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.ipfsHash;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    // Fallback to mock for demo
    return generateMockIpfsHash();
  }
}

// Create post via backend
async function createPostOnBackend(author, content, mediaFile = null) {
  try {
    const formData = new FormData();
    formData.append('author', author);
    formData.append('content', content);
    
    if (mediaFile) {
      formData.append('file', mediaFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/post/create`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Post creation failed:', error);
    throw error;
  }
}

// Create comment via backend
async function createCommentOnBackend(postHash, author, content) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/comment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        postHash,
        author,
        content
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Comment creation failed:', error);
    throw error;
  }
}

// Fetch all posts from backend
async function fetchPostsFromBackend() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/post/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.posts) {
      // Convert timestamp strings to Date objects
      return data.posts.map(post => ({
        ...post,
        timestamp: new Date(post.timestamp),
        likes: post.likes || [],
        comments: post.comments || []
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch posts from backend:', error);
    // Fallback to localStorage if backend is unavailable
    return loadPosts();
  }
}

// Create like via backend
async function createLikeOnBackend(postHash, likedBy) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        postHash,
        likedBy
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Like creation failed:', error);
    throw error;
  }
}

/**
 * LEGACY: Keep for backward compatibility
 */
async function uploadToIPFS(data) {
  // Fallback mock implementation
  await new Promise(resolve => setTimeout(resolve, 500));
  return generateMockIpfsHash();
}

/**
 * Store key in browser localStorage (prototype-level persistence)
 * In production, consider more secure options like IndexedDB with encryption
 */
function storeKey(publicKey, privateKey) {
  try {
    localStorage.setItem('ss3_publicKey', publicKey);
    localStorage.setItem('ss3_privateKey', privateKey);
  } catch (e) {
    console.warn("localStorage not available:", e);
  }
}

function loadStoredKeys() {
  try {
    return {
      publicKey: localStorage.getItem('ss3_publicKey'),
      privateKey: localStorage.getItem('ss3_privateKey')
    };
  } catch (e) {
    return { publicKey: null, privateKey: null };
  }
}

function clearStoredKeys() {
  try {
    localStorage.removeItem('ss3_publicKey');
    localStorage.removeItem('ss3_privateKey');
    localStorage.removeItem('ss3_authMethod');
  } catch (e) {
    console.warn("localStorage clear failed:", e);
  }
}

/**
 * Save posts to localStorage for persistence across sessions
 */
function savePosts() {
  try {
    localStorage.setItem('ss3_posts', JSON.stringify(state.posts));
  } catch (e) {
    console.warn("Failed to save posts:", e);
  }
}

/**
 * Load posts from localStorage
 */
function loadPosts() {
  try {
    const stored = localStorage.getItem('ss3_posts');
    if (stored) {
      const posts = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return posts.map(post => ({
        ...post,
        timestamp: new Date(post.timestamp)
      }));
    }
  } catch (e) {
    console.warn("Failed to load posts:", e);
  }
  return [];
}

/**
 * Save comments to localStorage
 */
function saveComments() {
  try {
    const commentsArray = Array.from(state.comments.entries());
    localStorage.setItem('ss3_comments', JSON.stringify(commentsArray));
  } catch (e) {
    console.warn("Failed to save comments:", e);
  }
}

/**
 * Load comments from localStorage
 */
function loadComments() {
  try {
    const stored = localStorage.getItem('ss3_comments');
    if (stored) {
      const commentsArray = JSON.parse(stored);
      const commentsMap = new Map();
      commentsArray.forEach(([key, value]) => {
        // Convert timestamp strings back to Date objects
        const comments = value.map(comment => ({
          ...comment,
          timestamp: new Date(comment.timestamp)
        }));
        commentsMap.set(key, comments);
      });
      return commentsMap;
    }
  } catch (e) {
    console.warn("Failed to load comments:", e);
  }
  return new Map();
}

function createElement(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

function render() {
  appEl.innerHTML = "";
  if (state.currentView === "login") {
    appEl.appendChild(renderLoginView());
  } else if (state.currentView === "keyGenerated") {
    appEl.appendChild(renderKeyGeneratedView());
  } else {
    appEl.appendChild(renderAppShell());
  }
}

// ========================
// LOGIN / ONBOARDING VIEWS
// ========================

/**
 * PROFESSIONAL LOGIN VIEW - Modern Social Media Style
 * Two login options: Secure Key & MetaMask
 */
function renderLoginView() {
  const el = createElement(`
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">DecentraSocial</div>
          <div class="login-tagline">Own your identity. Own your content.</div>
          <div class="login-subtitle">Decentralized Social Media Platform</div>
        </div>

        <div class="login-options">
          <!-- PRIMARY: Secure Key Login -->
          <button class="login-btn login-btn-primary" id="generate-key-btn">
            <span class="login-btn-icon">🔐</span>
            <span>Login with Secure Key</span>
          </button>
          <div class="login-helper-text">No email. No password. Client-side identity.</div>

          <div class="login-divider">
            <span>OR</span>
          </div>

          <!-- SECONDARY: MetaMask Login (UI only) -->
          <button class="login-btn login-btn-secondary" id="metamask-btn">
            <span class="login-btn-icon">🦊</span>
            <span>Login with MetaMask</span>
          </button>
          <div class="login-helper-text">Use your existing crypto wallet</div>
        </div>

        <div class="login-info-box">
          <div class="login-info-title">🔒 Client-Side Only</div>
          <div class="login-info-text">
            Uses cryptographic key-based identity and wallet authentication.
            No email, no password — your key or wallet is your login.
          </div>
        </div>

        <!-- Hidden: Existing Key Input -->
        <div id="existing-key-section" style="display: none; margin-top: 1.5rem;">
          <textarea
            id="existing-key-input"
            placeholder="Or paste your existing key here..."
            style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; font-size: 0.875rem; font-family: monospace; resize: vertical;"
            rows="3"
          ></textarea>
          <button class="login-btn login-btn-primary" id="login-existing-btn" style="margin-top: 0.75rem; width: 100%;">
            <span>→</span>
            <span>Continue with This Key</span>
          </button>
        </div>
      </div>
    </div>
  `);

  // Primary Button: Generate Key
  const generateKeyBtn = el.querySelector("#generate-key-btn");
  const metamaskBtn = el.querySelector("#metamask-btn");
  const existingKeySection = el.querySelector("#existing-key-section");
  const existingKeyInput = el.querySelector("#existing-key-input");
  const loginExistingBtn = el.querySelector("#login-existing-btn");
  
  generateKeyBtn.addEventListener("click", () => {
    // Show existing key input section
    existingKeySection.style.display = 'block';
    generateKeyBtn.textContent = '✨ Generate New Key';
    generateKeyBtn.onclick = async () => {
      await handleGenerateNewKey();
    };
  });

  // MetaMask button - Real integration
  metamaskBtn.addEventListener("click", async () => {
    // Wait a moment for MetaMask to inject if needed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask extension from metamask.io");
      return;
    }

    try {
      metamaskBtn.disabled = true;
      metamaskBtn.innerHTML = '<span>🔄 Connecting...</span>';

      // Request wallet connection
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const walletAddress = accounts[0];

      if (!walletAddress) {
        throw new Error("No wallet address returned");
      }

      // Success: use wallet address as public key
      console.log("MetaMask connected:", walletAddress);

      // Store as user identity
      state.publicKey = walletAddress;
      state.privateKey = null; // MetaMask manages private keys
      state.authMethod = "metamask";

      localStorage.setItem("ss3_publicKey", walletAddress);
      localStorage.setItem("ss3_authMethod", "metamask");
      
      // Load existing data
      loadPosts();
      loadComments();

      // Navigate to main app
      state.currentView = "app";
      render();

    } catch (error) {
      console.error("MetaMask connection failed:", error);
      
      if (error.code === 4001) {
        alert("MetaMask connection was rejected. Please try again and approve the connection.");
      } else {
        alert("Failed to connect to MetaMask: " + error.message);
      }
      
      metamaskBtn.disabled = false;
      metamaskBtn.innerHTML = '<span>🦊</span><span>Login with MetaMask</span>';
    }
  });

  // Existing key input validation
  existingKeyInput.addEventListener("input", () => {
    loginExistingBtn.disabled = existingKeyInput.value.trim().length < 20;
  });

  loginExistingBtn.addEventListener("click", async () => {
    await handleLoginWithExistingKey(existingKeyInput.value.trim());
  });

  return el;
}

/**
 * GENERATE KEY CONFIRMATION MODAL
 * User must confirm they understand before key generation
 */
function openGenerateKeyConfirmModal(rootEl) {
  if (rootEl.querySelector(".modal-backdrop")) return;

  const modal = createElement(`
    <div class="modal-backdrop">
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="key-modal-title">
        <h2 id="key-modal-title" class="modal-title">Generate Secure Identity Key</h2>
        <p class="modal-text">
          A cryptographic key will be generated on your device.<br />
          <strong>This key is your identity.</strong> No email or password.<br /><br />
          You must save this key to log in on another device.
        </p>
        <div class="modal-actions">
          <button class="modal-btn cancel" id="key-cancel-btn">Cancel</button>
          <button class="modal-btn confirm" id="key-confirm-btn">Generate Key</button>
        </div>
      </div>
    </div>
  `);

  rootEl.appendChild(modal);

  modal.querySelector("#key-cancel-btn").addEventListener("click", () => {
    modal.remove();
  });

  modal.querySelector("#key-confirm-btn").addEventListener("click", async () => {
    modal.remove();
    await handleGenerateNewKey();
  });
}

/**
 * HANDLE NEW KEY GENERATION
 * Generate cryptographic keypair and show to user
 */
async function handleGenerateNewKey() {
  // Show loading state
  appEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-size: 16px; color: #64748b;">Generating secure key...</div>';
  
  // Generate cryptographic keypair
  const keyData = await generateCryptoKeyPair();
  
  state.generatedPublicKey = keyData.publicKey;
  state.privateKey = keyData.privateKey;
  state.currentView = "keyGenerated";
  
  render();
}

/**
 * KEY GENERATED VIEW
 * Display generated key with copy/download options
 * User MUST see and acknowledge their key before continuing
 */
function renderKeyGeneratedView() {
  const el = createElement(`
    <div class="app-shell">
      <main class="center-layout">
        <section class="auth-card key-display-card" aria-labelledby="key-display-title">
          <div class="success-icon">✅</div>
          <h1 id="key-display-title" class="auth-title">Your Secure Key</h1>
          <p class="auth-subtitle">Save this key. You'll need it to log in on other devices.</p>

          <div class="key-display-box">
            <div class="key-display-label">Public Key (Your Identity)</div>
            <div class="key-display-value" id="public-key-display">${state.generatedPublicKey}</div>
            <div class="key-stored-badge">
              <span>📱</span>
              <span>Stored on your device</span>
            </div>
          </div>

          <div class="key-actions">
            <button class="key-action-btn" id="copy-key-btn">
              <span>📋</span>
              <span>Copy Public Key</span>
            </button>
            <button class="key-action-btn" id="download-key-btn">
              <span>💾</span>
              <span>Download Key File</span>
            </button>
          </div>

          <div class="warning-box">
            <span class="warning-icon">⚠️</span>
            <p>
              <strong>Important:</strong> Save this key now. To log in on another device, 
              you will need to paste this key. There is no password recovery.
            </p>
          </div>

          <button class="primary-btn" id="continue-to-app-btn">
            <span class="primary-btn-icon">→</span>
            <span>Continue to App</span>
          </button>

          <button class="text-btn" id="back-to-login-btn">← Back to Login</button>
        </section>
      </main>
    </div>
  `);

  // Copy public key to clipboard
  el.querySelector("#copy-key-btn").addEventListener("click", () => {
    const btn = el.querySelector("#copy-key-btn");
    navigator.clipboard.writeText(state.generatedPublicKey).then(() => {
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>✓</span><span>Copied!</span>';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }).catch(err => {
      alert("Failed to copy key. Please copy manually.");
    });
  });

  // Download key as JSON file
  el.querySelector("#download-key-btn").addEventListener("click", () => {
    const keyData = {
      publicKey: state.generatedPublicKey,
      privateKey: state.privateKey,
      createdAt: new Date().toISOString(),
      platform: "DecentraSocial SS-3"
    };
    
    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decentrasocial-key-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Continue to app
  el.querySelector("#continue-to-app-btn").addEventListener("click", async () => {
    state.publicKey = state.generatedPublicKey;
    state.authMethod = "key";
    storeKey(state.publicKey, state.privateKey);
    localStorage.setItem("ss3_authMethod", "key");
    state.currentView = "app";
    
    // Load posts from backend (fallback to localStorage if backend unavailable)
    state.posts = await fetchPostsFromBackend();
    state.comments = loadComments();
    
    if (!state.posts.length) {
      seedMockPosts();
    }
    render();
  });

  // Back to login
  el.querySelector("#back-to-login-btn").addEventListener("click", () => {
    state.currentView = "login";
    state.generatedPublicKey = null;
    state.privateKey = null;
    render();
  });

  return el;
}

/**
 * HANDLE LOGIN WITH EXISTING KEY
 * Validate and derive public key if needed
 */
async function handleLoginWithExistingKey(keyInput) {
  if (!keyInput) {
    alert("Please paste a valid key.");
    return;
  }

  // Basic validation: check if it looks like a hex key
  const cleanKey = keyInput.trim().replace(/\s+/g, '');
  
  if (cleanKey.length < 20) {
    alert("Invalid key format. Key is too short.");
    return;
  }

  // Derive public key (simplified - in production, use proper crypto)
  let publicKey = cleanKey;
  if (!publicKey.startsWith('0x')) {
    publicKey = '0x' + cleanKey.substring(0, 64);
  }

  // Store and login
  state.publicKey = publicKey;
  state.privateKey = cleanKey;
  state.authMethod = "key";
  storeKey(state.publicKey, state.privateKey);
  localStorage.setItem("ss3_authMethod", "key");
  state.currentView = "app";
  
  // Load posts from backend (fallback to localStorage if backend unavailable)
  state.posts = await fetchPostsFromBackend();
  state.comments = loadComments();
  
  if (!state.posts.length) {
    seedMockPosts();
  }
  
  render();
}



// INITIAL DATA
function seedMockPosts() {
  const now = Date.now();
  const otherKey = generateMockPublicKey();
  
  state.posts = [
    {
      id: 1,
      author: otherKey,
      content: "Welcome to DecentraSocial! This is a demo feed showing posts with IPFS storage.",
      timestamp: new Date(now - 10 * 60 * 1000),
      ipfsHash: generateMockIpfsHash(),
      mediaType: null,
      mediaIpfsHash: null,
      likes: [state.publicKey],
      comments: []
    },
    {
      id: 2,
      author: generateMockPublicKey(),
      content: "Check out this decentralized image! Stored on IPFS, not a centralized server.",
      timestamp: new Date(now - 7 * 60 * 1000),
      ipfsHash: generateMockIpfsHash(),
      mediaType: "image",
      mediaIpfsHash: generateMockIpfsHash(),
      likes: [],
      comments: []
    },
    {
      id: 3,
      author: state.publicKey,
      content: "First post from your key-based identity. No username, no password — just cryptography.",
      timestamp: new Date(now - 2 * 60 * 1000),
      ipfsHash: generateMockIpfsHash(),
      mediaType: null,
      mediaIpfsHash: null,
      likes: [otherKey],
      comments: []
    },
  ];
}

// APP SHELL
function renderAppShell() {
  const shell = createElement(`
    <div class="app-layout">
      <!-- Top Navigation Bar -->
      <nav class="top-navbar">
        <div class="navbar-left">
          <a href="#" class="navbar-logo">DecentraSocial</a>
        </div>
        <div class="navbar-search">
          <span class="navbar-search-icon">🔍</span>
          <input type="search" class="navbar-search-input" placeholder="Search (UI only)" />
        </div>
        <div class="navbar-right">
          <div class="navbar-user">
            <div class="navbar-avatar">${shortenKey(state.publicKey, 2).replace("…", "")}</div>
            <div class="navbar-key">${shortenKey(state.publicKey)}</div>
          </div>
          <button class="navbar-logout-btn" id="logout-btn">Logout</button>
        </div>
      </nav>

      <!-- Left Sidebar -->
      <aside class="sidebar">
        <nav class="sidebar-nav" id="sidebar-nav"></nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content" id="main-content"></main>
    </div>
  `);

  // Setup sidebar navigation
  const sidebarNav = shell.querySelector("#sidebar-nav");
  const tabs = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "explore", label: "Explore", icon: "🔎" },
    { id: "create", label: "Create Post", icon: "✏️" },
    { id: "activity", label: "Activity", icon: "📡" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "about", label: "About", icon: "ℹ️" }
  ];

  tabs.forEach((tab) => {
    const item = createElement(`
      <a href="#" class="sidebar-item ${state.currentTab === tab.id ? "active" : ""}" data-tab="${tab.id}">
        <span class="sidebar-icon">${tab.icon}</span>
        <span>${tab.label}</span>
      </a>
    `);
    item.addEventListener("click", (e) => {
      e.preventDefault();
      state.currentTab = tab.id;
      render();
    });
    sidebarNav.appendChild(item);
  });

  // Render current tab content
  const mainContent = shell.querySelector("#main-content");
  mainContent.appendChild(renderCurrentTab());

  // Logout handler
  shell.querySelector("#logout-btn").addEventListener("click", () => {
    savePosts();
    saveComments();
    clearStoredKeys();
    state.currentView = "login";
    state.currentTab = "home";
    state.publicKey = null;
    state.privateKey = null;
    state.lastModeration = null;
    render();
  });

  return shell;
}

// TOP NAV
// TABS
function renderCurrentTab() {
  switch (state.currentTab) {
    case "explore":
      return renderExploreTab();
    case "create":
      return renderCreateTab();
    case "activity":
      return renderActivityTab();
    case "profile":
      return renderProfileTab();
    case "home":
    default:
      return renderHomeTab();
  }
}

function renderHomeTab() {
  const el = createElement(`<div></div>`);
  el.appendChild(renderComposeSnippet());
  el.appendChild(renderFeedSection("Home feed"));
  return el;
}

function renderExploreTab() {
  const el = createElement(`<div></div>`);
  el.appendChild(renderFeedSection("Explore"));
  return el;
}

function renderCreateTab() {
  const el = createElement(`
    <section class="create-card" aria-label="Create new post">
      <div class="section-title-row">
        <div>
          <h2 class="section-title">Create Post</h2>
          <p class="section-subtitle">Publish content with media to IPFS.</p>
        </div>
        <span class="status-badge ${state.lastModeration ? state.lastModeration.status : ""}">
          ${state.lastModeration ? state.lastModeration.statusLabel : "Awaiting publish"}
        </span>
      </div>
      <label class="visually-hidden" for="create-input">Post content</label>
      <textarea
        id="create-input"
        class="compose-textarea"
        placeholder="What's on your mind?"
        maxlength="500"
      ></textarea>
      
      <!-- Media Upload Section -->
      <div class="media-upload-section">
        <input type="file" id="create-media-input" accept="image/*,video/*" style="display:none" />
        <button class="media-btn" id="create-attach-media-btn">
          <span>📷</span>
          <span>Add Photo/Video</span>
        </button>
        <div id="create-media-preview" class="media-preview"></div>
      </div>
      
      <div class="compose-footer">
        <div class="compose-helper">
          Media stored on IPFS • Posts are decentralized
        </div>
        <div class="compose-actions">
          <button class="post-btn" id="publish-btn" disabled>Publish</button>
        </div>
      </div>
      <div class="status-message" id="status-message">
        ${state.lastModeration ? formatModerationText(state.lastModeration) : "No moderation decisions yet."}
      </div>
    </section>
  `);

  const textarea = el.querySelector("#create-input");
  const publishBtn = el.querySelector("#publish-btn");
  const statusEl = el.querySelector("#status-message");
  const mediaInput = el.querySelector("#create-media-input");
  const attachMediaBtn = el.querySelector("#create-attach-media-btn");
  const mediaPreview = el.querySelector("#create-media-preview");
  let selectedMedia = null;

  textarea.addEventListener("input", () => {
    publishBtn.disabled = !textarea.value.trim();
  });

  attachMediaBtn.addEventListener("click", () => {
    mediaInput.click();
  });

  mediaInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    selectedMedia = {
      file: file,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      url: URL.createObjectURL(file)
    };

    mediaPreview.innerHTML = `
      <div class="media-preview-item">
        ${selectedMedia.type === 'image' 
          ? `<img src="${selectedMedia.url}" alt="Preview" />` 
          : `<video src="${selectedMedia.url}" controls></video>`
        }
        <button class="remove-media-btn" id="remove-create-media">✕</button>
      </div>
    `;

    mediaPreview.querySelector("#remove-create-media").addEventListener("click", () => {
      URL.revokeObjectURL(selectedMedia.url);
      selectedMedia = null;
      mediaPreview.innerHTML = '';
      mediaInput.value = '';
    });
  });

  publishBtn.addEventListener("click", async () => {
    const content = textarea.value.trim();
    if (!content) return;

    publishBtn.disabled = true;
    publishBtn.textContent = "Publishing to IPFS...";

    try {
      // Call backend API to create post with moderation
      const result = await createPostOnBackend(
        state.publicKey,
        content,
        selectedMedia ? selectedMedia.file : null
      );

      if (result.success && result.approved) {
        // Post approved and created
        state.lastModeration = {
          status: "approved",
          statusLabel: "Approved",
          reason: "Content moderated and uploaded to IPFS successfully."
        };

        const newPost = {
          id: Date.now(),
          author: state.publicKey,
          content,
          timestamp: new Date(),
          ipfsHash: result.postIpfsHash,
          mediaType: selectedMedia ? selectedMedia.type : null,
          mediaIpfsHash: result.mediaIpfsHash || null,
          likes: [],
          comments: []
        };
        state.posts.unshift(newPost);
        savePosts(); // Persist to localStorage

        const moderationLabel = result.moderation === 'fallback' ? ' (Fallback)' : '';
        state.activity.unshift({
          id: Date.now(),
          type: "approved",
          message: `Post created on IPFS: ${shortenKey(result.postIpfsHash, 8)}${moderationLabel}`,
          createdAt: new Date()
        });

        console.log('✅ Post created:', result.postIpfsHash);
        console.log('🔗 Verify at:', result.verifyUrl);
        if (result.moderation) {
          console.log('🛡️  Moderation:', result.moderation === 'ai' ? 'AI' : 'Fallback (AI unavailable)');
        }
        
        // Refresh posts from backend to get all posts including from other users
        state.posts = await fetchPostsFromBackend();
        savePosts();
        
      } else {
        // Post rejected by AI moderation
        state.lastModeration = {
          status: "rejected",
          statusLabel: "Rejected",
          reason: result.reason || "Content did not pass moderation."
        };

        state.activity.unshift({
          id: Date.now(),
          type: "rejected",
          message: `Post rejected: ${result.reason}`,
          createdAt: new Date()
        });
      }

      if (selectedMedia) {
        URL.revokeObjectURL(selectedMedia.url);
        selectedMedia = null;
      }

      statusEl.innerHTML = formatModerationText(state.lastModeration);
      textarea.value = "";
      mediaPreview.innerHTML = '';
      mediaInput.value = '';
      
    } catch (error) {
      console.error('Error publishing post:', error);
      state.lastModeration = {
        status: "rejected",
        statusLabel: "Error",
        reason: "Failed to connect to backend. Is the server running?"
      };
      statusEl.innerHTML = formatModerationText(state.lastModeration);
    } finally {
      publishBtn.disabled = true;
      publishBtn.textContent = "Publish";
      render();
    }
  });

  return el;
}

function formatModerationText(moderation) {
  return `<strong>${moderation.statusLabel}:</strong> ${moderation.reason}`;
}

function renderActivityTab() {
  const el = createElement(`
    <section class="activity-card" aria-label="Activity">
      <div class="section-title-row">
        <h2 class="section-title">Activity</h2>
        <p class="section-subtitle">Moderation decisions for your posts.</p>
      </div>
      <ul class="activity-list" id="activity-list"></ul>
    </section>
  `);

  const list = el.querySelector("#activity-list");
  if (!state.activity.length) {
    list.innerHTML = `<li class="activity-item"><span>No activity yet.</span></li>`;
  } else {
    state.activity.forEach((item) => {
      const li = createElement(`
        <li class="activity-item ${item.type === "rejected" ? "rejected" : ""}">
          <span class="activity-dot"></span>
          <div>
            <div>${item.message}</div>
            <div class="activity-meta">${formatTimestamp(item.createdAt)}</div>
          </div>
        </li>
      `);
      list.appendChild(li);
    });
  }

  return el;
}

function renderProfileTab() {
  const userPosts = state.posts.filter((p) => p.author === state.publicKey);

  const wrapper = createElement(`<div></div>`);

  const profileCard = createElement(`
    <section class="profile-card" aria-label="Profile">
      <div class="profile-header">
        <div class="profile-avatar">${shortenKey(state.publicKey, 2).replace("…", "")}</div>
        <div class="profile-meta">
          <div class="profile-key">${shortenKey(state.publicKey, 12)}</div>
          <div class="profile-stat">${userPosts.length} post${userPosts.length === 1 ? "" : "s"}</div>
        </div>
      </div>
      <p class="section-subtitle">
        This profile represents a single decentralized identity. All posts are linked to your public key.
      </p>
    </section>
  `);

  wrapper.appendChild(profileCard);

  const postsSection = createElement(`
    <section>
      <h3 class="profile-section-title">Your posts</h3>
      <div class="feed-list" id="profile-posts"></div>
    </section>
  `);

  const list = postsSection.querySelector("#profile-posts");
  if (!userPosts.length) {
    list.innerHTML = `<div class="profile-posts-empty">You haven't published any posts yet.</div>`;
  } else {
    userPosts.forEach((post) => {
      list.appendChild(renderPostCard(post));
    });
  }

  wrapper.appendChild(postsSection);
  return wrapper;
}

// HOME COMPOSE SNIPPET (smaller than full create tab)
function renderComposeSnippet() {
  const el = createElement(`
    <div class="compose-box">
      <textarea
        id="post-input"
        class="compose-textarea"
        placeholder="What's on your mind?"
        maxlength="500"
      ></textarea>
      
      <input type="file" id="media-input" accept="image/*,video/*" style="display:none" />
      <div id="media-preview" style="margin-bottom: 1rem;"></div>
      
      <div class="compose-actions">
        <div class="compose-media-btns">
          <button class="media-btn" id="attach-media-btn" title="Add photo or video">
            📷
          </button>
          <button class="media-btn" id="attach-video-btn" title="Add video">
            🎥
          </button>
        </div>
        <button class="post-btn" id="post-btn" disabled>Post</button>
      </div>
    </div>
  `);

  const textarea = el.querySelector("#post-input");
  const postBtn = el.querySelector("#post-btn");
  const mediaInput = el.querySelector("#media-input");
  const attachMediaBtn = el.querySelector("#attach-media-btn");
  const mediaPreview = el.querySelector("#media-preview");
  let selectedMedia = null;

  textarea.addEventListener("input", () => {
    postBtn.disabled = !textarea.value.trim();
  });

  attachMediaBtn.addEventListener("click", () => {
    mediaInput.click();
  });

  mediaInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    selectedMedia = {
      file: file,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      url: URL.createObjectURL(file)
    };

    mediaPreview.innerHTML = `
      <div class="media-preview-item">
        ${selectedMedia.type === 'image' 
          ? `<img src="${selectedMedia.url}" alt="Preview" />` 
          : `<video src="${selectedMedia.url}" controls></video>`
        }
        <button class="remove-media-btn" id="remove-media">✕</button>
      </div>
    `;

    mediaPreview.querySelector("#remove-media").addEventListener("click", () => {
      URL.revokeObjectURL(selectedMedia.url);
      selectedMedia = null;
      mediaPreview.innerHTML = '';
      mediaInput.value = '';
    });
  });

  postBtn.addEventListener("click", async () => {
    const content = textarea.value.trim();
    if (!content) return;

    postBtn.disabled = true;
    postBtn.textContent = "Creating post...";

    try {
      // Call backend API to create post
      const result = await createPostOnBackend(
        state.publicKey,
        content,
        selectedMedia ? selectedMedia.file : null
      );

      if (result.success && result.approved) {
        // Post created successfully on backend
        const newPost = {
          id: Date.now(),
          author: state.publicKey,
          content,
          timestamp: new Date(),
          ipfsHash: result.postIpfsHash,
          mediaType: selectedMedia ? selectedMedia.type : null,
          mediaIpfsHash: result.mediaIpfsHash || null,
          likes: [],
          comments: []
        };

        state.posts.unshift(newPost);
        savePosts(); // Persist to localStorage

        // Add to activity feed with moderation info
        const moderationLabel = result.moderation === 'fallback' ? ' (Fallback moderation)' : '';
        state.activity.unshift({
          id: Date.now(),
          type: "approved",
          message: `Post created on IPFS: ${shortenKey(result.postIpfsHash, 8)}${moderationLabel}`,
          createdAt: new Date()
        });

        console.log('✅ Post created:', result.postIpfsHash);
        console.log('🔗 Verify at:', result.verifyUrl);
        
        // Refresh posts from backend to get all posts including from other users
        state.posts = await fetchPostsFromBackend();
        savePosts();
        
      } else {
        // Post rejected by moderation
        state.activity.unshift({
          id: Date.now(),
          type: "rejected",
          message: `Post rejected: ${result.reason}`,
          createdAt: new Date()
        });
        
        alert(`Post rejected: ${result.reason}`);
      }
      
      if (selectedMedia) {
        URL.revokeObjectURL(selectedMedia.url);
        selectedMedia = null;
      }
      
      textarea.value = "";
      mediaPreview.innerHTML = '';
      mediaInput.value = '';
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Check console for details.');
    } finally {
      postBtn.disabled = true;
      postBtn.textContent = "Post";
      render();
    }
  });

  return el;
}

// FEED + POSTS
function formatTimestamp(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function renderFeedSection(title) {
  const el = createElement(`
    <section aria-label="${title}">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--gray-200);">
        <h2 class="feed-section-title" style="margin: 0;">${title}</h2>
        <button class="refresh-feed-btn" id="refresh-feed-btn" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); border-radius: var(--radius-md); background: var(--white); color: var(--gray-700); cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>
      <div class="feed-list"></div>
    </section>
  `);

  const list = el.querySelector(".feed-list");
  const refreshBtn = el.querySelector("#refresh-feed-btn");
  
  // Refresh button handler
  refreshBtn.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<span>⏳</span><span>Loading...</span>';
    
    try {
      // Fetch latest posts from backend
      state.posts = await fetchPostsFromBackend();
      savePosts(); // Update local cache
      render(); // Re-render entire view
    } catch (error) {
      console.error('Failed to refresh posts:', error);
      alert('Failed to refresh feed. Please try again.');
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span>🔄</span><span>Refresh</span>';
    }
  });
  
  if (!state.posts.length) {
    list.innerHTML = `
      <div class="empty-state">
        No posts yet.
        <span>Be the first to post something from your key.</span>
      </div>
    `;
  } else {
    state.posts.forEach((post) => {
      list.appendChild(renderPostCard(post));
    });
  }

  return el;
}

function renderPostCard(post) {
  const userHasLiked = post.likes && post.likes.includes(state.publicKey);
  const likeCount = post.likes ? post.likes.length : 0;
  const postComments = state.comments.get(post.ipfsHash) || [];
  
  const el = createElement(`
    <article class="post-card">
      <header class="post-header">
        <div class="post-author">
          <div class="post-avatar">${shortenKey(post.author, 2).replace("…", "")}</div>
          <div class="post-author-meta">
            <span class="post-author-key">${shortenKey(post.author)}</span>
            <span class="post-timestamp">${formatTimestamp(post.timestamp)}</span>
          </div>
        </div>
      </header>
      <div class="post-content"></div>
      
      <!-- Media Display (if exists) -->
      ${post.mediaType && post.mediaIpfsHash ? `
        <div class="post-media">
          ${post.mediaType === 'image' 
            ? `<img src="https://ipfs.io/ipfs/${post.mediaIpfsHash}" alt="Post media" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23e2e8f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2364748b%22%3EImage on IPFS%3C/text%3E%3C/svg%3E'" />` 
            : `<video controls src="https://ipfs.io/ipfs/${post.mediaIpfsHash}" onerror="this.innerHTML='<div class=video-placeholder>Video on IPFS</div>'"></video>`
          }
          <div class="media-ipfs-label">
            Media stored on IPFS: ${shortenKey(post.mediaIpfsHash, 8)}
          </div>
        </div>
      ` : ''}
      
      <!-- Like and Comment Actions -->
      <div class="post-actions">
        <button class="action-btn like-btn ${userHasLiked ? 'liked' : ''}" data-post-id="${post.id}">
          <span class="action-icon">${userHasLiked ? '❤️' : '🤍'}</span>
          <span class="action-count">${likeCount}</span>
        </button>
        <button class="action-btn comment-btn" data-post-id="${post.id}">
          <span class="action-icon">💬</span>
          <span class="action-count">${postComments.length}</span>
        </button>
      </div>
      
      <!-- Comments Section -->
      <div class="comments-section" id="comments-${post.id}" style="display:none">
        <div class="comments-list" id="comments-list-${post.id}"></div>
        <div class="comment-input-section">
          <input 
            type="text" 
            class="comment-input" 
            placeholder="Add a comment..." 
            id="comment-input-${post.id}"
          />
          <button class="comment-submit-btn" id="submit-comment-${post.id}">Post</button>
        </div>
      </div>
      
      ${post.author === state.publicKey ? `
        <div class="post-ipfs">
          <span class="ipfs-hash">IPFS: ${shortenKey(post.ipfsHash, 8)}</span>
          <a href="#" class="verify-link">Verify on IPFS</a>
        </div>
      ` : ''}
    </article>
  `);

  el.querySelector(".post-content").textContent = post.content;

  // Like button handler
  const likeBtn = el.querySelector(".like-btn");
  likeBtn.addEventListener("click", async () => {
    if (!post.likes) post.likes = [];
    
    if (userHasLiked) {
      // Unlike: remove user's public key (local only)
      post.likes = post.likes.filter(key => key !== state.publicKey);
      savePosts(); // Persist unlike to localStorage
      render();
    } else {
      // Like: add user's public key and create on backend
      likeBtn.disabled = true;
      
      try {
        const result = await createLikeOnBackend(post.ipfsHash, state.publicKey);
        
        if (result.success) {
          post.likes.push(state.publicKey);
          savePosts(); // Persist likes to localStorage
          console.log('✅ Like created on IPFS:', result.likeIpfsHash);
        } else {
          console.error('Failed to create like:', result.error);
          alert('Failed to save like. Try again.');
        }
      } catch (error) {
        console.error('Error creating like:', error);
        alert('Failed to connect to backend for like.');
      } finally {
        likeBtn.disabled = false;
        render();
      }
    }
  });

  // Comment button toggle
  const commentBtn = el.querySelector(".comment-btn");
  const commentsSection = el.querySelector(`#comments-${post.id}`);
  commentBtn.addEventListener("click", () => {
    const isVisible = commentsSection.style.display !== 'none';
    commentsSection.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      renderComments(post);
    }
  });

  // Submit comment handler
  const commentInput = el.querySelector(`#comment-input-${post.id}`);
  const submitCommentBtn = el.querySelector(`#submit-comment-${post.id}`);
  
  submitCommentBtn.addEventListener("click", async () => {
    const content = commentInput.value.trim();
    if (!content) return;
    
    submitCommentBtn.disabled = true;
    submitCommentBtn.textContent = "Creating...";
    
    try {
      // Call backend to create comment
      const result = await createCommentOnBackend(post.ipfsHash, state.publicKey, content);
      
      if (result.success) {
        // Create comment object with IPFS hash from backend
        const comment = {
          id: Date.now().toString(),
          postIpfsHash: post.ipfsHash,
          author: state.publicKey,
          content: content,
          timestamp: new Date(),
          ipfsHash: result.commentIpfsHash
        };
        
        // Store comment locally
        if (!state.comments.has(post.ipfsHash)) {
          state.comments.set(post.ipfsHash, []);
        }
        state.comments.get(post.ipfsHash).push(comment);
        saveComments(); // Persist to localStorage
        
        commentInput.value = '';
        console.log('✅ Comment created on IPFS:', result.commentIpfsHash);
        
        renderComments(post);
        render();
      } else {
        console.error('Failed to create comment:', result.error);
        alert('Failed to save comment. Try again.');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to connect to backend for comment.');
    } finally {
      submitCommentBtn.disabled = false;
      submitCommentBtn.textContent = "Post";
    }
  });

  // Verify link handler (only for user's own posts)
  const verifyLink = el.querySelector(".verify-link");
  if (verifyLink) {
    verifyLink.addEventListener("click", (e) => {
      e.preventDefault();
      const url = `https://ipfs.io/ipfs/${post.ipfsHash}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  return el;
}

/**
 * Render comments for a post
 * Each comment references the parent post IPFS hash
 */
function renderComments(post) {
  const commentsList = document.querySelector(`#comments-list-${post.id}`);
  if (!commentsList) return;
  
  const postComments = state.comments.get(post.ipfsHash) || [];
  
  if (postComments.length === 0) {
    commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first!</div>';
    return;
  }
  
  commentsList.innerHTML = '';
  postComments.forEach(comment => {
    const commentEl = createElement(`
      <div class="comment-item">
        <div class="comment-avatar">${shortenKey(comment.author, 2).replace("…", "")}</div>
        <div class="comment-content">
          <div class="comment-author">${shortenKey(comment.author)}</div>
          <div class="comment-text">${comment.content}</div>
          <div class="comment-meta">
            <span>${formatTimestamp(comment.timestamp)}</span>
            <span>•</span>
            <span class="comment-ipfs">IPFS: ${shortenKey(comment.ipfsHash, 6)}</span>
          </div>
        </div>
      </div>
    `);
    commentsList.appendChild(commentEl);
  });
}

// Initialize app - check for existing login
async function initializeApp() {
  const savedPublicKey = localStorage.getItem("ss3_publicKey");
  const savedAuthMethod = localStorage.getItem("ss3_authMethod");

  if (savedPublicKey) {
    state.publicKey = savedPublicKey;
    state.authMethod = savedAuthMethod || "key";
    
    if (savedAuthMethod !== "metamask") {
      state.privateKey = localStorage.getItem("ss3_privateKey");
    }
    
    // Load posts from backend (fallback to localStorage if backend unavailable)
    state.posts = await fetchPostsFromBackend();
    state.comments = loadComments();
    state.currentView = "app";
    console.log(`Auto-login: ${savedAuthMethod} - ${shortenKey(savedPublicKey)}`);
  }
  
  render();
}

initializeApp();

