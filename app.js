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
            
            // Get the image data as a base64 string
            const imageData = canvas.toDataURL('image/jpeg');
            
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
            Analyze this image for monitoring pets and babies. Describe the scene, identify key objects/subjects, 
            and assess safety or concerning situations. For each detected subject, provide the following:
            
            1. Subject type (e.g., "Baby", "Dog", "Cat")
            2. Current state (e.g., "Sleeping", "Playing", "Crying", "Eating")
            3. Relevant objects in scene (e.g., "Crib", "Toy", "Furniture")
            4. Any safety concerns or potential hazards
            
            Format your response as a structured description including:
            - Overall scene description
            - List of detected objects with confidence estimates
            - Alert status (info, warning, or danger) with explanatory message
            
            Focus especially on:
            - Baby sleeping position (back is safest)
            - Pet behavior (calm, agitated, curious)
            - Potential hazards in reach of babies or pets
            - Signs of distress in either babies or pets
        `;

        // Call Puter AI vision API
        console.log("Sending image to Puter AI...");
        
        // Use Puter's AI chat API with the image
        puter.ai.chat(prompt, imageData)
            .then(response => {
                console.log("AI Response:", response);
                
                try {
                    // Parse the AI response to create a structured result
                    const aiResult = parseAIResponse(response);
                    displayResults(aiResult);
                } catch (parseError) {
                    console.error("Error parsing AI response:", parseError);
                    showErrorState("Failed to understand AI response. Please try again.");
                }
            })
            .catch(error => {
                console.error("AI API Error:", error);
                showErrorState("Error connecting to AI service. Please try again later.");
            });
    }
    
    // Parse the AI response text into a structured format for our app
    function parseAIResponse(response) {
        let responseText = '';
        
        // Extract the text content from the response (handle different possible formats)
        if (typeof response === 'string') {
            responseText = response;
        } else if (typeof response === 'object' && response !== null) {
            responseText = response.content || response.text || 
                          (response.message && response.message.content) || 
                          JSON.stringify(response);
        }
        
        console.log("Parsing AI response text:", responseText);
        
        // Default result structure (fallback in case parsing fails)
        const defaultResult = {
            scene: "Could not clearly identify scene",
            objects: [
                { type: "Unknown", state: "Unrecognized", confidence: 0.5 }
            ],
            alert: { type: "info", message: "Scene analysis inconclusive. Please try again." }
        };
        
        try {
            // Simple parsing strategy - identify key sections in the AI response
            const result = {
                scene: "",
                objects: [],
                alert: { type: "info", message: "" }
            };
            
            // Extract the scene description (usually first paragraph)
            const lines = responseText.split('\n').filter(line => line.trim() !== '');
            if (lines.length > 0) {
                result.scene = lines[0].trim();
            }
            
            // Look for object descriptions
            const objectPattern = /(Baby|Pet|Dog|Cat|Child|Infant|Person|Object|Furniture|Toy|Crib)/gi;
            const statePattern = /(sleeping|playing|sitting|standing|crying|eating|resting|active|awake|moving)/gi;
            
            let objects = [];
            for (const line of lines) {
                const typeMatches = line.match(objectPattern);
                const stateMatches = line.match(statePattern);
                
                if (typeMatches && typeMatches.length > 0) {
                    // Calculate a mock confidence based on certainty language in the text
                    let confidence = 0.85; // Default reasonable confidence
                    if (line.includes("clearly") || line.includes("definitely")) confidence = 0.95;
                    if (line.includes("appears to") || line.includes("seems to")) confidence = 0.75;
                    if (line.includes("possibly") || line.includes("might be")) confidence = 0.6;
                    
                    objects.push({
                        type: typeMatches[0],
                        state: stateMatches ? stateMatches[0] : "Unknown state",
                        confidence: confidence
                    });
                }
            }
            
            // If we found objects, use them; otherwise add a generic object
            result.objects = objects.length > 0 ? objects : defaultResult.objects;
            
            // Determine alert type based on keywords in response
            let alertType = "info";
            let alertMessage = "No issues detected.";
            
            if (responseText.match(/(hazard|danger|unsafe|risk|warning|caution|concern|attention|problem)/gi)) {
                alertType = "warning";
                
                // Extract a sentence containing the alert-related keyword
                const warningMatch = responseText.match(/[^.!?]*?(hazard|danger|unsafe|risk|warning|caution|concern|attention|problem)[^.!?]*[.!?]/gi);
                if (warningMatch && warningMatch.length > 0) {
                    alertMessage = warningMatch[0].trim();
                } else {
                    alertMessage = "Potential issue detected. Check the image carefully.";
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
