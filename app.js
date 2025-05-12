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

    // Camera State
    let currentStream = null;
    let facingMode = 'environment'; // Start with rear camera
    let canvas = document.createElement('canvas');
    let canvasContext = canvas.getContext('2d');
    let imageCapture = null;

    // Initialize the camera
    initCamera();

    // Set up event listeners
    takeSnapshotBtn.addEventListener('click', takeSnapshot);
    toggleCameraBtn.addEventListener('click', toggleCamera);
    uploadImageBtn.addEventListener('click', handleImageUpload);

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

    // Process the image with AI (mock implementation for demo)
    function processImageWithAI(imageData) {
        // In a real implementation, this would send the image to an AI service
        // For this demo, we'll simulate a response after a delay
        
        setTimeout(() => {
            // Mock AI analysis results
            const mockResults = generateMockResults();
            displayResults(mockResults);
        }, 2000); // Simulate processing delay
    }

    // Generate mock AI analysis results
    function generateMockResults() {
        // Array of possible mock scenarios
        const scenarios = [
            {
                scene: "Pet (dog) sleeping peacefully on bed",
                objects: [
                    { type: "Dog", state: "Sleeping", confidence: 0.96 },
                    { type: "Bed", state: "Static", confidence: 0.98 }
                ],
                alert: { type: "info", message: "Pet is resting normally. No action needed." }
            },
            {
                scene: "Baby sleeping on back in crib",
                objects: [
                    { type: "Baby", state: "Sleeping on back", confidence: 0.94 },
                    { type: "Crib", state: "Static", confidence: 0.99 },
                    { type: "Blanket", state: "Covering legs", confidence: 0.87 }
                ],
                alert: { type: "info", message: "Baby is sleeping safely on back. All looks good." }
            },
            {
                scene: "Pet (cat) playing with toy near furniture",
                objects: [
                    { type: "Cat", state: "Active/Playing", confidence: 0.93 },
                    { type: "Toy", state: "Moving", confidence: 0.85 },
                    { type: "Furniture", state: "Static", confidence: 0.97 }
                ],
                alert: { type: "info", message: "Pet is active and playing. No concerns detected." }
            },
            {
                scene: "Baby awake and crying in crib",
                objects: [
                    { type: "Baby", state: "Awake/Crying", confidence: 0.92 },
                    { type: "Crib", state: "Static", confidence: 0.99 }
                ],
                alert: { type: "warning", message: "Baby appears to be crying. Attention may be needed." }
            },
            {
                scene: "Pet (dog) near potentially hazardous item",
                objects: [
                    { type: "Dog", state: "Curious/Sniffing", confidence: 0.91 },
                    { type: "Unknown Object", state: "Static", confidence: 0.84 }
                ],
                alert: { type: "warning", message: "Pet near unidentified object. May require supervision." }
            }
        ];
        
        // Return a random scenario
        return scenarios[Math.floor(Math.random() * scenarios.length)];
    }

    // Display the analysis results in the UI
    function displayResults(results) {
        // Hide loading state and placeholder
        resultsPlaceholder.classList.add('hidden');
        
        // Set scene description text
        sceneText.textContent = results.scene;
        
        // Clear and populate detection list
        detectionList.innerHTML = '';
        results.objects.forEach(obj => {
            const listItem = document.createElement('li');
            listItem.className = 'flex items-center justify-between bg-gray-50 p-3 rounded-md';
            
            const confidencePercent = Math.round(obj.confidence * 100);
            let confidenceClass = 'text-green-700 bg-green-100';
            if (confidencePercent < 75) {
                confidenceClass = 'text-yellow-700 bg-yellow-100';
            }
            
            listItem.innerHTML = `
                <div>
                    <span class="font-medium">${obj.type}</span>
                    <span class="text-gray-500 text-sm ml-2">${obj.state}</span>
                </div>
                <span class="text-sm ${confidenceClass} px-2 py-1 rounded">
                    ${confidencePercent}%
                </span>
            `;
            
            detectionList.appendChild(listItem);
        });
        
        // Set alert status based on alert type
        const { type, message } = results.alert;
        let alertClass = '';
        let alertIcon = '';
        
        if (type === 'warning') {
            alertClass = 'bg-yellow-100 border-yellow-400 text-yellow-800';
            alertIcon = 'fa-exclamation-triangle';
        } else if (type === 'danger') {
            alertClass = 'bg-red-100 border-red-400 text-red-800';
            alertIcon = 'fa-exclamation-circle';
        } else { // info
            alertClass = 'bg-blue-100 border-blue-400 text-blue-800';
            alertIcon = 'fa-info-circle';
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
        resultsPlaceholder.classList.remove('hidden');
        analysisResults.classList.add('hidden');
        
        resultsPlaceholder.innerHTML = `
            <div class="bg-red-100 text-red-800 p-4 rounded-md">
                <div class="flex items-center mb-2">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    <p class="font-medium">Error</p>
                </div>
                <p>${errorMessage}</p>
                <button id="retry-button" class="mt-3 bg-red-200 px-4 py-2 rounded hover:bg-red-300 transition">
                    Try Again
                </button>
            </div>
        `;
        
        // Add retry button functionality
        document.getElementById('retry-button').addEventListener('click', () => {
            resultsPlaceholder.innerHTML = `
                <i class="fas fa-search text-4xl text-gray-400 mb-3"></i>
                <p class="text-gray-500">Capture an image to see real-time analysis of what's happening in the scene.</p>
            `;
        });
    }
});
