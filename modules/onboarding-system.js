// Interactive Onboarding System for SpotKin
// Comprehensive first-time user experience with guided tutorials and contextual help

class OnboardingSystem {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 0;
        this.isActive = false;
        this.hasCompletedOnboarding = false;
        this.userProfile = {
            monitorType: null,
            experience: null,
            goals: [],
            preferences: {}
        };
        
        this.init();
    }

    init() {
        console.log('🎓 Onboarding System initialized');
        this.loadOnboardingState();
        this.createOnboardingOverlay();
        this.bindEvents();
        
        // Auto-onboarding disabled - only manual trigger via Setup button
        // if (this.shouldShowOnboarding()) {
        //     setTimeout(() => this.startOnboarding(), 1000);
        // }
    }

    shouldShowOnboarding() {
        // Never auto-show onboarding - only show when manually triggered
        return false;
    }

    loadOnboardingState() {
        try {
            const saved = localStorage.getItem('spotkin_onboarding_state');
            if (saved) {
                const state = JSON.parse(saved);
                this.hasCompletedOnboarding = state.completed || false;
                this.userProfile = state.userProfile || this.userProfile;
            }
        } catch (error) {
            console.warn('Failed to load onboarding state:', error);
        }
    }

    saveOnboardingState() {
        try {
            const state = {
                completed: this.hasCompletedOnboarding,
                userProfile: this.userProfile,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('spotkin_onboarding_state', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save onboarding state:', error);
        }
    }

    createOnboardingOverlay() {
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center hidden';
        
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-2xl mx-4 relative overflow-hidden">
                <!-- Progress bar -->
                <div class="h-2 bg-gray-200">
                    <div id="onboarding-progress" class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style="width: 0%"></div>
                </div>
                
                <!-- Header -->
                <div class="p-6 border-b border-gray-100">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-graduation-cap text-white"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-gray-900">🔥 TESTING FILE CHANGES 🔥</h2>
                                <p class="text-sm text-gray-500" id="onboarding-subtitle">Let's get you started</p>
                            </div>
                        </div>
                        <button id="onboarding-close" class="text-gray-400 hover:text-gray-600 transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Content area -->
                <div id="onboarding-content" class="p-8 min-h-96">
                    <!-- Dynamic content will be inserted here -->
                </div>
                
                <!-- Footer -->
                <div class="px-8 py-6 bg-gray-50 flex items-center justify-between">
                    <button id="onboarding-prev" class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors hidden">
                        <i class="fas fa-chevron-left mr-2"></i>Previous
                    </button>
                    <div class="flex items-center space-x-2" id="onboarding-dots">
                        <!-- Progress dots will be inserted here -->
                    </div>
                    <button id="onboarding-next" class="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all">
                        Get Started <i class="fas fa-chevron-right ml-2"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    bindEvents() {
        // Close button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'onboarding-close') {
                this.closeOnboarding();
            }
        });

        // Navigation buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'onboarding-next' || e.target.closest('#onboarding-next')) {
                this.nextStep();
            }
            if (e.target.id === 'onboarding-prev' || e.target.closest('#onboarding-prev')) {
                this.prevStep();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                this.nextStep();
            } else if (e.key === 'ArrowLeft') {
                this.prevStep();
            } else if (e.key === 'Escape') {
                this.closeOnboarding();
            }
        });
    }

    startOnboarding() {
        console.log('🎓 Starting interactive onboarding');
        this.isActive = true;
        this.currentStep = 0;
        this.totalSteps = this.getOnboardingSteps().length;
        
        const overlay = document.getElementById('onboarding-overlay');
        overlay.classList.remove('hidden');
        
        this.renderStep();
        this.updateProgress();
        this.createProgressDots();
        
        // Track onboarding start
        this.trackEvent('onboarding_started');
    }

    closeOnboarding() {
        this.isActive = false;
        const overlay = document.getElementById('onboarding-overlay');
        overlay.classList.add('hidden');
        
        this.trackEvent('onboarding_closed', { step: this.currentStep });
    }

    completeOnboarding() {
        this.hasCompletedOnboarding = true;
        this.isActive = false;
        
        // Mark as completed
        localStorage.setItem('spotkin_onboarding_completed', 'true');
        localStorage.setItem('spotkin_first_use', new Date().toISOString());
        
        this.saveOnboardingState();
        this.closeOnboarding();
        
        // Show completion celebration
        this.showCompletionCelebration();
        
        this.trackEvent('onboarding_completed');
        console.log('🎉 Onboarding completed successfully!');
    }

    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.renderStep();
            this.updateProgress();
            this.updateNavigation();
        } else {
            this.completeOnboarding();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep();
            this.updateProgress();
            this.updateNavigation();
        }
    }

    renderStep() {
        const steps = this.getOnboardingSteps();
        const currentStepData = steps[this.currentStep];
        
        if (!currentStepData) return;
        
        const content = document.getElementById('onboarding-content');
        const subtitle = document.getElementById('onboarding-subtitle');
        
        subtitle.textContent = currentStepData.subtitle;
        content.innerHTML = currentStepData.content;
        
        // Execute step-specific logic
        if (currentStepData.onRender) {
            currentStepData.onRender(this);
        }
        
        this.updateNavigation();
        
        // Track step view
        this.trackEvent('onboarding_step_viewed', { 
            step: this.currentStep,
            step_name: currentStepData.id 
        });
    }

    updateProgress() {
        const progress = ((this.currentStep + 1) / this.totalSteps) * 100;
        const progressBar = document.getElementById('onboarding-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    updateNavigation() {
        const prevBtn = document.getElementById('onboarding-prev');
        const nextBtn = document.getElementById('onboarding-next');
        
        // Previous button
        if (this.currentStep > 0) {
            prevBtn.classList.remove('hidden');
        } else {
            prevBtn.classList.add('hidden');
        }
        
        // Next button text
        if (this.currentStep === this.totalSteps - 1) {
            nextBtn.innerHTML = 'Complete Setup <i class="fas fa-check ml-2"></i>';
        } else {
            nextBtn.innerHTML = 'Continue <i class="fas fa-chevron-right ml-2"></i>';
        }
    }

    createProgressDots() {
        const dotsContainer = document.getElementById('onboarding-dots');
        dotsContainer.innerHTML = '';
        
        for (let i = 0; i < this.totalSteps; i++) {
            const dot = document.createElement('div');
            dot.className = `w-2 h-2 rounded-full transition-colors ${
                i <= this.currentStep ? 'bg-indigo-500' : 'bg-gray-300'
            }`;
            dotsContainer.appendChild(dot);
        }
    }

    getOnboardingSteps() {
        return [
            {
                id: 'welcome',
                subtitle: 'AI-Powered Monitoring for Your Peace of Mind',
                content: this.getWelcomeStep(),
                onRender: () => this.setupWelcomeInteractions()
            },
            {
                id: 'monitor_type',
                subtitle: 'Choose Your Monitoring Focus',
                content: this.getMonitorTypeStep(),
                onRender: () => this.setupMonitorTypeSelection()
            },
            {
                id: 'camera_setup',
                subtitle: 'Position Your Camera',
                content: this.getCameraSetupStep(),
                onRender: () => this.setupCameraDemo()
            },
            {
                id: 'ai_features',
                subtitle: 'Understanding AI Analysis',
                content: this.getAIFeaturesStep(),
                onRender: () => this.setupAIDemo()
            },
            {
                id: 'privacy_security',
                subtitle: 'Your Privacy & Security',
                content: this.getPrivacyStep(),
                onRender: () => this.setupPrivacyInfo()
            },
            {
                id: 'first_analysis',
                subtitle: 'Ready to Start Monitoring',
                content: this.getFirstAnalysisStep(),
                onRender: () => this.setupFirstAnalysis()
            }
        ];
    }

    getWelcomeStep() {
        return `
            <div class="text-center">
                <div class="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-eye text-3xl text-white"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">🚀 FILE EDIT TEST SUCCESS 🚀</h3>
                <p class="text-gray-600 text-lg mb-6">Transform any device with a camera into an intelligent AI-powered monitor for babies, pets, and home security.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div class="p-4 bg-indigo-50 rounded-lg">
                        <i class="fas fa-brain text-2xl text-indigo-600 mb-2"></i>
                        <h4 class="font-semibold text-gray-900">Smart AI Analysis</h4>
                        <p class="text-sm text-gray-600">Advanced scene understanding with context-aware alerts</p>
                    </div>
                    <div class="p-4 bg-purple-50 rounded-lg">
                        <i class="fas fa-shield-alt text-2xl text-purple-600 mb-2"></i>
                        <h4 class="font-semibold text-gray-900">Privacy First</h4>
                        <p class="text-sm text-gray-600">All processing happens locally on your device</p>
                    </div>
                    <div class="p-4 bg-pink-50 rounded-lg">
                        <i class="fas fa-mobile-alt text-2xl text-pink-600 mb-2"></i>
                        <h4 class="font-semibold text-gray-900">Works Anywhere</h4>
                        <p class="text-sm text-gray-600">No special hardware required - use any camera</p>
                    </div>
                </div>
            </div>
        `;
    }

    getMonitorTypeStep() {
        return `
            <div>
                <h3 class="text-xl font-bold text-gray-900 mb-4 text-center">What would you like to monitor?</h3>
                <p class="text-gray-600 mb-6 text-center">This helps us customize the AI analysis for your specific needs.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <label class="cursor-pointer onboarding-monitor-option" data-type="baby">
                        <div class="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-400 transition-all duration-200 text-center">
                            <i class="fas fa-baby text-4xl text-pink-500 mb-3"></i>
                            <h4 class="font-semibold text-lg">Baby Monitor</h4>
                            <p class="text-sm text-gray-600 mt-2">Monitor sleeping babies, detect crying, track movement patterns</p>
                        </div>
                    </label>
                    
                    <label class="cursor-pointer onboarding-monitor-option" data-type="pet">
                        <div class="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-400 transition-all duration-200 text-center">
                            <i class="fas fa-paw text-4xl text-amber-500 mb-3"></i>
                            <h4 class="font-semibold text-lg">Pet Monitor</h4>
                            <p class="text-sm text-gray-600 mt-2">Watch pets, detect unusual behavior, monitor activity levels</p>
                        </div>
                    </label>
                </div>
                
                <div class="mb-4">
                    <label class="cursor-pointer onboarding-monitor-option" data-type="general">
                        <div class="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-400 transition-all duration-200">
                            <div class="flex items-center">
                                <i class="fas fa-home text-2xl text-blue-500 mr-4"></i>
                                <div>
                                    <h4 class="font-semibold">General Security</h4>
                                    <p class="text-sm text-gray-600">Monitor general areas, detect motion and unusual activities</p>
                                </div>
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }

    getCameraSetupStep() {
        return `
            <div>
                <h3 class="text-xl font-bold text-gray-900 mb-4 text-center">Camera Positioning Tips</h3>
                <p class="text-gray-600 mb-6 text-center">Optimal camera placement ensures the best AI analysis results.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4" id="camera-tips">
                        <!-- Tips will be populated based on monitor type -->
                    </div>
                    
                    <div class="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                        <div class="text-center">
                            <i class="fas fa-camera text-4xl text-gray-400 mb-2"></i>
                            <p class="text-sm text-gray-600">Camera preview will appear here once you start monitoring</p>
                            <button class="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors" onclick="window.onboardingSystem.testCamera()">
                                Test Camera <i class="fas fa-video ml-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getAIFeaturesStep() {
        return `
            <div>
                <h3 class="text-xl font-bold text-gray-900 mb-4 text-center">Understanding AI Analysis</h3>
                <p class="text-gray-600 mb-6 text-center">See how SpotKin's AI understands and analyzes scenes.</p>
                
                <div class="space-y-6">
                    <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-check-circle text-green-600 mr-2"></i>
                            <h4 class="font-semibold text-green-800">Safe Conditions</h4>
                        </div>
                        <p class="text-sm text-green-700">Normal activities, sleeping, peaceful situations</p>
                    </div>
                    
                    <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                            <h4 class="font-semibold text-yellow-800">Warning Situations</h4>
                        </div>
                        <p class="text-sm text-yellow-700">Unusual movement, potential hazards, attention needed</p>
                    </div>
                    
                    <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-alert text-red-600 mr-2"></i>
                            <h4 class="font-semibold text-red-800">Critical Alerts</h4>
                        </div>
                        <p class="text-sm text-red-700">Immediate attention required, safety concerns</p>
                    </div>
                </div>
                
                <div class="mt-6 p-4 bg-indigo-50 rounded-lg">
                    <h4 class="font-semibold text-indigo-800 mb-2">🧠 AI Features</h4>
                    <ul class="text-sm text-indigo-700 space-y-1">
                        <li>• Multi-frame temporal analysis for movement detection</li>
                        <li>• Context-aware scene understanding</li>
                        <li>• Customizable sensitivity settings</li>
                        <li>• Smart noise reduction and false positive filtering</li>
                    </ul>
                </div>
            </div>
        `;
    }

    getPrivacyStep() {
        return `
            <div>
                <h3 class="text-xl font-bold text-gray-900 mb-4 text-center">Your Privacy & Security</h3>
                <p class="text-gray-600 mb-6 text-center">SpotKin is designed with privacy as the top priority.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-lock text-indigo-600 mt-1"></i>
                            <div>
                                <h4 class="font-semibold text-gray-900">Local Processing</h4>
                                <p class="text-sm text-gray-600">All AI analysis happens on your device - no images sent to servers</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-shield-alt text-green-600 mt-1"></i>
                            <div>
                                <h4 class="font-semibold text-gray-900">Encrypted Storage</h4>
                                <p class="text-sm text-gray-600">Data stored locally with military-grade AES-256 encryption</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-eye-slash text-purple-600 mt-1"></i>
                            <div>
                                <h4 class="font-semibold text-gray-900">No Data Collection</h4>
                                <p class="text-sm text-gray-600">We don't collect, store, or transmit your personal data</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-100 rounded-lg p-6 text-center">
                        <i class="fas fa-certificate text-4xl text-indigo-600 mb-3"></i>
                        <h4 class="font-semibold text-gray-900 mb-2">GDPR Compliant</h4>
                        <p class="text-sm text-gray-600 mb-4">Full compliance with privacy regulations</p>
                        <div class="text-xs text-gray-500 space-y-1">
                            <div>✓ Data portability</div>
                            <div>✓ Right to deletion</div>
                            <div>✓ Privacy by design</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getFirstAnalysisStep() {
        return `
            <div class="text-center">
                <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-play text-2xl text-white"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">You're All Set!</h3>
                <p class="text-gray-600 text-lg mb-6">SpotKin is now configured and ready to provide intelligent monitoring.</p>
                
                <div class="bg-indigo-50 p-6 rounded-lg mb-6">
                    <h4 class="font-semibold text-indigo-800 mb-3">Quick Start Guide:</h4>
                    <div class="text-left space-y-2 text-sm text-indigo-700">
                        <div class="flex items-center">
                            <i class="fas fa-circle text-xs mr-3"></i>
                            Click "Take Snapshot" to analyze a single moment
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-circle text-xs mr-3"></i>
                            Use "Start Monitoring" for continuous analysis
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-circle text-xs mr-3"></i>
                            Check the History tab to review past events
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-circle text-xs mr-3"></i>
                            Adjust settings in the Settings panel
                        </div>
                    </div>
                </div>
                
                <div class="text-sm text-gray-500">
                    <p>Need help? Click the <i class="fas fa-question-circle text-blue-500"></i> Help button anytime for assistance.</p>
                </div>
            </div>
        `;
    }

    // Step interaction handlers
    setupWelcomeInteractions() {
        // Add any welcome step specific interactions
    }

    setupMonitorTypeSelection() {
        const options = document.querySelectorAll('.onboarding-monitor-option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                // Remove selection from others
                options.forEach(opt => opt.querySelector('div').classList.remove('border-indigo-500', 'bg-indigo-50'));
                
                // Add selection to clicked option
                const div = option.querySelector('div');
                div.classList.add('border-indigo-500', 'bg-indigo-50');
                
                // Save selection
                this.userProfile.monitorType = option.dataset.type;
                this.saveOnboardingState();
            });
        });
    }

    setupCameraDemo() {
        const tipsContainer = document.getElementById('camera-tips');
        const monitorType = this.userProfile.monitorType || 'general';
        
        const tips = {
            baby: [
                { icon: 'fas fa-bed', text: 'Position above the crib at a 45-degree angle' },
                { icon: 'fas fa-lightbulb', text: 'Ensure adequate lighting without glare' },
                { icon: 'fas fa-volume-up', text: 'Place where you can hear audio clearly' },
                { icon: 'fas fa-eye', text: 'Keep full view of the sleeping area' }
            ],
            pet: [
                { icon: 'fas fa-couch', text: 'Cover main activity areas and resting spots' },
                { icon: 'fas fa-door-open', text: 'Monitor entry/exit points' },
                { icon: 'fas fa-paw', text: 'Position at pet eye-level for better detection' },
                { icon: 'fas fa-home', text: 'Avoid areas with frequent false triggers' }
            ],
            general: [
                { icon: 'fas fa-door-closed', text: 'Monitor main entry points' },
                { icon: 'fas fa-stairs', text: 'Cover high-traffic areas' },
                { icon: 'fas fa-lightbulb', text: 'Ensure good lighting conditions' },
                { icon: 'fas fa-shield-alt', text: 'Position securely and discretely' }
            ]
        };
        
        tipsContainer.innerHTML = tips[monitorType].map(tip => `
            <div class="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                <i class="${tip.icon} text-indigo-600 mt-1"></i>
                <p class="text-sm text-gray-700">${tip.text}</p>
            </div>
        `).join('');
    }

    setupAIDemo() {
        // Could add interactive AI demo here
    }

    setupPrivacyInfo() {
        // Add privacy information interactions
    }

    setupFirstAnalysis() {
        // Setup final step
    }

    testCamera() {
        console.log('Testing camera for onboarding');
        // This would integrate with the existing camera system
        if (window.initCamera) {
            window.initCamera();
        }
    }

    showCompletionCelebration() {
        // Create a celebration popup
        const celebration = document.createElement('div');
        celebration.className = 'fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center';
        celebration.innerHTML = `
            <div class="bg-white rounded-2xl p-8 mx-4 text-center max-w-md animate-bounce">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
                <p class="text-gray-600 mb-6">You've successfully set up SpotKin. Your intelligent monitoring system is ready to use!</p>
                <button onclick="this.closest('div').remove()" class="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all">
                    Start Monitoring <i class="fas fa-rocket ml-2"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.remove();
            }
        }, 10000);
    }

    // Analytics tracking
    trackEvent(eventName, properties = {}) {
        try {
            // This would integrate with analytics system
            console.log('📊 Onboarding Event:', eventName, properties);
            
            // Store locally for now
            const events = JSON.parse(localStorage.getItem('spotkin_onboarding_events') || '[]');
            events.push({
                event: eventName,
                properties,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('spotkin_onboarding_events', JSON.stringify(events));
        } catch (error) {
            console.warn('Failed to track onboarding event:', error);
        }
    }

    // Public methods for external integration
    restartOnboarding() {
        localStorage.removeItem('spotkin_onboarding_completed');
        localStorage.removeItem('spotkin_onboarding_state');
        this.hasCompletedOnboarding = false;
        this.startOnboarding();
    }

    skipOnboarding() {
        this.trackEvent('onboarding_skipped', { step: this.currentStep });
        this.completeOnboarding();
    }
}

// Export for dynamic import
export default OnboardingSystem;