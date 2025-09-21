// User Feedback Collection System
// Comprehensive system for gathering user feedback, bug reports, and feature requests

class FeedbackCollectionSystem {
    constructor() {
        this.feedbackData = [];
        this.sessionData = this.initializeSessionTracking();
        this.feedbackTypes = this.initializeFeedbackTypes();
        this.isEnabled = this.getFeedbackPreference();
        this.submissionQueue = [];
        
        console.log('💬 Feedback Collection System initialized');
        this.initializeEventListeners();
    }

    // Initialize feedback types and categories
    initializeFeedbackTypes() {
        return {
            bug: {
                icon: '🐛',
                title: 'Bug Report',
                description: 'Report issues, errors, or unexpected behavior',
                priority: 'high',
                fields: ['description', 'steps', 'expected', 'actual', 'browser', 'screenshot']
            },
            feature: {
                icon: '💡',
                title: 'Feature Request',
                description: 'Suggest new features or improvements',
                priority: 'medium',
                fields: ['description', 'usecase', 'priority', 'category']
            },
            usability: {
                icon: '🎯',
                title: 'Usability Feedback',
                description: 'Share thoughts on user experience and interface',
                priority: 'medium',
                fields: ['description', 'area', 'difficulty', 'suggestion']
            },
            performance: {
                icon: '⚡',
                title: 'Performance Issue',
                description: 'Report slow loading, crashes, or responsiveness issues',
                priority: 'high',
                fields: ['description', 'timing', 'device', 'frequency', 'impact']
            },
            general: {
                icon: '💬',
                title: 'General Feedback',
                description: 'Any other comments, suggestions, or thoughts',
                priority: 'low',
                fields: ['description', 'category', 'rating']
            },
            ai: {
                icon: '🤖',
                title: 'AI Analysis Feedback',
                description: 'Report AI accuracy issues or analysis problems',
                priority: 'high',
                fields: ['description', 'scenario', 'expected', 'actual', 'confidence']
            }
        };
    }

    // Initialize session tracking for context
    initializeSessionTracking() {
        return {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            referrer: document.referrer,
            actions: [],
            errors: [],
            performance: {}
        };
    }

    // Generate unique session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Initialize event listeners for automatic feedback triggers
    initializeEventListeners() {
        // Track errors automatically
        window.addEventListener('error', (event) => {
            this.trackError({
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now()
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                message: 'Unhandled Promise Rejection',
                reason: event.reason?.toString() || 'Unknown',
                timestamp: Date.now(),
                type: 'promise_rejection'
            });
        });

        // Track performance issues
        if ('performance' in window) {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.sessionData.performance = {
                        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                        domInteractive: navigation.domInteractive - navigation.fetchStart,
                        firstPaint: this.getFirstPaint()
                    };
                }
            }, 2000);
        }

        // Track user frustration indicators
        this.setupFrustrationDetection();
    }

    // Setup frustration detection (rapid clicks, back/forward, etc.)
    setupFrustrationDetection() {
        let clickCount = 0;
        let clickTimer = null;
        
        document.addEventListener('click', () => {
            clickCount++;
            
            if (clickTimer) clearTimeout(clickTimer);
            
            clickTimer = setTimeout(() => {
                if (clickCount > 5) {
                    this.detectFrustration('rapid_clicking', {
                        clicks: clickCount,
                        timeWindow: 2000
                    });
                }
                clickCount = 0;
            }, 2000);
        });

        // Detect back/forward navigation
        window.addEventListener('beforeunload', () => {
            const sessionDuration = Date.now() - this.sessionData.startTime;
            if (sessionDuration < 30000) { // Less than 30 seconds
                this.detectFrustration('quick_exit', {
                    duration: sessionDuration
                });
            }
        });
    }

    // Detect and record frustration indicators
    detectFrustration(type, data) {
        if (!this.isEnabled) return;
        
        console.log('😤 User frustration detected:', type, data);
        
        this.sessionData.actions.push({
            type: 'frustration_detected',
            frustration_type: type,
            data,
            timestamp: Date.now()
        });

        // Optionally trigger feedback prompt for certain frustration types
        if (type === 'rapid_clicking' && data.clicks > 8) {
            setTimeout(() => {
                this.showSmartFeedbackPrompt('usability', 'It looks like you might be having trouble. Would you like to share feedback?');
            }, 1000);
        }
    }

    // Get first paint timing
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }

    // Track user errors for context
    trackError(errorData) {
        this.sessionData.errors.push(errorData);
        
        // Auto-suggest bug report for repeated errors
        const recentErrors = this.sessionData.errors.filter(
            error => Date.now() - error.timestamp < 60000 // Last minute
        );
        
        if (recentErrors.length >= 3) {
            this.showSmartFeedbackPrompt('bug', 'We noticed some errors. Would you like to report this issue?');
        }
    }

    // Show smart contextual feedback prompt
    showSmartFeedbackPrompt(suggestedType, message) {
        if (!this.isEnabled) return;
        
        // Don't show multiple prompts rapidly
        if (this.lastPromptTime && Date.now() - this.lastPromptTime < 120000) return;
        
        this.lastPromptTime = Date.now();
        
        const promptElement = document.createElement('div');
        promptElement.className = 'fixed bottom-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm feedback-prompt';
        promptElement.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <span class="text-xl">${this.feedbackTypes[suggestedType].icon}</span>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${message}</p>
                    <div class="mt-3 flex space-x-2">
                        <button class="feedback-prompt-yes bg-white text-indigo-600 px-3 py-1 rounded text-sm font-medium hover:bg-indigo-50">
                            Yes, help improve SpotKin
                        </button>
                        <button class="feedback-prompt-no text-indigo-200 hover:text-white px-3 py-1 rounded text-sm">
                            No thanks
                        </button>
                    </div>
                </div>
                <button class="feedback-prompt-close text-indigo-200 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(promptElement);
        
        // Add event listeners
        promptElement.querySelector('.feedback-prompt-yes').addEventListener('click', () => {
            promptElement.remove();
            this.showFeedbackModal(suggestedType);
        });
        
        promptElement.querySelector('.feedback-prompt-no').addEventListener('click', () => {
            promptElement.remove();
        });
        
        promptElement.querySelector('.feedback-prompt-close').addEventListener('click', () => {
            promptElement.remove();
        });
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (promptElement.parentNode) {
                promptElement.remove();
            }
        }, 15000);
    }

    // Show main feedback modal
    showFeedbackModal(selectedType = 'general') {
        if (!this.isEnabled) {
            this.showPrivacyNotice();
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'feedback-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-bold text-gray-900">Share Your Feedback</h2>
                        <button id="feedback-close" class="text-gray-400 hover:text-gray-600 text-xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <p class="text-gray-600 mt-2">Help us improve SpotKin by sharing your experience</p>
                </div>
                
                <div class="p-6 max-h-[70vh] overflow-y-auto">
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-3">Feedback Type</label>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="feedback-types">
                            ${Object.entries(this.feedbackTypes).map(([key, type]) => `
                                <div class="feedback-type-option cursor-pointer p-3 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors ${key === selectedType ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}" data-type="${key}">
                                    <div class="text-center">
                                        <span class="text-2xl block mb-2">${type.icon}</span>
                                        <span class="text-sm font-medium text-gray-900">${type.title}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <form id="feedback-form">
                        <div id="feedback-fields">
                            <!-- Dynamic fields will be inserted here -->
                        </div>
                        
                        <div class="mt-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                            <input type="email" id="feedback-email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="your@email.com">
                            <p class="text-xs text-gray-500 mt-1">We'll only use this to follow up on your feedback if needed</p>
                        </div>
                        
                        <div class="mt-6">
                            <label class="flex items-center">
                                <input type="checkbox" id="feedback-include-data" checked class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                                <span class="ml-2 text-sm text-gray-700">Include anonymous usage data to help us understand the context</span>
                            </label>
                        </div>
                    </form>
                </div>
                
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                    <button id="feedback-cancel" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                    <button id="feedback-submit" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                        Send Feedback
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupModalEventListeners(modal, selectedType);
        this.updateFormFields(selectedType);
    }

    // Setup event listeners for the feedback modal
    setupModalEventListeners(modal, selectedType) {
        // Close button
        modal.querySelector('#feedback-close').addEventListener('click', () => {
            modal.remove();
        });
        
        // Cancel button
        modal.querySelector('#feedback-cancel').addEventListener('click', () => {
            modal.remove();
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Feedback type selection
        modal.querySelectorAll('.feedback-type-option').forEach(option => {
            option.addEventListener('click', () => {
                // Update selection
                modal.querySelectorAll('.feedback-type-option').forEach(opt => {
                    opt.classList.remove('border-indigo-500', 'bg-indigo-50');
                    opt.classList.add('border-gray-200');
                });
                option.classList.add('border-indigo-500', 'bg-indigo-50');
                option.classList.remove('border-gray-200');
                
                // Update form fields
                const type = option.dataset.type;
                this.updateFormFields(type);
            });
        });
        
        // Submit button
        modal.querySelector('#feedback-submit').addEventListener('click', (e) => {
            e.preventDefault();
            this.submitFeedback(modal);
        });
        
        // Enter key on form fields
        modal.querySelector('#feedback-form').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.submitFeedback(modal);
            }
        });
    }

    // Update form fields based on feedback type
    updateFormFields(type) {
        const fieldsContainer = document.querySelector('#feedback-fields');
        const typeConfig = this.feedbackTypes[type];
        
        if (!fieldsContainer || !typeConfig) return;
        
        let fieldsHTML = '';
        
        typeConfig.fields.forEach(field => {
            switch (field) {
                case 'description':
                    fieldsHTML += `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                            <textarea id="feedback-description" required rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Please describe your ${type === 'bug' ? 'issue' : type === 'feature' ? 'idea' : 'feedback'} in detail..."></textarea>
                        </div>
                    `;
                    break;
                case 'steps':
                    fieldsHTML += `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Steps to Reproduce</label>
                            <textarea id="feedback-steps" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="1. First step&#10;2. Second step&#10;3. ..."></textarea>
                        </div>
                    `;
                    break;
                case 'expected':
                    fieldsHTML += `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Expected Behavior</label>
                            <textarea id="feedback-expected" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="What did you expect to happen?"></textarea>
                        </div>
                    `;
                    break;
                case 'actual':
                    fieldsHTML += `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Actual Behavior</label>
                            <textarea id="feedback-actual" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="What actually happened?"></textarea>
                        </div>
                    `;
                    break;
                case 'priority':
                    fieldsHTML += `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                            <select id="feedback-priority" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                <option value="low">Low - Nice to have</option>
                                <option value="medium">Medium - Would improve experience</option>
                                <option value="high">High - Important for my workflow</option>
                                <option value="critical">Critical - Blocking my usage</option>
                            </select>
                        </div>
                    `;
                    break;
                case 'category':
                    fieldsHTML += `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select id="feedback-category" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                <option value="monitoring">Monitoring & Analysis</option>
                                <option value="ui">User Interface</option>
                                <option value="performance">Performance</option>
                                <option value="mobile">Mobile Experience</option>
                                <option value="settings">Settings & Preferences</option>
                                <option value="ai">AI Features</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    `;
                    break;
                case 'rating':
                    fieldsHTML += `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                            <div class="flex items-center space-x-2" id="feedback-rating">
                                ${[1,2,3,4,5].map(star => `
                                    <button type="button" class="rating-star text-2xl text-gray-300 hover:text-yellow-400 transition-colors" data-rating="${star}">
                                        <i class="fas fa-star"></i>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `;
                    break;
                case 'screenshot':
                    fieldsHTML += `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Screenshot (Optional)</label>
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <input type="file" id="feedback-screenshot" accept="image/*" class="hidden">
                                <button type="button" id="screenshot-upload" class="text-indigo-600 hover:text-indigo-700 font-medium">
                                    <i class="fas fa-camera mr-2"></i>Upload Screenshot
                                </button>
                                <p class="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                            </div>
                        </div>
                    `;
                    break;
            }
        });
        
        fieldsContainer.innerHTML = fieldsHTML;
        
        // Setup special field handlers
        this.setupSpecialFieldHandlers();
    }

    // Setup handlers for special form fields
    setupSpecialFieldHandlers() {
        // Star rating
        const ratingContainer = document.querySelector('#feedback-rating');
        if (ratingContainer) {
            let selectedRating = 0;
            ratingContainer.querySelectorAll('.rating-star').forEach(star => {
                star.addEventListener('click', () => {
                    selectedRating = parseInt(star.dataset.rating);
                    this.updateStarRating(ratingContainer, selectedRating);
                });
                
                star.addEventListener('mouseover', () => {
                    const hoverRating = parseInt(star.dataset.rating);
                    this.updateStarRating(ratingContainer, hoverRating);
                });
                
                ratingContainer.addEventListener('mouseleave', () => {
                    this.updateStarRating(ratingContainer, selectedRating);
                });
            });
        }
        
        // Screenshot upload
        const screenshotUpload = document.querySelector('#screenshot-upload');
        if (screenshotUpload) {
            screenshotUpload.addEventListener('click', () => {
                document.querySelector('#feedback-screenshot').click();
            });
        }
    }

    // Update star rating display
    updateStarRating(container, rating) {
        container.querySelectorAll('.rating-star').forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('text-gray-300');
                star.classList.add('text-yellow-400');
            } else {
                star.classList.remove('text-yellow-400');
                star.classList.add('text-gray-300');
            }
        });
    }

    // Submit feedback
    async submitFeedback(modal) {
        const submitButton = modal.querySelector('#feedback-submit');
        const originalText = submitButton.textContent;
        
        try {
            // Show loading state
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            // Collect form data
            const selectedType = modal.querySelector('.feedback-type-option.border-indigo-500').dataset.type;
            const feedbackData = this.collectFormData(modal, selectedType);
            
            // Validate required fields
            if (!feedbackData.description || feedbackData.description.trim().length < 10) {
                throw new Error('Please provide a detailed description (at least 10 characters)');
            }
            
            // Add session context if requested
            if (modal.querySelector('#feedback-include-data').checked) {
                feedbackData.sessionContext = this.getSessionContext();
            }
            
            // Add metadata
            feedbackData.metadata = {
                timestamp: new Date().toISOString(),
                type: selectedType,
                sessionId: this.sessionData.sessionId,
                userAgent: navigator.userAgent,
                url: window.location.href,
                version: '4.0.0'
            };
            
            // Submit feedback
            const result = await this.sendFeedback(feedbackData);
            
            if (result.success) {
                this.showSuccessMessage();
                modal.remove();
            } else {
                throw new Error(result.error || 'Failed to submit feedback');
            }
            
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            this.showErrorMessage(error.message);
            
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    // Collect form data based on feedback type
    collectFormData(modal, type) {
        const data = {
            type,
            description: modal.querySelector('#feedback-description')?.value || '',
            email: modal.querySelector('#feedback-email')?.value || '',
        };
        
        // Collect type-specific fields
        const typeConfig = this.feedbackTypes[type];
        if (typeConfig) {
            typeConfig.fields.forEach(field => {
                const element = modal.querySelector(`#feedback-${field}`);
                if (element) {
                    if (field === 'rating') {
                        // Special handling for star rating
                        const selectedStar = modal.querySelector('.rating-star.text-yellow-400:last-of-type');
                        data[field] = selectedStar ? parseInt(selectedStar.dataset.rating) : 0;
                    } else {
                        data[field] = element.value;
                    }
                }
            });
        }
        
        return data;
    }

    // Get session context for feedback
    getSessionContext() {
        return {
            sessionDuration: Date.now() - this.sessionData.startTime,
            actionsCount: this.sessionData.actions.length,
            errorsCount: this.sessionData.errors.length,
            viewport: this.sessionData.viewport,
            performance: this.sessionData.performance,
            recentErrors: this.sessionData.errors.slice(-3) // Last 3 errors
        };
    }

    // Send feedback via email to support@endemicmedia.com
    async sendFeedback(feedbackData) {
        console.log('📝 Feedback submitted:', feedbackData);

        try {
            // Store locally for backup
            this.storeFeedbackLocally(feedbackData);

            // Send via email
            await this.sendFeedbackEmail(feedbackData);

            return { success: true, id: 'feedback_' + Date.now() };
        } catch (error) {
            console.error('Failed to send feedback email:', error);

            // Try alternative form submission service
            try {
                await this.submitToFormService(feedbackData);
                return { success: true, id: 'feedback_' + Date.now() + '_form' };
            } catch (formError) {
                console.error('Form service also failed:', formError);
                throw new Error('Unable to send feedback. Please try again later.');
            }
        }
    }

    // Send feedback email using mailto
    async sendFeedbackEmail(feedbackData) {
        const emailSubject = `SpotKin Feedback: ${feedbackData.type || 'General'} ${feedbackData.rating ? '(★' + feedbackData.rating + ')' : ''}`;

        const emailBody = `
New SpotKin Feedback Received
================================

Type: ${this.feedbackTypes[feedbackData.type]?.title || feedbackData.type}
Rating: ${feedbackData.rating ? '★'.repeat(feedbackData.rating) + ' (' + feedbackData.rating + '/5)' : 'Not provided'}

Description:
${feedbackData.description || 'No description provided'}

Additional Details:
${Object.entries(feedbackData).filter(([key, value]) =>
    !['type', 'description', 'email', 'metadata', 'sessionContext'].includes(key) && value
).map(([key, value]) => `${key}: ${value}`).join('\n') || 'None'}

User Information:
Email: ${feedbackData.email || 'Not provided (anonymous)'}
Timestamp: ${feedbackData.metadata?.timestamp || 'Unknown'}
Page: ${feedbackData.metadata?.url || 'Unknown'}
User Agent: ${feedbackData.metadata?.userAgent || 'Unknown'}

Session Context:
${feedbackData.sessionContext ? `
- Session Duration: ${Math.round(feedbackData.sessionContext.sessionDuration / 1000)} seconds
- Actions Count: ${feedbackData.sessionContext.actionsCount}
- Errors Count: ${feedbackData.sessionContext.errorsCount}
- Viewport: ${feedbackData.sessionContext.viewport?.width}x${feedbackData.sessionContext.viewport?.height}
` : 'Session context not included'}

================================

This feedback was submitted through the SpotKin feedback system.
${feedbackData.email ? 'You can reply directly to the user\'s email address.' : 'This is anonymous feedback - no reply address available.'}
        `.trim();

        // Create mailto link and attempt to open
        const mailtoLink = `mailto:support@endemicmedia.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        // Try to open email client
        const link = document.createElement('a');
        link.href = mailtoLink;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Wait a moment to see if email client opens
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Alternative form submission service
    async submitToFormService(feedbackData) {
        const formData = new FormData();
        formData.append('_to', 'support@endemicmedia.com');
        formData.append('_subject', `SpotKin Feedback: ${feedbackData.type || 'General'}`);
        formData.append('_captcha', 'false');
        formData.append('_template', 'basic');
        formData.append('_next', window.location.href);

        // Add feedback data
        formData.append('feedback_type', feedbackData.type || 'general');
        formData.append('rating', feedbackData.rating || 'Not provided');
        formData.append('description', feedbackData.description || 'No description');
        formData.append('email', feedbackData.email || 'Anonymous');
        formData.append('timestamp', feedbackData.metadata?.timestamp || new Date().toISOString());
        formData.append('url', feedbackData.metadata?.url || window.location.href);
        formData.append('user_agent', feedbackData.metadata?.userAgent || navigator.userAgent);

        // Add additional fields if present
        Object.entries(feedbackData).forEach(([key, value]) => {
            if (!['type', 'description', 'email', 'metadata', 'sessionContext'].includes(key) && value) {
                formData.append(`additional_${key}`, value);
            }
        });

        const response = await fetch('https://formsubmit.co/ajax/support@endemicmedia.com', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Form service responded with status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success !== 'true') {
            throw new Error('Form service reported failure');
        }

        return result;
    }

    // Store feedback locally until it can be sent
    storeFeedbackLocally(feedbackData) {
        try {
            const existingFeedback = JSON.parse(localStorage.getItem('spotkin_feedback_queue') || '[]');
            existingFeedback.push(feedbackData);
            
            // Keep only recent feedback (last 50)
            if (existingFeedback.length > 50) {
                existingFeedback.splice(0, existingFeedback.length - 50);
            }
            
            localStorage.setItem('spotkin_feedback_queue', JSON.stringify(existingFeedback));
        } catch (error) {
            console.warn('Could not store feedback locally:', error);
        }
    }

    // Show success message
    showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
        message.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-3"></i>
                <div>
                    <p class="font-medium">Thank you!</p>
                    <p class="text-sm opacity-90">Your feedback has been submitted successfully.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }

    // Show error message
    showErrorMessage(error) {
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
        message.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-3"></i>
                <div>
                    <p class="font-medium">Error</p>
                    <p class="text-sm opacity-90">${error}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 7000);
    }

    // Show privacy notice for feedback
    showPrivacyNotice() {
        const notice = document.createElement('div');
        notice.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        notice.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
                <div class="text-center mb-4">
                    <i class="fas fa-shield-alt text-4xl text-indigo-600 mb-3"></i>
                    <h3 class="text-lg font-bold text-gray-900">Privacy Notice</h3>
                </div>
                
                <p class="text-gray-600 mb-4">
                    To provide feedback, SpotKin would like to collect anonymous usage data to help us understand your experience better.
                </p>
                
                <div class="space-y-2 text-sm text-gray-500 mb-6">
                    <p><i class="fas fa-check text-green-500 mr-2"></i>All data is anonymous</p>
                    <p><i class="fas fa-check text-green-500 mr-2"></i>No personal information is collected</p>
                    <p><i class="fas fa-check text-green-500 mr-2"></i>Used only to improve the app</p>
                </div>
                
                <div class="flex space-x-3">
                    <button id="privacy-accept" class="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700">
                        Enable Feedback
                    </button>
                    <button id="privacy-decline" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300">
                        No Thanks
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notice);
        
        notice.querySelector('#privacy-accept').addEventListener('click', () => {
            this.setFeedbackPreference(true);
            notice.remove();
            this.showFeedbackModal();
        });
        
        notice.querySelector('#privacy-decline').addEventListener('click', () => {
            this.setFeedbackPreference(false);
            notice.remove();
        });
    }

    // Get feedback preference
    getFeedbackPreference() {
        const pref = localStorage.getItem('spotkin_feedback_enabled');
        return pref === 'true';
    }

    // Set feedback preference
    setFeedbackPreference(enabled) {
        localStorage.setItem('spotkin_feedback_enabled', enabled.toString());
        this.isEnabled = enabled;
    }

    // Get feedback statistics
    getFeedbackStatistics() {
        try {
            const feedback = JSON.parse(localStorage.getItem('spotkin_feedback_queue') || '[]');
            const stats = {
                total: feedback.length,
                byType: {},
                recent: feedback.filter(f => 
                    Date.now() - new Date(f.metadata.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
                ).length
            };
            
            feedback.forEach(f => {
                stats.byType[f.type] = (stats.byType[f.type] || 0) + 1;
            });
            
            return stats;
        } catch (error) {
            return { total: 0, byType: {}, recent: 0 };
        }
    }

    // Export feedback data for analysis
    exportFeedbackData() {
        try {
            const feedback = JSON.parse(localStorage.getItem('spotkin_feedback_queue') || '[]');
            return {
                exported: new Date().toISOString(),
                version: '4.0.0',
                feedback,
                statistics: this.getFeedbackStatistics()
            };
        } catch (error) {
            return null;
        }
    }

    // Show feedback button in UI
    createFeedbackButton() {
        const button = document.createElement('button');
        button.id = 'feedback-button';
        button.className = 'fixed bottom-4 left-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg z-40 transition-colors';
        button.innerHTML = '<i class="fas fa-comment"></i>';
        button.title = 'Send Feedback';
        
        button.addEventListener('click', () => {
            this.showFeedbackModal();
        });
        
        document.body.appendChild(button);
        return button;
    }
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackCollectionSystem;
} else if (typeof window !== 'undefined') {
    window.FeedbackCollectionSystem = FeedbackCollectionSystem;
}