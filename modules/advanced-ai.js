// Advanced AI Module - Lazy Loaded
// This module handles advanced AI features like temporal analysis and enhanced prompts

export class AdvancedAIManager {
    constructor() {
        this.FRAME_HISTORY_SIZE = 5;
        this.MOVEMENT_THRESHOLD_BASE = 1000;
        
        console.log('🧠 Advanced AI Module loaded');
    }

    // ENHANCED AI: Create dynamic prompts based on user preferences
    createEnhancedAIPrompt(temporalAnalysis) {
        const sensitivity = this.getSensitivityMultiplier();
        const movementThreshold = this.getMovementThreshold();
        
        // Base prompt focused on safety and meaningful alerts
        let basePrompt = `You are an AI assistant helping parents and pet owners monitor their loved ones. Analyze this image/scene and provide a JSON response with the following structure:

{
    "scene_description": "brief description of what you see",
    "subjects": [{"type": "Baby/Pet/Dog/Cat/Person", "state": "Sleeping/Playing/Moving/Sitting/etc", "confidence": 0.0-1.0}],
    "safety_assessment": {"level": "Safe/Warning/Danger", "reason": "explanation of safety level"}
}

IMPORTANT GUIDELINES:
- Only report Baby, Pet, Dog, Cat, or Person subjects
- Focus on safety and wellbeing
- Be specific about states (Sleeping, Playing, Crawling, Running, etc.)
- Use "Safe" for normal activities, "Warning" for potential issues, "Danger" for immediate concerns
- Provide confidence scores (0.0-1.0) for detections`;

        // Add sensitivity-based instructions
        if (sensitivity > 1.2) {
            basePrompt += `\n- HIGH SENSITIVITY: Report any movement or activity, even subtle changes`;
        } else if (sensitivity < 0.8) {
            basePrompt += `\n- LOW SENSITIVITY: Only report significant activities or obvious safety concerns`;
        }

        // Add temporal context if available
        if (temporalAnalysis && temporalAnalysis.movementLevel) {
            basePrompt += `\n\nTEMPORAL CONTEXT: ${temporalAnalysis.context}`;
            basePrompt += `\nMovement Level Detected: ${temporalAnalysis.movementLevel}`;
            
            if (temporalAnalysis.movementLevel === 'high') {
                basePrompt += `\n- Pay special attention to fast movements or sudden changes`;
            }
        }

        return basePrompt;
    }

    // ENHANCED AI: Multi-frame temporal analysis
    analyzeTemporalChanges(frameHistoryData) {
        if (!frameHistoryData || frameHistoryData.length < 2) {
            return {
                movementLevel: 'none',
                context: 'Single frame analysis - no temporal comparison available.',
                confidence: 0.5
            };
        }

        console.log(`Analyzing temporal changes across ${frameHistoryData.length} frames`);
        
        try {
            // Get the canvas for analysis
            const canvas = document.getElementById('canvas');
            const canvasContext = canvas.getContext('2d');
            
            let totalDifference = 0;
            let comparisons = 0;
            
            // Compare consecutive frames
            for (let i = 1; i < frameHistoryData.length; i++) {
                const currentFrame = frameHistoryData[i];
                const previousFrame = frameHistoryData[i - 1];
                
                if (currentFrame && previousFrame) {
                    const difference = this.compareFrames(currentFrame, previousFrame, canvasContext);
                    totalDifference += difference;
                    comparisons++;
                }
            }
            
            if (comparisons === 0) {
                return {
                    movementLevel: 'none',
                    context: 'Unable to compare frames for temporal analysis.',
                    confidence: 0.3
                };
            }
            
            const averageDifference = totalDifference / comparisons;
            const movementThreshold = this.getMovementThreshold();
            
            console.log(`Average frame difference: ${averageDifference}, Threshold: ${movementThreshold}`);
            
            // Classify movement level
            let movementLevel, temporalContext;
            const multiFrameDiff = averageDifference * frameHistoryData.length;
            
            if (averageDifference < movementThreshold * 0.3) {
                movementLevel = 'minimal';
                temporalContext = 'Very stable scene with minimal changes detected across frames.';
            } else if (averageDifference < movementThreshold * 0.7) {
                movementLevel = 'low';
                temporalContext = 'Some movement detected, but generally stable scene.';
            } else if (averageDifference < movementThreshold) {
                movementLevel = 'moderate';
                temporalContext = 'Moderate movement or changes detected in the monitoring area.';
            } else {
                // Check for significant changes across multiple frames
                const hasSignificantChange = multiFrameDiff > movementThreshold * 2;
                
                if (hasSignificantChange || multiFrameDiff > 2000) {
                    movementLevel = 'high';
                    temporalContext = 'Significant changes detected across multiple frames, suggesting active movement or scene changes.';
                } else {
                    movementLevel = 'moderate';
                    temporalContext = 'Notable movement detected in the scene.';
                }
            }
            
            return {
                movementLevel,
                context: temporalContext,
                averageDifference,
                totalFrames: frameHistoryData.length,
                confidence: Math.min(comparisons / 3, 1.0) // Higher confidence with more comparisons
            };
            
        } catch (error) {
            console.error('Error in temporal analysis:', error);
            return {
                movementLevel: 'unknown',
                context: 'Error occurred during temporal analysis.',
                confidence: 0.1
            };
        }
    }

    // Compare two frames for movement detection
    compareFrames(frame1, frame2, canvasContext) {
        try {
            // Simple pixel difference comparison
            // This is a basic implementation - could be enhanced with more sophisticated algorithms
            
            if (!frame1 || !frame2) return 0;
            
            // Convert base64 to image data for comparison
            const img1 = new Image();
            const img2 = new Image();
            
            let difference = 0;
            
            // For now, use string comparison as a simple difference metric
            // In a production environment, this would use proper image comparison algorithms
            if (frame1 !== frame2) {
                difference = Math.abs(frame1.length - frame2.length) + 
                           (frame1.substring(0, 1000) !== frame2.substring(0, 1000) ? 500 : 0);
            }
            
            return difference;
            
        } catch (error) {
            console.error('Error comparing frames:', error);
            return 0;
        }
    }

    // Get user preference values
    getSensitivityMultiplier() {
        try {
            const preferences = JSON.parse(localStorage.getItem('spotkinPreferences') || '{}');
            const sensitivity = preferences.analysisSensitivity || 'medium';
            
            switch (sensitivity) {
                case 'low': return 0.7;
                case 'high': return 1.3;
                case 'maximum': return 1.6;
                default: return 1.0; // medium
            }
        } catch (error) {
            console.error('Error getting sensitivity multiplier:', error);
            return 1.0;
        }
    }

    getMovementThreshold() {
        try {
            const sensitivity = this.getSensitivityMultiplier();
            return Math.round(this.MOVEMENT_THRESHOLD_BASE / sensitivity);
        } catch (error) {
            console.error('Error getting movement threshold:', error);
            return this.MOVEMENT_THRESHOLD_BASE;
        }
    }
}

export default AdvancedAIManager;