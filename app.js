document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const video = document.getElementById('camera');
    const cameraFeedback = document.getElementById('camera-feedback');
    const takeSnapshotBtn = document.getElementById('take-snapshot');
    const toggleCameraBtn = document.getElementById('toggle-camera');
    const uploadImageBtn = document.getElementById('upload-image');
    const resultsContainer = document.getElementById('results-container');
    const resultsPlaceholder = document.getElementById('results-placeholder');
    const analysisResults = document.getElementById('analysis-results');
    const sceneText = document.getElementById('scene-text');
    const detectionList = document.getElementById('detection-list');
    const alertStatus = document.getElementById('alert-status');
    const aiStatus = document.getElementById('ai-status');

    // Camera State
    let currentStream = null;
    let facingMode = 'environment'; // Start with rear camera
    let canvas = document.createElement('canvas');
    let canvasContext = canvas.getContext('2d');
    let imageCapture = null;

    // Initialize the camera and check for Puter AI availability
    initCamera();
    checkPuterAIAvailability();

    // Set up event listeners
    takeSnapshotBtn.addEventListener('click', takeSnapshot);
    toggleCameraBtn.addEventListener('click', toggleCamera);
    uploadImageBtn.addEventListener('click', handleImageUpload);
    
    // Function to check if Puter AI is available
    function checkPuterAIAvailability() {
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

    // Handle image upload from device
    function handleImageUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                showLoadingState();
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = e.target.result;
                    processImageWithAI(imageData);
                };
                reader.onerror = () => {
                    showErrorState('Failed to read the uploaded image. Please try again.');
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

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
        takeSnapshotBtn.disabled = true; // Disable the button while processing
        
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
                // Re-enable the snapshot button regardless of success or failure
                takeSnapshotBtn.disabled = false;
            });
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
            
            // Look for subject/object descriptions - common patterns
            const subjectTypes = ['baby', 'infant', 'child', 'toddler', 'dog', 'puppy', 'cat', 'kitten', 'pet', 'person'];
            const statePatterns = [
                'sleeping', 'playing', 'sitting', 'standing', 'crying', 
                'eating', 'resting', 'active', 'awake', 'moving', 'lying'
            ];
            
            let objects = [];
            let foundAnyObject = false;
            
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
                        
                        foundAnyObject = true;
                        break; // Found subject in this line, move to next line
                    }
                }
            }
            
            // If we didn't find any subjects but have an image description,
            // extract general objects from the scene
            if (!foundAnyObject && responseText.length > 30) {
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
            
            // Ensure we have at least one object
            if (objects.length === 0) {
                // Check if this is an "empty scene" or "cannot determine" situation
                if (responseText.includes("can't see") || 
                    responseText.includes("no pets") || 
                    responseText.includes("no babies") || 
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
        
        // Check if we have objects to display
        if (results.objects.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'bg-gray-50 p-3 rounded-md text-gray-500 text-center';
            emptyItem.textContent = 'No specific objects detected';
            detectionList.appendChild(emptyItem);
        } else {
            // Add each detected object to the list
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
});
