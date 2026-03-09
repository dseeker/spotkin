/**
 * SpotKin Device Bridge - UI Module
 * P2P device-to-device bridge UI components
 * 
 * @version 1.0.0
 */

// ============================================================
// STATUS STYLES
// ============================================================
const DB_STATUS_STYLES = {
  safe: { 
    color: '#10B981', 
    bgColor: '#D1FAE5', 
    icon: 'fa-check-circle', 
    label: 'SAFE' 
  },
  warning: { 
    color: '#F59E0B', 
    bgColor: '#FEF3C7', 
    icon: 'fa-exclamation-triangle', 
    label: 'WATCH' 
  },
  danger: { 
    color: '#EF4444', 
    bgColor: '#FEE2E2', 
    icon: 'fa-exclamation-circle', 
    label: 'ALERT' 
  },
  offline: { 
    color: '#6B7280', 
    bgColor: '#F3F4F6', 
    icon: 'fa-times-circle', 
    label: 'OFFLINE' 
  },
  unknown: { 
    color: '#6B7280', 
    bgColor: '#F3F4F6', 
    icon: 'fa-question-circle', 
    label: 'UNKNOWN' 
  }
};

// ============================================================
// UI: MODE 1 — AI Info
// ============================================================
class AIInfoUI {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.lastUpdateTime = null;
    this._updateInterval = null;
  }

  render() {
    return `
      <div id="${this.containerId}" class="db-ai-info hidden">
        <div class="db-status-card">
          <div class="db-status-badge" id="db-status-badge">
            <i class="fas fa-circle"></i>
            <span>Connecting...</span>
          </div>
          <div class="db-confidence" id="db-confidence"></div>
        </div>
        
        <div class="db-section">
          <h4><i class="fas fa-image"></i> Scene</h4>
          <p id="db-scene-text" class="db-scene-text">Waiting for data...</p>
        </div>
        
        <div class="db-section">
          <h4><i class="fas fa-cube"></i> Detected Objects</h4>
          <ul id="db-objects-list" class="db-objects-list">
            <li class="db-object-item">No objects detected yet</li>
          </ul>
        </div>
        
        <div class="db-temporal" id="db-temporal">
          <div class="db-temporal-item">
            <i class="fas fa-walking"></i>
            <span id="db-movement">No movement data</span>
          </div>
        </div>
        
        <div class="db-footer">
          <span id="db-last-update">Last update: --</span>
          <span id="db-connection-quality">Connection: --</span>
        </div>
        
        <div class="db-mode-buttons">
          <button class="db-mode-btn" id="db-btn-snapshots">
            <i class="fas fa-camera"></i> Snapshots
          </button>
          <button class="db-mode-btn" id="db-btn-live">
            <i class="fas fa-video"></i> Live Video
          </button>
        </div>
      </div>
    `;
  }

  updateAIResult(data) {
    if (!data) return;
    
    const status = data.alert?.type || 'unknown';
    const style = DB_STATUS_STYLES[status] || DB_STATUS_STYLES.unknown;
    
    const badge = document.getElementById('db-status-badge');
    if (badge) {
      badge.style.backgroundColor = style.bgColor;
      badge.style.color = style.color;
      badge.innerHTML = `<i class="fas ${style.icon}"></i><span>${style.label}</span>`;
    }
    
    const confidence = document.getElementById('db-confidence');
    if (confidence && data.objects && data.objects.length > 0) {
      const avgConfidence = data.objects.reduce((sum, obj) => sum + (obj.confidence || 0), 0) / data.objects.length;
      confidence.textContent = `Confidence: ${Math.round(avgConfidence * 100)}%`;
    }
    
    const sceneText = document.getElementById('db-scene-text');
    if (sceneText && data.scene) {
      sceneText.textContent = data.scene;
    }
    
    const objectsList = document.getElementById('db-objects-list');
    if (objectsList && data.objects) {
      if (data.objects.length === 0) {
        objectsList.innerHTML = '<li class="db-object-item">No objects detected</li>';
      } else {
        objectsList.innerHTML = data.objects.map(obj => {
          const confidence = obj.confidence ? Math.round(obj.confidence * 100) : '?';
          return `
            <li class="db-object-item">
              <span class="db-object-icon">${this._getObjectIcon(obj.type)}</span>
              <span class="db-object-name">${obj.type}</span>
              <span class="db-object-state">${obj.state || ''}</span>
              <span class="db-object-confidence">${confidence}%</span>
            </li>
          `;
        }).join('');
      }
    }
    
    if (data.temporalAnalysis) {
      const movementEl = document.getElementById('db-movement');
      if (movementEl) {
        const movement = data.temporalAnalysis.movementLevel || 'none';
        movementEl.textContent = movement === 'none' ? 'No movement detected' : 
                                  movement === 'moderate' ? 'Moderate movement' : 'High movement';
      }
    }
    
    this.lastUpdateTime = Date.now();
    this._updateLastUpdateText();
    
    if (!this._updateInterval) {
      this._updateInterval = setInterval(() => this._updateLastUpdateText(), 5000);
    }
  }

  updateConnectionStatus(state, detail) {
    const qualityEl = document.getElementById('db-connection-quality');
    if (!qualityEl) return;
    
    const statusMap = {
      'connected': 'Connected',
      'disconnected': 'Disconnected',
      'reconnecting': `Reconnecting (${detail?.attempt || 1})...`
    };
    
    qualityEl.textContent = `Connection: ${statusMap[state] || state}`;
  }

  _updateLastUpdateText() {
    const el = document.getElementById('db-last-update');
    if (!el || !this.lastUpdateTime) return;
    
    const seconds = Math.floor((Date.now() - this.lastUpdateTime) / 1000);
    let text;
    if (seconds < 5) text = 'Just now';
    else if (seconds < 60) text = `${seconds}s ago`;
    else text = `${Math.floor(seconds / 60)}m ago`;
    
    el.textContent = `Last update: ${text}`;
  }

  _getObjectIcon(type) {
    const icons = {
      'Baby': '👶',
      'Child': '👧',
      'Person': '👤',
      'Dog': '🐕',
      'Cat': '🐈',
      'Pet': '🐾',
      'Crib': '🛏️',
      'Bed': '🛏️'
    };
    return icons[type] || '📦';
  }

  show() {
    this.container = document.getElementById(this.containerId);
    if (this.container) this.container.classList.remove('hidden');
  }

  hide() {
    this.container = document.getElementById(this.containerId);
    if (this.container) this.container.classList.add('hidden');
  }

  destroy() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }
}


// ============================================================
// UI: MODE 2 — Snapshots
// ============================================================
class SnapshotsUI {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.snapshots = [];
    this.maxSnapshots = 240;
    this.onRequestSnapshot = null;
    this._pruneNoticeShown = false;
  }

  render() {
    return `
      <div id="${this.containerId}" class="db-snapshots hidden">
        <div class="db-snapshots-header">
          <h4><i class="fas fa-camera"></i> Snapshot History</h4>
          <button class="db-btn-request" id="db-btn-request-snap">
            <i class="fas fa-sync"></i> Capture Now
          </button>
        </div>
        
        <div class="db-snapshots-current" id="db-snapshots-current">
          <div class="db-no-snapshot">
            <i class="fas fa-image"></i>
            <p>No snapshots yet</p>
          </div>
        </div>
        
        <div class="db-snapshots-list-container">
          <h5>History</h5>
          <div class="db-snapshots-list" id="db-snapshots-list">
            <!-- Thumbnails will be added here -->
          </div>
        </div>
        
        <div class="db-mode-buttons">
          <button class="db-mode-btn" id="db-btn-ai-info-from-snap">
            <i class="fas fa-info-circle"></i> AI Info
          </button>
          <button class="db-mode-btn" id="db-btn-live-from-snap">
            <i class="fas fa-video"></i> Live Video
          </button>
        </div>
        
        <div id="db-prune-notice" class="db-prune-notice hidden">
          <i class="fas fa-info-circle"></i>
          <span>Oldest entries removed (2 hour limit)</span>
        </div>
      </div>
    `;
  }

  attachListeners() {
    const requestBtn = document.getElementById('db-btn-request-snap');
    if (requestBtn) {
      requestBtn.addEventListener('click', () => {
        this.onRequestSnapshot?.();
      });
    }
  }

  addSnapshot(meta, dataUrl) {
    if (!dataUrl) return;
    
    const snapshot = { ...meta, dataUrl };
    this.snapshots.unshift(snapshot);
    
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.pop();
      if (!this._pruneNoticeShown) {
        this._showPruneNotice();
      }
    }
    
    this._updateCurrentSnapshot(snapshot);
    this._updateHistoryList();
  }

  _updateCurrentSnapshot(snapshot) {
    const container = document.getElementById('db-snapshots-current');
    if (!container) return;
    
    const style = DB_STATUS_STYLES[snapshot.analysis?.alertType] || DB_STATUS_STYLES.unknown;
    const time = new Date(snapshot.timestamp).toLocaleTimeString();
    
    container.innerHTML = `
      <div class="db-snapshot-main">
        <img src="${snapshot.dataUrl}" alt="Snapshot" class="db-snapshot-img">
        <div class="db-snapshot-overlay">
          <div class="db-snapshot-status" style="background-color: ${style.bgColor}; color: ${style.color}">
            <i class="fas ${style.icon}"></i>
            <span>${style.label}</span>
          </div>
          <div class="db-snapshot-time">${time}</div>
        </div>
        ${snapshot.analysis ? `
          <div class="db-snapshot-analysis">
            <p>${snapshot.analysis.alertMessage || ''}</p>
            ${snapshot.analysis.detectedObjects ? `
              <small>${snapshot.analysis.detectedObjects.join(', ')}</small>
            ` : ''}
          </div>
        ` : ''}
        <button class="db-snapshot-download" data-id="${snapshot.snapshotId}">
          <i class="fas fa-download"></i>
        </button>
      </div>
    `;
    
    const downloadBtn = container.querySelector('.db-snapshot-download');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this._downloadSnapshot(snapshot));
    }
  }

  _updateHistoryList() {
    const list = document.getElementById('db-snapshots-list');
    if (!list) return;
    
    if (this.snapshots.length <= 1) {
      list.innerHTML = '<p class="db-no-history">No history yet</p>';
      return;
    }
    
    // Skip the first one (currently displayed)
    const history = this.snapshots.slice(1);
    
    list.innerHTML = history.map((snap, index) => {
      const time = new Date(snap.timestamp).toLocaleTimeString();
      const style = DB_STATUS_STYLES[snap.analysis?.alertType] || DB_STATUS_STYLES.unknown;
      
      return `
        <div class="db-snapshot-thumb" data-index="${index + 1}">
          <img src="${snap.dataUrl}" alt="Snapshot at ${time}">
          <div class="db-snapshot-thumb-overlay" style="background-color: ${style.color}">
            <i class="fas ${style.icon}"></i>
          </div>
          <span class="db-snapshot-thumb-time">${time}</span>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    list.querySelectorAll('.db-snapshot-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const index = parseInt(thumb.dataset.index);
        this._showSnapshot(index);
      });
    });
  }

  _showSnapshot(index) {
    const snapshot = this.snapshots[index];
    if (!snapshot) return;
    
    // Move to front
    this.snapshots.splice(index, 1);
    this.snapshots.unshift(snapshot);
    
    this._updateCurrentSnapshot(snapshot);
    this._updateHistoryList();
  }

  _downloadSnapshot(snapshot) {
    const link = document.createElement('a');
    link.href = snapshot.dataUrl;
    link.download = `spotkin-snapshot-${snapshot.snapshotId}.jpg`;
    link.click();
  }

  _showPruneNotice() {
    const notice = document.getElementById('db-prune-notice');
    if (notice) {
      notice.classList.remove('hidden');
      this._pruneNoticeShown = true;
    }
  }

  show() {
    this.container = document.getElementById(this.containerId);
    if (this.container) this.container.classList.remove('hidden');
  }

  hide() {
    this.container = document.getElementById(this.containerId);
    if (this.container) this.container.classList.add('hidden');
  }

  clear() {
    this.snapshots = [];
    this._pruneNoticeShown = false;
    const notice = document.getElementById('db-prune-notice');
    if (notice) notice.classList.add('hidden');
  }
}


// ============================================================
// UI: MODE 3 — Live Video
// ============================================================
class LiveVideoUI {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.video = null;
    this.currentStream = null;
    this.isMuted = true;
    this.isPaused = false;
    this.currentAIStatus = null;
    this.onToggleMute = null;
    this.onTogglePause = null;
    this.onRequestSnapshot = null;
  }

  render() {
    return `
      <div id="${this.containerId}" class="db-video hidden">
        <div class="db-video-container">
          <video id="db-live-video" autoplay playsinline muted></video>
          
          <div class="db-video-overlay" id="db-video-overlay">
            <div class="db-video-status" id="db-video-status">
              <i class="fas fa-circle"></i>
              <span>LIVE</span>
            </div>
          </div>
          
          <div class="db-video-controls">
            <button class="db-video-btn" id="db-btn-mute" title="Unmute">
              <i class="fas fa-volume-mute"></i>
            </button>
            <button class="db-video-btn" id="db-btn-pause" title="Pause">
              <i class="fas fa-pause"></i>
            </button>
            <button class="db-video-btn" id="db-btn-snapshot" title="Take Snapshot">
              <i class="fas fa-camera"></i>
            </button>
            <button class="db-video-btn db-video-btn-stop" id="db-btn-stop-video" title="Stop Video">
              <i class="fas fa-stop"></i>
            </button>
          </div>
          
          <div class="db-video-loading" id="db-video-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Connecting to video stream...</span>
          </div>
        </div>
        
        <div class="db-video-info">
          <div class="db-video-scene" id="db-video-scene">Waiting for AI data...</div>
          <div class="db-video-objects" id="db-video-objects"></div>
        </div>
        
        <div class="db-mode-buttons">
          <button class="db-mode-btn" id="db-btn-ai-info-from-video">
            <i class="fas fa-info-circle"></i> AI Info
          </button>
          <button class="db-mode-btn" id="db-btn-snapshots-from-video">
            <i class="fas fa-camera"></i> Snapshots
          </button>
        </div>
      </div>
    `;
  }

  attachListeners() {
    const muteBtn = document.getElementById('db-btn-mute');
    const pauseBtn = document.getElementById('db-btn-pause');
    const snapshotBtn = document.getElementById('db-btn-snapshot');
    const stopBtn = document.getElementById('db-btn-stop-video');
    
    if (muteBtn) {
      muteBtn.addEventListener('click', () => this._toggleMute());
    }
    
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this._togglePause());
    }
    
    if (snapshotBtn) {
      snapshotBtn.addEventListener('click', () => this._takeSnapshot());
    }
    
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        this.stop();
        this.onTogglePause?.();
      });
    }
  }

  attachStream(stream) {
    this.currentStream = stream;
    this.video = document.getElementById('db-live-video');
    
    if (this.video) {
      this.video.srcObject = stream;
      this.video.play().catch(err => console.error('Video play error:', err));
      
      this.video.addEventListener('loadedmetadata', () => {
        document.getElementById('db-video-loading')?.classList.add('hidden');
      });
    }
  }

  updateOverlay(aiData) {
    if (!aiData) return;
    
    this.currentAIStatus = aiData.alert?.type || 'unknown';
    const style = DB_STATUS_STYLES[this.currentAIStatus] || DB_STATUS_STYLES.unknown;
    
    const statusEl = document.getElementById('db-video-status');
    if (statusEl) {
      statusEl.style.backgroundColor = style.bgColor;
      statusEl.style.color = style.color;
      statusEl.innerHTML = `
        <i class="fas ${style.icon}"></i>
        <span>${style.label}</span>
      `;
    }
    
    const sceneEl = document.getElementById('db-video-scene');
    if (sceneEl && aiData.scene) {
      sceneEl.textContent = aiData.scene;
    }
    
    const objectsEl = document.getElementById('db-video-objects');
    if (objectsEl && aiData.objects) {
      objectsEl.innerHTML = aiData.objects.map(obj => 
        `<span class="db-video-object-tag">${this._getObjectIcon(obj.type)} ${obj.type}</span>`
      ).join('');
    }
  }

  _toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.video) {
      this.video.muted = this.isMuted;
    }
    
    const btn = document.getElementById('db-btn-mute');
    if (btn) {
      btn.innerHTML = this.isMuted ? 
        '<i class="fas fa-volume-mute"></i>' : 
        '<i class="fas fa-volume-up"></i>';
      btn.title = this.isMuted ? 'Unmute' : 'Mute';
    }
  }

  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.video) {
      if (this.isPaused) {
        this.video.pause();
      } else {
        this.video.play();
      }
    }
    
    const btn = document.getElementById('db-btn-pause');
    if (btn) {
      btn.innerHTML = this.isPaused ? 
        '<i class="fas fa-play"></i>' : 
        '<i class="fas fa-pause"></i>';
      btn.title = this.isPaused ? 'Play' : 'Pause';
    }
  }

  _takeSnapshot() {
    if (!this.video || !this.video.videoWidth) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `spotkin-video-snapshot-${Date.now()}.jpg`;
    link.click();
  }

  _getObjectIcon(type) {
    const icons = {
      'Baby': '👶',
      'Child': '👧',
      'Person': '👤',
      'Dog': '🐕',
      'Cat': '🐈',
      'Pet': '🐾',
      'Crib': '🛏️',
      'Bed': '🛏️'
    };
    return icons[type] || '📦';
  }

  showLoading() {
    document.getElementById('db-video-loading')?.classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('db-video-loading')?.classList.add('hidden');
  }

  show() {
    this.container = document.getElementById(this.containerId);
    if (this.container) this.container.classList.remove('hidden');
    this.showLoading();
  }

  hide() {
    this.container = document.getElementById(this.containerId);
    if (this.container) this.container.classList.add('hidden');
  }

  stop() {
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
  }

  destroy() {
    this.stop();
  }
}


// ============================================================
// UI CONTROLLER
// ============================================================
class DeviceBridgeUIController {
  constructor(bridge) {
    this.bridge = bridge;
    this.currentMode = null;
    this.aiInfoUI = null;
    this.snapshotsUI = null;
    this.liveVideoUI = null;
    this.isHost = false;
    this.historyStore = null;
    this.sessionId = null;
    this._fabButton = null;
    this._modal = null;
    this._scanAnimation = null;
  }

  initialize() {
    this._injectStyles();
    this._injectHTML();
    this._attachListeners();
    
    this.aiInfoUI = new AIInfoUI('db-ai-info-container');
    this.snapshotsUI = new SnapshotsUI('db-snapshots-container');
    this.liveVideoUI = new LiveVideoUI('db-video-container');
    
    this.snapshotsUI.onRequestSnapshot = () => {
      this.bridge.requestSnapshot();
    };
    
    this.liveVideoUI.onTogglePause = () => {
      this.switchMode('mode2_snapshots');
    };

    this._wireBridgeCallbacks();
  }

  _wireBridgeCallbacks() {
    this.bridge.onAIResult = (data) => {
      this.aiInfoUI.updateAIResult(data);
      this.liveVideoUI.updateOverlay(data);
      
      // Viewer notifications for danger alerts
      if (!this.isHost && data.alert?.type === 'danger') {
        this._triggerDangerNotification(data);
      }
    };
    
    this.bridge.onSnapshot = (meta, dataUrl) => {
      this.snapshotsUI.addSnapshot(meta, dataUrl);
      
      // Save to IndexedDB on viewer
      if (!this.isHost && this.historyStore && dataUrl) {
        this.historyStore.save({ ...meta, dataUrl }, this.sessionId);
      }
    };
    
    this.bridge.onStateChange = (state, detail) => {
      this.aiInfoUI.updateConnectionStatus(state, detail);
      
      if (state === 'connected') {
        this._updateFabStatus('connected');
      } else if (state === 'disconnected') {
        this._updateFabStatus('disconnected');
      }
    };
    
    this.bridge.onQualityWarning = (quality) => {
      this._showQualityBanner(quality);
    };
    
    this.bridge.onError = (error) => {
      console.error('Bridge error:', error);
      this._showError(error);
    };
  }

  _injectStyles() {
    if (document.getElementById('db-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'db-styles';
    styles.textContent = `
      /* Device Bridge Modal */
      .db-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      }
      .db-modal-overlay.hidden { display: none !important; }
      
      .db-modal {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      }
      
      .db-modal-header {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .db-modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .db-modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: background 0.2s;
      }
      .db-modal-close:hover { background: rgba(255,255,255,0.2); }
      
      .db-modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }
      
      /* Selection View */
      .db-selection-grid {
        display: grid;
        gap: 16px;
      }
      .db-selection-card {
        background: #f9fafb;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 24px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }
      .db-selection-card:hover {
        border-color: #4f46e5;
        background: #f5f3ff;
        transform: translateY(-2px);
      }
      .db-selection-card i {
        font-size: 2.5rem;
        color: #4f46e5;
        margin-bottom: 12px;
      }
      .db-selection-card h4 {
        margin: 0 0 8px 0;
        color: #1f2937;
      }
      .db-selection-card p {
        margin: 0;
        color: #6b7280;
        font-size: 0.875rem;
      }
      
      /* QR Display */
      .db-qr-section {
        text-align: center;
        padding: 20px;
      }
      .db-qr-container {
        display: inline-block;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        margin: 20px 0;
      }
      .db-qr-code {
        display: flex;
        justify-content: center;
      }
      .db-qr-code canvas {
        border-radius: 8px;
      }
      .db-qr-instructions {
        color: #6b7280;
        font-size: 0.875rem;
        margin-top: 16px;
      }
      .db-qr-manual {
        margin-top: 20px;
        padding: 16px;
        background: #f3f4f6;
        border-radius: 8px;
        font-size: 0.75rem;
        word-break: break-all;
      }
      
      /* QR Scanner */
      .db-scanner-section {
        text-align: center;
      }
      .db-scanner-video-container {
        position: relative;
        width: 100%;
        max-width: 400px;
        margin: 0 auto;
        aspect-ratio: 4/3;
        background: #1f2937;
        border-radius: 12px;
        overflow: hidden;
      }
      .db-scanner-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .db-scanner-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        border: 2px solid rgba(79, 70, 229, 0.8);
        border-radius: 16px;
        box-shadow: 0 0 0 100vw rgba(0,0,0,0.5);
      }
      .db-scanner-corner {
        position: absolute;
        width: 20px;
        height: 20px;
        border-color: #4f46e5;
        border-style: solid;
        border-width: 0;
      }
      .db-scanner-corner.top-left { top: -2px; left: -2px; border-top-width: 4px; border-left-width: 4px; }
      .db-scanner-corner.top-right { top: -2px; right: -2px; border-top-width: 4px; border-right-width: 4px; }
      .db-scanner-corner.bottom-left { bottom: -2px; left: -2px; border-bottom-width: 4px; border-left-width: 4px; }
      .db-scanner-corner.bottom-right { bottom: -2px; right: -2px; border-bottom-width: 4px; border-right-width: 4px; }
      
      .db-manual-entry {
        margin-top: 20px;
      }
      .db-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        margin-bottom: 12px;
      }
      .db-input:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
      }
      .db-btn {
        width: 100%;
        padding: 12px 24px;
        background: #4f46e5;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s;
      }
      .db-btn:hover { background: #4338ca; }
      .db-btn:disabled { background: #9ca3af; cursor: not-allowed; }
      
      /* Mode 1: AI Info */
      .db-ai-info {}
      .db-status-card {
        text-align: center;
        padding: 24px;
        background: #f9fafb;
        border-radius: 12px;
        margin-bottom: 20px;
      }
      .db-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 1.25rem;
      }
      .db-confidence {
        margin-top: 8px;
        color: #6b7280;
        font-size: 0.875rem;
      }
      .db-section {
        margin-bottom: 20px;
      }
      .db-section h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #374151;
        margin-bottom: 12px;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .db-scene-text {
        color: #1f2937;
        line-height: 1.6;
        padding: 16px;
        background: #f3f4f6;
        border-radius: 8px;
      }
      .db-objects-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .db-object-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 8px;
      }
      .db-object-icon { font-size: 1.25rem; }
      .db-object-name { flex: 1; font-weight: 500; }
      .db-object-state { color: #6b7280; font-size: 0.875rem; }
      .db-object-confidence { color: #4f46e5; font-weight: 600; }
      .db-temporal {
        padding: 16px;
        background: #fef3c7;
        border-radius: 8px;
        margin-bottom: 20px;
      }
      .db-temporal-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #92400e;
      }
      .db-footer {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #9ca3af;
        margin-bottom: 20px;
      }
      
      /* Mode 2: Snapshots */
      .db-snapshots {}
      .db-snapshots-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .db-snapshots-header h4 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .db-btn-request {
        padding: 8px 16px;
        background: #4f46e5;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.875rem;
      }
      .db-btn-request:hover { background: #4338ca; }
      .db-snapshots-current {
        margin-bottom: 20px;
      }
      .db-snapshot-main {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        background: #1f2937;
      }
      .db-snapshot-img {
        width: 100%;
        display: block;
      }
      .db-snapshot-overlay {
        position: absolute;
        top: 12px;
        left: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.875rem;
      }
      .db-snapshot-time {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(0,0,0,0.6);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
      }
      .db-snapshot-analysis {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
        color: white;
        padding: 40px 16px 16px;
        font-size: 0.875rem;
      }
      .db-snapshot-analysis p { margin: 0 0 4px 0; }
      .db-snapshot-analysis small { opacity: 0.8; }
      .db-snapshot-download {
        position: absolute;
        bottom: 12px;
        right: 12px;
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.9);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .db-snapshot-download:hover { background: white; }
      .db-no-snapshot {
        text-align: center;
        padding: 40px;
        color: #9ca3af;
      }
      .db-no-snapshot i { font-size: 3rem; margin-bottom: 12px; display: block; }
      .db-snapshots-list-container h5 {
        margin: 0 0 12px 0;
        color: #6b7280;
        font-size: 0.875rem;
      }
      .db-snapshots-list {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }
      .db-snapshot-thumb {
        position: relative;
        aspect-ratio: 4/3;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
      }
      .db-snapshot-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .db-snapshot-thumb-overlay {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.5rem;
      }
      .db-snapshot-thumb-time {
        position: absolute;
        bottom: 4px;
        left: 4px;
        font-size: 0.625rem;
        color: white;
        background: rgba(0,0,0,0.6);
        padding: 2px 4px;
        border-radius: 2px;
      }
      .db-no-history {
        grid-column: 1 / -1;
        text-align: center;
        color: #9ca3af;
        padding: 20px;
      }
      .db-prune-notice {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
        padding: 12px;
        background: #dbeafe;
        color: #1e40af;
        border-radius: 8px;
        font-size: 0.875rem;
      }
      .db-prune-notice.hidden { display: none; }
      
      /* Mode 3: Live Video */
      .db-video {}
      .db-video-container {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        background: #1f2937;
        margin-bottom: 16px;
      }
      .db-video-container video {
        width: 100%;
        display: block;
      }
      .db-video-overlay {
        position: absolute;
        top: 12px;
        left: 12px;
      }
      .db-video-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.875rem;
      }
      .db-video-controls {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        padding: 8px;
        background: rgba(0,0,0,0.6);
        border-radius: 12px;
      }
      .db-video-btn {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .db-video-btn:hover { background: rgba(255,255,255,0.3); }
      .db-video-btn-stop { background: #dc2626; }
      .db-video-btn-stop:hover { background: #b91c1c; }
      .db-video-loading {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: white;
        background: #1f2937;
      }
      .db-video-loading.hidden { display: none; }
      .db-video-info {
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .db-video-scene {
        color: #1f2937;
        margin-bottom: 8px;
      }
      .db-video-objects {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .db-video-object-tag {
        padding: 4px 8px;
        background: #e5e7eb;
        border-radius: 4px;
        font-size: 0.875rem;
      }
      
      /* Mode Buttons */
      .db-mode-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 20px;
      }
      .db-mode-btn {
        padding: 12px;
        background: #f3f4f6;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 0.875rem;
        transition: all 0.2s;
      }
      .db-mode-btn:hover {
        border-color: #4f46e5;
        background: #f5f3ff;
      }
      
      /* Quality Banner */
      .db-quality-banner {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #fef3c7;
        color: #92400e;
        padding: 12px 24px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        z-index: 10001;
        animation: db-slide-down 0.3s ease;
      }
      @keyframes db-slide-down {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      .db-quality-banner button {
        padding: 6px 12px;
        background: #92400e;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
      }
      .db-quality-banner button:hover { background: #78350f; }
      
      /* Error Toast */
      .db-error-toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #dc2626;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10001;
        animation: db-slide-up 0.3s ease;
      }
      @keyframes db-slide-up {
        from { transform: translateX(-50%) translateY(100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      
      /* FAB Button */
      .db-fab {
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #4f46e5;
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        z-index: 9999;
        transition: all 0.2s;
      }
      .db-fab:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.5);
      }
      .db-fab.connected { background: #10b981; }
      .db-fab.disconnected { background: #6b7280; }
      .db-fab.hidden { display: none; }
      
      /* Hidden utility */
      .hidden { display: none !important; }
      
      /* Responsive */
      @media (max-width: 640px) {
        .db-modal-overlay { padding: 10px; }
        .db-modal { max-height: 95vh; }
        .db-modal-body { padding: 16px; }
        .db-fab { bottom: 80px; right: 16px; }
      }
    `;
    document.head.appendChild(styles);
  }


  _injectHTML() {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'db-modal';
    modal.className = 'db-modal-overlay hidden';
    modal.innerHTML = `
      <div class="db-modal">
        <div class="db-modal-header">
          <h3><i class="fas fa-link"></i> Device Pairing</h3>
          <button class="db-modal-close" id="db-modal-close">&times;</button>
        </div>
        <div class="db-modal-body">
          <!-- Selection View -->
          <div id="db-selection-view" class="db-selection-grid">
            <div class="db-selection-card" id="db-select-host">
              <i class="fas fa-video"></i>
              <h4>This is the Camera</h4>
              <p>Show QR code for viewer to scan</p>
            </div>
            <div class="db-selection-card" id="db-select-viewer">
              <i class="fas fa-mobile-alt"></i>
              <h4>This is the Viewer</h4>
              <p>Scan QR code or enter connection code</p>
            </div>
          </div>
          
          <!-- Host QR View -->
          <div id="db-host-view" class="db-qr-section hidden">
            <p>Scan this QR code with your other device:</p>
            <div class="db-qr-container">
              <div id="db-qr-code" class="db-qr-code"></div>
            </div>
            <p class="db-qr-instructions">Open SpotKin on the other device and select "This is the Viewer"</p>
            <div class="db-qr-manual" id="db-qr-manual"></div>
          </div>
          
          <!-- Viewer Scanner View -->
          <div id="db-viewer-view" class="db-scanner-section hidden">
            <div class="db-scanner-video-container" id="db-scanner-container">
              <video id="db-scanner-video" class="db-scanner-video" autoplay playsinline></video>
              <div class="db-scanner-overlay">
                <div class="db-scanner-corner top-left"></div>
                <div class="db-scanner-corner top-right"></div>
                <div class="db-scanner-corner bottom-left"></div>
                <div class="db-scanner-corner bottom-right"></div>
              </div>
            </div>
            <div class="db-manual-entry">
              <p style="color: #6b7280; margin-bottom: 12px;">Or enter connection code manually:</p>
              <input type="text" class="db-input" id="db-peer-id-input" placeholder="Peer ID">
              <input type="text" class="db-input" id="db-token-input" placeholder="Token">
              <button class="db-btn" id="db-btn-connect">Connect</button>
            </div>
          </div>
          
          <!-- Connected Views -->
          <div id="db-connected-view" class="hidden">
            ${this.aiInfoUI?.render() || ''}
            ${this.snapshotsUI?.render() || ''}
            ${this.liveVideoUI?.render() || ''}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this._modal = modal;
    
    // Create FAB button
    const fab = document.createElement('button');
    fab.id = 'db-fab';
    fab.className = 'db-fab hidden';
    fab.innerHTML = '<i class="fas fa-link"></i>';
    fab.title = 'Device Pairing';
    document.body.appendChild(fab);
    this._fabButton = fab;
    
    // Inject the actual content containers after they're created
    setTimeout(() => {
      const connectedView = document.getElementById('db-connected-view');
      if (connectedView) {
        connectedView.innerHTML = `
          <div id="db-ai-info-container">${new AIInfoUI().render()}</div>
          <div id="db-snapshots-container">${new SnapshotsUI().render()}</div>
          <div id="db-video-container">${new LiveVideoUI().render()}</div>
        `;
      }
    }, 0);
  }

  _attachListeners() {
    // Modal close
    document.getElementById('db-modal-close')?.addEventListener('click', () => {
      this.hideModal();
    });
    
    // Click outside to close
    this._modal?.addEventListener('click', (e) => {
      if (e.target === this._modal) this.hideModal();
    });
    
    // FAB button
    this._fabButton?.addEventListener('click', () => {
      this.showModal();
    });
    
    // Selection cards
    document.getElementById('db-select-host')?.addEventListener('click', () => {
      this._startHostFlow();
    });
    
    document.getElementById('db-select-viewer')?.addEventListener('click', () => {
      this._startViewerFlow();
    });
    
    // Manual connect button
    document.getElementById('db-btn-connect')?.addEventListener('click', () => {
      const peerId = document.getElementById('db-peer-id-input')?.value?.trim();
      const token = document.getElementById('db-token-input')?.value?.trim();
      if (peerId && token) {
        this._connectAsViewer(peerId, token);
      }
    });
    
    // Mode switch buttons (delegate to container)
    this._modal?.addEventListener('click', (e) => {
      const btn = e.target.closest('.db-mode-btn');
      if (!btn) return;
      
      if (btn.id === 'db-btn-snapshots') this.switchMode('mode2_snapshots');
      else if (btn.id === 'db-btn-live') this.switchMode('mode3_live_video');
      else if (btn.id === 'db-btn-ai-info-from-snap') this.switchMode('mode1_ai_info');
      else if (btn.id === 'db-btn-live-from-snap') this.switchMode('mode3_live_video');
      else if (btn.id === 'db-btn-ai-info-from-video') this.switchMode('mode1_ai_info');
      else if (btn.id === 'db-btn-snapshots-from-video') this.switchMode('mode2_snapshots');
    });
  }

  async _startHostFlow() {
    this.isHost = true;
    document.getElementById('db-selection-view')?.classList.add('hidden');
    document.getElementById('db-host-view')?.classList.remove('hidden');
    
    try {
      const videoEl = document.getElementById('camera');
      const { peerId, token } = await this.bridge.createHostSession('db-qr-code', videoEl);
      
      // Show manual connection info
      const manualEl = document.getElementById('db-qr-manual');
      if (manualEl) {
        manualEl.innerHTML = `
          <strong>Peer ID:</strong> ${peerId}<br>
          <strong>Token:</strong> ${token}
        `;
      }
      
      // Show FAB
      this._fabButton?.classList.remove('hidden');
      
      // Switch to connected view when a viewer connects
      const checkConnected = setInterval(() => {
        if (this.bridge.isConnected()) {
          clearInterval(checkConnected);
          this._showConnectedView();
          this.switchMode('mode1_ai_info');
        }
      }, 500);
      
    } catch (err) {
      console.error('Failed to create host session:', err);
      this._showError('Failed to create session. Please try again.');
    }
  }

  async _startViewerFlow() {
    this.isHost = false;
    document.getElementById('db-selection-view')?.classList.add('hidden');
    document.getElementById('db-viewer-view')?.classList.remove('hidden');
    
    // Request notification permission
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    
    // Start QR scanning
    this._startQRScanner();
  }

  async _startQRScanner() {
    const video = document.getElementById('db-scanner-video');
    if (!video) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      video.srcObject = stream;
      
      const qrManager = new DBQRManager();
      let scanning = true;
      
      const scanLoop = () => {
        if (!scanning) return;
        
        const result = qrManager.scanFrame(video);
        if (result) {
          scanning = false;
          stream.getTracks().forEach(t => t.stop());
          this._connectAsViewer(result.peerId, result.token);
          return;
        }
        
        requestAnimationFrame(scanLoop);
      };
      
      video.addEventListener('loadedmetadata', () => {
        scanLoop();
      });
      
    } catch (err) {
      console.error('Camera access error:', err);
      // User can still use manual entry
    }
  }

  async _connectAsViewer(peerId, token) {
    try {
      this.sessionId = peerId;
      await this.bridge.joinSession(peerId, token);
      
      // Initialize history store
      this.historyStore = new DBHistoryStore();
      await this.historyStore.init();
      await this.historyStore.clearOld();
      
      // Load existing history
      const history = await this.historyStore.getAll(this.sessionId);
      history.forEach(snap => {
        this.snapshotsUI.addSnapshot(snap, snap.dataUrl);
      });
      
      this._showConnectedView();
      this.switchMode('mode1_ai_info');
      this._fabButton?.classList.remove('hidden');
      
    } catch (err) {
      console.error('Failed to join session:', err);
      this._showError('Failed to connect. Please check the code and try again.');
    }
  }

  _showConnectedView() {
    document.getElementById('db-host-view')?.classList.add('hidden');
    document.getElementById('db-viewer-view')?.classList.add('hidden');
    document.getElementById('db-selection-view')?.classList.add('hidden');
    document.getElementById('db-connected-view')?.classList.remove('hidden');
    
    // Re-attach listeners for the new content
    this.aiInfoUI = new AIInfoUI('db-ai-info-container');
    this.snapshotsUI = new SnapshotsUI('db-snapshots-container');
    this.liveVideoUI = new LiveVideoUI('db-video-container');
    
    this.snapshotsUI.onRequestSnapshot = () => this.bridge.requestSnapshot();
    this.liveVideoUI.onTogglePause = () => this.switchMode('mode2_snapshots');
    
    this.snapshotsUI.attachListeners();
    this.liveVideoUI.attachListeners();
  }

  switchMode(mode) {
    this.aiInfoUI?.hide();
    this.snapshotsUI?.hide();
    this.liveVideoUI?.hide();
    
    if (mode === 'mode1_ai_info') {
      this.aiInfoUI?.show();
    } else if (mode === 'mode2_snapshots') {
      this.snapshotsUI?.show();
    } else if (mode === 'mode3_live_video') {
      this.liveVideoUI?.show();
      
      // Start video stream on viewer
      if (!this.isHost && !this.bridge.isStreaming()) {
        this.liveVideoUI.showLoading();
        this.bridge.startVideoStream((stream) => {
          this.liveVideoUI.attachStream(stream);
          this.liveVideoUI.hideLoading();
        });
      }
    }
    
    this.currentMode = mode;
    this.bridge.requestModeChange(mode);
  }

  _updateFabStatus(status) {
    if (!this._fabButton) return;
    this._fabButton.classList.remove('connected', 'disconnected');
    this._fabButton.classList.add(status);
  }

  _showQualityBanner(quality) {
    // Remove existing banner
    document.getElementById('db-quality-banner')?.remove();
    
    const banner = document.createElement('div');
    banner.id = 'db-quality-banner';
    banner.className = 'db-quality-banner';
    banner.innerHTML = `
      <i class="fas fa-wifi"></i>
      <span>Connection is ${quality.label} (${Math.round(quality.avgRtt)}ms). 
            ${quality.recommendedMode === 'mode1_ai_info' ? 'Text-only mode recommended.' : 
              quality.recommendedMode === 'mode2_snapshots' ? 'Snapshot mode recommended.' : ''}</span>
      <button id="db-quality-action">Switch</button>
    `;
    
    document.body.appendChild(banner);
    
    document.getElementById('db-quality-action')?.addEventListener('click', () => {
      this.switchMode(quality.recommendedMode);
      banner.remove();
    });
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => banner.remove(), 10000);
  }

  _showError(message) {
    const existing = document.getElementById('db-error-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'db-error-toast';
    toast.className = 'db-error-toast';
    toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 5000);
  }

  _triggerDangerNotification(data) {
    // Vibrate
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
    
    // System notification
    if (Notification.permission === 'granted') {
      new Notification('⚠️ SpotKin Alert', {
        body: data.alert?.message || 'Danger detected!',
        icon: './images/favicon.png',
        tag: 'spotkin-bridge-alert',
        renotify: true
      });
    }
    
    // Audio alert
    if (typeof window.playAlertSound === 'function') {
      window.playAlertSound('danger');
    }
  }

  showModal() {
    this._modal?.classList.remove('hidden');
  }

  hideModal() {
    this._modal?.classList.add('hidden');
  }

  showFab() {
    this._fabButton?.classList.remove('hidden');
  }

  hideFab() {
    this._fabButton?.classList.add('hidden');
  }

  destroy() {
    this.aiInfoUI?.destroy();
    this.liveVideoUI?.destroy();
    this._modal?.remove();
    this._fabButton?.remove();
    document.getElementById('db-styles')?.remove();
  }
}

// ============================================================
// UMD EXPORT
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AIInfoUI,
        SnapshotsUI,
        LiveVideoUI,
        DeviceBridgeUIController,
        DB_STATUS_STYLES
    };
} else if (typeof window !== 'undefined') {
    window.AIInfoUI = AIInfoUI;
    window.SnapshotsUI = SnapshotsUI;
    window.LiveVideoUI = LiveVideoUI;
    window.DeviceBridgeUIController = DeviceBridgeUIController;
    window.DB_STATUS_STYLES = DB_STATUS_STYLES;
}
