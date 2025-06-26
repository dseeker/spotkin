# SpotKin Technical Architecture

This document outlines the technical architecture for the SpotKin application, providing guidance on code organization, data flow, and implementation patterns.

## System Overview

SpotKin is a web-based application that uses computer vision and AI to monitor scenes for pets, babies, and relevant activity. The application leverages modern browser capabilities including:

- WebRTC for camera access
- Canvas API for image capture and processing
- Local Storage for persistent data
- Puter.js AI API for scene analysis
- Web Audio API for alerts

## Architecture Principles

1. **Modularity**: Components should be loosely coupled and independently maintainable
2. **Progressive Enhancement**: Core functionality works without advanced features
3. **Privacy by Design**: Data should be processed locally when possible
4. **Performance Optimization**: Efficient resource usage for long monitoring sessions
5. **Error Resilience**: Graceful handling of unexpected conditions

## High-Level Architecture

```
┌───────────────────────────────────────┐
│              User Interface           │
├───────┬───────────────┬───────────────┤
│ Camera│  Analysis     │ History &     │
│ Module│  Module       │ Timeline      │
├───────┴───────┬───────┴───────────────┤
│     Core Services & Utilities         │
├─────────┬─────┴──────┬────────────────┤
│ Storage │ AI Service │ Alert Service  │
└─────────┴────────────┴────────────────┘
```

## Module Descriptions

### UI Layer

#### Camera Module
Handles video capture, device selection, and snapshot functionality.

**Key Components:**
- Camera initialization and permission handling
- Device switching (front/rear cameras)
- Frame capture and canvas management
- Monitoring loop management

#### Analysis Module
Displays and interprets AI analysis results.

**Key Components:**
- Scene description presentation
- Object detection visualization
- Alert status indicators
- Confidence level visualization

#### History & Timeline Module
Manages historical events and provides timeline visualization.

**Key Components:**
- Timeline rendering
- Event filtering and grouping
- History navigation
- Data export

### Core Services

#### Storage Service
Handles persistent storage of application data.

**Key Components:**
- History data persistence
- User preferences storage
- Cache management
- Data export/import capabilities

#### AI Service
Interfaces with Puter.js for AI analysis.

**Key Components:**
- AI prompt management
- Image preparation for analysis
- Response parsing and interpretation
- Multi-frame analysis coordination

#### Alert Service
Manages notification and alert functionality.

**Key Components:**
- Alert classification
- Sound generation
- Browser notifications
- Alert filtering and throttling

## Data Flow

### Camera Capture Flow
1. User grants camera permissions
2. Video stream is initialized and displayed
3. Capture is triggered (manually or on schedule)
4. Frame is captured to canvas
5. Canvas data is converted to image format
6. Image is passed to AI Service for analysis

### Analysis Flow
1. AI Service receives image data
2. Puter.js API is called with optimized prompt
3. Response is parsed and structured
4. Analysis results are passed to UI for display
5. Events are added to history
6. Alerts are triggered based on analysis results

### Alert Flow
1. Analysis results are evaluated for alert conditions
2. Alert level is determined (info, warning, danger)
3. Appropriate notification is generated
4. Sound is played based on alert level (if enabled)
5. Alert is added to history
6. UI is updated to reflect alert status

## Code Organization

```
/
├── index.html              # Main application entry point
├── app.js                  # Application initialization
├── styles.css              # Global styles
├── modules/                # Module-specific code
│   ├── camera.js           # Camera handling
│   ├── analysis.js         # Analysis functionality
│   ├── timeline.js         # Timeline and history
│   └── settings.js         # User preferences
├── services/               # Core services
│   ├── ai-service.js       # AI integration
│   ├── storage-service.js  # Persistent storage
│   └── alert-service.js    # Notification system
├── utils/                  # Utilities and helpers
│   ├── logger.js           # Logging functionality
│   ├── error-handler.js    # Global error handling
│   └── helpers.js          # Common utility functions
└── assets/                 # Static assets
    ├── images/             # Images and icons
    └── sounds/             # Alert sounds
```

## Detailed Component Specifications

### Camera Module (modules/camera.js)

```javascript
/**
 * Camera Module
 * Handles video capture, device switching, and monitoring loop
 */
const CameraModule = (function() {
    // Private variables
    let currentStream = null;
    let facingMode = 'environment';
    let canvas = null;
    let monitoringInterval = null;
    let isMonitoring = false;
    
    // Events
    const events = {
        FRAME_CAPTURED: 'camera:frameCaptured',
        ERROR: 'camera:error',
        STARTED: 'camera:started',
        STOPPED: 'camera:stopped'
    };
    
    // Initialize camera
    async function init(videoElement, canvasElement) {
        // Implementation
    }
    
    // Switch camera
    async function switchCamera() {
        // Implementation
    }
    
    // Capture frame
    function captureFrame() {
        // Implementation
    }
    
    // Start monitoring
    function startMonitoring(intervalMs) {
        // Implementation
    }
    
    // Stop monitoring
    function stopMonitoring() {
        // Implementation
    }
    
    // Public API
    return {
        init,
        switchCamera,
        captureFrame,
        startMonitoring,
        stopMonitoring,
        events
    };
})();
```

### AI Service (services/ai-service.js)

```javascript
/**
 * AI Service
 * Handles interaction with Puter.js AI API and manages AI analysis
 */
const AIService = (function() {
    // Private variables
    let frameBuffer = [];
    const MAX_BUFFER_SIZE = 5;
    
    // Events
    const events = {
        ANALYSIS_COMPLETE: 'ai:analysisComplete',
        ANALYSIS_ERROR: 'ai:analysisError'
    };
    
    // Initialize service
    function init(options = {}) {
        // Implementation
    }
    
    // Process image with AI
    async function processImage(imageData) {
        // Implementation
    }
    
    // Generate AI prompt
    function generatePrompt(context = {}) {
        // Implementation
    }
    
    // Parse AI response
    function parseResponse(responseText) {
        // Implementation
    }
    
    // Add frame to buffer for multi-frame analysis
    function addFrameToBuffer(frameData) {
        // Implementation
    }
    
    // Perform multi-frame analysis
    function analyzeFrameSequence() {
        // Implementation
    }
    
    // Public API
    return {
        init,
        processImage,
        addFrameToBuffer,
        analyzeFrameSequence,
        events
    };
})();
```

### Storage Service (services/storage-service.js)

```javascript
/**
 * Storage Service
 * Handles local storage operations for history and settings
 */
const StorageService = (function() {
    // Private variables
    const HISTORY_KEY = 'spotkin_history';
    const SETTINGS_KEY = 'spotkin_settings';
    const MAX_HISTORY_ITEMS = 100;
    
    // Events
    const events = {
        HISTORY_UPDATED: 'storage:historyUpdated',
        SETTINGS_UPDATED: 'storage:settingsUpdated',
        STORAGE_ERROR: 'storage:error'
    };
    
    // Initialize storage
    function init() {
        // Implementation
    }
    
    // Save history item
    function addHistoryItem(item) {
        // Implementation
    }
    
    // Get all history
    function getHistory() {
        // Implementation
    }
    
    // Clear history
    function clearHistory() {
        // Implementation
    }
    
    // Save settings
    function saveSettings(settings) {
        // Implementation
    }
    
    // Get settings
    function getSettings() {
        // Implementation
    }
    
    // Public API
    return {
        init,
        addHistoryItem,
        getHistory,
        clearHistory,
        saveSettings,
        getSettings,
        events
    };
})();
```

### Alert Service (services/alert-service.js)

```javascript
/**
 * Alert Service
 * Handles notifications and audio alerts
 */
const AlertService = (function() {
    // Private variables
    let audioContext = null;
    let alertSettings = {
        soundEnabled: true,
        notificationsEnabled: false,
        alertLevels: {
            info: true,
            warning: true,
            danger: true
        }
    };
    
    // Events
    const events = {
        ALERT_TRIGGERED: 'alert:triggered'
    };
    
    // Initialize service
    function init(settings = {}) {
        // Implementation
    }
    
    // Trigger an alert
    function triggerAlert(type, message, data = {}) {
        // Implementation
    }
    
    // Play alert sound
    function playSound(type) {
        // Implementation
    }
    
    // Show browser notification
    function showNotification(title, options = {}) {
        // Implementation
    }
    
    // Update alert settings
    function updateSettings(newSettings) {
        // Implementation
    }
    
    // Public API
    return {
        init,
        triggerAlert,
        updateSettings,
        events
    };
})();
```

## Event Bus Implementation

To facilitate communication between modules while maintaining loose coupling, we implement a simple event bus:

```javascript
/**
 * Event Bus
 * Central event management system for cross-module communication
 */
const EventBus = (function() {
    // Event handlers storage
    const handlers = {};
    
    // Subscribe to event
    function subscribe(event, handler) {
        if (!handlers[event]) {
            handlers[event] = [];
        }
        handlers[event].push(handler);
        return () => unsubscribe(event, handler);
    }
    
    // Unsubscribe from event
    function unsubscribe(event, handler) {
        if (!handlers[event]) return;
        handlers[event] = handlers[event].filter(h => h !== handler);
    }
    
    // Publish event
    function publish(event, data) {
        if (!handlers[event]) return;
        handlers[event].forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }
    
    // Public API
    return {
        subscribe,
        unsubscribe,
        publish
    };
})();
```

## Error Handling Strategy

A comprehensive error handling strategy ensures application stability:

```javascript
/**
 * Error Handler
 * Global error handling and reporting
 */
const ErrorHandler = (function() {
    // Error levels
    const LEVELS = {
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error',
        CRITICAL: 'critical'
    };
    
    // Initialize error handling
    function init() {
        // Global error handler
        window.onerror = function(message, source, lineno, colno, error) {
            handleError(error || new Error(message), LEVELS.ERROR);
            return true;
        };
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', function(event) {
            handleError(event.reason, LEVELS.ERROR);
        });
    }
    
    // Handle errors
    function handleError(error, level = LEVELS.ERROR) {
        // Log error
        logError(error, level);
        
        // Display user-friendly message if needed
        if (level === LEVELS.ERROR || level === LEVELS.CRITICAL) {
            displayErrorMessage(error, level);
        }
        
        // Report error if critical
        if (level === LEVELS.CRITICAL) {
            reportError(error);
        }
    }
    
    // Log error
    function logError(error, level) {
        // Implementation
    }
    
    // Display error to user
    function displayErrorMessage(error, level) {
        // Implementation
    }
    
    // Report error to monitoring system (future)
    function reportError(error) {
        // Implementation
    }
    
    // Public API
    return {
        init,
        handleError,
        LEVELS
    };
})();
```

## Multi-Frame Analysis Implementation

A key feature of SpotKin is the ability to analyze multiple frames for better context understanding:

```javascript
/**
 * Multi-Frame Analyzer
 * Performs temporal analysis across multiple frames
 */
const MultiFrameAnalyzer = (function() {
    // Frame buffer
    let frames = [];
    const MAX_FRAMES = 5;
    
    // Add frame to buffer
    function addFrame(frame) {
        frames.push(frame);
        if (frames.length > MAX_FRAMES) {
            frames.shift();
        }
    }
    
    // Analyze frame sequence
    function analyzeSequence() {
        if (frames.length < 2) {
            return null; // Not enough frames for sequence analysis
        }
        
        // Detect temporal patterns
        const patterns = detectPatterns();
        
        // Identify state changes
        const stateChanges = identifyStateChanges();
        
        // Calculate confidence scores
        const confidenceScores = calculateConfidence();
        
        return {
            patterns,
            stateChanges,
            confidenceScores,
            frameCount: frames.length
        };
    }
    
    // Detect patterns across frames
    function detectPatterns() {
        // Implementation
    }
    
    // Identify state changes
    function identifyStateChanges() {
        // Implementation
    }
    
    // Calculate confidence scores
    function calculateConfidence() {
        // Implementation
    }
    
    // Clear frame buffer
    function clearFrames() {
        frames = [];
    }
    
    // Public API
    return {
        addFrame,
        analyzeSequence,
        clearFrames
    };
})();
```

## Performance Optimization Strategies

To ensure efficient operation, especially during long monitoring sessions:

### Resource Management

```javascript
/**
 * Resource Manager
 * Optimizes resource usage during monitoring
 */
const ResourceManager = (function() {
    // Resource usage limits
    const limits = {
        maxImageSize: 1280, // Max dimension for analysis
        maxHistorySize: 100, // Max history items
        maxFrameRate: 0.2, // Frames per second (5s interval)
        inactivityTimeout: 30 * 60 * 1000 // 30 minutes
    };
    
    // Track resource usage
    let metrics = {
        memoryUsage: 0,
        processingTime: 0,
        batteryLevel: 100,
        isLowPowerMode: false
    };
    
    // Initialize monitoring
    function init() {
        // Implementation
    }
    
    // Optimize image for processing
    function optimizeImage(imageData) {
        // Implementation
    }
    
    // Adjust monitoring parameters based on conditions
    function adjustMonitoringParams() {
        // Implementation
    }
    
    // Handle device state changes
    function handleDeviceStateChange(state) {
        // Implementation
    }
    
    // Public API
    return {
        init,
        optimizeImage,
        adjustMonitoringParams,
        limits
    };
})();
```

## Security Considerations

### Data Protection

```javascript
/**
 * Security Service
 * Handles secure data storage and permissions
 */
const SecurityService = (function() {
    // Initialize
    function init() {
        // Implementation
    }
    
    // Request necessary permissions
    async function requestPermissions() {
        // Implementation
    }
    
    // Secure data before storage
    function secureData(data) {
        // Implementation
    }
    
    // Validate and sanitize data
    function validateData(data, schema) {
        // Implementation
    }
    
    // Public API
    return {
        init,
        requestPermissions,
        secureData,
        validateData
    };
})();
```

## Application Initialization Flow

```javascript
/**
 * Application main entry point
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize error handling first
        ErrorHandler.init();
        
        // Initialize core services
        await StorageService.init();
        await AIService.init();
        AlertService.init();
        
        // Initialize UI modules
        const videoElement = document.getElementById('camera');
        const canvasElement = document.createElement('canvas');
        await CameraModule.init(videoElement, canvasElement);
        
        // Subscribe to events
        EventBus.subscribe(CameraModule.events.FRAME_CAPTURED, (imageData) => {
            AIService.processImage(imageData);
        });
        
        EventBus.subscribe(AIService.events.ANALYSIS_COMPLETE, (results) => {
            // Update UI
            // Add to history
            StorageService.addHistoryItem(results);
            
            // Check for alerts
            if (results.alert && results.alert.type !== 'info') {
                AlertService.triggerAlert(
                    results.alert.type,
                    results.alert.message,
                    results
                );
            }
        });
        
        // Initialize remaining UI
        initializeUI();
        
        console.log('SpotKin application initialized successfully');
    } catch (error) {
        ErrorHandler.handleError(error, ErrorHandler.LEVELS.CRITICAL);
        console.error('Failed to initialize application:', error);
    }
});
```

## Testing Strategy

### Unit Testing

Each module should have comprehensive unit tests covering:

- Core functionality
- Edge cases
- Error handling

### Integration Testing

Integration tests should focus on:

- Module interactions
- Data flow between components
- Event handling

### End-to-End Testing

E2E tests should validate:

- Complete user journeys
- Camera integration
- AI analysis pipeline
- Alert system

## Deployment Strategy

### Development Environment

- Local development server
- Mock AI service for testing
- Debug logging enabled

### Staging Environment

- Web-hosted with restricted access
- Integration with production AI services
- Performance monitoring

### Production Environment

- CDN-deployed static assets
- Optimized bundle sizes
- Error monitoring and reporting
- Analytics integration

## Future Technical Considerations

### Mobile App Development

When expanding to native mobile apps:

- Use React Native for code sharing
- Implement native camera access for better performance
- Develop offline-first capabilities

### Backend Service Integration

For future cloud features:

- Develop API gateway for authentication
- Implement secure sync protocol
- Create user management system

### Smart Home Integration

For IoT and smart home features:

- Research WebRTC for device-to-device communication
- Develop integration SDKs for major platforms
- Create standardized API for third-party integration

## Conclusion

This technical architecture provides a foundation for building the SpotKin application with modularity, performance, and security in mind. By following these patterns and practices, we can create a robust system that meets the needs of our users while maintaining flexibility for future growth.
