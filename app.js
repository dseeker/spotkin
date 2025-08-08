// Global Error Handling
console.log('🚀 SpotKin Application Initializing');

// Single Global Error Handler
window.onerror = function(message, source, lineno, colno, error) {
    console.error('🚨 Global Error Caught:', {
        message,
        source,
        lineno,
        colno,
        error: error ? error.toString() : null
    });
    return false; // Allow default error handling
};

// Capture Unhandled Promise Rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
});

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

    // Camera initialization function
    async function initCamera() {
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

            // Update the camera feedback
            cameraFeedback.innerHTML = `
                <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <i class="fas fa-check-circle mr-1"></i>Camera active
                </div>
            `;

            // Wait for the video to be loaded
            return new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });
        } catch (error) {
            console.error('Error initializing camera:', error);
            cameraFeedback.innerHTML = `
                <div class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                    <i class="fas fa-exclamation-circle mr-1"></i>Camera error: ${error.message}
                </div>
            `;
        }
    }

    // Toggle between front and rear cameras
    function toggleCamera() {
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        initCamera();
    }

    // Take a snapshot from the video feed
    function takeSnapshot() {
        if (!video.srcObject) {
            alert('Camera is not initialized. Please refresh and allow camera access.');
            return;
        }

        // Show loading state
        showLoadingState();

        try {
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw the current video frame to the canvas
            canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get the image data as a base64 string (use PNG for higher quality)
            const imageData = canvas.toDataURL('image/png');

            // Add current frame to history and maintain size
            frameHistory.push(imageData);
            if (frameHistory.length > FRAME_HISTORY_SIZE) {
                frameHistory.shift(); // Remove the oldest frame
            }

            // Process the image with AI, passing the frame history
            processImageWithAI(frameHistory);
        } catch (error) {
            console.error('Error taking snapshot:', error);
            showErrorState('Failed to capture image. Please try again.');
        }
    }

    // Image upload functionality removed

    // Process the image with AI using Puter's AI vision API
    function processImageWithAI(frameHistoryData) {
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
        console.log("Sending image to Puter AI...");

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
                console.error("AI API Error:", error);
                showErrorState("Error connecting to AI service. Please try again later.");
            })
            .finally(() => {
                // Re-enable the button if not in monitoring mode
                if (!isMonitoring) {
                    takeSnapshotBtn.disabled = false;
                }
            });
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

        // Add to history
        addToHistory(results);
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

            // Refresh the history display
            console.log('Refreshing history display...'); // Added log
            updateHistoryDisplay();
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
        // Add to the beginning of the history array
        historyData.unshift(entry);

        // Limit the history size
        if (historyData.length > MAX_HISTORY_ITEMS) {
            console.log('History size exceeds limit, trimming...'); // Added log
            historyData = historyData.slice(0, MAX_HISTORY_ITEMS);
        }

        // Save to local storage
        console.log('Saving history to local storage...'); // Added log
        saveHistoryToLocalStorage();

        // Update the history display if the history tab is active
        if (!historyTab.classList.contains('hidden')) {
            console.log('History tab is active, updating display...'); // Added log
            updateHistoryDisplay();
        }
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

        // Clear the timeline list
        timelineList.innerHTML = '';
        console.log('Cleared timeline list.'); // Added log

        // Add each history item to the timeline
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

            // Add to timeline
            timelineList.appendChild(timelineItem);
        });
    }

    // Save history data to local storage
    function saveHistoryToLocalStorage() {
        console.log('saveHistoryToLocalStorage() called. Saving', historyData.length, 'items.'); // Added log
        try {
            localStorage.setItem('spotkin_history', JSON.stringify(historyData));
            console.log('History saved to local storage successfully.'); // Added log
        } catch (error) {
            console.error('Error saving history to local storage:', error); // Added log
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
                // Update the history display if data was loaded
                if (historyData.length > 0) {
                    console.log('Updating history display after loading from local storage.'); // Added log
                    updateHistoryDisplay();
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
            updateHistoryDisplay();
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
        monitoringZones: []
    };

    // Current preferences (loaded from localStorage or defaults)
    let userPreferences = { ...defaultPreferences };

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

    // Load user preferences from localStorage
    function loadUserPreferences() {
        console.log('Loading user preferences...');
        try {
            const savedPrefs = localStorage.getItem('spotkin_preferences');
            if (savedPrefs) {
                userPreferences = { ...defaultPreferences, ...JSON.parse(savedPrefs) };
                console.log('User preferences loaded:', userPreferences);
            } else {
                console.log('No saved preferences found, using defaults');
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            userPreferences = { ...defaultPreferences };
        }
        
        // Apply preferences to the UI
        applyPreferencesToUI();
    }

    // Save user preferences to localStorage
    function saveUserPreferences() {
        console.log('Saving user preferences:', userPreferences);
        try {
            localStorage.setItem('spotkin_preferences', JSON.stringify(userPreferences));
            console.log('Preferences saved successfully');
        } catch (error) {
            console.error('Error saving preferences:', error);
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
        
        // Apply zone preferences
        zonesEnabled.checked = userPreferences.zonesEnabled;
        if (userPreferences.zonesEnabled) {
            zoneControls.classList.remove('hidden');
            currentZones = [...userPreferences.monitoringZones];
            updateZoneList();
            updateZoneDisplay();
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
    function savePreferences() {
        console.log('Saving preferences from form');
        userPreferences = collectPreferencesFromForm();
        saveUserPreferences();
        hidePreferencesModal();
        
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
    preferencesSave.addEventListener('click', savePreferences);
    preferencesReset.addEventListener('click', resetPreferences);
    
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

    // Zone control event listeners
    zonesEnabled.addEventListener('change', (e) => {
        if (e.target.checked) {
            zoneControls.classList.remove('hidden');
        } else {
            zoneControls.classList.add('hidden');
            zoneOverlay.classList.add('hidden');
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

    // Initialize preferences on load
    loadUserPreferences();
    
    // Initialize zone system after preferences are loaded
    initializeZoneSystem();
    
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
});