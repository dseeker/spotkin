/**
 * SpotKin Device Bridge - Core Module
 * P2P device-to-device bridge for streaming AI analysis data
 * 
 * @version 1.0.0
 */

// ============================================================
// PROTOCOL CONSTANTS
// ============================================================
const DB_MESSAGE_TYPES = {
  // Mode 1 - Core AI Data (Always Active)
  AI_RESULT: 'ai_result',
  STATUS_UPDATE: 'status_update',
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_ACK: 'heartbeat_ack',

  // Mode 2 - Snapshots
  SNAPSHOT_CHUNK: 'snapshot_chunk',
  SNAPSHOT_DONE: 'snapshot_done',
  SNAPSHOT_REQUEST: 'snapshot_req',
  SNAPSHOT_HISTORY: 'snap_history',

  // Mode 3 - Live Video
  VIDEO_START: 'video_start',
  VIDEO_STOP: 'video_stop',
  VIDEO_OFFER: 'video_offer',
  VIDEO_ANSWER: 'video_answer',
  ICE_CANDIDATE: 'ice_candidate',

  // Control
  MODE_CHANGE_REQUEST: 'mode_change_req',
  MODE_CHANGE_ACK: 'mode_change_ack',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error'
};

const DB_VIEW_MODES = {
  AI_INFO: 'mode1_ai_info',
  SNAPSHOTS: 'mode2_snapshots',
  LIVE_VIDEO: 'mode3_live_video'
};

const DB_BANDWIDTH_CONFIG = {
  mode1_ai_info: {
    aiResultsInterval: 5000,
    heartbeatInterval: 30000,
  },
  mode2_snapshots: {
    aiResultsInterval: 5000,
    snapshotInterval: {
      free: 30000,
      premium: 5000
    },
    snapshotQuality: 0.6,
    maxDimension: 640,
  },
  mode3_live_video: {
    aiResultsInterval: 10000,
    videoResolution: '480p',
    videoFps: 15,
  }
};

const DB_QUALITY_THRESHOLDS = {
  excellent: { maxRtt: 50, recommendedMode: 'mode3_live_video' },
  good: { maxRtt: 150, recommendedMode: 'mode3_live_video' },
  fair: { maxRtt: 400, recommendedMode: 'mode2_snapshots' },
  poor: { maxRtt: Infinity, recommendedMode: 'mode1_ai_info' }
};

const TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// ============================================================
// ICE CONFIGURATION - STUN + TURN
// ============================================================

// Default ICE config with STUN only (fallback)
const DB_ICE_CONFIG_DEFAULT = {
  iceServers: [
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// Cloudflare TURN configuration
// To get fresh credentials, use the Cloudflare API:
// curl -H "Authorization: Bearer YOUR_API_TOKEN" \
//      -H "Content-Type: application/json" \
//      -d '{"ttl": 86400}' \
//      https://rtc.live.cloudflare.com/v1/turn/keys/YOUR_KEY_ID/credentials/generate-ice-servers
const CLOUDFLARE_TURN_CONFIG = {
  keyId: '64830439d3658d251a40c3d47b0b86b8',
  apiToken: '644ba401614b5e204fdd5476798411f6e697ab047c85457aa69b3f4fbb54b54b',
  apiUrl: 'https://rtc.live.cloudflare.com/v1/turn/keys/64830439d3658d251a40c3d47b0b86b8/credentials/generate-ice-servers'
};

let DB_ICE_CONFIG = null;

/**
 * Fetch fresh TURN credentials from Cloudflare API
 * Credentials expire after TTL (default 86400s = 24 hours)
 */
async function fetchTurnCredentials() {
  try {
    const response = await fetch(CLOUDFLARE_TURN_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_TURN_CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ttl: 86400 }) // 24 hours
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Fetched fresh TURN credentials from Cloudflare');
    return data;
  } catch (err) {
    console.warn('⚠️ Failed to fetch TURN credentials:', err);
    console.warn('   Falling back to STUN-only configuration');
    return null;
  }
}

/**
 * Initialize ICE configuration with TURN credentials
 * Call this before creating Peer connections
 */
async function initIceConfig() {
  if (DB_ICE_CONFIG) return DB_ICE_CONFIG;

  const turnData = await fetchTurnCredentials();
  
  if (turnData && turnData.iceServers) {
    // Use Cloudflare-provided ICE servers (includes TURN)
    DB_ICE_CONFIG = { iceServers: turnData.iceServers };
  } else {
    // Fallback to STUN-only
    DB_ICE_CONFIG = DB_ICE_CONFIG_DEFAULT;
  }
  
  return DB_ICE_CONFIG;
}

// ============================================================
// CONNECTION MANAGER
// ============================================================
class DBConnectionManager {
  constructor() {
    this.peer = null;
    this.connection = null;
    this.isHost = false;
    this.sessionToken = null;
    this.onMessage = null;
    this.onStateChange = null;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 5;
  }

  getPeer() { return this.peer; }

  async createHostSession() {
    // Ensure ICE config is initialized (fetches fresh TURN credentials)
    const iceConfig = await initIceConfig();
    
    this.peer = new Peer({ config: iceConfig });
    this.sessionToken = this._generateToken();
    this.isHost = true;

    return new Promise((resolve, reject) => {
      this.peer.on('open', (id) => {
        this._setupHostListeners();
        resolve({ peerId: id, token: this.sessionToken });
      });
      this.peer.on('error', (err) => {
        console.error('PeerJS host error:', err);
        reject(err);
      });
    });
  }

  async joinSession(hostPeerId, token) {
    // Ensure ICE config is initialized (fetches fresh TURN credentials)
    const iceConfig = await initIceConfig();
    
    this.peer = new Peer({ config: iceConfig });
    this.isHost = false;

    return new Promise((resolve, reject) => {
      this.peer.on('open', () => {
        const conn = this.peer.connect(hostPeerId, { reliable: true });
        conn.on('open', () => {
          this.connection = conn;
          this._setupDataListeners(conn);
          this.sendMessage({ type: 'auth', token });
          resolve();
        });
        conn.on('error', (err) => {
          console.error('PeerJS connection error:', err);
          reject(err);
        });
      });
      this.peer.on('error', (err) => {
        console.error('PeerJS peer error:', err);
        reject(err);
      });
    });
  }

  sendMessage(message) {
    if (!this.connection || !this.connection.open) return false;
    try {
      this.connection.send(JSON.stringify(message));
      return true;
    } catch (e) {
      console.error('DB send error:', e);
      return false;
    }
  }

  isConnected() {
    return !!(this.connection && this.connection.open);
  }

  disconnect() {
    this._reconnectAttempts = this._maxReconnectAttempts;
    if (this.connection) {
      this.connection.close();
    }
    if (this.peer) {
      this.peer.destroy();
    }
    this.connection = null;
    this.peer = null;
  }

  _setupHostListeners() {
    this.peer.on('connection', (conn) => {
      conn.on('open', () => {
        conn.on('data', (raw) => {
          const msg = this._parseMessage(raw);
          if (!msg) return;
          
          if (msg.type === 'auth') {
            if (!this._validateToken(msg.token)) {
              conn.send(JSON.stringify({ 
                type: DB_MESSAGE_TYPES.ERROR, 
                message: 'Invalid or expired token' 
              }));
              conn.close();
              return;
            }
            this.connection = conn;
            this._setupDataListeners(conn);
            this.onStateChange?.('connected');
            return;
          }
          this.onMessage?.(msg);
        });
      });
    });

    this.peer.on('disconnected', () => {
      this.onStateChange?.('disconnected');
      this._attemptReconnect();
    });
  }

  _setupDataListeners(conn) {
    conn.on('data', (raw) => {
      const msg = this._parseMessage(raw);
      if (msg) this.onMessage?.(msg);
    });
    conn.on('close', () => {
      this.onStateChange?.('disconnected');
      if (this.isHost) return;
      this._attemptReconnect();
    });
  }

  _attemptReconnect() {
    if (this._reconnectAttempts >= this._maxReconnectAttempts) return;
    this._reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts), 30000);
    this.onStateChange?.('reconnecting', { attempt: this._reconnectAttempts, delay });
    setTimeout(() => {
      if (this.peer && !this.peer.disconnected) return;
      this.peer?.reconnect();
    }, delay);
  }

  _generateToken() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  _validateToken(token) {
    return token === this.sessionToken;
  }

  _parseMessage(raw) {
    try { 
      return typeof raw === 'string' ? JSON.parse(raw) : raw; 
    }
    catch { 
      return null; 
    }
  }
}

// ============================================================
// QR MANAGER
// ============================================================
class DBQRManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.scanCanvas = null;
    this.scanCtx = null;
  }

  async generate(peerId, token) {
    const payload = btoa(JSON.stringify({
      v: 1,
      peerId,
      token,
      ts: Date.now()
    }));
    const url = `spotkin://pair/${payload}`;

    const container = document.getElementById(this.containerId);
    if (!container) throw new Error(`QR container #${this.containerId} not found`);
    container.innerHTML = '';

    // Check if QRCode library is available (QRCodeJS uses a constructor API)
    if (typeof QRCode === 'undefined' || typeof QRCode !== 'function') {
      // Fallback: display connection info as text with copy button
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; background: #f9fafb; border-radius: 12px;">
          <i class="fas fa-qrcode" style="font-size: 48px; color: #4f46e5; margin-bottom: 16px;"></i>
          <p style="color: #6b7280; margin-bottom: 16px;">QR Code library not loaded.<br>Use manual connection:</p>
          <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; word-break: break-all;">
            <strong>Peer ID:</strong><br>
            <code style="font-size: 12px;">${peerId}</code>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; word-break: break-all;">
            <strong>Token:</strong><br>
            <code style="font-size: 12px;">${token}</code>
          </div>
          <button onclick="navigator.clipboard.writeText('${peerId}|${token}')" 
                  style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">
            <i class="fas fa-copy"></i> Copy Code
          </button>
        </div>
      `;
      return url;
    }

    try {
      // QRCodeJS uses constructor: new QRCode(element, { text, width, height, colorDark, colorLight })
      // eslint-disable-next-line no-new
      new QRCode(container, {
        text: url,
        width: 256,
        height: 256,
        colorDark: '#4f46e5',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });

      const img = container.querySelector('img');
      if (img) {
        img.style.borderRadius = '8px';
        img.style.display = 'block';
      }
    } catch (err) {
      console.error('QR generation failed:', err);
      // Fallback to text display
      container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <p>Peer ID: ${peerId}</p>
          <p>Token: ${token}</p>
        </div>
      `;
    }
    return url;
  }

  clear() {
    const container = document.getElementById(this.containerId);
    if (container) container.innerHTML = '';
  }

  scanFrame(videoElement) {
    if (!this.scanCanvas) {
      this.scanCanvas = document.createElement('canvas');
      this.scanCtx = this.scanCanvas.getContext('2d');
    }
    
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      return null;
    }
    
    this.scanCanvas.width = videoElement.videoWidth;
    this.scanCanvas.height = videoElement.videoHeight;
    this.scanCtx.drawImage(videoElement, 0, 0);
    const imageData = this.scanCtx.getImageData(0, 0, this.scanCanvas.width, this.scanCanvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height);
    if (!result) return null;
    return DBQRManager.parseConnectionData(result.data);
  }

  static parseConnectionData(qrString) {
    try {
      if (!qrString.startsWith('spotkin://pair/')) return null;
      const payload = JSON.parse(atob(qrString.replace('spotkin://pair/', '')));
      if (payload.v !== 1 || !payload.peerId || !payload.token) return null;
      if (Date.now() - payload.ts > TOKEN_EXPIRY_MS) return null;
      return { peerId: payload.peerId, token: payload.token };
    } catch {
      return null;
    }
  }
}


// ============================================================
// SNAPSHOT MANAGER (chunked transfer)
// ============================================================
class DBSnapshotManager {
  constructor(connectionManager, videoElement) {
    this.conn = connectionManager;
    this.videoElement = videoElement;
    this.history = [];
    this.maxHistory = 240;
    this._chunkSize = 180 * 1024; // 180KB per chunk
    this._pendingChunks = {};
  }

  async capture(currentAIResult = null) {
    if (!this.videoElement || !this.videoElement.videoWidth) {
      console.warn('Cannot capture snapshot: no video element available');
      return null;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const v = this.videoElement;

    const ratio = Math.min(640 / v.videoWidth, 480 / v.videoHeight, 1);
    canvas.width = Math.round(v.videoWidth * ratio);
    canvas.height = Math.round(v.videoHeight * ratio);
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
    const snapshotId = `snap_${Date.now()}`;
    const meta = {
      snapshotId,
      timestamp: new Date().toISOString(),
      seq: this.history.length,
      format: 'jpeg',
      quality: 0.6,
      width: canvas.width,
      height: canvas.height,
      analysis: currentAIResult ? {
        alertType: currentAIResult.alert?.type || 'unknown',
        alertMessage: currentAIResult.alert?.message || '',
        detectedObjects: (currentAIResult.objects || []).map(o => o.type)
      } : null
    };

    const fullDataUrl = `data:image/jpeg;base64,${base64}`;
    this.history.unshift({ ...meta, dataUrl: fullDataUrl });
    if (this.history.length > this.maxHistory) this.history.pop();

    if (this.conn && this.conn.isConnected()) {
      this._sendChunked(base64, snapshotId, meta);
    }
    
    return { ...meta, dataUrl: fullDataUrl };
  }

  _sendChunked(base64, snapshotId, meta) {
    const totalChunks = Math.ceil(base64.length / this._chunkSize);
    for (let i = 0; i < totalChunks; i++) {
      this.conn.sendMessage({
        type: DB_MESSAGE_TYPES.SNAPSHOT_CHUNK,
        snapshotId,
        chunkIndex: i,
        totalChunks,
        data: base64.substring(i * this._chunkSize, (i + 1) * this._chunkSize)
      });
    }
    this.conn.sendMessage({ type: DB_MESSAGE_TYPES.SNAPSHOT_DONE, ...meta });
  }

  receiveChunk(msg) {
    if (msg.type === DB_MESSAGE_TYPES.SNAPSHOT_DONE) {
      const pending = this._pendingChunks[msg.snapshotId];
      if (!pending) return null;
      
      const base64 = pending.chunks.join('');
      delete this._pendingChunks[msg.snapshotId];
      return {
        meta: msg,
        dataUrl: `data:image/jpeg;base64,${base64}`
      };
    }
    
    if (!this._pendingChunks[msg.snapshotId]) {
      this._pendingChunks[msg.snapshotId] = { 
        chunks: [], 
        totalChunks: msg.totalChunks 
      };
    }
    const pending = this._pendingChunks[msg.snapshotId];
    pending.chunks[msg.chunkIndex] = msg.data;
    
    return null;
  }

  getHistory() { return this.history; }
  clearHistory() { this.history = []; }
}

// ============================================================
// VIDEO STREAM MANAGER
// ============================================================
class DBVideoStreamManager {
  constructor() {
    this.call = null;
    this.localStream = null;
    this.isStreaming = false;
    this._onRemoteStream = null;
  }

  listenForCall(peer, onStream) {
    this._onRemoteStream = onStream;
    peer.on('call', (call) => {
      this.call = call;
      call.answer(this.localStream);
      call.on('stream', (remoteStream) => {
        this.isStreaming = true;
        onStream(remoteStream);
      });
      call.on('close', () => {
        this.isStreaming = false;
      });
      call.on('error', (err) => {
        console.error('Video call error:', err);
        this.isStreaming = false;
      });
    });
  }

  async requestStream(peer, hostPeerId, onStream) {
    try {
      const emptyStream = new MediaStream();
      this.call = peer.call(hostPeerId, emptyStream);
      
      if (!this.call) {
        throw new Error('Failed to initiate call');
      }
      
      this.call.on('stream', (remoteStream) => {
        this.isStreaming = true;
        onStream(remoteStream);
      });
      this.call.on('close', () => {
        this.isStreaming = false;
      });
      this.call.on('error', (err) => {
        console.error('Video call error:', err);
        this.isStreaming = false;
      });
      
      return true;
    } catch (err) {
      console.error('Failed to request video stream:', err);
      return false;
    }
  }

  setLocalStream(stream) { 
    this.localStream = stream; 
  }

  stop() {
    if (this.call) {
      this.call.close();
      this.call = null;
    }
    this.isStreaming = false;
  }
}

// ============================================================
// ADAPTIVE QUALITY MANAGER
// ============================================================
class DBAdaptiveQuality {
  constructor(connectionManager) {
    this.conn = connectionManager;
    this.latencyHistory = [];
    this._timer = null;
    this._pendingPing = null;
    this._onRecommendation = null;
  }

  start(onRecommendation) {
    this._onRecommendation = onRecommendation;
    this._timer = setInterval(() => this._measure(), 30000);
  }

  stop() { 
    if (this._timer) {
      clearInterval(this._timer); 
      this._timer = null;
    }
  }

  handlePong(sentAt) {
    const rtt = Date.now() - sentAt;
    this.latencyHistory.push(rtt);
    if (this.latencyHistory.length > 10) this.latencyHistory.shift();

    const avgRtt = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;
    const quality = this._classify(avgRtt);
    this._onRecommendation?.(quality, avgRtt);
  }

  _measure() {
    const ts = Date.now();
    this.conn.sendMessage({ type: DB_MESSAGE_TYPES.PING, ts });
  }

  _classify(avgRtt) {
    for (const [label, cfg] of Object.entries(DB_QUALITY_THRESHOLDS)) {
      if (avgRtt <= cfg.maxRtt) return { label, recommendedMode: cfg.recommendedMode, avgRtt };
    }
    return { label: 'poor', recommendedMode: 'mode1_ai_info', avgRtt };
  }
}


// ============================================================
// DEVICE BRIDGE MANAGER (main entry point)
// ============================================================
class DeviceBridgeManager {
  constructor(userTier = 'free') {
    this.conn = new DBConnectionManager();
    this.qr = null;
    this.snapshots = null;
    this.video = null;
    this.videoStream = new DBVideoStreamManager();
    this.adaptiveQuality = new DBAdaptiveQuality(this.conn);
    this._seq = 0;
    this._heartbeatTimer = null;
    this._lastAIResult = null;
    this._snapshotTimer = null;
    this._currentMode = DB_VIEW_MODES.AI_INFO;
    this._userTier = userTier;
    this._snapshotAssembler = null;

    // Callbacks
    this.onStateChange = null;
    this.onAIResult = null;
    this.onSnapshot = null;
    this.onError = null;
    this.onQualityWarning = null;

    this.conn.onMessage = (msg) => this._handleMessage(msg);
    this.conn.onStateChange = (state, detail) => {
      this.onStateChange?.(state, detail);
      if (state === 'connected') this._startHeartbeat();
      if (state === 'disconnected') this._stopHeartbeat();
    };
  }

  async createHostSession(qrContainerId, videoElement) {
    this.video = videoElement;
    this.snapshots = new DBSnapshotManager(this.conn, videoElement);
    
    if (videoElement && videoElement.srcObject) {
      this.videoStream.setLocalStream(videoElement.srcObject);
    }
    
    this.qr = new DBQRManager(qrContainerId);

    const { peerId, token } = await this.conn.createHostSession();
    await this.qr.generate(peerId, token);

    this.videoStream.listenForCall(this.conn.getPeer(), () => {});

    return { peerId, token };
  }

  async joinSession(hostPeerId, token) {
    await this.conn.joinSession(hostPeerId, token);
    this.adaptiveQuality.start((quality) => {
      if (quality.label === 'poor' || quality.label === 'fair') {
        this.onQualityWarning?.(quality);
      }
    });
  }

  sendAIResult(aiResult) {
    if (!this.conn.isConnected()) return;
    this._lastAIResult = aiResult;
    
    const message = {
      type: DB_MESSAGE_TYPES.AI_RESULT,
      timestamp: new Date().toISOString(),
      seq: ++this._seq,
      data: {
        scene: aiResult.scene,
        alert: aiResult.alert,
        objects: aiResult.objects,
        hasPetsOrBabies: aiResult.hasPetsOrBabies,
        temporalAnalysis: aiResult.temporalAnalysis || null
      }
    };
    
    this.conn.sendMessage(message);

    if (this._currentMode === DB_VIEW_MODES.SNAPSHOTS &&
        aiResult.alert?.type === 'danger') {
      this.snapshots?.capture(aiResult);
    }
  }

  sendStatusUpdate(status) {
    if (!this.conn.isConnected()) return;
    this.conn.sendMessage({
      type: DB_MESSAGE_TYPES.STATUS_UPDATE,
      timestamp: new Date().toISOString(),
      status
    });
  }

  requestSnapshot() {
    this.conn.sendMessage({ type: DB_MESSAGE_TYPES.SNAPSHOT_REQUEST });
  }

  requestModeChange(mode) {
    this.conn.sendMessage({ type: DB_MESSAGE_TYPES.MODE_CHANGE_REQUEST, mode });
  }

  async startVideoStream(onStream) {
    if (!this.conn.getPeer()) return false;
    
    const hostPeerId = this.conn.connection?.peer;
    if (!hostPeerId) return false;
    
    this.conn.sendMessage({ type: DB_MESSAGE_TYPES.VIDEO_START });
    return await this.videoStream.requestStream(this.conn.getPeer(), hostPeerId, onStream);
  }

  stopVideoStream() {
    this.conn.sendMessage({ type: DB_MESSAGE_TYPES.VIDEO_STOP });
    this.videoStream.stop();
  }

  isConnected() { return this.conn.isConnected(); }
  isStreaming() { return this.videoStream.isStreaming; }
  getCurrentMode() { return this._currentMode; }

  disconnect() {
    this._stopHeartbeat();
    this._stopSnapshotInterval();
    this.adaptiveQuality.stop();
    this.videoStream.stop();
    this.conn.disconnect();
  }

  _handleMessage(msg) {
    switch (msg.type) {
      case DB_MESSAGE_TYPES.AI_RESULT:
        this.onAIResult?.(msg.data);
        break;

      case DB_MESSAGE_TYPES.STATUS_UPDATE:
        this.onStateChange?.('status_update', msg.status);
        break;

      case DB_MESSAGE_TYPES.SNAPSHOT_CHUNK:
        if (!this._snapshotAssembler) {
          this._snapshotAssembler = new DBSnapshotManager(null, null);
        }
        this._snapshotAssembler.receiveChunk(msg);
        break;

      case DB_MESSAGE_TYPES.SNAPSHOT_DONE: {
        if (!this._snapshotAssembler) {
          this._snapshotAssembler = new DBSnapshotManager(null, null);
        }
        const result = this._snapshotAssembler.receiveChunk(msg);
        if (result) {
          this.onSnapshot?.(result.meta, result.dataUrl);
        }
        break;
      }

      case DB_MESSAGE_TYPES.MODE_CHANGE_REQUEST:
        this._setMode(msg.mode);
        this.conn.sendMessage({ type: DB_MESSAGE_TYPES.MODE_CHANGE_ACK, mode: msg.mode });
        break;

      case DB_MESSAGE_TYPES.MODE_CHANGE_ACK:
        this._currentMode = msg.mode;
        break;

      case DB_MESSAGE_TYPES.SNAPSHOT_REQUEST:
        this.snapshots?.capture(this._lastAIResult);
        break;

      case DB_MESSAGE_TYPES.VIDEO_START:
        // Host: viewer wants live video - handled by listenForCall
        break;

      case DB_MESSAGE_TYPES.VIDEO_STOP:
        this.videoStream.stop();
        break;

      case DB_MESSAGE_TYPES.HEARTBEAT:
        this.conn.sendMessage({ type: DB_MESSAGE_TYPES.HEARTBEAT_ACK });
        break;

      case DB_MESSAGE_TYPES.HEARTBEAT_ACK:
        // Connection alive
        break;

      case DB_MESSAGE_TYPES.PING:
        this.conn.sendMessage({ type: DB_MESSAGE_TYPES.PONG, ts: msg.ts });
        break;

      case DB_MESSAGE_TYPES.PONG:
        this.adaptiveQuality.handlePong(msg.ts);
        break;

      case DB_MESSAGE_TYPES.ERROR:
        this.onError?.(msg.message);
        break;
    }
  }

  _setMode(mode) {
    this._currentMode = mode;
    this._stopSnapshotInterval();
    
    if (mode === DB_VIEW_MODES.SNAPSHOTS) {
      const intervalMs = DB_BANDWIDTH_CONFIG.mode2_snapshots.snapshotInterval[this._userTier]
        ?? DB_BANDWIDTH_CONFIG.mode2_snapshots.snapshotInterval.free;
      this._snapshotTimer = setInterval(() => {
        this.snapshots?.capture(this._lastAIResult);
      }, intervalMs);
    }
    
    if (mode === DB_VIEW_MODES.LIVE_VIDEO) {
      // Host doesn't need to do anything special - video stream is initiated by viewer
    }
  }

  _startHeartbeat() {
    this._heartbeatTimer = setInterval(() => {
      this.conn.sendMessage({ type: DB_MESSAGE_TYPES.HEARTBEAT });
    }, DB_BANDWIDTH_CONFIG.mode1_ai_info.heartbeatInterval);
  }

  _stopHeartbeat() { 
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer); 
      this._heartbeatTimer = null;
    }
  }
  
  _stopSnapshotInterval() { 
    if (this._snapshotTimer) {
      clearInterval(this._snapshotTimer); 
      this._snapshotTimer = null;
    }
  }
}

// ============================================================
// INDEXEDDB HISTORY STORE (for persistence)
// ============================================================
class DBHistoryStore {
  constructor(dbName = 'SpotKinBridgeDB') {
    this.dbName = dbName;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('snapshots')) {
          const store = db.createObjectStore('snapshots', { keyPath: 'snapshotId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('sessionId', 'sessionId', { unique: false });
        }
      };
    });
  }

  async save(snapshotMeta, sessionId = 'default') {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['snapshots'], 'readwrite');
      const store = transaction.objectStore('snapshots');
      
      const data = { ...snapshotMeta, sessionId, savedAt: Date.now() };
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(sessionId = null) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['snapshots'], 'readonly');
      const store = transaction.objectStore('snapshots');
      
      let request;
      if (sessionId) {
        const index = store.index('sessionId');
        request = index.getAll(sessionId);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => {
        const results = request.result;
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearOld(maxAgeMs = 2 * 60 * 60 * 1000) {
    if (!this.db) await this.init();
    
    const cutoff = Date.now() - maxAgeMs;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['snapshots'], 'readwrite');
      const store = transaction.objectStore('snapshots');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(new Date(cutoff).toISOString());
      
      const request = index.openCursor(range);
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['snapshots'], 'readwrite');
      const store = transaction.objectStore('snapshots');
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================================
// UMD EXPORT
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DeviceBridgeManager,
        DBQRManager,
        DBConnectionManager,
        DBSnapshotManager,
        DBVideoStreamManager,
        DBAdaptiveQuality,
        DBHistoryStore,
        fetchTurnCredentials,
        initIceConfig,
        CLOUDFLARE_TURN_CONFIG,
        DB_MESSAGE_TYPES,
        DB_VIEW_MODES,
        DB_BANDWIDTH_CONFIG,
        DB_QUALITY_THRESHOLDS
    };
} else if (typeof window !== 'undefined') {
    window.DeviceBridgeManager = DeviceBridgeManager;
    window.DBQRManager = DBQRManager;
    window.DBConnectionManager = DBConnectionManager;
    window.DBSnapshotManager = DBSnapshotManager;
    window.DBVideoStreamManager = DBVideoStreamManager;
    window.DBAdaptiveQuality = DBAdaptiveQuality;
    window.DBHistoryStore = DBHistoryStore;
    window.fetchTurnCredentials = fetchTurnCredentials;
    window.initIceConfig = initIceConfig;
    window.CLOUDFLARE_TURN_CONFIG = CLOUDFLARE_TURN_CONFIG;
    window.DB_MESSAGE_TYPES = DB_MESSAGE_TYPES;
    window.DB_VIEW_MODES = DB_VIEW_MODES;
    window.DB_BANDWIDTH_CONFIG = DB_BANDWIDTH_CONFIG;
    window.DB_QUALITY_THRESHOLDS = DB_QUALITY_THRESHOLDS;
}
