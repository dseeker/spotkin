// Add global error handler to catch syntax and runtime errors
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error caught:', {
        message: message,
        source: source,
        lineno: lineno,
        colno: colno,
        error: error
    });
    alert('Error at line ' + lineno + ': ' + message);
    return true; // Prevents default error handling
};

// Wrap in try-catch to catch initialization errors
try {
document.addEventListener('DOMContentLoaded', function() {
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
    const alertStatus = document.getElementById('alert-status');
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
        console.log('Checking Puter AI availability...'); // Added log
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
            aiStatus.textContent = 'AI Unavailable';
            aiStatus.classList.remove('hidden');
            aiStatus.classList.add('bg-red-700');

            // Create a mock for testing when Puter API is not available
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('Creating mock Puter AI for local testing');
                window.puter = window.puter || {};
                window.puter.ai = window.puter.ai || {};
                window.puter.ai.chat = function(prompt, imageData, _, options) {
                    console.log('Mock AI called with prompt:', prompt);
                    console.log('Mock AI image data length:', imageData ? imageData.length : 0);

                    // Return a promise that resolves with a mock response
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            // Generate random test scenarios
                            const scenarios = [
                                // No pets or babies
                                "The image shows an empty room with furniture, including a couch and a table. There are no pets or babies/children present in this scene. This is not a pet/baby monitoring situation.",

                                // Baby scenario
                                "In this image, I can see a baby sleeping peacefully in a crib. The baby appears to be about 6-8 months old and is lying on their back with a light blanket covering them. The crib has standard rails and the room appears to be a nursery with soft lighting.",

                                // Pet scenario
                                "The image shows a small brown dog resting on what appears to be a bed or couch. The dog looks to be a terrier mix and is lying down in a relaxed state. There are no people or other animals visible in the frame.",

                                // Warning scenario
                                "In this image, I can see a baby sitting unsupervised near what appears to be electrical cords or cables on the floor. The baby seems to be reaching toward these cords, which could pose a safety hazard as babies often put things in their mouths."
                            ];

                            // Pick a random scenario
                            const randomResponse = scenarios[Math.floor(Math.random() * scenarios.length)];
                            resolve(randomResponse);
                        }, 1000); // Simulate network delay
                    });
                };

                // Update the AI status indicator
                aiStatus.textContent = 'Mock AI Ready';
                aiStatus.classList.remove('bg-red-700');
                aiStatus.classList.add('bg-yellow-700');
            }
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
            Describe what you see in this image, focusing on monitoring pets (dogs, cats) and babies/children.

            First, tell me if you can see any pets or babies/children in the image, including their positions
            and what they are doing. If they are present, provide details about:

            1. Subject type (e.g., "Baby", "Dog", "Cat")
            2. Current state (e.g., "Sleeping", "Playing", "Crying", "Eating")
            3. Relevant objects in scene (e.g., "Crib", "Toy", "Furniture")
            4. Any safety concerns or potential hazards

            Be very specific in your description. If there are no pets or babies in the image, describe
            whatever you can see in the image instead, noting that it's not a pet/baby monitoring situation.

            Your response should include:
            - Overall scene description (1-2 sentences)
            - List of key elements in the image
            - Any potential concerns if applicable
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

        // Default result structure (fallback in case parsing fails)
        const defaultResult = {
            scene: "Scene analysis completed",
            objects: [
                { type: "Object", state: "Detected", confidence: 0.7 }
            ],
            alert: { type: "info", message: "Analysis complete." }
        };

        try {
            // Simple parsing strategy - identify key sections in the AI response
            const result = {
                scene: "",
                objects: [],
                alert: { type: "info", message: "No issues detected." }
            };

            // Extract the scene description (usually first paragraph)
            const lines = responseText.split('\n').filter(line => line.trim() !== '');
            if (lines.length > 0) {
                result.scene = lines[0].trim();
            }

            // Check if the response mentions no pets or babies
            const noPetsOrBabies = responseText.toLowerCase().includes('no pets') ||
                                   responseText.toLowerCase().includes('no babies') ||
                                   responseText.toLowerCase().includes('no children') ||
                                   (responseText.toLowerCase().includes('not a pet') && responseText.toLowerCase().includes('monitoring situation'));

            // Look for subject/object descriptions - common patterns
            const subjectTypes = ['baby', 'infant', 'child', 'toddler', 'dog', 'puppy', 'cat', 'kitten', 'pet', 'person'];
            const statePatterns = [
                'sleeping', 'playing', 'sitting', 'standing', 'crying',
                'eating', 'resting', 'active', 'awake', 'moving', 'lying'
            ];

            let objects = [];
            let foundPetOrBaby = false;

            // First pass: Look for specific mentions of subjects with states
            for (const line of lines) {
                // Check for mentions of subject types
                for (const subjectType of subjectTypes) {
                    if (line.toLowerCase().includes(subjectType)) {
                        // Found a subject, now look for a state
                        let state = "Present";
                        for (const statePattern of statePatterns) {
                            if (line.toLowerCase().includes(statePattern)) {
                                state = statePattern.charAt(0).toUpperCase() + statePattern.slice(1);
                                break;
                            }
                        }

                        // Calculate a confidence based on certainty language
                        let confidence = 0.85; // Default reasonable confidence
                        if (line.includes("clearly") || line.includes("definitely")) confidence = 0.95;
                        if (line.includes("appears to") || line.includes("seems to")) confidence = 0.75;
                        if (line.includes("possibly") || line.includes("might be")) confidence = 0.6;

                        const type = subjectType.charAt(0).toUpperCase() + subjectType.slice(1);
                        objects.push({
                            type: type,
                            state: state,
                            confidence: confidence
                        });

                        foundPetOrBaby = ['baby', 'infant', 'child', 'toddler', 'dog', 'puppy', 'cat', 'kitten', 'pet'].includes(subjectType);

                        break; // Found subject in this line, move to next line
                    }
                }
            }

            // If we didn't find any subjects but have an image description,
            // extract general objects from the scene
            if (objects.length === 0 && responseText.length > 30) {
                // Add a "No pets or babies" object if explicitly mentioned
                if (noPetsOrBabies) {
                    objects.push({
                        type: "Scene",
                        state: "No pets or babies present",
                        confidence: 0.95
                    });
                } else {
                    // Look for common objects in the scene
                    const commonObjects = [
                        'furniture', 'table', 'chair', 'bed', 'crib', 'toy', 'room',
                        'window', 'door', 'wall', 'floor', 'light', 'plant', 'food'
                    ];

                    for (const object of commonObjects) {
                        if (responseText.toLowerCase().includes(object)) {
                            const type = object.charAt(0).toUpperCase() + object.slice(1);
                            objects.push({
                                type: type,
                                state: "Present",
                                confidence: 0.7
                            });
                        }
                    }
                }
            }

            // Ensure we have at least one object
            if (objects.length === 0) {
                // Check if this is an "empty scene" or "cannot determine" situation
                if (responseText.includes("can't see") ||
                    responseText.includes("empty") ||
                    responseText.includes("unable to identify")) {

                    objects.push({
                        type: "Scene",
                        state: "Empty or unclear",
                        confidence: 0.8
                    });
                } else {
                    // Add a generic object as fallback
                    objects.push({
                        type: "Image",
                        state: "Processed",
                        confidence: 0.7
                    });
                }
            }

            // Assign objects to result
            result.objects = objects;

            // Determine alert type based on keywords in response
            let alertType = "info";
            let alertMessage = "Analysis complete. No issues detected.";

            // Check for safety concerns or warnings
            if (responseText.match(/(hazard|danger|unsafe|risk|warning|caution|concern|attention|problem)/gi)) {
                alertType = "warning";

                // Extract a sentence containing the alert-related keyword
                const warningMatch = responseText.match(/[^.!?]*?(hazard|danger|unsafe|risk|warning|caution|concern|attention|problem)[^.!?]*[.!?]/gi);
                if (warningMatch && warningMatch.length > 0) {
                    alertMessage = warningMatch[0].trim();
                } else {
                    alertMessage = "Potential concern detected. Please check the image carefully.";
                }
            }

            // Look for more serious issues
            if (responseText.match(/(emergency|immediate|urgent|critical|serious|severe)/gi)) {
                alertType = "danger";

                const dangerMatch = responseText.match(/[^.!?]*?(emergency|immediate|urgent|critical|serious|severe)[^.!?]*[.!?]/gi);
                if (dangerMatch && dangerMatch.length > 0) {
                    alertMessage = dangerMatch[0].trim();
                } else {
                    alertMessage = "Critical issue detected! Immediate attention recommended.";
                }
            }

            result.alert = { type: alertType, message: alertMessage };
            result.hasPetsOrBabies = foundPetOrBaby;

            return result;
        } catch (error) {
            console.error("Error during AI response parsing:", error);
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

        // Check if we have pets or babies to display
        const hasPetsOrBabies = results.hasPetsOrBabies || results.objects.some(obj => {
            const petBabyTypes = ['baby', 'infant', 'child', 'toddler', 'dog', 'puppy', 'cat', 'kitten', 'pet'];
            return petBabyTypes.some(type => obj.type.toLowerCase().includes(type));
        });

        if (!hasPetsOrBabies) {
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
        } else if (results.objects.length === 0) {
            // Just in case we have an empty objects array
            const emptyItem = document.createElement('li');
            emptyItem.className = 'bg-gray-50 p-3 rounded-md text-gray-500 text-center';
            emptyItem.textContent = 'No specific objects detected';
            detectionList.appendChild(emptyItem);
        } else {
            // Add each detected object to the list (only pets and babies)
            results.objects.forEach(obj => {
                // Skip objects that aren't pets or babies if we have pet/baby objects
                const petBabyTypes = ['baby', 'infant', 'child', 'toddler', 'dog', 'puppy', 'cat', 'kitten', 'pet', 'person'];
                const isPetOrBaby = petBabyTypes.some(type => obj.type.toLowerCase().includes(type));

                if (hasPetsOrBabies && !isPetOrBaby) {
                    return; // Skip this object
                }

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
        } else { // info
            alertClass = 'bg-blue-100 border-blue-400 text-blue-800';
            alertIcon = 'fa-circle-info';
        }

        alertStatus.className = `p-4 rounded-md border-l-4 ${alertClass}`;
        alertStatus.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${alertIcon} mr-3"></i>
                <p>${message}</p>
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
            hasPetsOrBabies: hasPetsOrBabies(result.objects)
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

    // Check if the result contains pets or babies
    function hasPetsOrBabies(objects) {
        console.log('hasPetsOrBabies() called with objects:', objects); // Added log
        const petBabyTypes = ['baby', 'infant', 'child', 'toddler', 'dog', 'puppy', 'cat', 'kitten', 'pet'];
        const result = objects.some(obj => {
            return petBabyTypes.some(type =>
                obj.type.toLowerCase().includes(type)
            );
        });
        console.log('hasPetsOrBabies() returning:', result); // Added log
        return result;
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

            // Determine alert class
            let alertClass = 'text-blue-600';
            let alertIcon = 'fa-info-circle';

            if (entry.alert.type === 'warning') {
                alertClass = 'text-yellow-600';
                alertIcon = 'fa-triangle-exclamation';
            } else if (entry.alert.type === 'danger') {
                alertClass = 'text-red-600';
                alertIcon = 'fa-circle-exclamation';
            }

            // Create the content based on whether pets/babies are present
            let objectsContent = '';

            if (entry.hasPetsOrBabies) {
                // Filter to only show relevant objects (pets and babies)
                const petBabyObjects = entry.objects.filter(obj => {
                    const type = obj.type.toLowerCase();
                    return ['baby', 'infant', 'child', 'toddler', 'dog', 'puppy', 'cat', 'kitten', 'pet', 'person'].some(t => type.includes(t));
                });

                objectsContent = `
                    <div class="mt-2">
                        <h5 class="text-sm font-medium text-gray-700">Detected:</h5>
                        <ul class="mt-1 text-sm text-gray-600">
                            ${petBabyObjects.map(obj => `
                                <li class="flex justify-between">
                                    <span>${obj.type} - ${obj.state}</span>
                                    <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100">${Math.round((obj.confidence || 0.5) * 100)}%</span>
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
} catch (error) {
    console.error('Fatal error during script execution:', error);
    alert('An error occurred while loading the application: ' + error.message);
}
