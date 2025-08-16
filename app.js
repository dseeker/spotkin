// Global Error Handling
console.log('🚀 SpotKin Application Initializing');

// ENHANCED ERROR HANDLING SYSTEM
class ErrorManager {
    constructor() {
        this.errorCount = 0;
        this.errorHistory = [];
        this.maxErrorHistory = 10;
        this.userNotificationThreshold = 3; // Show user-friendly message after 3 errors
        
        this.setupGlobalHandlers();
    }
    
    setupGlobalHandlers() {
        // Enhanced global error handler
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError({
                type: 'javascript',
                message,
                source,
                lineno,
                colno,
                error: error ? error.toString() : null,
                timestamp: new Date().toISOString()
            });
            return false;
        };

        // Enhanced promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise_rejection',
                message: event.reason?.message || 'Unhandled Promise Rejection',
                reason: event.reason,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    handleError(errorInfo) {
        console.error('🚨 Enhanced Error Handler:', errorInfo);
        
        this.errorCount++;
        this.errorHistory.unshift(errorInfo);
        
        // Keep error history manageable
        if (this.errorHistory.length > this.maxErrorHistory) {
            this.errorHistory.pop();
        }
        
        // Show user notification if errors are frequent
        if (this.errorCount >= this.userNotificationThreshold) {
            this.showUserErrorNotification(errorInfo);
        }
        
        // Auto-recovery suggestions
        this.suggestRecoveryActions(errorInfo);
    }
    
    showUserErrorNotification(errorInfo) {
        const errorContainer = this.createErrorNotificationElement(errorInfo);
        document.body.appendChild(errorContainer);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 10000);
    }
    
    createErrorNotificationElement(errorInfo) {
        const container = document.createElement('div');
        container.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 max-w-md';
        container.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex">
                    <i class="fas fa-exclamation-triangle mr-3 mt-1"></i>
                    <div>
                        <strong class="font-bold">Application Error Detected</strong>
                        <p class="text-sm mt-1">SpotKin has encountered multiple errors. Try refreshing the page or check your internet connection.</p>
                        <div class="mt-2">
                            <button onclick="location.reload()" class="text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded mr-2">
                                Refresh Page
                            </button>
                            <button onclick="this.closest('.fixed').remove()" class="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-red-400 hover:text-red-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        return container;
    }
    
    suggestRecoveryActions(errorInfo) {
        // Camera-related error recovery
        if (errorInfo.message && (errorInfo.message.includes('camera') || errorInfo.message.includes('video'))) {
            console.log('💡 Recovery Suggestion: Camera error detected. Try refreshing the page to reinitialize camera access.');
        }
        
        // AI service error recovery
        if (errorInfo.message && errorInfo.message.includes('AI')) {
            console.log('💡 Recovery Suggestion: AI service error. The system will automatically retry the request.');
        }
        
        // Storage error recovery
        if (errorInfo.message && errorInfo.message.includes('localStorage')) {
            console.log('💡 Recovery Suggestion: Storage error. Consider clearing browser data or freeing up space.');
        }
    }
    
    // Reset error count (useful after successful operations)
    resetErrorCount() {
        this.errorCount = 0;
        console.log('✅ Error count reset - system appears stable');
    }
    
    // Get error statistics
    getErrorStats() {
        return {
            totalErrors: this.errorCount,
            recentErrors: this.errorHistory.length,
            lastError: this.errorHistory[0] || null
        };
    }
}

// Initialize global error manager
const errorManager = new ErrorManager();
window.errorManager = errorManager; // Expose for testing

// Parse the AI response text into a structured format for our app
function parseAIResponse(responseText) {
    console.log("Parsing AI response text:", responseText);

    // Default result structure in case of parsing errors
    const defaultResult = {
        scene: "Could not parse AI response.",
        objects: [],
        alert: { type: "danger", message: "Error parsing AI response. Check console for details." },
        hasPetsOrBabies: false
    };

    try {
        // Clean the response text to ensure it's valid JSON
        // The AI might return a string wrapped in ```json ... ```
        const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const aiData = JSON.parse(jsonString);

        // Validate the structure of the parsed JSON
        if (!aiData.scene_description || !Array.isArray(aiData.subjects) || !aiData.safety_assessment) {
            console.error("Invalid AI response structure:", aiData);
            // For missing fields, still try to extract what we can
            const partialResult = {
                scene: aiData.scene_description || "Could not parse scene description.",
                objects: Array.isArray(aiData.subjects) ? aiData.subjects.map(subject => ({
                    type: subject.type || 'Unknown',
                    state: subject.state || 'Unspecified',
                    confidence: subject.confidence || 0.5
                })) : [],
                alert: { type: "danger", message: "Error parsing AI response. Check console for details." },
                hasPetsOrBabies: Array.isArray(aiData.subjects) && aiData.subjects.length > 0
            };
            return partialResult;
        }

        const result = {
            scene: aiData.scene_description,
            // Map the 'subjects' array to the 'objects' array format
            objects: aiData.subjects.map(subject => ({
                type: subject.type || 'Unknown',
                state: subject.state || 'Unspecified',
                confidence: subject.confidence || 0.5
            })),
            // Map the 'safety_assessment' to the 'alert' object format
            alert: {
                type: aiData.safety_assessment.level ? aiData.safety_assessment.level.toLowerCase() : 'info',
                message: aiData.safety_assessment.reason || 'No specific details provided.'
            },
            // Determine if pets or babies are present
            hasPetsOrBabies: aiData.subjects.length > 0
        };

        console.log("Parsed AI result:", result);
        return result;

    } catch (error) {
        console.error("Error during AI response parsing:", error);
        // Try to extract some information even if parsing fails
        defaultResult.scene = responseText;
        return defaultResult;
    }
}

// Analyze temporal changes between frames
function analyzeTemporalChanges(frameHistory) {
    if (frameHistory.length < 2) {
        return {
            hasMovement: false,
            movementLevel: 'none',
            temporalContext: 'Insufficient frame history for temporal analysis.'
        };
    }

    // Simple temporal analysis based on frame differences
    // In a more sophisticated implementation, you could use computer vision libraries
    // to detect actual movement, but for now we'll use frame size and timestamp differences
    
    const currentFrame = frameHistory[frameHistory.length - 1];
    const previousFrame = frameHistory[frameHistory.length - 2];
    
    // Calculate basic temporal metrics
    const frameDifference = Math.abs(currentFrame.length - previousFrame.length);
    // Get movement threshold from user preferences if available, otherwise use default
    const movementThreshold = (typeof window !== 'undefined' && window.getMovementThreshold) ? 
        window.getMovementThreshold() : 1000;
    const hasSignificantChange = frameDifference > movementThreshold;
    
    let movementLevel = 'none';
    let temporalContext = '';
    
    if (frameHistory.length >= 3) {
        const olderFrame = frameHistory[frameHistory.length - 3];
        const multiFrameDiff = Math.abs(currentFrame.length - olderFrame.length);
        
        if (hasSignificantChange || multiFrameDiff > 2000) {
            movementLevel = 'high';
            temporalContext = 'Significant changes detected across multiple frames, suggesting active movement or scene changes.';
        } else if (hasSignificantChange) {
            movementLevel = 'moderate';
            temporalContext = 'Some changes detected between recent frames, indicating possible movement.';
        } else {
            movementLevel = 'none';
            temporalContext = 'Scene appears stable across multiple frames with minimal changes.';
        }
    } else {
        if (hasSignificantChange) {
            movementLevel = 'moderate';
            temporalContext = 'Changes detected between current and previous frame.';
        } else {
            movementLevel = 'none';
            temporalContext = 'Scene appears stable between recent frames.';
        }
    }
    
    return {
        hasMovement: movementLevel !== 'none',
        movementLevel,
        temporalContext,
        frameCount: frameHistory.length
    };
}

// Enhanced function to create AI prompt with temporal context
function createEnhancedAIPrompt(temporalAnalysis) {
    // Get user preferences for sensitivity
    const sensitivityMultiplier = (typeof window !== 'undefined' && window.getSensitivityMultiplier) ? 
        window.getSensitivityMultiplier() : 1.0;
    
    // Determine sensitivity instructions based on user preference
    let sensitivityInstructions = '';
    if (sensitivityMultiplier < 1.0) {
        sensitivityInstructions = 'Use CONSERVATIVE detection - only flag clear, obvious hazards and subjects. Require high confidence levels (>0.8) for detections.';
    } else if (sensitivityMultiplier > 1.0) {
        sensitivityInstructions = 'Use SENSITIVE detection - flag potential hazards even if subtle. Accept moderate confidence levels (>0.6) for detections and err on the side of caution.';
    } else {
        sensitivityInstructions = 'Use BALANCED detection - flag clear hazards while avoiding false positives. Use standard confidence thresholds (>0.7).';
    }

    const basePrompt = `
**System Role**: You are an expert AI vision analyst for SpotKin, a critical safety monitoring application. Your analysis directly impacts the safety of babies and pets. You must provide precise, structured analysis with zero tolerance for false negatives in safety assessment.

**Temporal Context**: ${temporalAnalysis.temporalContext}
Movement Analysis: ${temporalAnalysis.movementLevel} movement detected.
${temporalAnalysis.hasMovement ? '⚠️ MOVEMENT DETECTED - Pay extra attention to dynamic hazards, rapid state changes, and subjects in motion.' : '✅ STABLE SCENE - Focus on static hazards, positioning safety, and environmental risks.'}

**Detection Sensitivity**: ${sensitivityInstructions}

**Critical Analysis Request**:
Analyze the provided image and return a valid JSON object with exactly these fields: 'scene_description', 'subjects', and 'safety_assessment'.

1. **'scene_description'**: One detailed sentence describing the scene, lighting, and context.
   • Include environmental details: lighting quality, room type, furniture/objects present
   • Note image quality issues if present (blurry, dark, obscured)
   • Example: "A well-lit nursery with a wooden crib, rocking chair, and soft toys scattered on a carpeted floor."

2. **'subjects'**: Array of detected babies/pets (empty array [] if none found).
   For each subject, provide:
   • 'type': EXACTLY one of: "Baby", "Toddler", "Dog", "Cat", "Bird", "Other Pet"
   • 'state': Current activity - be specific about safety-relevant behaviors
     - Good examples: "Sleeping peacefully", "Crawling toward stairs", "Chewing electrical cord", "Playing with safe toy"
     - Bad examples: "Active", "Moving", "Present"
   • 'confidence': Float 0.0-1.0 based on visual clarity and certainty

3. **'safety_assessment'**: Critical safety evaluation
   • 'level': EXACTLY one of: "Safe", "Warning", "Danger"
     - "Safe": No hazards visible, subjects secure and supervised environment
     - "Warning": Potential hazard requiring attention (unsecured objects, positioning concerns)
     - "Danger": Immediate risk requiring urgent intervention (active hazards, unsafe positions)
   • 'reason': Mandatory detailed explanation for ALL levels
     - Safe: "All subjects are in secure positions with no hazards visible in the monitoring area."
     - Warning: "Baby is crawling near an uncovered electrical outlet on the left wall."
     - Danger: "Cat is on a high windowsill with the window open, at immediate risk of falling."

**Enhanced Safety Focus Areas**:
• Proximity to stairs, windows, doors, or elevated surfaces
• Electrical outlets, cords, or electronic devices within reach
• Small objects that pose choking hazards
• Sharp furniture corners or edges
• Open containers of liquid or chemicals
• Unsecured furniture that could tip over
• Temperature hazards (heaters, fireplaces, hot surfaces)
• Pet-specific risks (toxic plants, small spaces where they could get stuck)
• Access to areas outside the intended monitoring zone

**Movement-Specific Instructions**:
${temporalAnalysis.hasMovement ? `
🔄 MOVEMENT DETECTED: 
• Identify what is moving (subject, objects, or environmental changes)
• Assess if movement indicates increased risk
• Note direction of movement relative to hazards
• Consider momentum and trajectory for safety assessment
• Flag erratic or distressed movement patterns immediately
` : `
📷 STABLE SCENE:
• Assess current positioning for static hazards
• Check for environmental risks in the subject's vicinity  
• Evaluate whether the current position is sustainable/safe over time
• Look for signs of distress even in stationary subjects
`}

**Critical Requirements**:
• MANDATORY: Return only valid JSON - no markdown, no explanations outside JSON
• MANDATORY: Never return empty 'reason' field - always provide specific explanation
• MANDATORY: If uncertain about safety, lean toward "Warning" rather than "Safe"
• MANDATORY: Consider age-appropriate hazards (babies vs toddlers have different risk profiles)
• MANDATORY: Account for pet behavior patterns and species-specific risks

**Response Format**:
Return ONLY the JSON object, exactly in this format:
{
    "scene_description": "Detailed one-sentence scene description",
    "subjects": [
        {
            "type": "Baby|Toddler|Dog|Cat|Bird|Other Pet",
            "state": "Specific activity/behavior description", 
            "confidence": 0.95
        }
    ],
    "safety_assessment": {
        "level": "Safe|Warning|Danger",
        "reason": "Detailed explanation of safety assessment"
    }
}`;
    
    return basePrompt;
}

// Expose parseAIResponse globally for testing
window.parseAIResponse = parseAIResponse;
window.analyzeTemporalChanges = analyzeTemporalChanges;
window.createEnhancedAIPrompt = createEnhancedAIPrompt;
// Placeholder for preferences functions (will be set after DOM loads)
window.getMovementThreshold = () => 1000;

// Main Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 DOM Content Loaded');
    
    // Initialize splash screen
    initializeSplashScreen();
    
    // Initialize share target functionality
    initializeShareTarget();

    try {
        // Validate Critical DOM Elements
        const criticalElements = [
            'camera', 'camera-feedback', 'take-snapshot', 'toggle-camera', 
            'results-container', 'results-placeholder', 'analysis-results',
            'ai-status'
        ];
        
        const missingElements = criticalElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            throw new Error(`Missing critical DOM elements: ${missingElements.join(', ')}`);
        }

        console.log('✅ All critical DOM elements verified');
    } catch (elementError) {
        console.error('Error during DOM element validation:', elementError);
        // Gracefully handle missing elements, maybe show a user-friendly error
        document.body.innerHTML = `
            <div class="error-container">
                <h1>Application Initialization Error</h1>
                <p>Some critical components are missing. Please refresh the page or contact support.</p>
            </div>
        `;
        return; // Stop further script execution
    }
    // DOM Elements
    const video = document.getElementById('camera');
    const cameraFeedback = document.getElementById('camera-feedback');
    const takeSnapshotBtn = document.getElementById('take-snapshot');
    const toggleCameraBtn = document.getElementById('toggle-camera');
    // Upload image button removed
    const resultsContainer = document.getElementById('results-container');
    const resultsPlaceholder = document.getElementById('results-placeholder');
    const analysisResults = document.getElementById('analysis-results');
    const sceneText = document.getElementById('scene-text');
    const detectionList = document.getElementById('detection-list');
    const safetyAssessmentDisplay = document.getElementById('safety-assessment-display');
    const safetyLevelText = document.getElementById('safety-level');
    const safetyReasonText = document.getElementById('safety-reason');
    const aiStatus = document.getElementById('ai-status');

    // Tab Elements
    const tabCurrent = document.getElementById('tab-current');
    const tabHistory = document.getElementById('tab-history');
    const currentTab = document.getElementById('current-tab');
    const historyTab = document.getElementById('history-tab');

    // Monitoring Elements
    const toggleMonitoringBtn = document.getElementById('toggle-monitoring');
    const monitoringStatusText = document.getElementById('monitoring-status-text');
    const refreshRateSelect = document.getElementById('refresh-rate');
    const historyEmptyMsg = document.getElementById('history-empty');
    const timelineContainer = document.getElementById('timeline-container');
    const timelineList = document.getElementById('timeline-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    // Camera State
    let currentStream = null;
    let facingMode = 'environment'; // Start with rear camera
    let canvas = document.createElement('canvas');
    let canvasContext = canvas.getContext('2d');
    let imageCapture = null;

    // Monitoring State
    let isMonitoring = false;
    let monitoringInterval = null;
    let historyData = [];
    const MAX_HISTORY_ITEMS = 50; // Maximum number of history items to store

    // New: Frame history for temporal analysis
    let frameHistory = [];
    const FRAME_HISTORY_SIZE = 3; // Store the last 3 frames
    
    // PERFORMANCE OPTIMIZATION: Debounce camera operations
    let isProcessingSnapshot = false;
    let debounceTimeout = null;

    // Initialize PWA capabilities
    initPWACapabilities();
    
    // Initialize the camera and check for Puter AI availability
    initCamera();
    checkPuterAIAvailability();
    loadHistoryFromLocalStorage();

    // Set up event listeners
    console.log('Setting up event listeners...'); // Added log
    takeSnapshotBtn.addEventListener('click', takeSnapshot);
    toggleCameraBtn.addEventListener('click', toggleCamera);
    // Event listeners updated to remove upload image functionality

    // Monitoring event listeners
    console.log('Setting up monitoring event listeners...'); // Added log
    toggleMonitoringBtn.addEventListener('click', toggleMonitoring);
    refreshRateSelect.addEventListener('change', updateMonitoringInterval);

    // Tab event listeners
    console.log('Setting up tab event listeners...'); // Added log
    tabCurrent.addEventListener('click', () => switchTab('current'));
    tabHistory.addEventListener('click', () => switchTab('history')); // Log will be inside switchTab

    // History event listeners
    console.log('Setting up history event listeners...'); // Added log
    clearHistoryBtn.addEventListener('click', clearHistory); // Log will be inside clearHistory

    // Function to check if Puter AI is available
    function checkPuterAIAvailability() {
    console.log('Checking Puter AI availability...'); 
    
    // Log Puter object details for debugging
    console.log('Puter object:', puter);
    console.log('Puter AI available:', typeof puter !== 'undefined' && puter.ai && puter.ai.chat);
    
    try {
        if (typeof puter !== 'undefined' && puter.ai && puter.ai.chat) {
            console.log('Puter AI is available');
            aiStatus.textContent = 'AI Ready';
            aiStatus.classList.remove('hidden');
            aiStatus.classList.add('bg-green-700');

            // Hide status after 3 seconds
            setTimeout(() => {
                aiStatus.classList.add('hidden');
            }, 3000);
        } else {
            console.error('Puter AI is not available');
            
            // Detailed logging for unavailability
            console.log('Puter undefined:', typeof puter === 'undefined');
            if (typeof puter !== 'undefined') {
                console.log('Puter AI undefined:', !puter.ai);
                if (puter.ai) {
                    console.log('Puter AI chat undefined:', !puter.ai.chat);
                }
            }

            aiStatus.textContent = 'AI Unavailable';
            aiStatus.classList.remove('hidden');
            aiStatus.classList.add('bg-red-700');

            // Modified local testing logic
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('Creating mock Puter AI for local testing');
                window.puter = window.puter || {};
                window.puter.ai = window.puter.ai || {};
                window.puter.ai.chat = function(prompt, imageData, _, options) {
                    console.log('Mock AI called with prompt:', prompt);
                    console.log('Mock AI image data length:', imageData ? imageData.length : 0);

                    // Return a promise that resolves with a mock JSON response
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            // Generate random test scenarios
                            const scenarios = [
                                // No pets or babies
                                {
                                    "scene_description": "An empty room with a couch and a coffee table.",
                                    "subjects": [],
                                    "safety_assessment": {
                                        "level": "Safe",
                                        "reason": "No subjects detected in the scene."
                                    }
                                },
                                // Baby scenario
                                {
                                    "scene_description": "A baby is sleeping peacefully in a crib.",
                                    "subjects": [{
                                        "type": "Baby",
                                        "state": "Sleeping",
                                        "confidence": 0.95
                                    }],
                                    "safety_assessment": {
                                        "level": "Safe",
                                        "reason": "The baby is sleeping safely in the crib."
                                    }
                                },
                                // Pet scenario
                                {
                                    "scene_description": "A small dog is resting on a couch.",
                                    "subjects": [{
                                        "type": "Dog",
                                        "state": "Resting",
                                        "confidence": 0.89
                                    }],
                                    "safety_assessment": {
                                        "level": "Safe",
                                        "reason": "The dog appears calm and is not in any immediate danger."
                                    }
                                },
                                // Warning scenario
                                {
                                    "scene_description": "A baby is sitting on the floor near some electrical cords.",
                                    "subjects": [{
                                        "type": "Baby",
                                        "state": "Sitting",
                                        "confidence": 0.92
                                    }],
                                    "safety_assessment": {
                                        "level": "Warning",
                                        "reason": "The baby is close to electrical cords, which could be a potential hazard."
                                    }
                                }
                            ];

                            // Pick a random scenario
                            const randomResponse = scenarios[Math.floor(Math.random() * scenarios.length)];
                            resolve(JSON.stringify(randomResponse));
                        }, 1000); // Simulate network delay
                    });
                };

                // Update the AI status indicator
                aiStatus.textContent = 'Mock AI Ready';
                aiStatus.classList.remove('bg-red-700');
                aiStatus.classList.add('bg-yellow-700');
            }
        }
    } catch (error) {
        console.error('Error in Puter AI availability check:', error);
        aiStatus.textContent = 'AI Error';
        aiStatus.classList.remove('hidden');
        aiStatus.classList.add('bg-red-700');
    }
}

    // ENHANCED ERROR HANDLING: Camera initialization with retry logic
    async function initCamera(retryCount = 0) {
        const maxRetries = 2;
        
        try {
            if (currentStream) {
                // Stop any existing streams
                currentStream.getTracks().forEach(track => track.stop());
            }

            // Get user media with appropriate facing mode
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            currentStream = stream;

            // Set up the ImageCapture API if supported
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack && 'ImageCapture' in window) {
                imageCapture = new ImageCapture(videoTrack);
            }

            // Update the camera feedback with success message
            cameraFeedback.innerHTML = `
                <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <i class="fas fa-check-circle mr-1"></i>Camera active
                </div>
            `;

            // Reset error count on successful camera init
            errorManager.resetErrorCount();

            // Wait for the video to be loaded
            return new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });
            
        } catch (error) {
            console.error(`Camera initialization error (attempt ${retryCount + 1}):`, error);
            
            // Enhanced error messages based on error type
            let userMessage = 'Camera error: ';
            let recoveryActions = [];
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                userMessage += 'Camera access denied. Please allow camera permissions and refresh the page.';
                recoveryActions.push('Allow camera access in your browser settings');
                recoveryActions.push('Refresh the page');
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                userMessage += 'No camera found. Please connect a camera and try again.';
                recoveryActions.push('Connect a camera device');
                recoveryActions.push('Refresh the page');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                userMessage += 'Camera is being used by another application.';
                recoveryActions.push('Close other applications using the camera');
                recoveryActions.push('Refresh the page');
                
                // Try to retry with different constraints
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        facingMode = facingMode === 'environment' ? 'user' : 'environment';
                        initCamera(retryCount + 1);
                    }, 2000);
                    return;
                }
            } else if (error.name === 'OverconstrainedError') {
                userMessage += 'Camera constraints not supported.';
                recoveryActions.push('Try switching between front and rear camera');
                
                // Auto-retry with less strict constraints
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        facingMode = facingMode === 'environment' ? 'user' : 'environment';
                        initCamera(retryCount + 1);
                    }, 1000);
                    return;
                }
            } else {
                userMessage += `${error.message || 'Unknown error'}`;
                recoveryActions.push('Refresh the page');
                recoveryActions.push('Check your camera permissions');
            }

            // Display enhanced error feedback with recovery actions
            cameraFeedback.innerHTML = `
                <div class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                    <i class="fas fa-exclamation-circle mr-1"></i>
                    <div class="font-medium">${userMessage}</div>
                    <div class="text-xs mt-1">
                        <strong>Try:</strong> ${recoveryActions.join(' • ')}
                    </div>
                    <button onclick="initCamera()" class="text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded mt-1">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Toggle between front and rear cameras
    function toggleCamera() {
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        initCamera();
    }

    // PERFORMANCE OPTIMIZATION: Compress image for AI analysis
    function compressImageForAI(sourceCanvas) {
        try {
            // Create a smaller canvas for compression
            const compressionCanvas = document.createElement('canvas');
            const compressionContext = compressionCanvas.getContext('2d');
            
            // Calculate optimal dimensions for AI processing
            // Reduce resolution while maintaining aspect ratio
            const maxDimension = 800; // Maximum width or height for AI processing
            const aspectRatio = sourceCanvas.width / sourceCanvas.height;
            
            if (sourceCanvas.width > sourceCanvas.height) {
                compressionCanvas.width = Math.min(maxDimension, sourceCanvas.width);
                compressionCanvas.height = compressionCanvas.width / aspectRatio;
            } else {
                compressionCanvas.height = Math.min(maxDimension, sourceCanvas.height);
                compressionCanvas.width = compressionCanvas.height * aspectRatio;
            }
            
            // Enable image smoothing for better quality when downscaling
            compressionContext.imageSmoothingEnabled = true;
            compressionContext.imageSmoothingQuality = 'high';
            
            // Draw the original image scaled down
            compressionContext.drawImage(sourceCanvas, 0, 0, compressionCanvas.width, compressionCanvas.height);
            
            // Use JPEG compression with quality setting for smaller file size
            return compressionCanvas.toDataURL('image/jpeg', 0.85); // 85% quality provides good balance
        } catch (error) {
            console.warn('Image compression failed, using original:', error);
            // Fallback to original image if compression fails
            return sourceCanvas.toDataURL('image/png');
        }
    }

    // Take a snapshot from the video feed
    function takeSnapshot() {
        if (!video.srcObject) {
            alert('Camera is not initialized. Please refresh and allow camera access.');
            return;
        }

        // PERFORMANCE OPTIMIZATION: Prevent rapid successive calls
        if (isProcessingSnapshot && !isMonitoring) {
            console.log('Snapshot already in progress, skipping...');
            return;
        }

        // Clear any existing debounce timeout
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        // Set processing flag
        isProcessingSnapshot = true;

        // Show loading state
        showLoadingState();

        try {
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw the current video frame to the canvas
            canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

            // PERFORMANCE OPTIMIZATION: Compress image for AI analysis
            const compressedImageData = compressImageForAI(canvas);

            // Add current frame to history and maintain size (store compressed version)
            frameHistory.push(compressedImageData);
            if (frameHistory.length > FRAME_HISTORY_SIZE) {
                frameHistory.shift(); // Remove the oldest frame
            }

            // Process the image with AI, passing the frame history
            processImageWithAI(frameHistory);
        } catch (error) {
            console.error('Error taking snapshot:', error);
            
            // Queue snapshot for background sync if processing fails
            if (backgroundSyncManager) {
                const snapshotData = {
                    imageData: compressedImageData || canvas.toDataURL('image/jpeg', 0.8),
                    timestamp: Date.now(),
                    frameHistory: frameHistory.slice(-3), // Only keep last 3 frames
                    settings: {
                        quality: 0.8,
                        monitoring: isMonitoring,
                        preferences: userPreferences
                    }
                };
                
                backgroundSyncManager.queueSnapshot(snapshotData.imageData, snapshotData.settings)
                    .then(result => {
                        if (result.queued) {
                            showErrorState('Failed to process image now. Analysis queued for when connection is restored.');
                        }
                    })
                    .catch(syncError => {
                        console.error('❌ Failed to queue snapshot for background sync:', syncError);
                        showErrorState('Failed to capture image. Please try again.');
                    });
            } else {
                showErrorState('Failed to capture image. Please try again.');
            }
            
            // Reset processing flag on error
            isProcessingSnapshot = false;
        }
    }

    // Image upload functionality removed

    // ENHANCED ERROR HANDLING: AI processing with retry logic
    function processImageWithAI(frameHistoryData, retryCount = 0) {
        const maxRetries = 2;
        
        try {
            // Analyze temporal changes across frames
            const temporalAnalysis = analyzeTemporalChanges(frameHistoryData);
            console.log("Temporal analysis:", temporalAnalysis);
            
            // Create enhanced AI prompt with temporal context
            const prompt = createEnhancedAIPrompt(temporalAnalysis);
            
            // Get the current (latest) frame for AI analysis
            const currentImageData = frameHistoryData[frameHistoryData.length - 1];

            // Optional parameters for the AI
            const options = {
                model: 'gpt-4o-mini', // Default model, using the most affordable option
                stream: false // We want the complete response at once
            };

            // Call Puter AI vision API
            console.log(`Sending image to Puter AI... (attempt ${retryCount + 1})`);

            // Disable the button during processing (only if not in monitoring mode)
            if (!isMonitoring) {
                takeSnapshotBtn.disabled = true;
            }

            // Use Puter's AI chat API with the current frame
            puter.ai.chat(prompt, currentImageData, false, options)
            .then(response => {
                console.log("AI Response:", response);
                console.log("AI Response type:", typeof response);
                if (typeof response === 'object') {
                    console.log("AI Response structure:", Object.keys(response));
                    if (response.message) console.log("Response message:", response.message);
                    if (response.content) console.log("Response content:", response.content);
                }

                try {
                    // Check for refusal or failure to analyze
                    let responseText = '';
                    if (typeof response === 'string') {
                        responseText = response;
                    } else if (typeof response === 'object' && response !== null) {
                        // Handle various response formats from the Puter API
                        if (response.message && response.message.content) {
                            responseText = response.message.content;
                        } else if (response.content) {
                            responseText = response.content;
                        } else if (response.text) {
                            responseText = response.text;
                        } else if (response.result && response.result.message && response.result.message.content) {
                            responseText = response.result.message.content;
                        } else {
                            responseText = JSON.stringify(response);
                        }
                    }

                    // Check for common refusal patterns
                    if (responseText.includes("unable to provide an analysis") ||
                        responseText.includes("cannot analyze") ||
                        responseText.includes("can't analyze") ||
                        responseText.includes("refusal") ||
                        responseText.length < 30) { // Very short responses are likely refusals

                        throw new Error("AI couldn't analyze the image properly");
                    }

                    const aiResult = parseAIResponse(responseText);
                    // Add temporal analysis information to the result
                    aiResult.temporalAnalysis = temporalAnalysis;
                    displayResults(aiResult);

                    // Enhanced alert system with user preferences
                    if (isMonitoring && aiResult.hasPetsOrBabies) {
                        const alertType = aiResult.alert ? aiResult.alert.type.toLowerCase() : 'safe';
                        
                        // Check if this type of alert is enabled in user preferences
                        const shouldAlert = checkShouldAlert(alertType, aiResult, temporalAnalysis);
                        
                        if (shouldAlert && window.playAlertSound) {
                            // Get severity classification for enhanced alert sound
                            const severity = classifyAlertSeverity(aiResult.alert, aiResult);
                            window.playAlertSound(severity.level);
                        }
                    }
                } catch (parseError) {
                    console.error("Error parsing AI response:", parseError);
                    showErrorState("The AI couldn't analyze this image properly. Please try a clearer image or different angle.");
                }
            })
            .catch(error => {
                console.error(`AI API Error (attempt ${retryCount + 1}):`, error);
                
                // ENHANCED ERROR HANDLING: Retry logic with exponential backoff
                if (retryCount < maxRetries) {
                    const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s delays
                    console.log(`Retrying AI request in ${retryDelay}ms...`);
                    
                    setTimeout(() => {
                        processImageWithAI(frameHistoryData, retryCount + 1);
                    }, retryDelay);
                    
                    return; // Don't proceed to finally block yet
                }
                
                // All retries failed - show user-friendly error with recovery options
                const errorMessage = error.message || 'Unknown error';
                let userMessage = "Error connecting to AI service. ";
                
                if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                    userMessage += "Please check your internet connection and try again.";
                } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
                    userMessage += "Service temporarily unavailable. Please try again in a few moments.";
                } else {
                    userMessage += "Please try again later.";
                }
                
                showErrorState(userMessage);
            })
            .finally(() => {
                // Re-enable the button if not in monitoring mode
                if (!isMonitoring) {
                    takeSnapshotBtn.disabled = false;
                }
                
                // PERFORMANCE OPTIMIZATION: Reset processing flag with debounce
                debounceTimeout = setTimeout(() => {
                    isProcessingSnapshot = false;
                }, 500); // 500ms cooldown between snapshots
            });
        } catch (syncError) {
            // ENHANCED ERROR HANDLING: Catch synchronous errors in AI processing
            console.error("Synchronous error in AI processing:", syncError);
            showErrorState("An unexpected error occurred during image processing. Please try again.");
            
            // Reset processing state
            isProcessingSnapshot = false;
            if (!isMonitoring) {
                takeSnapshotBtn.disabled = false;
            }
        }
    }

    // Check if an alert should be triggered based on user preferences
    function checkShouldAlert(alertType, aiResult, temporalAnalysis) {
        // Always alert for danger level
        if (alertType === 'danger') {
            return true;
        }
        
        // Check warning level alerts
        if (alertType === 'warning' && window.isAlertEnabled) {
            return window.isAlertEnabled('safety');
        }
        
        // Check movement-based alerts
        if (temporalAnalysis.hasMovement && window.isAlertEnabled) {
            return window.isAlertEnabled('movement');
        }
        
        // Check for unusual events (subjects in unusual states)
        if (aiResult.objects && aiResult.objects.length > 0) {
            const hasUnusualState = aiResult.objects.some(obj => 
                obj.state.toLowerCase().includes('crying') ||
                obj.state.toLowerCase().includes('distressed') ||
                obj.state.toLowerCase().includes('climbing') ||
                obj.state.toLowerCase().includes('stuck') ||
                obj.confidence < 0.5 // Low confidence might indicate unusual pose/position
            );
            
            if (hasUnusualState && window.isAlertEnabled) {
                return window.isAlertEnabled('unusual');
            }
        }
        
        return false;
    }

    // ===== ALERT SEVERITY CLASSIFICATION SYSTEM =====

    // Classify alert severity based on multiple factors
    function classifyAlertSeverity(alert, analysisResults) {
        const alertType = alert.type.toLowerCase();
        const alertMessage = alert.message.toLowerCase();
        
        // Base severity from alert type
        let baseSeverity = {
            'safe': 1,
            'warning': 5, 
            'danger': 9
        }[alertType] || 3;
        
        // Severity modifiers based on specific conditions
        let severityModifiers = 0;
        
        // High-risk keywords increase severity
        const dangerKeywords = ['immediate', 'urgent', 'falling', 'fire', 'electrical', 'choking', 'stuck', 'entangled'];
        const warningKeywords = ['near', 'close to', 'approaching', 'unsecured', 'potential', 'could'];
        
        if (dangerKeywords.some(keyword => alertMessage.includes(keyword))) {
            severityModifiers += 2;
        } else if (warningKeywords.some(keyword => alertMessage.includes(keyword))) {
            severityModifiers += 1;
        }
        
        // Movement-based severity adjustment
        if (analysisResults.temporalAnalysis && analysisResults.temporalAnalysis.hasMovement) {
            if (analysisResults.temporalAnalysis.movementLevel === 'high') {
                severityModifiers += 2;
            } else if (analysisResults.temporalAnalysis.movementLevel === 'medium') {
                severityModifiers += 1;
            }
        }
        
        // Subject-specific severity adjustments
        if (analysisResults.objects && analysisResults.objects.length > 0) {
            analysisResults.objects.forEach(obj => {
                const state = obj.state.toLowerCase();
                const confidence = obj.confidence || 0.7;
                
                // Low confidence in dangerous situations increases severity
                if (alertType === 'danger' && confidence < 0.6) {
                    severityModifiers += 1;
                }
                
                // Specific dangerous states
                if (state.includes('crying') || state.includes('distressed')) {
                    severityModifiers += 1;
                } else if (state.includes('climbing') || state.includes('reaching')) {
                    severityModifiers += 1;
                }
                
                // Baby-specific concerns (higher vulnerability)
                if (obj.type.toLowerCase().includes('baby') && alertType !== 'safe') {
                    severityModifiers += 1;
                }
            });
        }
        
        // Calculate final severity (0-10 scale)
        const finalSeverity = Math.min(10, Math.max(0, baseSeverity + severityModifiers));
        
        // Return severity classification
        if (finalSeverity >= 8) {
            return { level: 'critical', score: finalSeverity, priority: 'HIGH' };
        } else if (finalSeverity >= 6) {
            return { level: 'high', score: finalSeverity, priority: 'HIGH' };
        } else if (finalSeverity >= 4) {
            return { level: 'medium', score: finalSeverity, priority: 'MEDIUM' };
        } else if (finalSeverity >= 2) {
            return { level: 'low', score: finalSeverity, priority: 'LOW' };
        } else {
            return { level: 'minimal', score: finalSeverity, priority: 'LOW' };
        }
    }

    // Create visual severity display components
    function createSeverityDisplay(severityLevel, alert) {
        const { level, score, priority } = severityLevel;
        
        // Severity badges with color coding
        const badges = {
            'critical': '<span class="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">🚨 CRITICAL</span>',
            'high': '<span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">🔴 HIGH</span>',
            'medium': '<span class="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">🟡 MEDIUM</span>',
            'low': '<span class="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">🟢 LOW</span>',
            'minimal': '<span class="bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">ℹ️ MINIMAL</span>'
        };
        
        // Severity indicators with visual bars
        const indicators = {
            'critical': `
                <div class="text-right">
                    <div class="text-xs text-red-600 font-bold">SEVERITY ${score}/10</div>
                    <div class="flex space-x-1 mt-1">
                        ${[...Array(10)].map((_, i) => 
                            `<div class="w-1 h-4 ${i < score ? 'bg-red-600' : 'bg-gray-200'} rounded-sm"></div>`
                        ).join('')}
                    </div>
                </div>
            `,
            'high': `
                <div class="text-right">
                    <div class="text-xs text-red-500 font-bold">SEVERITY ${score}/10</div>
                    <div class="flex space-x-1 mt-1">
                        ${[...Array(10)].map((_, i) => 
                            `<div class="w-1 h-4 ${i < score ? 'bg-red-500' : 'bg-gray-200'} rounded-sm"></div>`
                        ).join('')}
                    </div>
                </div>
            `,
            'medium': `
                <div class="text-right">
                    <div class="text-xs text-yellow-600 font-bold">SEVERITY ${score}/10</div>
                    <div class="flex space-x-1 mt-1">
                        ${[...Array(10)].map((_, i) => 
                            `<div class="w-1 h-4 ${i < score ? 'bg-yellow-500' : 'bg-gray-200'} rounded-sm"></div>`
                        ).join('')}
                    </div>
                </div>
            `,
            'low': `
                <div class="text-right">
                    <div class="text-xs text-blue-600 font-bold">SEVERITY ${score}/10</div>
                    <div class="flex space-x-1 mt-1">
                        ${[...Array(10)].map((_, i) => 
                            `<div class="w-1 h-4 ${i < score ? 'bg-blue-500' : 'bg-gray-200'} rounded-sm"></div>`
                        ).join('')}
                    </div>
                </div>
            `,
            'minimal': `
                <div class="text-right">
                    <div class="text-xs text-gray-600 font-bold">SEVERITY ${score}/10</div>
                    <div class="flex space-x-1 mt-1">
                        ${[...Array(10)].map((_, i) => 
                            `<div class="w-1 h-4 ${i < score ? 'bg-gray-400' : 'bg-gray-200'} rounded-sm"></div>`
                        ).join('')}
                    </div>
                </div>
            `
        };
        
        return {
            badge: badges[level] || badges['minimal'],
            indicator: indicators[level] || indicators['minimal'],
            level,
            score,
            priority
        };
    }

    // Display the analysis results in the UI
    function displayResults(results) {
        // Handle invalid results
        if (!results || !results.scene || !Array.isArray(results.objects) || !results.alert) {
            console.error("Invalid results format:", results);
            showErrorState("Received invalid analysis results. Please try again.");
            return;
        }

        // Hide loading state and placeholder
        resultsPlaceholder.classList.add('hidden');

        // Set scene description text with temporal context
        let sceneDescription = results.scene;
        if (results.temporalAnalysis) {
            const movementIndicator = results.temporalAnalysis.hasMovement ? 
                `🔄 Movement detected (${results.temporalAnalysis.movementLevel})` : 
                `📷 Stable scene`;
            sceneDescription += ` ${movementIndicator}`;
        }
        sceneText.textContent = sceneDescription;

        // Clear and populate detection list
        detectionList.innerHTML = '';

        if (!results.hasPetsOrBabies) {
            // Display a message for no pets or babies
            const emptyItem = document.createElement('li');
            emptyItem.className = 'bg-gray-50 p-4 rounded-md text-gray-600 text-center';
            emptyItem.innerHTML = `
                <div class="flex flex-col items-center">
                    <i class="fas fa-search text-gray-400 text-2xl mb-2"></i>
                    <p>No pets or babies detected in this scene.</p>
                </div>
            `;
            detectionList.appendChild(emptyItem);
        } else {
            // Add each detected object to the list (only pets and babies)
            results.objects.forEach(obj => {
                const listItem = document.createElement('li');
                listItem.className = 'flex items-center justify-between bg-gray-50 p-3 rounded-md';

                const confidencePercent = Math.round((obj.confidence || 0.5) * 100);
                let confidenceClass = 'text-green-700 bg-green-100';
                if (confidencePercent < 75) {
                    confidenceClass = 'text-yellow-700 bg-yellow-100';
                }

                listItem.innerHTML = `
                    <div>
                        <span class="font-medium">${obj.type || 'Unknown'}</span>
                        <span class="text-gray-500 text-sm ml-2">${obj.state || 'Unspecified'}</span>
                    </div>
                    <span class="text-sm ${confidenceClass} px-2 py-1 rounded">
                        ${confidencePercent}%
                    </span>
                `;

                detectionList.appendChild(listItem);
            });
        }

        // Set alert status based on alert type
        const type = results.alert.type || 'info';
        const message = results.alert.message || 'Analysis complete.';

        let alertClass = '';
        let alertIcon = '';

        if (type === 'warning') {
            alertClass = 'bg-yellow-100 border-yellow-400 text-yellow-800';
            alertIcon = 'fa-triangle-exclamation';
        } else if (type === 'danger') {
            alertClass = 'bg-red-100 border-red-400 text-red-800';
            alertIcon = 'fa-circle-exclamation';
        } else { // info or safe
            alertClass = 'bg-blue-100 border-blue-400 text-blue-800';
            alertIcon = 'fa-circle-info';
        }

        // Update safety assessment display
        safetyLevelText.textContent = results.alert.type.charAt(0).toUpperCase() + results.alert.type.slice(1);
        safetyReasonText.textContent = results.alert.message;

        let safetyClass = '';
        let safetyIcon = '';

        if (type === 'safe') {
            safetyClass = 'bg-green-100 border-green-400 text-green-800';
            safetyIcon = 'fa-check-circle';
        } else if (type === 'warning') {
            safetyClass = 'bg-yellow-100 border-yellow-400 text-yellow-800';
            safetyIcon = 'fa-triangle-exclamation';
        } else if (type === 'danger') {
            safetyClass = 'bg-red-100 border-red-400 text-red-800';
            safetyIcon = 'fa-circle-exclamation';
        } else { // Default to info if type is unexpected
            safetyClass = 'bg-blue-100 border-blue-400 text-blue-800';
            safetyIcon = 'fa-circle-info';
        }

        // Apply enhanced safety assessment display with severity classification
        safetyAssessmentDisplay.className = `p-4 rounded-md mb-4 border-l-4 ${safetyClass}`;
        
        // Enhanced severity display with visual indicators
        const severityLevel = classifyAlertSeverity(results.alert, results);
        const severityDisplay = createSeverityDisplay(severityLevel, results.alert);
        
        safetyAssessmentDisplay.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h4 class="font-semibold text-lg mb-2 flex items-center">
                        <i class="fas ${safetyIcon} mr-2"></i>Safety Assessment
                        ${severityDisplay.badge}
                    </h4>
                    <p class="font-bold text-lg mb-1">${results.alert.type.charAt(0).toUpperCase() + results.alert.type.slice(1)}</p>
                    <p class="text-sm opacity-90">${results.alert.message}</p>
                </div>
                <div class="ml-4 text-right">
                    ${severityDisplay.indicator}
                </div>
            </div>
        `;

        // Show the results container
        analysisResults.classList.remove('hidden');

        // Add to history with background sync integration
        addToHistory(results);
        
        // NOTIFICATION INTEGRATION: Send critical notifications
        if (results.alert && results.alert.type !== 'none') {
            const notificationData = {
                alert: results.alert,
                severity: results.severity || 3,
                scene: results.scene,
                hasPetsOrBabies: results.hasPetsOrBabies,
                temporalAnalysis: results.temporalAnalysis
            };
            
            // Send notification for critical events and queue for background sync
            sendCriticalNotification(notificationData);
            
            // Queue alert for background sync
            if (backgroundSyncManager) {
                backgroundSyncManager.queueAlert(notificationData, results.alert.type)
                    .catch(error => {
                        console.error('❌ Failed to queue alert for background sync:', error);
                    });
            }
        }
    }

    // Show loading state while processing image
    function showLoadingState() {
        resultsPlaceholder.classList.remove('hidden');
        analysisResults.classList.add('hidden');

        resultsPlaceholder.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p class="text-gray-500">Analyzing image with AI...</p>
            </div>
        `;
    }

    // Show error state when processing fails
    function showErrorState(errorMessage) {
        // Hide analysis results and show error placeholder
        resultsPlaceholder.classList.remove('hidden');
        analysisResults.classList.add('hidden');

        // Create error message with retry button
        resultsPlaceholder.innerHTML = `
            <div class="bg-red-100 text-red-800 p-4 rounded-md">
                <div class="flex items-center mb-2">
                    <i class="fas fa-circle-exclamation mr-2"></i>
                    <p class="font-medium">Error</p>
                </div>
                <p>${errorMessage}</p>
                <div class="flex mt-3">
                    <button id="retry-button" class="bg-red-200 px-4 py-2 rounded hover:bg-red-300 transition">
                        <i class="fas fa-redo mr-2"></i>Try Again
                    </button>
                    <button id="new-snapshot-button" class="bg-indigo-200 text-indigo-800 px-4 py-2 rounded hover:bg-indigo-300 transition ml-2">
                        <i class="fas fa-camera mr-2"></i>New Snapshot
                    </button>
                </div>
            </div>
        `;

        // Add retry button functionality - just reset the placeholder
        document.getElementById('retry-button').addEventListener('click', () => {
            resultsPlaceholder.innerHTML = `
                <i class="fas fa-search text-4xl text-gray-400 mb-3"></i>
                <p class="text-gray-500">Capture an image to see real-time analysis of what's happening in the scene.</p>
            `;
        });

        // Add new snapshot button - take a new picture immediately
        document.getElementById('new-snapshot-button').addEventListener('click', () => {
            takeSnapshot();
        });
    }

    // Toggle the monitoring state (start/stop)
    function toggleMonitoring() {
        console.log('toggleMonitoring() called. Current state:', isMonitoring); // Added log
        if (isMonitoring) {
            stopMonitoring();
        } else {
            startMonitoring();
        }
    }

    // Start the monitoring process
    function startMonitoring() {
        console.log('startMonitoring() called.'); // Added log
        if (!video.srcObject) {
            alert('Camera is not initialized. Please refresh and allow camera access.');
            console.warn('startMonitoring() aborted: Camera not initialized.'); // Added log
            return;
        }

        isMonitoring = true;
        updateMonitoringUI();
        
        // NOTIFICATION INTEGRATION: Send monitoring started notification
        const interval = parseInt(refreshRateSelect.value);
        sendMonitoringNotification('started', `Monitoring started with ${interval/1000}s intervals`);

        // Take an initial snapshot immediately
        console.log('Taking initial snapshot...'); // Added log
        takeSnapshot();

        // Set up the interval for automatic snapshots
        const intervalMs = parseInt(refreshRateSelect.value);
        console.log('Setting new monitoring interval to:', intervalMs, 'ms'); // Added log
        monitoringInterval = setInterval(takeSnapshot, intervalMs);

        // Add visual indicator to camera container
        document.getElementById('camera-container').classList.add('camera-active');
    }

    // Stop the monitoring process
    function stopMonitoring() {
        console.log('stopMonitoring() called.'); // Added log
        isMonitoring = false;
        updateMonitoringUI();

        // Clear the monitoring interval
        if (monitoringInterval) {
            console.log('Clearing existing monitoring interval.'); // Added log
            clearInterval(monitoringInterval);
            monitoringInterval = null;
        }

        // Remove visual indicator from camera container
        document.getElementById('camera-container').classList.remove('camera-active');
        
        // NOTIFICATION INTEGRATION: Send monitoring stopped notification
        sendMonitoringNotification('stopped', 'Monitoring has been stopped');
    }

    // Update the monitoring UI based on current state
    function updateMonitoringUI() {
        console.log('updateMonitoringUI() called. isMonitoring:', isMonitoring); // Added log
        if (isMonitoring) {
            monitoringStatusText.textContent = 'Stop Monitoring';
            toggleMonitoringBtn.innerHTML = '<i class="fas fa-stop mr-2"></i>Stop Monitoring';
            toggleMonitoringBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
            toggleMonitoringBtn.classList.add('bg-red-600', 'hover:bg-red-700');
            takeSnapshotBtn.disabled = true;
            takeSnapshotBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            monitoringStatusText.textContent = 'Start Monitoring';
            toggleMonitoringBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Start Monitoring';
            toggleMonitoringBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
            toggleMonitoringBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            takeSnapshotBtn.disabled = false;
            takeSnapshotBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    // Update the monitoring interval when the refresh rate changes
    function updateMonitoringInterval() {
        console.log('updateMonitoringInterval() called. New rate:', refreshRateSelect.value); // Added log
        if (isMonitoring) {
            // Clear the existing interval
            console.log('Clearing existing monitoring interval.'); // Added log
            clearInterval(monitoringInterval);

            // Set up a new interval with the updated refresh rate
            const intervalMs = parseInt(refreshRateSelect.value);
            console.log('Setting new monitoring interval to:', intervalMs, 'ms'); // Added log
            monitoringInterval = setInterval(takeSnapshot, intervalMs);
        }
    }

    // Switch between Current and History tabs
    function switchTab(tabName) {
        console.log('switchTab() called with tabName:', tabName); // Added log
        if (tabName === 'current') {
            tabCurrent.classList.remove('bg-gray-100', 'text-gray-600');
            tabCurrent.classList.add('bg-indigo-100', 'text-indigo-700');
            tabHistory.classList.remove('bg-indigo-100', 'text-indigo-700');
            tabHistory.classList.add('bg-gray-100', 'text-gray-600');

            currentTab.classList.remove('hidden');
            historyTab.classList.add('hidden');
        } else if (tabName === 'history') {
            tabHistory.classList.remove('bg-gray-100', 'text-gray-600');
            tabHistory.classList.add('bg-indigo-100', 'text-indigo-700');
            tabCurrent.classList.remove('bg-indigo-100', 'text-indigo-700');
            tabCurrent.classList.add('bg-gray-100', 'text-gray-600');

            historyTab.classList.remove('hidden');
            currentTab.classList.add('hidden');

            // Refresh the history display (use scheduled update for performance)
            console.log('Scheduling history display refresh...'); // Added log
            scheduleHistoryUpdate();
        }
    }

    // Add a new event to the history
    function addToHistory(result) {
        console.log('addToHistory() called with result:', result); // Added log
        // Create a new history entry
        const entry = {
            timestamp: new Date().toISOString(),
            scene: result.scene,
            objects: result.objects,
            alert: result.alert,
            hasPetsOrBabies: result.hasPetsOrBabies, // Directly use the value from parsed AI result
            temporalAnalysis: result.temporalAnalysis // Include temporal analysis information
        };

        console.log('New history entry:', entry); // Added log
        
        // Background sync integration: Queue timeline event for synchronization
        if (backgroundSyncManager) {
            backgroundSyncManager.queueTimelineEvent({
                type: 'analysis_result',
                entry: entry,
                priority: result.alert.type === 'danger' ? 'high' : 'normal',
                source: 'spotkin_analysis'
            }).catch(error => {
                console.error('❌ Failed to queue timeline event for background sync:', error);
            });
        }
        
        // Add to the beginning of the history array
        historyData.unshift(entry);

        // PERFORMANCE OPTIMIZATION: Limit history size and clean old entries
        if (historyData.length > MAX_HISTORY_ITEMS) {
            console.log('History size exceeds limit, trimming...'); // Added log
            historyData = historyData.slice(0, MAX_HISTORY_ITEMS);
        }
        
        // Clean old entries (older than 7 days) to prevent unbounded growth
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const initialLength = historyData.length;
        
        historyData = historyData.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate > oneWeekAgo;
        });
        
        if (historyData.length < initialLength) {
            console.log(`Cleaned ${initialLength - historyData.length} old history entries`);
        }

        // Save to local storage
        console.log('Saving history to local storage...'); // Added log
        saveHistoryToLocalStorage();

        // Update the history display if the history tab is active (use scheduled update for performance)
        if (!historyTab.classList.contains('hidden')) {
            console.log('History tab is active, scheduling display update...'); // Added log
            scheduleHistoryUpdate();
        }
    }

    

    // PERFORMANCE OPTIMIZATION: Batch DOM updates for better performance
    let updateHistoryTimeout = null;
    
    function scheduleHistoryUpdate() {
        if (updateHistoryTimeout) {
            clearTimeout(updateHistoryTimeout);
        }
        
        updateHistoryTimeout = setTimeout(() => {
            updateHistoryDisplay();
            updateHistoryTimeout = null;
        }, 100); // Batch updates with 100ms delay
    }
    
    // Update the history display
    function updateHistoryDisplay() {
        console.log('updateHistoryDisplay() called. History data length:', historyData.length); // Added log
        if (historyData.length === 0) {
            // Show empty message
            console.log('History is empty, showing empty message.'); // Added log
            historyEmptyMsg.classList.remove('hidden');
            timelineContainer.classList.add('hidden');
            return;
        }

        // Hide empty message and show timeline
        console.log('History has data, showing timeline.'); // Added log
        historyEmptyMsg.classList.add('hidden');
        timelineContainer.classList.remove('hidden');

        // PERFORMANCE OPTIMIZATION: Use DocumentFragment for batch DOM operations
        const fragment = document.createDocumentFragment();
        
        // Add each history item to the fragment first
        historyData.forEach((entry, index) => {
            console.log('Adding history entry to timeline:', entry); // Added log
            // Create timeline item
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item p-3 bg-white rounded-md shadow-sm mb-3';

            // Format the timestamp
            const timestamp = new Date(entry.timestamp);
            const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Determine alert class based on safety level
            let alertClass = '';
            let alertIcon = '';

            if (entry.alert.type === 'safe') {
                alertClass = 'text-green-600';
                alertIcon = 'fa-check-circle';
            } else if (entry.alert.type === 'warning') {
                alertClass = 'text-yellow-600';
                alertIcon = 'fa-triangle-exclamation';
            } else if (entry.alert.type === 'danger') {
                alertClass = 'text-red-600';
                alertIcon = 'fa-circle-exclamation';
            } else { // info or safe
                alertClass = 'text-blue-600';
                alertIcon = 'fa-info-circle';
            }

            // Create the content based on whether pets/babies are present
            let objectsContent = ``;

            if (entry.hasPetsOrBabies && entry.objects.length > 0) {
                objectsContent = `
                    <div class="mt-2">
                        <h5 class="text-sm font-medium text-gray-700">Detected:</h5>
                        <ul class="mt-1 text-sm text-gray-600">
                            ${entry.objects.map(obj => `
                                <li class="flex justify-between">
                                    <span>${obj.type} - ${obj.state}</span>
                                    <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100">${Math.round((obj.confidence || 0.0) * 100)}%</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            } else {
                objectsContent = `
                    <div class="mt-2 text-sm text-gray-600">
                        <p>No pets or babies detected in this scene.</p>
                    </div>
                `;
            }

            // Build the timeline item content
            timelineItem.innerHTML = `
                <div class="flex justify-between items-start">
                    <h4 class="text-sm font-bold text-gray-800">${timeString}</h4>
                    <span class="${alertClass} text-xs">
                        <i class="fas ${alertIcon} mr-1"></i>${entry.alert.type}
                    </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">${entry.scene}</p>
                ${objectsContent}
            `;

            // Add to fragment instead of directly to DOM
            fragment.appendChild(timelineItem);
        });
        
        // PERFORMANCE OPTIMIZATION: Clear and update DOM in one operation
        timelineList.innerHTML = '';
        timelineList.appendChild(fragment);
        
        console.log('Timeline display updated with batch DOM operations');
    }

    // PERFORMANCE OPTIMIZATION: Compress history data for storage
    function compressHistoryForStorage(historyData) {
        try {
            // Create compressed version by removing redundant data and truncating strings
            return historyData.map(entry => ({
                timestamp: entry.timestamp,
                scene: entry.scene.substring(0, 200), // Limit scene description length
                objects: entry.objects.map(obj => ({
                    type: obj.type,
                    state: obj.state.substring(0, 100), // Limit state description
                    confidence: Math.round(obj.confidence * 100) / 100 // Round confidence to 2 decimal places
                })),
                alert: {
                    type: entry.alert.type,
                    message: entry.alert.message.substring(0, 150) // Limit alert message length
                },
                hasPetsOrBabies: entry.hasPetsOrBabies,
                // Compress temporal analysis data
                temporalAnalysis: entry.temporalAnalysis ? {
                    hasMovement: entry.temporalAnalysis.hasMovement,
                    movementLevel: entry.temporalAnalysis.movementLevel,
                    frameCount: entry.temporalAnalysis.frameCount
                    // Skip full temporalContext to save space
                } : null
            }));
        } catch (error) {
            console.warn('History compression failed, using original data:', error);
            return historyData;
        }
    }

    // Save history data to local storage
    function saveHistoryToLocalStorage() {
        console.log('saveHistoryToLocalStorage() called. Saving', historyData.length, 'items.'); // Added log
        try {
            // PERFORMANCE OPTIMIZATION: Compress history data before storing
            const compressedHistory = compressHistoryForStorage(historyData);
            localStorage.setItem('spotkin_history', JSON.stringify(compressedHistory));
            console.log('Compressed history saved to local storage successfully.'); // Added log
        } catch (error) {
            console.error('Error saving history to local storage:', error); // Added log
            // Try to save without compression as fallback
            try {
                localStorage.setItem('spotkin_history', JSON.stringify(historyData.slice(0, 20))); // Limit to 20 items
                console.log('Fallback: Limited history saved without compression.');
            } catch (fallbackError) {
                console.error('Fallback save also failed:', fallbackError);
            }
        }
    }

    // Load history data from local storage
    function loadHistoryFromLocalStorage() {
        console.log('loadHistoryFromLocalStorage() called.'); // Added log
        try {
            const savedHistory = localStorage.getItem('spotkin_history');
            if (savedHistory) {
                historyData = JSON.parse(savedHistory);
                console.log('History loaded from local storage.', historyData.length, 'items loaded.'); // Added log
                // Update the history display if data was loaded (use scheduled update for performance)
                if (historyData.length > 0) {
                    console.log('Scheduling history display update after loading from local storage.'); // Added log
                    scheduleHistoryUpdate();
                }
            } else {
                console.log('No history found in local storage.'); // Added log
            }
        } catch (error) {
            console.error('Error loading history from local storage:', error); // Added log
            historyData = []; // Reset history on error
        }
    }

    // Clear all history data
    function clearHistory() {
        console.log('clearHistory() called.'); // Added log
        if (confirm('Are you sure you want to clear all monitoring history?')) {
            console.log('User confirmed clearing history.'); // Added log
            historyData = [];
            saveHistoryToLocalStorage();
            scheduleHistoryUpdate();
            console.log('History cleared.'); // Added log
        } else {
            console.log('User cancelled clearing history.'); // Added log
        }
    }

    // ===== PREFERENCES SYSTEM =====

    // Default preferences
    const defaultPreferences = {
        analysisSensitivity: 'medium',
        alertMovement: true,
        alertSafety: true,
        alertUnusual: true,
        soundAlerts: true,
        defaultRefreshRate: '10000',
        movementThreshold: 1000,
        zonesEnabled: false,
        monitoringZones: [],
        // Notification settings
        notificationsEnabled: false,
        notifyDanger: true,
        notifySafety: true,
        notifyActivity: false,
        notifyMonitoring: true
    };

    // Current preferences (loaded from localStorage or defaults) - exposed globally for testing
    let userPreferences = { ...defaultPreferences };
    window.userPreferences = userPreferences;

    // DOM Elements for preferences
    const preferencesBtn = document.getElementById('preferences-btn');
    const preferencesModal = document.getElementById('preferences-modal');
    const preferencesClose = document.getElementById('preferences-close');
    const preferencesSave = document.getElementById('preferences-save');
    const preferencesReset = document.getElementById('preferences-reset');

    // Preferences form elements
    const analysisSensitivity = document.getElementById('analysis-sensitivity');
    const alertMovement = document.getElementById('alert-movement');
    const alertSafety = document.getElementById('alert-safety');
    const alertUnusual = document.getElementById('alert-unusual');
    const soundOn = document.getElementById('sound-on');
    const soundOff = document.getElementById('sound-off');
    const defaultRefreshRate = document.getElementById('default-refresh-rate');
    const movementThreshold = document.getElementById('movement-threshold');
    const movementThresholdValue = document.getElementById('movement-threshold-value');
    
    // Notification elements
    const notificationsEnabled = document.getElementById('notifications-enabled');
    const notificationControls = document.getElementById('notification-controls');
    const notifyDanger = document.getElementById('notify-danger');
    const notifySafety = document.getElementById('notify-safety');
    const notifyActivity = document.getElementById('notify-activity');
    const notifyMonitoring = document.getElementById('notify-monitoring');
    const testNotificationBtn = document.getElementById('test-notification');
    
    // Zone-related elements
    const zonesEnabled = document.getElementById('zones-enabled');
    const zoneControls = document.getElementById('zone-controls');
    const addZoneBtn = document.getElementById('add-zone');
    const clearZonesBtn = document.getElementById('clear-zones');
    const zoneList = document.getElementById('zone-list');
    
    // Camera zone elements
    const zoneToggle = document.getElementById('zone-toggle');
    const zoneStatus = document.getElementById('zone-status');
    const zoneOverlay = document.getElementById('zone-overlay');
    const zoneSvg = document.getElementById('zone-svg');

    // Load user preferences from secure storage
    async function loadUserPreferences() {
        console.log('Loading user preferences...');
        try {
            if (window.secureStorage) {
                const savedPrefs = await window.secureStorage.getItem('spotkin_preferences');
                if (savedPrefs) {
                    userPreferences = { ...defaultPreferences, ...savedPrefs };
                    window.userPreferences = userPreferences; // Update global reference
                    console.log('🔐 User preferences loaded securely:', userPreferences);
                } else {
                    console.log('No saved preferences found, using defaults');
                }
            } else {
                // Fallback to regular localStorage if secure storage not available
                const savedPrefs = localStorage.getItem('spotkin_preferences');
                if (savedPrefs) {
                    userPreferences = { ...defaultPreferences, ...JSON.parse(savedPrefs) };
                    window.userPreferences = userPreferences;
                    console.log('⚠️ User preferences loaded from fallback storage:', userPreferences);
                } else {
                    console.log('No saved preferences found, using defaults');
                }
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            userPreferences = { ...defaultPreferences };
            window.userPreferences = userPreferences; // Update global reference
        }
        
        // Apply preferences to the UI
        applyPreferencesToUI();
    }

    // Save user preferences to secure storage
    async function saveUserPreferences() {
        console.log('Saving user preferences:', userPreferences);
        try {
            if (window.secureStorage) {
                const saved = await window.secureStorage.setItem('spotkin_preferences', userPreferences);
                if (saved) {
                    console.log('🔐 Preferences saved securely');
                } else {
                    console.warn('⚠️ Failed to save preferences securely, trying fallback');
                    localStorage.setItem('spotkin_preferences', JSON.stringify(userPreferences));
                }
            } else {
                // Fallback to regular localStorage if secure storage not available
                localStorage.setItem('spotkin_preferences', JSON.stringify(userPreferences));
                console.log('⚠️ Preferences saved to fallback storage');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            // Final fallback
            try {
                localStorage.setItem('spotkin_preferences', JSON.stringify(userPreferences));
                console.log('💾 Preferences saved to emergency fallback');
            } catch (fallbackError) {
                console.error('❌ All preference saving methods failed:', fallbackError);
            }
        }
    }

    // Apply current preferences to the form UI
    function applyPreferencesToUI() {
        console.log('Applying preferences to UI');
        
        analysisSensitivity.value = userPreferences.analysisSensitivity;
        alertMovement.checked = userPreferences.alertMovement;
        alertSafety.checked = userPreferences.alertSafety;
        alertUnusual.checked = userPreferences.alertUnusual;
        
        if (userPreferences.soundAlerts) {
            soundOn.checked = true;
            soundOff.checked = false;
        } else {
            soundOn.checked = false;
            soundOff.checked = true;
        }
        
        defaultRefreshRate.value = userPreferences.defaultRefreshRate;
        movementThreshold.value = userPreferences.movementThreshold;
        movementThresholdValue.textContent = userPreferences.movementThreshold;
        
        // Apply notification preferences
        notificationsEnabled.checked = userPreferences.notificationsEnabled;
        if (userPreferences.notificationsEnabled) {
            notificationControls.classList.remove('hidden');
        }
        notifyDanger.checked = userPreferences.notifyDanger;
        notifySafety.checked = userPreferences.notifySafety;
        notifyActivity.checked = userPreferences.notifyActivity;
        notifyMonitoring.checked = userPreferences.notifyMonitoring;

        // Apply zone preferences
        zonesEnabled.checked = userPreferences.zonesEnabled;
        if (userPreferences.zonesEnabled) {
            zoneControls.classList.remove('hidden');
            currentZones = [...userPreferences.monitoringZones];
            updateZoneList();
            updateZoneDisplay();
            // Show zone toggle button if zones are enabled
            if (zoneToggle) {
                zoneToggle.classList.remove('hidden');
            }
        }
        
        // Update the main refresh rate select to match preference
        if (refreshRateSelect.value === '10000') {
            refreshRateSelect.value = userPreferences.defaultRefreshRate;
        }
    }

    // Collect preferences from the form
    function collectPreferencesFromForm() {
        return {
            analysisSensitivity: analysisSensitivity.value,
            alertMovement: alertMovement.checked,
            alertSafety: alertSafety.checked,
            alertUnusual: alertUnusual.checked,
            soundAlerts: soundOn.checked,
            defaultRefreshRate: defaultRefreshRate.value,
            movementThreshold: parseInt(movementThreshold.value),
            // Notification settings
            notificationsEnabled: notificationsEnabled.checked,
            notifyDanger: notifyDanger.checked,
            notifySafety: notifySafety.checked,
            notifyActivity: notifyActivity.checked,
            notifyMonitoring: notifyMonitoring.checked,
            // Zone settings
            zonesEnabled: zonesEnabled.checked,
            monitoringZones: [...currentZones]
        };
    }

    // Show preferences modal
    function showPreferencesModal() {
        console.log('Opening preferences modal');
        preferencesModal.classList.remove('hidden');
        applyPreferencesToUI(); // Refresh form with current settings
    }

    // Hide preferences modal
    function hidePreferencesModal() {
        console.log('Closing preferences modal');
        preferencesModal.classList.add('hidden');
    }

    // Reset preferences to defaults
    function resetPreferences() {
        console.log('Resetting preferences to defaults');
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            userPreferences = { ...defaultPreferences };
            applyPreferencesToUI();
            console.log('Preferences reset to defaults');
        }
    }

    // Save preferences from form
    async function savePreferences() {
        console.log('Saving preferences from form');
        userPreferences = collectPreferencesFromForm();
        window.userPreferences = userPreferences; // Update global reference
        await saveUserPreferences();
        
        // Queue preferences for background sync
        if (backgroundSyncManager) {
            backgroundSyncManager.queuePreferenceChange(userPreferences)
                .catch(error => {
                    console.error('❌ Failed to queue preferences for background sync:', error);
                });
        }
        
        hidePreferencesModal();
        
        // Show zone toggle button if zones are enabled
        if (userPreferences.zonesEnabled && zoneToggle) {
            zoneToggle.classList.remove('hidden');
        } else if (zoneToggle) {
            zoneToggle.classList.add('hidden');
        }
        
        // Show confirmation feedback
        const originalText = preferencesSave.textContent;
        preferencesSave.textContent = 'Saved!';
        preferencesSave.classList.add('bg-green-600');
        preferencesSave.classList.remove('bg-indigo-600');
        
        setTimeout(() => {
            preferencesSave.textContent = originalText;
            preferencesSave.classList.remove('bg-green-600');
            preferencesSave.classList.add('bg-indigo-600');
        }, 2000);
        
        console.log('Preferences saved and applied');
    }

    // Get movement threshold based on user preference
    function getMovementThreshold() {
        return userPreferences.movementThreshold;
    }

    // Get analysis sensitivity multiplier
    function getSensitivityMultiplier() {
        switch (userPreferences.analysisSensitivity) {
            case 'low': return 0.5;
            case 'high': return 1.5;
            default: return 1.0; // medium
        }
    }

    // Check if alert type is enabled
    function isAlertEnabled(alertType) {
        switch (alertType) {
            case 'movement': return userPreferences.alertMovement;
            case 'safety': return userPreferences.alertSafety;
            case 'unusual': return userPreferences.alertUnusual;
            default: return true;
        }
    }

    // Play alert sound if enabled with severity-based patterns
    function playAlertSound(severityLevel = 'medium') {
        if (userPreferences.soundAlerts) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Define sound patterns based on severity
                const soundPatterns = {
                    'minimal': { frequency: 600, duration: 0.15, beeps: 1, gap: 0 },
                    'low': { frequency: 700, duration: 0.2, beeps: 1, gap: 0 },
                    'medium': { frequency: 800, duration: 0.25, beeps: 2, gap: 0.1 },
                    'high': { frequency: 900, duration: 0.3, beeps: 3, gap: 0.1 },
                    'critical': { frequency: 1000, duration: 0.4, beeps: 4, gap: 0.08 }
                };
                
                const pattern = soundPatterns[severityLevel] || soundPatterns['medium'];
                
                // Play the specified pattern
                for (let i = 0; i < pattern.beeps; i++) {
                    const startTime = audioContext.currentTime + (i * (pattern.duration + pattern.gap));
                    
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = pattern.frequency;
                    
                    // Different volume based on severity
                    const volume = {
                        'minimal': 0.2,
                        'low': 0.25,
                        'medium': 0.3,
                        'high': 0.4,
                        'critical': 0.5
                    }[severityLevel] || 0.3;
                    
                    gainNode.gain.value = volume;
                    
                    // Add slight frequency variation for critical alerts
                    if (severityLevel === 'critical') {
                        oscillator.frequency.setValueAtTime(pattern.frequency, startTime);
                        oscillator.frequency.linearRampToValueAtTime(pattern.frequency + 100, startTime + pattern.duration / 2);
                        oscillator.frequency.linearRampToValueAtTime(pattern.frequency, startTime + pattern.duration);
                    }
                    
                    oscillator.start(startTime);
                    oscillator.stop(startTime + pattern.duration);
                }
            } catch (error) {
                console.log('Could not play alert sound:', error);
            }
        }
    }

    // Preferences Event Listeners
    preferencesBtn.addEventListener('click', showPreferencesModal);
    preferencesClose.addEventListener('click', hidePreferencesModal);
    preferencesSave.addEventListener('click', async () => {
        try {
            await savePreferences();
        } catch (error) {
            console.error('❌ Failed to save preferences:', error);
        }
    });
    preferencesReset.addEventListener('click', resetPreferences);
    
    // Setup Wizard button
    const rerunSetupBtn = document.getElementById('rerun-setup-wizard');
    if (rerunSetupBtn) {
        rerunSetupBtn.addEventListener('click', () => {
            hidePreferencesModal();
            showSetupWizard();
        });
    }
    
    // Close modal when clicking outside
    preferencesModal.addEventListener('click', (e) => {
        if (e.target === preferencesModal) {
            hidePreferencesModal();
        }
    });

    // Update threshold value display
    movementThreshold.addEventListener('input', (e) => {
        movementThresholdValue.textContent = e.target.value;
    });

    // Notification control event listeners
    notificationsEnabled.addEventListener('change', async (e) => {
        if (e.target.checked) {
            // Request notification permission
            const permission = await requestNotificationPermission();
            if (permission === 'granted') {
                notificationControls.classList.remove('hidden');
            } else {
                // Permission denied, uncheck the box
                e.target.checked = false;
                showNotificationPermissionDenied();
            }
        } else {
            notificationControls.classList.add('hidden');
        }
    });

    // Test notification button
    testNotificationBtn.addEventListener('click', async () => {
        console.log('🧪 Test notification button clicked');
        
        // Ensure we have permission first
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
            testNotification();
        } else {
            showNotificationPermissionDenied();
        }
    });

    // Zone control event listeners
    zonesEnabled.addEventListener('change', (e) => {
        if (e.target.checked) {
            zoneControls.classList.remove('hidden');
            // Show zone toggle button when zones are enabled
            if (zoneToggle) {
                zoneToggle.classList.remove('hidden');
            }
        } else {
            zoneControls.classList.add('hidden');
            zoneOverlay.classList.add('hidden');
            // Hide zone toggle button when zones are disabled
            if (zoneToggle) {
                zoneToggle.classList.add('hidden');
            }
        }
        updateZoneDisplay();
    });

    addZoneBtn.addEventListener('click', () => {
        hidePreferencesModal();
        enterZoneMode();
    });

    clearZonesBtn.addEventListener('click', clearAllZones);

    // Camera zone toggle button
    zoneToggle.addEventListener('click', toggleZoneMode);

    // ESC key to close modal or exit zone mode
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isZoneMode) {
                exitZoneMode();
            } else if (!preferencesModal.classList.contains('hidden')) {
                hidePreferencesModal();
            }
        }
    });

    // ===== MONITORING ZONE SYSTEM =====

    // Zone management state
    let currentZones = [];
    let isZoneMode = false;
    let isDrawingZone = false;
    let currentDrawingZone = null;

    // Initialize monitoring zones system
    function initializeZoneSystem() {
        console.log('Initializing monitoring zone system...');
        
        // Show the zone toggle button when camera is ready
        if (video.srcObject) {
            zoneToggle.classList.remove('hidden');
        }
        
        // Load zones from preferences
        if (userPreferences.zonesEnabled && userPreferences.monitoringZones.length > 0) {
            currentZones = [...userPreferences.monitoringZones];
            updateZoneDisplay();
        }
    }

    // Toggle zone setup mode
    function toggleZoneMode() {
        isZoneMode = !isZoneMode;
        
        if (isZoneMode) {
            enterZoneMode();
        } else {
            exitZoneMode();
        }
    }

    // Enter zone setup mode
    function enterZoneMode() {
        isZoneMode = true;
        zoneStatus.textContent = 'Drawing Mode';
        zoneOverlay.classList.remove('hidden');
        zoneOverlay.style.pointerEvents = 'all';
        
        // Add drawing event listeners
        zoneOverlay.addEventListener('mousedown', startZoneDrawing);
        zoneOverlay.addEventListener('mousemove', updateZoneDrawing);
        zoneOverlay.addEventListener('mouseup', finishZoneDrawing);
        
        // Show current zones
        updateZoneDisplay();
        
        console.log('Zone setup mode activated');
    }

    // Exit zone setup mode
    function exitZoneMode() {
        isZoneMode = false;
        isDrawingZone = false;
        currentDrawingZone = null;
        zoneStatus.textContent = 'Setup Zone';
        zoneOverlay.style.pointerEvents = 'none';
        
        // Remove drawing event listeners
        zoneOverlay.removeEventListener('mousedown', startZoneDrawing);
        zoneOverlay.removeEventListener('mousemove', updateZoneDrawing);
        zoneOverlay.removeEventListener('mouseup', finishZoneDrawing);
        
        // Hide overlay if no zones are enabled
        if (!userPreferences.zonesEnabled || currentZones.length === 0) {
            zoneOverlay.classList.add('hidden');
        }
        
        console.log('Zone setup mode deactivated');
    }

    // Start drawing a new zone
    function startZoneDrawing(e) {
        if (!isZoneMode) return;
        
        isDrawingZone = true;
        const rect = zoneOverlay.getBoundingClientRect();
        const startX = ((e.clientX - rect.left) / rect.width) * 100;
        const startY = ((e.clientY - rect.top) / rect.height) * 100;
        
        currentDrawingZone = {
            id: Date.now(),
            name: `Zone ${currentZones.length + 1}`,
            x: startX,
            y: startY,
            width: 0,
            height: 0,
            enabled: true
        };
        
        console.log('Started drawing zone at:', startX, startY);
    }

    // Update zone drawing
    function updateZoneDrawing(e) {
        if (!isDrawingZone || !currentDrawingZone) return;
        
        const rect = zoneOverlay.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / rect.width) * 100;
        const currentY = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Calculate width and height
        currentDrawingZone.width = Math.abs(currentX - currentDrawingZone.x);
        currentDrawingZone.height = Math.abs(currentY - currentDrawingZone.y);
        
        // Adjust x,y if dragging backwards
        if (currentX < currentDrawingZone.x) {
            currentDrawingZone.x = currentX;
        }
        if (currentY < currentDrawingZone.y) {
            currentDrawingZone.y = currentY;
        }
        
        // Update visual representation
        updateZoneDrawingDisplay();
    }

    // Finish drawing a zone
    function finishZoneDrawing(e) {
        if (!isDrawingZone || !currentDrawingZone) return;
        
        isDrawingZone = false;
        
        // Only add zone if it has meaningful size
        if (currentDrawingZone.width > 2 && currentDrawingZone.height > 2) {
            currentZones.push(currentDrawingZone);
            console.log('Zone created:', currentDrawingZone);
        }
        
        currentDrawingZone = null;
        updateZoneDisplay();
        updateZoneList();
    }

    // Update zone drawing display during creation
    function updateZoneDrawingDisplay() {
        if (!currentDrawingZone) return;
        
        // Clear and redraw zones
        updateZoneDisplay();
        
        // Add current drawing zone
        const drawingRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        drawingRect.setAttribute('x', `${currentDrawingZone.x}%`);
        drawingRect.setAttribute('y', `${currentDrawingZone.y}%`);
        drawingRect.setAttribute('width', `${currentDrawingZone.width}%`);
        drawingRect.setAttribute('height', `${currentDrawingZone.height}%`);
        drawingRect.setAttribute('fill', 'rgba(99, 102, 241, 0.2)');
        drawingRect.setAttribute('stroke', '#6366f1');
        drawingRect.setAttribute('stroke-width', '2');
        drawingRect.setAttribute('stroke-dasharray', '5,5');
        
        zoneSvg.appendChild(drawingRect);
    }

    // Update the visual display of all zones
    function updateZoneDisplay() {
        // Clear existing zones
        zoneSvg.innerHTML = '';
        
        if (!userPreferences.zonesEnabled) return;
        
        // Draw each zone
        currentZones.forEach((zone, index) => {
            if (!zone.enabled) return;
            
            // Create zone rectangle
            const zoneRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            zoneRect.setAttribute('x', `${zone.x}%`);
            zoneRect.setAttribute('y', `${zone.y}%`);
            zoneRect.setAttribute('width', `${zone.width}%`);
            zoneRect.setAttribute('height', `${zone.height}%`);
            zoneRect.setAttribute('fill', 'rgba(34, 197, 94, 0.15)');
            zoneRect.setAttribute('stroke', '#22c55e');
            zoneRect.setAttribute('stroke-width', '2');
            zoneRect.classList.add('zone-rect');
            
            // Add zone label
            const zoneLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            zoneLabel.setAttribute('x', `${zone.x + 1}%`);
            zoneLabel.setAttribute('y', `${zone.y + 3}%`);
            zoneLabel.setAttribute('fill', '#22c55e');
            zoneLabel.setAttribute('font-size', '10');
            zoneLabel.setAttribute('font-weight', 'bold');
            zoneLabel.textContent = zone.name;
            
            zoneSvg.appendChild(zoneRect);
            zoneSvg.appendChild(zoneLabel);
        });
    }

    // Update the zone list in preferences
    function updateZoneList() {
        zoneList.innerHTML = '';
        
        currentZones.forEach((zone, index) => {
            const zoneItem = document.createElement('div');
            zoneItem.className = 'flex items-center justify-between bg-gray-50 p-2 rounded text-xs';
            zoneItem.innerHTML = `
                <div class="flex items-center">
                    <input type="checkbox" ${zone.enabled ? 'checked' : ''} 
                           class="mr-2 zone-checkbox" data-zone-id="${zone.id}">
                    <span class="zone-name" data-zone-id="${zone.id}">${zone.name}</span>
                </div>
                <button class="text-red-600 hover:text-red-800 delete-zone" data-zone-id="${zone.id}">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            `;
            
            zoneList.appendChild(zoneItem);
        });
        
        // Add event listeners for zone controls
        zoneList.querySelectorAll('.zone-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const zoneId = parseInt(e.target.dataset.zoneId);
                const zone = currentZones.find(z => z.id === zoneId);
                if (zone) {
                    zone.enabled = e.target.checked;
                    updateZoneDisplay();
                }
            });
        });
        
        zoneList.querySelectorAll('.delete-zone').forEach(button => {
            button.addEventListener('click', (e) => {
                const zoneId = parseInt(e.target.dataset.zoneId);
                deleteZone(zoneId);
            });
        });
        
        // Make zone names editable
        zoneList.querySelectorAll('.zone-name').forEach(nameSpan => {
            nameSpan.addEventListener('dblclick', (e) => {
                const zoneId = parseInt(e.target.dataset.zoneId);
                editZoneName(zoneId, e.target);
            });
        });
    }

    // Delete a monitoring zone
    function deleteZone(zoneId) {
        currentZones = currentZones.filter(zone => zone.id !== zoneId);
        updateZoneDisplay();
        updateZoneList();
    }

    // Edit zone name
    function editZoneName(zoneId, element) {
        const zone = currentZones.find(z => z.id === zoneId);
        if (!zone) return;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = zone.name;
        input.className = 'bg-white border rounded px-1 text-xs w-20';
        
        element.replaceWith(input);
        input.focus();
        input.select();
        
        const finishEdit = () => {
            zone.name = input.value || `Zone ${currentZones.indexOf(zone) + 1}`;
            updateZoneList();
            updateZoneDisplay();
        };
        
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEdit();
            }
        });
    }

    // Clear all monitoring zones
    function clearAllZones() {
        if (currentZones.length === 0) return;
        
        if (confirm('Are you sure you want to remove all monitoring zones?')) {
            currentZones = [];
            updateZoneDisplay();
            updateZoneList();
        }
    }

    // Get zones for AI analysis (convert to absolute coordinates)
    function getActiveZones() {
        if (!userPreferences.zonesEnabled) return [];
        
        return currentZones
            .filter(zone => zone.enabled)
            .map(zone => ({
                name: zone.name,
                x: zone.x / 100,
                y: zone.y / 100,
                width: zone.width / 100,
                height: zone.height / 100
            }));
    }

    // Wait for security modules to initialize before loading preferences
    function waitForSecurityModules() {
        return new Promise((resolve) => {
            const checkModules = () => {
                if (window.spotkinSecurity && window.secureStorage) {
                    console.log('🔐 Security modules ready');
                    resolve();
                } else {
                    console.log('⏳ Waiting for security modules...');
                    setTimeout(checkModules, 100);
                }
            };
            checkModules();
        });
    }

    // Initialize preferences on load
    // Load user preferences asynchronously and then initialize zone system
    (async () => {
        try {
            await waitForSecurityModules();
            await loadUserPreferences();
            // Initialize zone system after preferences are loaded
            initializeZoneSystem();
            console.log('✅ App initialization complete');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
        }
    })();
    
    // Expose preferences functions globally for use by other parts of the app
    window.getMovementThreshold = getMovementThreshold;
    window.getSensitivityMultiplier = getSensitivityMultiplier;
    window.isAlertEnabled = isAlertEnabled;
    window.playAlertSound = playAlertSound;
    
    // Expose alert severity functions globally for testing
    window.classifyAlertSeverity = classifyAlertSeverity;
    window.createSeverityDisplay = createSeverityDisplay;
    window.displayResults = displayResults;
    
    // Expose zone functions globally for testing  
    window.getActiveZones = getActiveZones;
    window.updateZoneDisplay = updateZoneDisplay;
    window.updateZoneList = updateZoneList;
    window.collectPreferencesFromForm = collectPreferencesFromForm;
    
    // Expose zone state for testing
    Object.defineProperty(window, 'currentZones', {
        get: () => currentZones,
        set: (value) => { currentZones = value; }
    });
    
    console.log('Preferences system initialized');
    
    // Initialize daily summary system
    console.log('📊 Initializing daily summary system...');
    setTimeout(() => {
        initializeDailySummary();
    }, 1000); // Delay to ensure all other systems are loaded
    
    console.log('✅ SpotKin application fully initialized');
});

// PWA Capabilities and Offline Management
function initPWACapabilities() {
    console.log('🔧 Initializing PWA capabilities...');
    
    // Monitor online/offline status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial status check
    updateConnectionStatus();
    
    // Setup background sync registration if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        console.log('✅ Background sync supported');
    }
    
    // Setup push notifications if supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('✅ Push notifications supported');
    }
    
    // Setup installation prompt handling
    setupInstallPrompt();
    
    // Setup app shortcuts handling
    setupAppShortcuts();
    
    console.log('✅ PWA capabilities initialized');
}

function handleOnline() {
    console.log('📶 Connection restored');
    updateConnectionStatus();
    
    // Show connection restored notification
    showConnectionNotification('online');
    
    // Retry any failed operations
    retryFailedOperations();
}

function handleOffline() {
    console.log('📵 Connection lost');
    updateConnectionStatus();
    
    // Show offline notification
    showConnectionNotification('offline');
}

function updateConnectionStatus() {
    const isOnline = navigator.onLine;
    const statusIndicator = document.getElementById('connection-status') || createConnectionStatusIndicator();
    
    if (isOnline) {
        statusIndicator.innerHTML = '<i class="fas fa-wifi text-green-500"></i>';
        statusIndicator.title = 'Online';
    } else {
        statusIndicator.innerHTML = '<i class="fas fa-wifi-slash text-red-500"></i>';
        statusIndicator.title = 'Offline - Limited functionality available';
    }
}

function createConnectionStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'connection-status';
    indicator.className = 'fixed top-4 right-4 z-50 p-2 bg-white rounded-full shadow-lg';
    document.body.appendChild(indicator);
    return indicator;
}

function showConnectionNotification(status) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 left-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center';
    
    if (status === 'online') {
        notification.className += ' bg-green-600 text-white';
        notification.innerHTML = `
            <i class="fas fa-wifi mr-3"></i>
            <div>
                <p class="font-semibold">Back Online</p>
                <p class="text-sm opacity-90">All features are now available</p>
            </div>
        `;
    } else {
        notification.className += ' bg-orange-600 text-white';
        notification.innerHTML = `
            <i class="fas fa-wifi-slash mr-3"></i>
            <div>
                <p class="font-semibold">Offline Mode</p>
                <p class="text-sm opacity-90">Limited functionality - Camera still works</p>
            </div>
        `;
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

function retryFailedOperations() {
    // This could retry any queued operations that failed when offline
    console.log('🔄 Retrying failed operations...');
    // Implementation depends on specific needs
}

function initializeSplashScreen() {
    // Initialize PWA splash screen
    const splashScreen = document.getElementById('pwa-splash');
    if (!splashScreen) return;
    
    console.log('🎨 Initializing splash screen');
    
    // Track app loading progress
    let loadingTasks = 0;
    let completedTasks = 0;
    
    const updateProgress = () => {
        const progress = completedTasks / loadingTasks;
        console.log(`📊 Loading progress: ${Math.round(progress * 100)}%`);
        
        if (progress >= 1) {
            hideSplashScreen();
        }
    };
    
    // Define loading tasks
    const loadingTaskPromises = [
        // Wait for critical resources
        new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        }),
        
        // Wait for service worker registration
        new Promise(resolve => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(resolve).catch(() => resolve());
            } else {
                resolve();
            }
        }),
        
        // Minimum display time for better UX
        new Promise(resolve => setTimeout(resolve, 1500))
    ];
    
    loadingTasks = loadingTaskPromises.length;
    
    // Execute loading tasks
    loadingTaskPromises.forEach(promise => {
        promise.then(() => {
            completedTasks++;
            updateProgress();
        }).catch(() => {
            completedTasks++;
            updateProgress();
        });
    });
    
    // Fallback timeout
    setTimeout(() => {
        console.log('⏰ Splash screen timeout, force hiding');
        hideSplashScreen();
    }, 5000);
}

function hideSplashScreen() {
    const splashScreen = document.getElementById('pwa-splash');
    if (!splashScreen) return;
    
    console.log('🎨 Hiding splash screen');
    
    splashScreen.classList.add('hidden');
    
    // Remove from DOM after animation
    setTimeout(() => {
        if (splashScreen.parentNode) {
            splashScreen.parentNode.removeChild(splashScreen);
        }
    }, 500);
}

function initializeShareTarget() {
    // Initialize share target functionality for PWA
    console.log('📤 Initializing share target functionality');
    
    // Check if launched via share target
    const urlParams = new URLSearchParams(window.location.search);
    const sharedTitle = urlParams.get('title');
    const sharedText = urlParams.get('text');
    const sharedUrl = urlParams.get('url');
    
    if (sharedTitle || sharedText || sharedUrl) {
        console.log('📤 App launched via share target');
        handleSharedContent({ title: sharedTitle, text: sharedText, url: sharedUrl });
    }
    
    // Register service worker message handler for shared files
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SHARED_FILES') {
                console.log('📤 Received shared files via service worker');
                handleSharedFiles(event.data.files);
            }
        });
    }
    
    // Add share functionality to the app
    if (navigator.share) {
        console.log('📤 Native sharing supported');
        addNativeShareButtons();
    } else {
        console.log('📤 Native sharing not supported, using fallback');
        addFallbackShareButtons();
    }
}

function handleSharedContent({ title, text, url }) {
    console.log('📤 Processing shared content:', { title, text, url });
    
    // Show notification about shared content
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
        <div class="flex items-start">
            <i class="fas fa-share-alt mr-2 mt-1"></i>
            <div>
                <div class="font-semibold">Content Shared</div>
                <div class="text-sm opacity-90">
                    ${title ? `Title: ${title}` : ''}
                    ${text ? `Text: ${text.substring(0, 50)}...` : ''}
                    ${url ? `URL: ${url}` : ''}
                </div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
    
    // Process the shared content - could be used for analysis
    if (url && url.includes('image')) {
        // If shared content is an image URL, try to analyze it
        analyzeSharedImage(url);
    }
}

function handleSharedFiles(files) {
    console.log('📤 Processing shared files:', files);
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            console.log('📤 Processing shared image:', file.name);
            analyzeSharedImage(file);
        } else if (file.type.startsWith('video/')) {
            console.log('📤 Processing shared video:', file.name);
            analyzeSharedVideo(file);
        }
    });
}

function analyzeSharedImage(imageSource) {
    // Analyze shared image using SpotKin's AI capabilities
    console.log('🔍 Analyzing shared image');
    
    // Convert to canvas for analysis
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (typeof imageSource === 'string') {
        // URL
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Convert to data URL and analyze
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            performSharedImageAnalysis(dataUrl, 'Shared Image');
        };
        img.src = imageSource;
    } else {
        // File object
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                performSharedImageAnalysis(dataUrl, imageSource.name);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(imageSource);
    }
}

function performSharedImageAnalysis(imageData, filename) {
    // Use existing AI analysis functionality
    if (typeof analyzeWithAI === 'function') {
        console.log('🧠 Analyzing shared image with AI');
        
        // Switch to history tab to show results
        const historyTab = document.getElementById('tab-history');
        if (historyTab) {
            historyTab.click();
        }
        
        // Perform analysis
        analyzeWithAI(imageData, `Shared: ${filename}`)
            .then(result => {
                console.log('✅ Shared image analysis complete:', result);
                
                // Show success notification
                showNotification('Shared image analyzed successfully', 'success');
            })
            .catch(error => {
                console.error('❌ Shared image analysis failed:', error);
                showNotification('Failed to analyze shared image', 'error');
            });
    } else {
        console.warn('⚠️ AI analysis function not available');
        showNotification('Image analysis not available', 'warning');
    }
}

function analyzeSharedVideo(videoFile) {
    console.log('🎥 Shared video analysis not yet implemented');
    showNotification('Video analysis coming soon', 'info');
}

function addNativeShareButtons() {
    // Add native share buttons to appropriate places in the UI
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const shareData = {
                title: 'SpotKin Analysis',
                text: 'Check out this monitoring analysis from SpotKin',
                url: window.location.href
            };
            
            if (navigator.share) {
                navigator.share(shareData).catch(console.error);
            }
        });
    });
}

function addFallbackShareButtons() {
    // Add fallback share functionality for browsers that don't support native sharing
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const shareUrl = `${window.location.origin}${window.location.pathname}`;
            
            // Copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    showNotification('Link copied to clipboard', 'success');
                }).catch(() => {
                    showFallbackShareDialog(shareUrl);
                });
            } else {
                showFallbackShareDialog(shareUrl);
            }
        });
    });
}

function showFallbackShareDialog(url) {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 class="text-lg font-semibold mb-4">Share SpotKin</h3>
            <div class="mb-4">
                <input type="text" value="${url}" readonly 
                       class="w-full p-2 border rounded bg-gray-50" 
                       onclick="this.select()">
            </div>
            <div class="flex justify-end space-x-2">
                <button onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                    Cancel
                </button>
                <button onclick="this.previousElementSibling.previousElementSibling.querySelector('input').select(); document.execCommand('copy'); this.closest('.fixed').remove(); showNotification('Copied to clipboard', 'success')"
                        class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    Copy
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}

function setupInstallPrompt() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ Running as installed PWA');
        document.body.classList.add('pwa-installed');
    }
}

function setupAppShortcuts() {
    // Handle shortcuts from manifest when app is launched
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const shortcut = params.get('shortcut'); // Legacy support
    
    const shortcutAction = action || shortcut;
    
    if (shortcutAction) {
        console.log('🚀 Launched via shortcut:', shortcutAction);
        handleAppShortcut(shortcutAction);
        
        // Add visual feedback for shortcut usage
        showShortcutFeedback(shortcutAction);
    }
    
    // Register shortcuts with keyboard API if available
    if ('keyboard' in navigator && 'getLayoutMap' in navigator.keyboard) {
        registerKeyboardShortcuts();
    }
}

function handleAppShortcut(shortcut) {
    // Wait for app to be ready before executing shortcuts
    setTimeout(() => {
        switch (shortcut) {
            case 'snapshot':
                console.log('🔥 Executing snapshot shortcut');
                if (typeof takeSnapshot === 'function') {
                    takeSnapshot();
                } else {
                    console.warn('⚠️ takeSnapshot function not available');
                }
                break;
            case 'monitor':
                console.log('🔥 Executing monitor shortcut');
                const toggleBtn = document.getElementById('toggle-monitoring');
                if (toggleBtn && toggleBtn.textContent.includes('Start')) {
                    toggleBtn.click();
                } else {
                    console.warn('⚠️ Monitor toggle button not available or already monitoring');
                }
                break;
            case 'history':
                console.log('🔥 Executing history shortcut');
                const historyTab = document.getElementById('tab-history');
                if (historyTab) {
                    historyTab.click();
                } else {
                    console.warn('⚠️ History tab not available');
                }
                break;
            case 'settings':
                console.log('🔥 Executing settings shortcut');
                const settingsTab = document.getElementById('tab-settings');
                if (settingsTab) {
                    settingsTab.click();
                } else {
                    console.warn('⚠️ Settings tab not available');
                }
                break;
            default:
                console.warn('⚠️ Unknown shortcut action:', shortcut);
        }
    }, 2000);
}

function showShortcutFeedback(action) {
    // Show visual feedback when app is launched via shortcut
    const messages = {
        'snapshot': 'Quick Snapshot Mode Activated',
        'monitor': 'Starting Monitoring Mode',
        'history': 'Opening Monitoring History',
        'settings': 'Opening Settings'
    };
    
    const message = messages[action] || `Shortcut activated: ${action}`;
    
    // Create temporary notification banner
    const banner = document.createElement('div');
    banner.className = 'fixed top-0 left-0 right-0 bg-indigo-600 text-white p-3 text-center z-50 transform -translate-y-full transition-transform duration-300';
    banner.innerHTML = `
        <div class="flex items-center justify-center">
            <i class="fas fa-rocket mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(banner);
    
    // Animate in
    setTimeout(() => {
        banner.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        banner.style.transform = 'translateY(-100%)';
        setTimeout(() => {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
        }, 300);
    }, 3000);
}

function registerKeyboardShortcuts() {
    // Register keyboard shortcuts for PWA
    const shortcuts = [
        { key: 'KeyS', ctrlKey: true, action: 'snapshot', description: 'Take snapshot (Ctrl+S)' },
        { key: 'KeyM', ctrlKey: true, action: 'monitor', description: 'Toggle monitoring (Ctrl+M)' },
        { key: 'KeyH', ctrlKey: true, action: 'history', description: 'View history (Ctrl+H)' },
        { key: 'KeyP', ctrlKey: true, action: 'settings', description: 'Open settings (Ctrl+P)' }
    ];
    
    document.addEventListener('keydown', (event) => {
        // Only handle shortcuts when not typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const shortcut = shortcuts.find(s => 
            s.key === event.code && 
            s.ctrlKey === event.ctrlKey &&
            !event.altKey && 
            !event.shiftKey
        );
        
        if (shortcut) {
            event.preventDefault();
            console.log('⌨️ Keyboard shortcut triggered:', shortcut.action);
            handleAppShortcut(shortcut.action);
            showShortcutFeedback(shortcut.action);
        }
    });
    
    console.log('⌨️ Keyboard shortcuts registered:', shortcuts.map(s => s.description));
}

// PWA-enhanced error handling
function handlePWAError(error, context = '') {
    if (!navigator.onLine) {
        // Special handling for offline errors
        console.log('🔌 Offline error detected:', error);
        showOfflineErrorMessage(context);
        return true; // Handled
    }
    return false; // Not handled, continue with normal error handling
}

function showOfflineErrorMessage(context) {
    const message = document.createElement('div');
    message.className = 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50';
    message.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas fa-info-circle mr-3"></i>
                <div>
                    <p class="font-semibold">Offline Mode</p>
                    <p class="text-sm opacity-90">${context || 'This feature requires an internet connection'}</p>
                </div>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="text-blue-200 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}

// Enhanced local storage with PWA awareness
function saveToLocalStorageWithSync(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        
        // Queue for background sync if offline and service worker is available
        if (!navigator.onLine && 'serviceWorker' in navigator) {
            queueForBackgroundSync(key, data);
        }
        
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
}

function queueForBackgroundSync(key, data) {
    // This would queue data for sync when back online
    // Implementation would depend on specific sync requirements
    console.log('📝 Queued for background sync:', key);
}

// NOTIFICATION SYSTEM IMPLEMENTATION

// Request notification permission
async function requestNotificationPermission() {
    console.log('🔔 Requesting notification permission...');
    
    if (!('Notification' in window)) {
        console.warn('❌ This browser does not support notifications');
        return 'denied';
    }
    
    if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
        return 'granted';
    }
    
    if (Notification.permission === 'denied') {
        console.log('❌ Notification permission was previously denied');
        return 'denied';
    }
    
    try {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission result:', permission);
        return permission;
    } catch (error) {
        console.error('❌ Error requesting notification permission:', error);
        return 'denied';
    }
}

// Show notification permission denied message
function showNotificationPermissionDenied() {
    const message = document.createElement('div');
    message.className = 'fixed bottom-4 left-4 right-4 bg-yellow-600 text-white p-4 rounded-lg shadow-lg z-50';
    message.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas fa-bell-slash mr-3"></i>
                <div>
                    <p class="font-semibold">Notifications Blocked</p>
                    <p class="text-sm opacity-90">Enable notifications in your browser settings to receive alerts</p>
                </div>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="text-yellow-200 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 6000);
}

// Send notification based on alert analysis
function sendCriticalNotification(alertData) {
    // Check if notifications are enabled and we have permission
    if (!userPreferences.notificationsEnabled || Notification.permission !== 'granted') {
        console.log('📵 Notifications disabled or no permission');
        return;
    }
    
    // Determine if we should send this notification based on user preferences
    if (!shouldSendNotification(alertData)) {
        console.log('🔇 Notification filtered by user preferences');
        return;
    }
    
    console.log('🔔 Sending critical notification:', alertData);
    
    // Create notification content
    const notificationData = createNotificationContent(alertData);
    
    // Send via service worker if available, otherwise use direct notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Send via service worker for better reliability
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            data: notificationData
        });
    } else {
        // Direct notification
        showDirectNotification(notificationData);
    }
}

// Determine if notification should be sent based on user preferences
function shouldSendNotification(alertData) {
    const { alert, severity } = alertData;
    
    // Always send danger alerts if enabled
    if (severity >= 7 && userPreferences.notifyDanger) {
        return true;
    }
    
    // Safety concerns (medium priority)
    if (severity >= 5 && severity < 7 && userPreferences.notifySafety) {
        return true;
    }
    
    // General activity (low priority)
    if (severity < 5 && userPreferences.notifyActivity) {
        return true;
    }
    
    return false;
}

// Create notification content based on alert data
function createNotificationContent(alertData) {
    const { alert, severity, scene, hasPetsOrBabies } = alertData;
    
    let title = 'SpotKin Alert';
    let body = alert.message;
    let icon = './images/icon-192.png';
    let badge = './images/badge.png';
    let tag = 'spotkin-alert';
    let requireInteraction = false;
    
    // Customize based on severity
    if (severity >= 7) {
        title = '🚨 High Priority Alert - SpotKin';
        requireInteraction = true;
        tag = 'spotkin-danger';
    } else if (severity >= 5) {
        title = '⚠️ Safety Alert - SpotKin';
        tag = 'spotkin-safety';
    } else {
        title = '📋 Activity Alert - SpotKin';
        tag = 'spotkin-activity';
    }
    
    // Add context about subjects
    if (hasPetsOrBabies) {
        const subjects = hasPetsOrBabies.babies ? 'baby' : 'pet';
        body += ` (${subjects} detected in scene)`;
    }
    
    return {
        title,
        options: {
            body,
            icon,
            badge,
            tag,
            requireInteraction,
            vibrate: severity >= 7 ? [200, 100, 200, 100, 200] : [200, 100, 200],
            data: {
                alertData,
                timestamp: Date.now(),
                severity
            },
            actions: [
                {
                    action: 'view',
                    title: 'View Details',
                    icon: './images/icon-view.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss',
                    icon: './images/icon-dismiss.png'
                }
            ]
        }
    };
}

// Show direct notification (fallback when no service worker)
function showDirectNotification(notificationData) {
    try {
        const notification = new Notification(notificationData.title, notificationData.options);
        
        notification.onclick = function(event) {
            console.log('🔔 Notification clicked');
            event.preventDefault();
            
            // Focus or open the app window
            if (window.focus) {
                window.focus();
            }
            
            // Close the notification
            notification.close();
        };
        
        // Auto-close after timeout (except for high priority)
        if (!notificationData.options.requireInteraction) {
            setTimeout(() => {
                notification.close();
            }, 8000);
        }
        
    } catch (error) {
        console.error('❌ Failed to show notification:', error);
    }
}

// Send monitoring status notifications
function sendMonitoringNotification(status, message) {
    if (!userPreferences.notifyMonitoring || !userPreferences.notificationsEnabled) {
        return;
    }
    
    const notificationData = {
        title: 'SpotKin Monitoring',
        options: {
            body: message,
            icon: './images/icon-192.png',
            tag: 'spotkin-monitoring',
            vibrate: [100, 50, 100],
            data: {
                type: 'monitoring',
                status,
                timestamp: Date.now()
            }
        }
    };
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            data: notificationData
        });
    } else {
        showDirectNotification(notificationData);
    }
}

// Test notification function (for debugging)
function testNotification() {
    console.log('🧪 Testing notification...');
    
    const testData = {
        alert: { message: 'This is a test notification from SpotKin' },
        severity: 6,
        scene: 'Test scene for notification',
        hasPetsOrBabies: { babies: false, pets: true }
    };
    
    sendCriticalNotification(testData);
}

// SETUP WIZARD FUNCTIONALITY
class SetupWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.setupData = {
            monitorType: null,
            cameraPosition: null,
            monitoringZones: [],
            alertPreferences: {},
            completed: false
        };
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Navigation buttons
        document.getElementById('setup-next')?.addEventListener('click', () => this.nextStep());
        document.getElementById('setup-prev')?.addEventListener('click', () => this.prevStep());
        document.getElementById('setup-skip')?.addEventListener('click', () => this.skipSetup());
        document.getElementById('setup-finish')?.addEventListener('click', () => this.finishSetup());
        document.getElementById('setup-wizard-close')?.addEventListener('click', () => this.closeWizard());
        
        // Monitor type selection
        document.querySelectorAll('input[name="monitor-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setupData.monitorType = e.target.value;
                this.updateMonitorTypeSelection(e.target.value);
            });
        });
        
        // Camera controls
        document.getElementById('wizard-start-camera')?.addEventListener('click', () => this.startWizardCamera());
        document.getElementById('wizard-switch-camera')?.addEventListener('click', () => this.switchWizardCamera());
        
        // Zone controls
        document.getElementById('wizard-add-zone')?.addEventListener('click', () => this.addMonitoringZone());
        document.getElementById('wizard-clear-zones')?.addEventListener('click', () => this.clearMonitoringZones());
        
        // Skip zones checkbox
        document.getElementById('skip-zones')?.addEventListener('change', (e) => {
            this.setupData.skipZones = e.target.checked;
        });
        
        // Monitor type cards
        document.querySelectorAll('.monitor-type-card').forEach(card => {
            card.addEventListener('click', () => {
                const radio = card.parentNode.querySelector('input[type="radio"]');
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            });
        });
    }
    
    show() {
        const modal = document.getElementById('setup-wizard');
        if (modal) {
            modal.classList.remove('hidden');
            this.currentStep = 1;
            this.updateWizardDisplay();
            
            // Focus first interactive element
            setTimeout(() => {
                const firstRadio = document.querySelector('input[name="monitor-type"]');
                if (firstRadio) firstRadio.focus();
            }, 300);
        }
    }
    
    hide() {
        const modal = document.getElementById('setup-wizard');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    nextStep() {
        if (!this.validateCurrentStep()) {
            return;
        }
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateWizardDisplay();
            this.populateStepContent();
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateWizardDisplay();
        }
    }
    
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                if (!this.setupData.monitorType) {
                    this.showValidationError('Please select a monitoring type');
                    return false;
                }
                break;
            case 2:
                // Camera setup is optional, just show warning if skipped
                if (!this.setupData.cameraPosition) {
                    const proceed = confirm('Camera preview not set up. You can set this up later. Continue?');
                    return proceed;
                }
                break;
            case 3:
                // Zones are optional
                return true;
            case 4:
                // Preferences have defaults
                return true;
        }
        return true;
    }
    
    updateWizardDisplay() {
        // Update progress indicators
        for (let i = 1; i <= this.totalSteps; i++) {
            const indicator = document.getElementById(`step-${i}-indicator`);
            const progress = document.getElementById(`progress-${i}-${i + 1}`);
            
            if (indicator) {
                if (i < this.currentStep) {
                    indicator.className = 'flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-semibold';
                    indicator.innerHTML = '<i class="fas fa-check"></i>';
                } else if (i === this.currentStep) {
                    indicator.className = 'flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold';
                    indicator.textContent = i;
                } else {
                    indicator.className = 'flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-gray-500 font-semibold';
                    indicator.textContent = i;
                }
            }
            
            if (progress) {
                progress.className = i < this.currentStep ? 'w-16 h-1 bg-green-600' : 'w-16 h-1 bg-gray-300';
            }
        }
        
        // Update progress text
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
        }
        
        // Show/hide steps
        document.querySelectorAll('.setup-step').forEach((step, index) => {
            step.classList.toggle('hidden', index + 1 !== this.currentStep);
        });
        
        // Update navigation buttons
        const prevBtn = document.getElementById('setup-prev');
        const nextBtn = document.getElementById('setup-next');
        const finishBtn = document.getElementById('setup-finish');
        
        if (prevBtn) {
            prevBtn.classList.toggle('hidden', this.currentStep === 1);
        }
        
        if (nextBtn) {
            nextBtn.classList.toggle('hidden', this.currentStep === this.totalSteps);
        }
        
        if (finishBtn) {
            finishBtn.classList.toggle('hidden', this.currentStep !== this.totalSteps);
        }
    }
    
    updateMonitorTypeSelection(type) {
        // Update UI to show selected type
        document.querySelectorAll('.monitor-type-card').forEach(card => {
            const radio = card.parentNode.querySelector('input[type="radio"]');
            if (radio.value === type) {
                card.style.borderColor = '#4f46e5';
                card.style.backgroundColor = '#f0f9ff';
            } else {
                card.style.borderColor = '#d1d5db';
                card.style.backgroundColor = 'transparent';
            }
        });
    }
    
    populateStepContent() {
        switch (this.currentStep) {
            case 2:
                this.populateCameraPositioningTips();
                break;
            case 4:
                this.populateAlertTypes();
                break;
        }
    }
    
    populateCameraPositioningTips() {
        const tipsContainer = document.getElementById('positioning-tips');
        if (!tipsContainer) return;
        
        const tips = {
            baby: [
                'Position camera to view the entire crib or sleeping area',
                'Mount at least 3 feet away from the baby',
                'Ensure clear view of the baby\'s face and chest',
                'Avoid placing camera directly above to prevent falling',
                'Consider multiple angles for comprehensive coverage'
            ],
            pet: [
                'Position to cover main activity areas',
                'Include food, water, and favorite resting spots',
                'Mount high enough to avoid pet interference',
                'Cover entry/exit points if monitoring unsupervised time',
                'Consider outdoor access areas if applicable'
            ],
            general: [
                'Focus on main entry points and valuable areas',
                'Ensure good coverage of high-traffic zones',
                'Position to minimize blind spots',
                'Consider lighting conditions throughout the day',
                'Mount securely to prevent tampering'
            ]
        };
        
        const selectedTips = tips[this.setupData.monitorType] || tips.general;
        tipsContainer.innerHTML = selectedTips.map(tip => `<li>• ${tip}</li>`).join('');
    }
    
    populateAlertTypes() {
        const typesContainer = document.getElementById('wizard-alert-types');
        if (!typesContainer) return;
        
        const alertTypes = {
            baby: [
                { id: 'cry-detection', label: 'Crying detection', checked: true },
                { id: 'movement-alerts', label: 'Unusual movement patterns', checked: true },
                { id: 'position-alerts', label: 'Position changes', checked: true },
                { id: 'safety-hazards', label: 'Safety hazards in area', checked: true },
                { id: 'no-movement', label: 'Extended periods of no movement', checked: false }
            ],
            pet: [
                { id: 'distress-sounds', label: 'Distress sounds', checked: true },
                { id: 'unusual-behavior', label: 'Unusual behavior patterns', checked: true },
                { id: 'activity-levels', label: 'Abnormal activity levels', checked: false },
                { id: 'area-access', label: 'Access to restricted areas', checked: true },
                { id: 'destructive-behavior', label: 'Destructive behavior', checked: false }
            ],
            general: [
                { id: 'motion-detection', label: 'Motion detection', checked: true },
                { id: 'security-alerts', label: 'Security concerns', checked: true },
                { id: 'unusual-activity', label: 'Unusual activity', checked: true },
                { id: 'area-intrusion', label: 'Restricted area intrusion', checked: false }
            ]
        };
        
        const selectedTypes = alertTypes[this.setupData.monitorType] || alertTypes.general;
        
        typesContainer.innerHTML = selectedTypes.map(type => `
            <label class="flex items-center">
                <input type="checkbox" id="wizard-${type.id}" class="form-checkbox" ${type.checked ? 'checked' : ''}>
                <span class="ml-2 text-sm">${type.label}</span>
            </label>
        `).join('');
    }
    
    startWizardCamera() {
        // This would integrate with existing camera functionality
        console.log('Starting wizard camera...');
        // For now, just show a placeholder
        const preview = document.getElementById('wizard-camera-preview');
        if (preview) {
            preview.innerHTML = '<div class="text-green-600"><i class="fas fa-video text-4xl mb-2"></i><p>Camera active (preview)</p></div>';
        }
        this.setupData.cameraPosition = 'configured';
    }
    
    switchWizardCamera() {
        console.log('Switching wizard camera...');
        // This would integrate with camera switching logic
    }
    
    addMonitoringZone() {
        console.log('Adding monitoring zone...');
        // This would integrate with zone drawing functionality
        const canvas = document.getElementById('wizard-zone-canvas');
        if (canvas) {
            // Simple placeholder zone
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 2;
            ctx.strokeRect(50, 50, 200, 100);
            
            this.setupData.monitoringZones.push({
                x: 50, y: 50, width: 200, height: 100
            });
        }
    }
    
    clearMonitoringZones() {
        const canvas = document.getElementById('wizard-zone-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        this.setupData.monitoringZones = [];
    }
    
    skipSetup() {
        if (confirm('Are you sure you want to skip the setup wizard? You can always run it again later from settings.')) {
            this.closeWizard();
            this.markSetupCompleted(false);
        }
    }
    
    finishSetup() {
        // Collect final preferences
        this.collectFinalPreferences();
        
        // Apply settings
        this.applySetupSettings();
        
        // Mark setup as completed
        this.markSetupCompleted(true);
        
        // Close wizard
        this.closeWizard();
        
        // Show success message
        this.showCompletionMessage();
    }
    
    collectFinalPreferences() {
        this.setupData.alertPreferences = {
            sensitivity: document.getElementById('wizard-sensitivity')?.value || 'medium',
            soundAlerts: document.getElementById('wizard-sound-alerts')?.checked || false,
            pushNotifications: document.getElementById('wizard-push-notifications')?.checked || false,
            visualAlerts: document.getElementById('wizard-visual-alerts')?.checked || false
        };
        
        // Collect alert type preferences
        const alertTypes = {};
        document.querySelectorAll('#wizard-alert-types input[type="checkbox"]').forEach(checkbox => {
            alertTypes[checkbox.id.replace('wizard-', '')] = checkbox.checked;
        });
        this.setupData.alertPreferences.alertTypes = alertTypes;
    }
    
    applySetupSettings() {
        // Apply settings to the main application
        const preferences = {
            ...this.setupData.alertPreferences,
            monitorType: this.setupData.monitorType,
            setupCompleted: true
        };
        
        // Save to localStorage
        localStorage.setItem('spotkin-setup-data', JSON.stringify(this.setupData));
        
        // Apply to existing preference system
        if (typeof updateUserPreferences === 'function') {
            updateUserPreferences(preferences);
        }
        
        console.log('✅ Setup wizard completed:', this.setupData);
    }
    
    markSetupCompleted(completed) {
        localStorage.setItem('spotkin-setup-completed', completed.toString());
        this.setupData.completed = completed;
    }
    
    closeWizard() {
        this.hide();
    }
    
    showCompletionMessage() {
        // Show a success notification
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
        message.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-3 text-xl"></i>
                <div>
                    <p class="font-semibold">Setup Complete!</p>
                    <p class="text-sm opacity-90">SpotKin is ready to monitor your ${this.setupData.monitorType || 'area'}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
        
        // Scroll to demo section
        setTimeout(() => {
            const demoSection = document.getElementById('demo');
            if (demoSection) {
                demoSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 1000);
    }
    
    showValidationError(message) {
        // Show validation error
        const error = document.createElement('div');
        error.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
        error.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-3"></i>
                <p class="text-sm">${message}</p>
            </div>
        `;
        
        document.body.appendChild(error);
        
        setTimeout(() => {
            if (error.parentNode) {
                error.parentNode.removeChild(error);
            }
        }, 3000);
    }
    
    static shouldShowSetup() {
        const completed = localStorage.getItem('spotkin-setup-completed');
        return completed !== 'true' && completed !== 'false'; // Show on first visit
    }
    
    static showSetupIfNeeded() {
        if (SetupWizard.shouldShowSetup()) {
            const wizard = new SetupWizard();
            // Show setup after a brief delay to let page load
            setTimeout(() => wizard.show(), 1000);
            return wizard;
        }
        return null;
    }
}

// Initialize Setup Wizard
let setupWizard = null;

// Show setup wizard on first visit
document.addEventListener('DOMContentLoaded', () => {
    setupWizard = SetupWizard.showSetupIfNeeded();
});

// Add button to rerun setup wizard (for testing/access later)
function showSetupWizard() {
    if (!setupWizard) {
        setupWizard = new SetupWizard();
    }
    setupWizard.show();
}

// Help Modal Functionality
document.addEventListener('DOMContentLoaded', () => {
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const helpCloseBtn = helpModal?.querySelector('.close-help');
    const helpTabs = helpModal?.querySelectorAll('.help-tab');
    const helpContents = helpModal?.querySelectorAll('.help-content');

    // Open help modal
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            if (helpModal) {
                helpModal.classList.remove('hidden');
                // Focus on first tab
                const firstTab = helpModal.querySelector('.help-tab');
                if (firstTab) firstTab.click();
            }
        });
    }

    // Close help modal
    if (helpCloseBtn) {
        helpCloseBtn.addEventListener('click', () => {
            if (helpModal) {
                helpModal.classList.add('hidden');
            }
        });
    }

    // Close modal when clicking backdrop
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.add('hidden');
            }
        });
    }

    // Handle tab switching
    if (helpTabs) {
        helpTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetContent = tab.getAttribute('data-tab');
                
                // Remove active state from all tabs and contents
                helpTabs.forEach(t => t.classList.remove('border-blue-500', 'text-blue-600'));
                helpContents.forEach(c => c.classList.add('hidden'));
                
                // Add active state to clicked tab
                tab.classList.add('border-blue-500', 'text-blue-600');
                
                // Show corresponding content
                const content = helpModal.querySelector(`#help-${targetContent}`);
                if (content) {
                    content.classList.remove('hidden');
                }
            });
        });
    }

    // Keyboard navigation for help modal
    if (helpModal) {
        helpModal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                helpModal.classList.add('hidden');
            }
        });
    }
});

// Background Sync Manager
class BackgroundSyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = new Map();
        this.syncInProgress = false;
        this.maxRetries = 3;
        
        this.initEventListeners();
    }

    initEventListeners() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('🌐 Network back online - triggering background sync');
            this.isOnline = true;
            this.triggerBackgroundSync();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Network offline - queuing operations');
            this.isOnline = false;
        });
    }

    async queueSnapshot(imageData, settings = {}) {
        try {
            if (this.isOnline) {
                // Process immediately if online
                return await this.processSnapshotOnline(imageData, settings);
            } else {
                // Queue for later processing
                await this.addToQueue('snapshots', {
                    imageData,
                    settings,
                    type: 'snapshot'
                });
                console.log('📸 Snapshot queued for background sync');
                return { queued: true, message: 'Snapshot will be processed when online' };
            }
        } catch (error) {
            console.error('❌ Failed to queue snapshot:', error);
            // Still queue it even if initial processing fails
            await this.addToQueue('snapshots', {
                imageData,
                settings,
                type: 'snapshot',
                error: error.message
            });
            throw error;
        }
    }

    async queueTimelineEvent(eventData) {
        try {
            if (this.isOnline) {
                return await this.processTimelineEventOnline(eventData);
            } else {
                await this.addToQueue('timeline', {
                    data: eventData,
                    type: 'timeline'
                });
                console.log('📊 Timeline event queued for background sync');
                return { queued: true };
            }
        } catch (error) {
            console.error('❌ Failed to queue timeline event:', error);
            await this.addToQueue('timeline', {
                data: eventData,
                type: 'timeline',
                error: error.message
            });
            throw error;
        }
    }

    async queuePreferenceChange(preferences) {
        try {
            if (this.isOnline) {
                return await this.processPreferencesOnline(preferences);
            } else {
                await this.addToQueue('preferences', {
                    data: preferences,
                    type: 'preferences'
                });
                console.log('⚙️ Preferences queued for background sync');
                return { queued: true };
            }
        } catch (error) {
            console.error('❌ Failed to queue preference change:', error);
            await this.addToQueue('preferences', {
                data: preferences,
                type: 'preferences',
                error: error.message
            });
        }
    }

    async queueAlert(alertData, priority = 'safe') {
        try {
            if (this.isOnline && priority === 'danger') {
                // Critical alerts should be processed immediately even if online
                return await this.processAlertOnline(alertData, priority);
            } else {
                await this.addToQueue('alerts', {
                    data: alertData,
                    priority,
                    type: 'alert'
                });
                console.log(`🚨 ${priority.toUpperCase()} alert queued for background sync`);
                return { queued: true };
            }
        } catch (error) {
            console.error('❌ Failed to queue alert:', error);
            await this.addToQueue('alerts', {
                data: alertData,
                priority,
                type: 'alert',
                error: error.message
            });
        }
    }

    async addToQueue(storeName, data) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Send to service worker for IndexedDB storage
            navigator.serviceWorker.controller.postMessage({
                type: 'QUEUE_FOR_SYNC',
                storeName,
                data
            });
        } else {
            // Fallback: store in localStorage temporarily
            const queueKey = `spotkin-sync-queue-${storeName}`;
            let queue = [];
            try {
                const stored = localStorage.getItem(queueKey);
                queue = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.warn('Failed to parse sync queue from localStorage');
            }
            
            queue.push({
                ...data,
                timestamp: Date.now(),
                id: Date.now() + Math.random()
            });
            
            // Keep queue manageable (max 50 items per type)
            if (queue.length > 50) {
                queue = queue.slice(-50);
            }
            
            localStorage.setItem(queueKey, JSON.stringify(queue));
        }
    }

    async triggerBackgroundSync() {
        if (this.syncInProgress) {
            console.log('🔄 Background sync already in progress');
            return;
        }

        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Worker not supported - using fallback sync');
            return this.fallbackSync();
        }

        try {
            this.syncInProgress = true;
            const registration = await navigator.serviceWorker.ready;
            
            if ('sync' in registration) {
                // Register different sync events
                await registration.sync.register('background-snapshot');
                await registration.sync.register('background-timeline');
                await registration.sync.register('background-preferences');
                await registration.sync.register('background-alerts');
                
                console.log('✅ Background sync registered successfully');
                this.showSyncStatus('Syncing queued data...', 'info');
            } else {
                console.warn('⚠️ Background Sync not supported - using fallback');
                return this.fallbackSync();
            }
        } catch (error) {
            console.error('❌ Failed to trigger background sync:', error);
            this.fallbackSync();
        } finally {
            this.syncInProgress = false;
        }
    }

    async fallbackSync() {
        console.log('🔄 Running fallback sync...');
        
        const syncTypes = ['snapshots', 'timeline', 'preferences', 'alerts'];
        
        for (const type of syncTypes) {
            try {
                const queueKey = `spotkin-sync-queue-${type}`;
                const stored = localStorage.getItem(queueKey);
                
                if (stored) {
                    const queue = JSON.parse(stored);
                    console.log(`📋 Processing ${queue.length} queued ${type}`);
                    
                    const processedItems = [];
                    
                    for (const item of queue) {
                        try {
                            await this.processFallbackItem(type, item);
                            processedItems.push(item.id);
                            console.log(`✅ Processed ${type} item ${item.id}`);
                        } catch (error) {
                            console.error(`❌ Failed to process ${type} item ${item.id}:`, error);
                            
                            // Implement retry logic
                            item.retryCount = (item.retryCount || 0) + 1;
                            if (item.retryCount >= this.maxRetries) {
                                console.log(`🗑️ Max retries exceeded for ${type} item ${item.id}, removing`);
                                processedItems.push(item.id);
                            }
                        }
                    }
                    
                    // Remove processed items from queue
                    if (processedItems.length > 0) {
                        const updatedQueue = queue.filter(item => !processedItems.includes(item.id));
                        if (updatedQueue.length === 0) {
                            localStorage.removeItem(queueKey);
                        } else {
                            localStorage.setItem(queueKey, JSON.stringify(updatedQueue));
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Fallback sync failed for ${type}:`, error);
            }
        }
        
        this.showSyncStatus('Sync completed', 'success');
    }

    async processFallbackItem(type, item) {
        switch (type) {
            case 'snapshots':
                return await this.processSnapshotOnline(item.imageData, item.settings);
            case 'timeline':
                return await this.processTimelineEventOnline(item.data);
            case 'preferences':
                return await this.processPreferencesOnline(item.data);
            case 'alerts':
                return await this.processAlertOnline(item.data, item.priority);
            default:
                throw new Error(`Unknown sync type: ${type}`);
        }
    }

    async processSnapshotOnline(imageData, settings) {
        // Mock processing - in real app this would send to AI service
        console.log('📸 Processing snapshot online');
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    processed: true,
                    timestamp: Date.now()
                });
            }, 1000);
        });
    }

    async processTimelineEventOnline(eventData) {
        console.log('📊 Processing timeline event online');
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, synced: true });
            }, 500);
        });
    }

    async processPreferencesOnline(preferences) {
        console.log('⚙️ Syncing preferences online');
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, synced: true });
            }, 300);
        });
    }

    async processAlertOnline(alertData, priority) {
        console.log(`🚨 Processing ${priority} alert online`);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, delivered: true });
            }, priority === 'danger' ? 100 : 500);
        });
    }

    showSyncStatus(message, type = 'info') {
        const statusEl = document.getElementById('sync-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `fixed bottom-20 left-4 p-2 rounded text-white text-sm transition-opacity ${
                type === 'success' ? 'bg-green-600' : 
                type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            }`;
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                statusEl.style.opacity = '0';
                setTimeout(() => statusEl.remove(), 300);
            }, 3000);
        } else {
            // Create status element if it doesn't exist
            const status = document.createElement('div');
            status.id = 'sync-status';
            status.textContent = message;
            status.className = `fixed bottom-20 left-4 p-2 rounded text-white text-sm transition-opacity ${
                type === 'success' ? 'bg-green-600' : 
                type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            }`;
            document.body.appendChild(status);
            
            setTimeout(() => {
                status.style.opacity = '0';
                setTimeout(() => status.remove(), 300);
            }, 3000);
        }
    }

    getQueueStatus() {
        const status = {};
        const syncTypes = ['snapshots', 'timeline', 'preferences', 'alerts'];
        
        for (const type of syncTypes) {
            try {
                const queueKey = `spotkin-sync-queue-${type}`;
                const stored = localStorage.getItem(queueKey);
                const queue = stored ? JSON.parse(stored) : [];
                status[type] = {
                    count: queue.length,
                    lastQueued: queue.length > 0 ? Math.max(...queue.map(item => item.timestamp)) : null
                };
            } catch (error) {
                status[type] = { count: 0, error: error.message };
            }
        }
        
        return status;
    }

    async clearQueue(type = null) {
        if (type) {
            localStorage.removeItem(`spotkin-sync-queue-${type}`);
            console.log(`🧹 Cleared ${type} sync queue`);
        } else {
            const syncTypes = ['snapshots', 'timeline', 'preferences', 'alerts'];
            syncTypes.forEach(t => localStorage.removeItem(`spotkin-sync-queue-${t}`));
            console.log('🧹 Cleared all sync queues');
        }
    }
}

// Initialize background sync
let backgroundSyncManager;

document.addEventListener('DOMContentLoaded', () => {
    backgroundSyncManager = new BackgroundSyncManager();
    console.log('🔄 Background Sync Manager initialized');
    
    // Initialize background sync UI
    initBackgroundSyncUI();
});

// Enhanced retryFailedOperations function with background sync integration
function retryFailedOperations() {
    console.log('🔄 Retrying failed operations via background sync...');
    if (backgroundSyncManager) {
        backgroundSyncManager.triggerBackgroundSync();
    }
}

// Background Sync UI Management
function initBackgroundSyncUI() {
    console.log('🎨 Initializing Background Sync UI...');
    
    // Update sync status display periodically
    updateSyncStatusDisplay();
    setInterval(updateSyncStatusDisplay, 10000); // Update every 10 seconds
    
    // Manual sync button
    const manualSyncBtn = document.getElementById('manual-sync-btn');
    if (manualSyncBtn) {
        manualSyncBtn.addEventListener('click', async () => {
            try {
                manualSyncBtn.disabled = true;
                manualSyncBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Syncing...';
                
                if (backgroundSyncManager) {
                    await backgroundSyncManager.triggerBackgroundSync();
                    showSyncNotification('Manual sync completed successfully', 'success');
                } else {
                    throw new Error('Background sync manager not available');
                }
            } catch (error) {
                console.error('❌ Manual sync failed:', error);
                showSyncNotification('Manual sync failed: ' + error.message, 'error');
            } finally {
                manualSyncBtn.disabled = false;
                manualSyncBtn.innerHTML = '<i class="fas fa-sync mr-2"></i>Sync Now';
                updateSyncStatusDisplay();
            }
        });
    }
    
    // View sync details button
    const viewDetailsBtn = document.getElementById('view-sync-details-btn');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => {
            showSyncDetailsModal();
        });
    }
    
    // Clear sync queue button
    const clearQueueBtn = document.getElementById('clear-sync-queue-btn');
    if (clearQueueBtn) {
        clearQueueBtn.addEventListener('click', () => {
            showClearQueueConfirmation();
        });
    }
    
    // Sync preferences event listeners
    const autoSyncEnabled = document.getElementById('auto-sync-enabled');
    const wifiOnlySync = document.getElementById('wifi-only-sync');
    const batterySaverSync = document.getElementById('battery-saver-sync');
    
    [autoSyncEnabled, wifiOnlySync, batterySaverSync].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', saveSyncPreferences);
        }
    });
    
    // Load saved sync preferences
    loadSyncPreferences();
}

async function updateSyncStatusDisplay() {
    try {
        const queueStatus = backgroundSyncManager ? backgroundSyncManager.getQueueStatus() : {};
        
        // Update queue counts
        document.getElementById('queue-snapshots').textContent = queueStatus.snapshots?.count || 0;
        document.getElementById('queue-timeline').textContent = queueStatus.timeline?.count || 0;
        document.getElementById('queue-alerts').textContent = queueStatus.alerts?.count || 0;
        document.getElementById('queue-preferences').textContent = queueStatus.preferences?.count || 0;
        
        // Update status indicator
        const statusIndicator = document.getElementById('sync-status-indicator');
        const totalQueued = Object.values(queueStatus).reduce((sum, status) => sum + (status.count || 0), 0);
        
        if (statusIndicator) {
            if (totalQueued > 0) {
                statusIndicator.innerHTML = `<i class="fas fa-clock mr-1"></i>${totalQueued} items queued`;
                statusIndicator.className = 'text-sm font-medium text-orange-600';
            } else if (!navigator.onLine) {
                statusIndicator.innerHTML = '<i class="fas fa-wifi-slash mr-1"></i>Offline';
                statusIndicator.className = 'text-sm font-medium text-red-600';
            } else {
                statusIndicator.innerHTML = '<i class="fas fa-check-circle mr-1"></i>Up to date';
                statusIndicator.className = 'text-sm font-medium text-green-600';
            }
        }
    } catch (error) {
        console.error('❌ Failed to update sync status display:', error);
    }
}

function showSyncDetailsModal() {
    const queueStatus = backgroundSyncManager ? backgroundSyncManager.getQueueStatus() : {};
    
    let detailsHTML = '<div class="space-y-4">';
    
    Object.entries(queueStatus).forEach(([type, status]) => {
        const count = status.count || 0;
        const lastQueued = status.lastQueued ? new Date(status.lastQueued).toLocaleString() : 'Never';
        
        detailsHTML += `
            <div class="border rounded p-3">
                <div class="flex justify-between items-center">
                    <span class="font-medium capitalize">${type}</span>
                    <span class="text-sm text-gray-600">${count} items</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">Last queued: ${lastQueued}</div>
            </div>
        `;
    });
    
    detailsHTML += '</div>';
    
    showCustomModal('Sync Queue Details', detailsHTML);
}

function showClearQueueConfirmation() {
    const confirmHTML = `
        <div class="text-center">
            <p class="mb-4">Are you sure you want to clear all sync queues? This action cannot be undone.</p>
            <div class="space-x-3">
                <button id="confirm-clear-queue" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    Clear All
                </button>
                <button id="cancel-clear-queue" class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    showCustomModal('Clear Sync Queue', confirmHTML, () => {
        // Setup button event listeners
        document.getElementById('confirm-clear-queue')?.addEventListener('click', () => {
            if (backgroundSyncManager) {
                backgroundSyncManager.clearQueue();
                updateSyncStatusDisplay();
                showSyncNotification('Sync queue cleared successfully', 'success');
            }
            closeCustomModal();
        });
        
        document.getElementById('cancel-clear-queue')?.addEventListener('click', () => {
            closeCustomModal();
        });
    });
}

function showCustomModal(title, content, onShown = null) {
    // Create modal HTML
    const modalHTML = `
        <div id="custom-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div class="flex justify-between items-center p-4 border-b">
                    <h3 class="text-lg font-semibold">${title}</h3>
                    <button id="close-custom-modal" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="p-4">
                    ${content}
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('custom-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup close handlers
    const modal = document.getElementById('custom-modal');
    const closeBtn = document.getElementById('close-custom-modal');
    
    const closeModal = () => {
        if (modal) {
            modal.remove();
        }
    };
    
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Call onShown callback
    if (onShown) {
        onShown();
    }
}

function closeCustomModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.remove();
    }
}

function showSyncNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 text-white transition-opacity ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function saveSyncPreferences() {
    const preferences = {
        autoSyncEnabled: document.getElementById('auto-sync-enabled')?.checked ?? true,
        wifiOnlySync: document.getElementById('wifi-only-sync')?.checked ?? false,
        batterySaverSync: document.getElementById('battery-saver-sync')?.checked ?? false
    };
    
    localStorage.setItem('spotkin-sync-preferences', JSON.stringify(preferences));
    console.log('💾 Sync preferences saved:', preferences);
}

function loadSyncPreferences() {
    try {
        const stored = localStorage.getItem('spotkin-sync-preferences');
        if (stored) {
            const preferences = JSON.parse(stored);
            
            const autoSyncEnabled = document.getElementById('auto-sync-enabled');
            const wifiOnlySync = document.getElementById('wifi-only-sync');
            const batterySaverSync = document.getElementById('battery-saver-sync');
            
            if (autoSyncEnabled) autoSyncEnabled.checked = preferences.autoSyncEnabled ?? true;
            if (wifiOnlySync) wifiOnlySync.checked = preferences.wifiOnlySync ?? false;
            if (batterySaverSync) batterySaverSync.checked = preferences.batterySaverSync ?? false;
            
            console.log('📖 Sync preferences loaded:', preferences);
        }
    } catch (error) {
        console.error('❌ Failed to load sync preferences:', error);
    }
}

// ===== AI-POWERED DAILY SUMMARY SYSTEM =====

class DailySummaryManager {
    constructor() {
        this.summaryCache = new Map(); // Cache summaries by date
        this.isGenerating = false;
    }

    // Aggregate daily monitoring data for AI analysis
    aggregateDailyData(targetDate = new Date()) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Get history data from global scope or storage
        let currentHistoryData = [];
        try {
            const savedHistory = localStorage.getItem('monitoring-history');
            if (savedHistory) {
                currentHistoryData = JSON.parse(savedHistory);
            } else if (typeof historyData !== 'undefined') {
                currentHistoryData = historyData;
            }
        } catch (error) {
            console.warn('Failed to get history data for daily summary:', error);
            currentHistoryData = [];
        }
        
        // Filter events for the target date
        const todaysEvents = currentHistoryData.filter(entry => {
            const entryTime = new Date(entry.timestamp);
            return entryTime >= startOfDay && entryTime <= endOfDay;
        });

        if (todaysEvents.length === 0) {
            return {
                totalEvents: 0,
                alertCounts: { safe: 0, warning: 0, danger: 0 },
                activityPeriods: [],
                mostCommonStates: [],
                keyEvents: [],
                timeSpan: { start: startOfDay, end: endOfDay },
                hasData: false
            };
        }

        // Calculate alert distribution
        const alertCounts = {
            safe: todaysEvents.filter(e => e.alert.type === 'safe').length,
            warning: todaysEvents.filter(e => e.alert.type === 'warning').length,
            danger: todaysEvents.filter(e => e.alert.type === 'danger').length
        };

        // Extract activity periods based on temporal analysis
        const activityPeriods = this.extractActivityPeriods(todaysEvents);
        
        // Find most common states
        const mostCommonStates = this.extractCommonStates(todaysEvents);
        
        // Identify key events (high severity, unusual states, etc.)
        const keyEvents = this.extractKeyEvents(todaysEvents);

        return {
            totalEvents: todaysEvents.length,
            alertCounts,
            activityPeriods,
            mostCommonStates,
            keyEvents,
            timeSpan: { start: startOfDay, end: endOfDay },
            hasData: true
        };
    }

    // Extract activity periods from temporal analysis data
    extractActivityPeriods(events) {
        const periods = [];
        let currentPeriod = null;

        events.forEach(event => {
            if (event.temporalAnalysis && event.temporalAnalysis.hasMovement) {
                if (!currentPeriod || 
                    new Date(event.timestamp) - new Date(currentPeriod.end) > 30 * 60 * 1000) { // 30 min gap
                    // Start new period
                    currentPeriod = {
                        start: event.timestamp,
                        end: event.timestamp,
                        movementLevel: event.temporalAnalysis.movementLevel,
                        eventCount: 1
                    };
                    periods.push(currentPeriod);
                } else {
                    // Extend current period
                    currentPeriod.end = event.timestamp;
                    currentPeriod.eventCount++;
                    currentPeriod.movementLevel = this.getHigherMovementLevel(
                        currentPeriod.movementLevel, 
                        event.temporalAnalysis.movementLevel
                    );
                }
            }
        });

        return periods;
    }

    // Extract most common states from detected objects
    extractCommonStates(events) {
        const stateCount = {};
        
        events.forEach(event => {
            if (event.objects && event.objects.length > 0) {
                event.objects.forEach(obj => {
                    const state = obj.state || 'unspecified';
                    stateCount[state] = (stateCount[state] || 0) + 1;
                });
            }
        });

        return Object.entries(stateCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5) // Top 5 most common states
            .map(([state, count]) => ({ state, count }));
    }

    // Extract key/notable events from the day
    extractKeyEvents(events) {
        return events
            .filter(event => {
                // Include danger alerts, unusual states, or high-confidence detections
                return event.alert.type === 'danger' ||
                       event.alert.type === 'warning' ||
                       (event.objects && event.objects.some(obj => 
                           obj.state.toLowerCase().includes('crying') ||
                           obj.state.toLowerCase().includes('distressed') ||
                           obj.state.toLowerCase().includes('climbing')
                       ));
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10); // Top 10 key events
    }

    // Helper to determine higher movement level
    getHigherMovementLevel(level1, level2) {
        const levels = { low: 1, medium: 2, high: 3 };
        const higher = Math.max(levels[level1] || 1, levels[level2] || 1);
        return Object.keys(levels).find(key => levels[key] === higher) || 'low';
    }

    // Create AI prompt for generating daily summary
    createDailySummaryPrompt(dailyData) {
        const date = dailyData.timeSpan.start.toLocaleDateString();
        
        if (!dailyData.hasData) {
            return `Generate a brief, caring message for a monitoring app user for ${date} when no monitoring data was recorded. 

Please create a warm, supportive message that:
1. Acknowledges there was no monitoring activity today
2. Suggests this might mean a peaceful day
3. Encourages continued use when needed
4. Uses a caring, positive tone

Format as JSON: {"summary": "brief message", "highlights": [], "insights": ["gentle encouragement"], "mood": "positive"}`;
        }

        const keyEventsDesc = dailyData.keyEvents.length > 0 
            ? dailyData.keyEvents.map(e => `${new Date(e.timestamp).toLocaleTimeString()}: ${e.scene}`).join('; ')
            : 'No significant events';

        return `Generate a caring, insightful daily monitoring summary for ${date} based on this data:

**Monitoring Overview:**
- Total monitoring events: ${dailyData.totalEvents}
- Safety status: ${dailyData.alertCounts.safe} safe periods, ${dailyData.alertCounts.warning} minor concerns, ${dailyData.alertCounts.danger} alerts

**Activity Patterns:**
- Active periods: ${dailyData.activityPeriods.length} periods of movement detected
- Most observed states: ${dailyData.mostCommonStates.map(s => `${s.state} (${s.count}x)`).join(', ')}

**Notable Events:** ${keyEventsDesc}

Please create a warm, informative summary that:
1. Highlights the day's key patterns and milestones in a caring tone
2. Notes any concerns or improvements with gentle guidance
3. Celebrates positive moments and peaceful periods  
4. Provides helpful insights for parents/caregivers
5. Uses supportive, encouraging language
6. Keeps the tone professional but warm

Format as JSON: {
    "summary": "main narrative summary (2-3 sentences)",
    "highlights": ["positive moments", "peaceful periods", "milestones"],
    "insights": ["helpful patterns observed", "gentle recommendations"], 
    "mood": "positive/neutral/concerned"
}`;
    }

    // Generate daily summary using Puter.js AI
    async generateDailySummary(targetDate = new Date()) {
        const dateKey = targetDate.toISOString().split('T')[0];
        
        // Check cache first
        if (this.summaryCache.has(dateKey)) {
            console.log('📋 Using cached daily summary for', dateKey);
            return this.summaryCache.get(dateKey);
        }

        if (this.isGenerating) {
            throw new Error('Summary generation already in progress');
        }

        this.isGenerating = true;

        try {
            console.log('🤖 Generating daily summary for', dateKey);
            
            const dailyData = this.aggregateDailyData(targetDate);
            const prompt = this.createDailySummaryPrompt(dailyData);
            
            // Use existing Puter.js integration (no image data needed)
            if (typeof puter === 'undefined' || !puter.ai || !puter.ai.chat) {
                console.warn('Puter.js AI not available, generating fallback summary');
                return this.generateFallbackSummary(dailyData, targetDate);
            }

            const response = await puter.ai.chat(prompt, null, false, {
                max_tokens: 600,
                temperature: 0.7
            });
            
            console.log('🤖 Raw AI summary response:', response);
            
            let summary;
            try {
                // Parse AI response (handle both string and object responses)
                summary = typeof response === 'string' ? JSON.parse(response) : response;
            } catch (parseError) {
                console.warn('Failed to parse AI response, generating fallback:', parseError);
                return this.generateFallbackSummary(dailyData, targetDate);
            }

            // Validate and enrich the summary
            const enrichedSummary = {
                ...summary,
                date: dateKey,
                dataStats: {
                    totalEvents: dailyData.totalEvents,
                    alertCounts: dailyData.alertCounts,
                    hasData: dailyData.hasData
                },
                generatedAt: new Date().toISOString()
            };

            // Cache the result
            this.summaryCache.set(dateKey, enrichedSummary);
            
            console.log('✅ Generated daily summary for', dateKey, enrichedSummary);
            return enrichedSummary;

        } catch (error) {
            console.error('❌ Failed to generate daily summary:', error);
            const dailyData = this.aggregateDailyData(targetDate);
            return this.generateFallbackSummary(dailyData, targetDate);
        } finally {
            this.isGenerating = false;
        }
    }

    // Fallback summary when AI is unavailable
    generateFallbackSummary(dailyData, targetDate) {
        const dateKey = targetDate.toISOString().split('T')[0];
        
        if (!dailyData.hasData) {
            return {
                summary: "No monitoring activity was recorded today. This might indicate a peaceful, quiet day.",
                highlights: ["Peaceful day with no monitoring needed"],
                insights: ["Consider monitoring during active periods for better insights"],
                mood: "positive",
                date: dateKey,
                dataStats: dailyData,
                generatedAt: new Date().toISOString(),
                fallback: true
            };
        }

        const totalAlerts = dailyData.alertCounts.warning + dailyData.alertCounts.danger;
        const safetyRate = dailyData.alertCounts.safe / dailyData.totalEvents * 100;
        
        let mood = "positive";
        let summary = `Today had ${dailyData.totalEvents} monitoring checks with ${dailyData.alertCounts.safe} safe periods.`;
        
        if (totalAlerts > dailyData.totalEvents * 0.3) {
            mood = "concerned";
            summary += " Several alerts were detected - please review the timeline for details.";
        } else if (totalAlerts > 0) {
            mood = "neutral";
            summary += ` ${totalAlerts} minor concerns were noted but overall activity was normal.`;
        } else {
            summary += " All monitoring periods showed safe, normal activity.";
        }

        return {
            summary,
            highlights: safetyRate > 80 ? ["High safety rate", "Normal activity patterns"] : ["Some concerns noted"],
            insights: [
                `${Math.round(safetyRate)}% of monitoring periods were safe`,
                dailyData.activityPeriods.length > 0 ? 
                    `${dailyData.activityPeriods.length} active periods detected` : 
                    "Mostly quiet day with minimal movement"
            ],
            mood,
            date: dateKey,
            dataStats: dailyData,
            generatedAt: new Date().toISOString(),
            fallback: true
        };
    }

    // Clear old cached summaries (keep last 30 days)
    cleanCache() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffKey = thirtyDaysAgo.toISOString().split('T')[0];
        
        for (const [dateKey] of this.summaryCache) {
            if (dateKey < cutoffKey) {
                this.summaryCache.delete(dateKey);
            }
        }
    }

    // Get summary for display (generates if needed)
    async getSummaryForDate(targetDate = new Date()) {
        try {
            return await this.generateDailySummary(targetDate);
        } catch (error) {
            console.error('Failed to get summary for date:', error);
            const dailyData = this.aggregateDailyData(targetDate);
            return this.generateFallbackSummary(dailyData, targetDate);
        }
    }
}

// Initialize daily summary manager
const dailySummaryManager = new DailySummaryManager();

// Daily Summary UI Functions
function createDailySummaryCard(summary) {
    const moodColors = {
        positive: 'border-green-200 bg-green-50',
        neutral: 'border-yellow-200 bg-yellow-50', 
        concerned: 'border-red-200 bg-red-50'
    };

    const moodIcons = {
        positive: '😊',
        neutral: '😐',
        concerned: '😟'
    };

    const cardColor = moodColors[summary.mood] || moodColors.neutral;
    const moodIcon = moodIcons[summary.mood] || moodIcons.neutral;

    return `
        <div class="daily-summary-card border-2 rounded-lg p-6 mb-6 ${cardColor}">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                    <i class="fas fa-calendar-day mr-2"></i>
                    Daily Summary - ${new Date(summary.date).toLocaleDateString()}
                    <span class="ml-2 text-2xl">${moodIcon}</span>
                </h3>
                ${summary.fallback ? '<span class="text-xs bg-gray-200 px-2 py-1 rounded">Offline Mode</span>' : '<span class="text-xs bg-blue-200 px-2 py-1 rounded">AI Generated</span>'}
            </div>
            
            <div class="mb-4">
                <p class="text-gray-700 leading-relaxed">${summary.summary}</p>
            </div>

            ${summary.highlights && summary.highlights.length > 0 ? `
                <div class="mb-4">
                    <h4 class="font-medium text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-star mr-2 text-yellow-500"></i>
                        Highlights
                    </h4>
                    <ul class="list-disc list-inside text-gray-600 space-y-1">
                        ${summary.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${summary.insights && summary.insights.length > 0 ? `
                <div class="mb-4">
                    <h4 class="font-medium text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-lightbulb mr-2 text-blue-500"></i>
                        Insights
                    </h4>
                    <ul class="list-disc list-inside text-gray-600 space-y-1">
                        ${summary.insights.map(insight => `<li>${insight}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${summary.dataStats && summary.dataStats.hasData ? `
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <div class="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div class="text-center">
                            <div class="font-medium text-gray-800">${summary.dataStats.totalEvents}</div>
                            <div>Total Checks</div>
                        </div>
                        <div class="text-center">
                            <div class="font-medium text-green-600">${summary.dataStats.alertCounts.safe}</div>
                            <div>Safe Periods</div>
                        </div>
                        <div class="text-center">
                            <div class="font-medium ${summary.dataStats.alertCounts.danger > 0 ? 'text-red-600' : 'text-gray-600'}">${summary.dataStats.alertCounts.warning + summary.dataStats.alertCounts.danger}</div>
                            <div>Alerts</div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="mt-3 text-xs text-gray-500 text-right">
                Generated: ${new Date(summary.generatedAt).toLocaleString()}
            </div>
        </div>
    `;
}

async function showDailySummary(targetDate = new Date()) {
    const loadingHtml = `
        <div class="daily-summary-loading border-2 border-blue-200 bg-blue-50 rounded-lg p-6 mb-6">
            <div class="flex items-center justify-center">
                <i class="fas fa-spinner fa-spin mr-3 text-blue-600"></i>
                <span class="text-blue-800">Generating your daily summary...</span>
            </div>
        </div>
    `;

    // Show loading state
    let summaryContainer = document.getElementById('daily-summary-container');
    if (!summaryContainer) {
        summaryContainer = document.createElement('div');
        summaryContainer.id = 'daily-summary-container';
        
        // Insert after camera section but before analysis results
        const cameraSection = document.querySelector('.camera-section') || document.querySelector('main > div');
        if (cameraSection && cameraSection.nextSibling) {
            cameraSection.parentNode.insertBefore(summaryContainer, cameraSection.nextSibling);
        } else {
            document.querySelector('main').prepend(summaryContainer);
        }
    }

    summaryContainer.innerHTML = loadingHtml;

    try {
        const summary = await dailySummaryManager.getSummaryForDate(targetDate);
        summaryContainer.innerHTML = createDailySummaryCard(summary);
        
        console.log('📊 Daily summary displayed successfully');
    } catch (error) {
        console.error('❌ Failed to display daily summary:', error);
        summaryContainer.innerHTML = `
            <div class="daily-summary-error border-2 border-red-200 bg-red-50 rounded-lg p-6 mb-6">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle mr-3 text-red-600"></i>
                    <div>
                        <h4 class="font-medium text-red-800">Unable to Generate Daily Summary</h4>
                        <p class="text-red-700 text-sm mt-1">Please try again or check your connection.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Auto-generate daily summary when app loads (if there's data from today)
function initializeDailySummary() {
    // Clean old cached summaries periodically
    dailySummaryManager.cleanCache();
    
    // Check if there's data from today to show summary
    const today = new Date();
    const todayData = dailySummaryManager.aggregateDailyData(today);
    
    if (todayData.hasData && todayData.totalEvents > 3) {
        console.log('📊 Auto-generating daily summary - sufficient data available');
        setTimeout(() => {
            showDailySummary(today);
        }, 2000); // Delay to let other components load first
    } else {
        console.log('📊 No daily summary generated - insufficient data for today');
    }
}

// Expose PWA functions globally for testing
window.initPWACapabilities = initPWACapabilities;
window.handlePWAError = handlePWAError;
window.saveToLocalStorageWithSync = saveToLocalStorageWithSync;
window.requestNotificationPermission = requestNotificationPermission;
window.sendCriticalNotification = sendCriticalNotification;
window.testNotification = testNotification;
window.showSetupWizard = showSetupWizard;
window.SetupWizard = SetupWizard;
window.BackgroundSyncManager = BackgroundSyncManager;
window.DailySummaryManager = DailySummaryManager;
window.dailySummaryManager = dailySummaryManager;
window.showDailySummary = showDailySummary;