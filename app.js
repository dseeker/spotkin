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

            // Process the image with AI
            processImageWithAI(imageData);
        } catch (error) {
            console.error('Error taking snapshot:', error);
            showErrorState('Failed to capture image. Please try again.');
        }
    }

    // Image upload functionality removed

    // Process the image with AI using Puter's AI vision API
    function processImageWithAI(imageData) {
        // Create AI prompt for detecting pets and babies
        const prompt = `
            **System Role**: You are an advanced AI assistant for the SpotKin application, designed to monitor for the safety and well-being of babies and pets. Your primary function is to analyze images and provide clear, concise, and accurate descriptions of the scene, with a strong emphasis on identifying potential hazards.

            **Analysis Request**:
            Analyze the provided image and return a structured response. The response should be a JSON object with the following keys: 'scene_description', 'subjects', and 'safety_assessment'.

            1.  **'scene_description'**: A brief, one-sentence overview of the entire scene.
            2.  **'subjects'**: An array of JSON objects, where each object represents a detected baby or pet. Each object should include:
                *   'type': (e.g., "Baby", "Dog", "Cat").
                *   'state': (e.g., "Sleeping", "Playing", "Crying", "Eating", "Near window").
                *   'confidence': A numerical value from 0.0 to 1.0 indicating your confidence in the detection.
            3.  **'safety_assessment'**: A JSON object containing:
                *   'level': A safety level, which must be one of "Safe", "Warning", or "Danger".
                *   'reason': A clear and concise explanation for the assigned safety level. If the level is "Warning" or "Danger", this reason is mandatory and must describe the specific hazard (e.g., "Baby is near an uncovered electrical outlet," "Dog is chewing on a small object that could be a choking hazard").

            **Instructions**:
            *   If no babies or pets are detected, the 'subjects' array should be empty.
            *   If the image is unclear or ambiguous, express this in the 'scene_description' and use a lower confidence score for any detected subjects.
            *   Prioritize accuracy and safety above all else. Your analysis is critical for user peace of mind.
        `;

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

        // Use Puter's AI chat API with the image
        puter.ai.chat(prompt, imageData, false, options)
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

                    // Parse the AI response to create a structured result
                    const aiResult = parseAIResponse(responseText);
                    displayResults(aiResult);

                    // If in monitoring mode and we detect babies/pets, make a sound alert
                    if (isMonitoring && aiResult.hasPetsOrBabies) {
                        // Simple browser alert for now
                        if (aiResult.alert && (aiResult.alert.type === 'warning' || aiResult.alert.type === 'danger')) {
                            playAlertSound();
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

    // Play a sound alert for important notifications
    function playAlertSound() {
        try {
            // Create a simple beep sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.5;

            oscillator.start();

            // Stop the sound after 300ms
            setTimeout(() => {
                oscillator.stop();
            }, 300);
        } catch (error) {
            console.error('Failed to play alert sound:', error);
        }
    }

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
            if (!aiData.scene_description || !aiData.subjects || !aiData.safety_assessment) {
                console.error("Invalid AI response structure:", aiData);
                throw new Error("Missing required fields in AI response.");
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

        // Set scene description text
        sceneText.textContent = results.scene;

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
        console.log('Setting monitoring interval to:', intervalMs, 'ms'); // Added log
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
            hasPetsOrBabies: result.hasPetsOrBabies // Directly use the value from parsed AI result
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
            } else { // Default to info if type is unexpected
                alertClass = 'text-blue-600';
                alertIcon = 'fa-info-circle';
            }

            // Create the content based on whether pets/babies are present
            let objectsContent = '';

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
});
