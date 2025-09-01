// Module Loader - Dynamic Import System for Code Splitting
// This module provides lazy loading for non-critical features

class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        console.log('📦 Module Loader initialized');
    }

    // Load Preference Migration System module dynamically
    async loadPreferenceMigrationModule() {
        const moduleKey = 'preference-migration';
        
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleKey)) {
            return this.loadedModules.get(moduleKey);
        }

        // Return existing loading promise if already loading
        if (this.loadingPromises.has(moduleKey)) {
            return this.loadingPromises.get(moduleKey);
        }

        console.log('🔄 Loading Preference Migration System module...');
        
        const loadingPromise = this.dynamicImport('./modules/preference-migration.js')
            .then(module => {
                const PreferenceMigrationSystem = module.default || module.PreferenceMigrationSystem;
                const instance = new PreferenceMigrationSystem();
                this.loadedModules.set(moduleKey, instance);
                this.loadingPromises.delete(moduleKey);
                console.log('✅ Preference Migration System module loaded successfully');
                return instance;
            })
            .catch(error => {
                console.error('❌ Failed to load Preference Migration System module:', error);
                this.loadingPromises.delete(moduleKey);
                // Return fallback implementation
                return this.createFallbackMigrationSystem();
            });

        this.loadingPromises.set(moduleKey, loadingPromise);
        return loadingPromise;
    }

    // Load Feedback Collection System module dynamically
    async loadFeedbackModule() {
        const moduleKey = 'feedback-collection';
        
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleKey)) {
            return this.loadedModules.get(moduleKey);
        }

        // Return existing loading promise if already loading
        if (this.loadingPromises.has(moduleKey)) {
            return this.loadingPromises.get(moduleKey);
        }

        console.log('💬 Loading Feedback Collection System module...');
        
        const loadingPromise = this.dynamicImport('./modules/feedback-collection.js')
            .then(module => {
                const FeedbackCollectionSystem = module.default || module.FeedbackCollectionSystem;
                const instance = new FeedbackCollectionSystem();
                this.loadedModules.set(moduleKey, instance);
                this.loadingPromises.delete(moduleKey);
                console.log('✅ Feedback Collection System module loaded successfully');
                return instance;
            })
            .catch(error => {
                console.error('❌ Failed to load Feedback Collection System module:', error);
                this.loadingPromises.delete(moduleKey);
                // Return fallback implementation
                return this.createFallbackFeedbackSystem();
            });

        this.loadingPromises.set(moduleKey, loadingPromise);
        return loadingPromise;
    }

    // Load FAQ System module dynamically
    async loadFAQModule() {
        const moduleKey = 'faq-system';
        
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleKey)) {
            return this.loadedModules.get(moduleKey);
        }

        // Return existing loading promise if already loading
        if (this.loadingPromises.has(moduleKey)) {
            return this.loadingPromises.get(moduleKey);
        }

        console.log('❓ Loading FAQ System module...');
        
        const loadingPromise = this.dynamicImport('./modules/faq-system.js')
            .then(module => {
                const FAQSystem = module.default || module.FAQSystem;
                const instance = new FAQSystem();
                this.loadedModules.set(moduleKey, instance);
                this.loadingPromises.delete(moduleKey);
                console.log('✅ FAQ System module loaded successfully');
                return instance;
            })
            .catch(error => {
                console.error('❌ Failed to load FAQ System module:', error);
                this.loadingPromises.delete(moduleKey);
                // Return null for FAQ - it's not critical
                return null;
            });

        this.loadingPromises.set(moduleKey, loadingPromise);
        return loadingPromise;
    }

    // Load Contextual Help module dynamically
    async loadContextualHelpModule() {
        const moduleKey = 'contextual-help';
        
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleKey)) {
            return this.loadedModules.get(moduleKey);
        }

        // Return existing loading promise if already loading
        if (this.loadingPromises.has(moduleKey)) {
            return this.loadingPromises.get(moduleKey);
        }

        console.log('💡 Loading Contextual Help module...');
        
        const loadingPromise = this.dynamicImport('./modules/contextual-help.js')
            .then(module => {
                const ContextualHelp = module.default || module.ContextualHelp;
                const instance = new ContextualHelp();
                this.loadedModules.set(moduleKey, instance);
                this.loadingPromises.delete(moduleKey);
                console.log('✅ Contextual Help module loaded successfully');
                return instance;
            })
            .catch(error => {
                console.error('❌ Failed to load Contextual Help module:', error);
                this.loadingPromises.delete(moduleKey);
                // Return null for contextual help - it's not critical
                return null;
            });

        this.loadingPromises.set(moduleKey, loadingPromise);
        return loadingPromise;
    }

    // Load Onboarding System module dynamically
    async loadOnboardingModule() {
        const moduleKey = 'onboarding-system';
        
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleKey)) {
            return this.loadedModules.get(moduleKey);
        }

        // Return existing loading promise if already loading
        if (this.loadingPromises.has(moduleKey)) {
            return this.loadingPromises.get(moduleKey);
        }

        console.log('🎓 Loading Onboarding System module...');
        
        const loadingPromise = this.dynamicImport('./modules/onboarding-system.js')
            .then(module => {
                const OnboardingSystem = module.default || module.OnboardingSystem;
                const instance = new OnboardingSystem();
                this.loadedModules.set(moduleKey, instance);
                this.loadingPromises.delete(moduleKey);
                console.log('✅ Onboarding System module loaded successfully');
                return instance;
            })
            .catch(error => {
                console.error('❌ Failed to load Onboarding System module:', error);
                this.loadingPromises.delete(moduleKey);
                // Return null for onboarding system - it's not critical
                return null;
            });

        this.loadingPromises.set(moduleKey, loadingPromise);
        return loadingPromise;
    }

    // Load Daily Summary module dynamically
    async loadDailySummaryModule() {
        const moduleKey = 'daily-summary';
        
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleKey)) {
            return this.loadedModules.get(moduleKey);
        }

        // Return existing loading promise if already loading
        if (this.loadingPromises.has(moduleKey)) {
            return this.loadingPromises.get(moduleKey);
        }

        console.log('📊 Loading Daily Summary module...');
        
        const loadingPromise = this.dynamicImport('./modules/daily-summary.js')
            .then(module => {
                const DailySummaryManager = module.default || module.DailySummaryManager;
                const instance = new DailySummaryManager();
                this.loadedModules.set(moduleKey, instance);
                this.loadingPromises.delete(moduleKey);
                console.log('✅ Daily Summary module loaded successfully');
                return instance;
            })
            .catch(error => {
                console.error('❌ Failed to load Daily Summary module:', error);
                this.loadingPromises.delete(moduleKey);
                // Return fallback implementation
                return this.createFallbackDailySummary();
            });

        this.loadingPromises.set(moduleKey, loadingPromise);
        return loadingPromise;
    }

    // Load Advanced AI module dynamically
    async loadAdvancedAIModule() {
        const moduleKey = 'advanced-ai';
        
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleKey)) {
            return this.loadedModules.get(moduleKey);
        }

        // Return existing loading promise if already loading
        if (this.loadingPromises.has(moduleKey)) {
            return this.loadingPromises.get(moduleKey);
        }

        console.log('🧠 Loading Advanced AI module...');
        
        const loadingPromise = this.dynamicImport('./modules/advanced-ai.js')
            .then(module => {
                const AdvancedAIManager = module.default || module.AdvancedAIManager;
                const instance = new AdvancedAIManager();
                this.loadedModules.set(moduleKey, instance);
                this.loadingPromises.delete(moduleKey);
                console.log('✅ Advanced AI module loaded successfully');
                return instance;
            })
            .catch(error => {
                console.error('❌ Failed to load Advanced AI module:', error);
                this.loadingPromises.delete(moduleKey);
                // Return fallback implementation
                return this.createFallbackAdvancedAI();
            });

        this.loadingPromises.set(moduleKey, loadingPromise);
        return loadingPromise;
    }

    // Dynamic import wrapper with fallback
    async dynamicImport(modulePath) {
        try {
            // Use dynamic import if supported
            if (typeof window.import === 'function' || 'import' in window) {
                const module = await import(modulePath);
                return module;
            } else {
                // Fallback for older browsers - load script dynamically
                return await this.loadScriptModule(modulePath);
            }
        } catch (error) {
            console.error(`Failed to import module ${modulePath}:`, error);
            throw error;
        }
    }

    // Fallback script loading for browsers without dynamic import support
    async loadScriptModule(modulePath) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = modulePath;
            
            script.onload = () => {
                // For fallback, we'll need to access globally exposed objects
                resolve(window.SpotKinModules || {});
            };
            
            script.onerror = () => {
                reject(new Error(`Failed to load script: ${modulePath}`));
            };
            
            document.head.appendChild(script);
        });
    }

    // Create fallback Daily Summary implementation
    createFallbackDailySummary() {
        return {
            generateDailySummary: async (targetDate = new Date()) => {
                console.log('📋 Using fallback Daily Summary implementation');
                return {
                    summary: 'Daily summary temporarily unavailable. Core monitoring functionality continues to work normally.',
                    highlights: ['System operational'],
                    insights: ['All core features available'],
                    mood: 'neutral',
                    fallback: true,
                    date: targetDate.toISOString().split('T')[0]
                };
            },
            getCachedSummary: () => null,
            clearCache: () => {}
        };
    }

    // Create fallback Feedback Collection implementation
    createFallbackFeedbackSystem() {
        return {
            isEnabled: false,
            showFeedbackModal: (type = 'general') => {
                console.log('💬 Using fallback feedback system');
                // Simple alert-based feedback
                const feedback = prompt('Please share your feedback:');
                if (feedback) {
                    console.log('📝 Feedback received:', feedback);
                    alert('Thank you for your feedback! It has been noted.');
                }
            },
            createFeedbackButton: () => {
                console.log('💬 Fallback feedback button not implemented');
                return null;
            },
            getFeedbackStatistics: () => ({
                total: 0,
                byType: {},
                recent: 0,
                fallback: true
            })
        };
    }

    // Create fallback Preference Migration implementation
    createFallbackMigrationSystem() {
        return {
            currentVersion: '4.0.0',
            performMigration: async () => {
                console.log('🔄 Using fallback migration system');
                // Simple version check and update
                const version = localStorage.getItem('spotkin_app_version');
                if (!version || version !== '4.0.0') {
                    localStorage.setItem('spotkin_app_version', '4.0.0');
                    console.log('✅ Version updated to 4.0.0');
                    return { success: true, migrated: true, fallback: true };
                }
                return { success: true, migrated: false, fallback: true };
            },
            getCurrentUserVersion: () => localStorage.getItem('spotkin_app_version') || '1.0.0',
            isMigrationNeeded: (version) => version !== '4.0.0',
            getMigrationStatus: () => ({
                currentUserVersion: localStorage.getItem('spotkin_app_version') || '1.0.0',
                latestVersion: '4.0.0',
                migrationNeeded: (localStorage.getItem('spotkin_app_version') || '1.0.0') !== '4.0.0',
                fallback: true
            }),
            exportUserData: () => ({
                version: '4.0.0',
                timestamp: new Date().toISOString(),
                preferences: {},
                fallback: true
            })
        };
    }

    // Create fallback Advanced AI implementation
    createFallbackAdvancedAI() {
        return {
            createEnhancedAIPrompt: (temporalAnalysis) => {
                // Basic prompt without advanced features
                return `You are an AI assistant helping parents and pet owners monitor their loved ones. Analyze this image/scene and provide a JSON response with:
{
    "scene_description": "brief description",
    "subjects": [{"type": "Baby/Pet/Dog/Cat/Person", "state": "description", "confidence": 0.0-1.0}],
    "safety_assessment": {"level": "Safe/Warning/Danger", "reason": "explanation"}
}`;
            },
            analyzeTemporalChanges: (frameHistory) => {
                return {
                    movementLevel: 'unknown',
                    context: 'Advanced temporal analysis unavailable - using basic mode.',
                    confidence: 0.5
                };
            },
            getSensitivityMultiplier: () => 1.0,
            getMovementThreshold: () => 1000
        };
    }

    // Get module loading status
    getModuleStatus() {
        return {
            loaded: Array.from(this.loadedModules.keys()),
            loading: Array.from(this.loadingPromises.keys()),
            totalLoaded: this.loadedModules.size
        };
    }

    // Preload modules for better performance
    async preloadModules() {
        console.log('🚀 Preloading non-critical modules...');
        
        // Load preference migration system first (highest priority)
        setTimeout(() => {
            this.loadPreferenceMigrationModule().then(migrationSystem => {
                if (migrationSystem) {
                    // Perform migration if needed
                    migrationSystem.performMigration().then(result => {
                        if (result.migrated) {
                            console.log('✅ User preferences migrated successfully');
                        }
                    });
                }
            }).catch(() => {
                console.log('Preference Migration module preload failed - will load on demand');
            });
        }, 100);
        
        // Load onboarding system early for first-time users - COMPLETELY DISABLED
        // setTimeout(() => {
        //     this.loadOnboardingModule().catch(() => {
        //         console.log('Onboarding module preload failed - will load on demand');
        //     });
        // }, 500);
        
        // COMPLETELY DISABLE onboarding module loading
        this.loadOnboardingModule = async function() {
            console.log('Onboarding system loading disabled');
            return null;
        };
        
        // Load contextual help for user guidance
        setTimeout(() => {
            this.loadContextualHelpModule().catch(() => {
                console.log('Contextual Help module preload failed - will load on demand');
            });
        }, 1000);
        
        // Load FAQ system for user support
        setTimeout(() => {
            this.loadFAQModule().catch(() => {
                console.log('FAQ System module preload failed - will load on demand');
            });
        }, 1500);
        
        // Load feedback collection system
        setTimeout(() => {
            this.loadFeedbackModule().then(feedbackSystem => {
                if (feedbackSystem && feedbackSystem.isEnabled) {
                    // Create feedback button after a delay
                    setTimeout(() => {
                        feedbackSystem.createFeedbackButton();
                    }, 5000);
                }
            }).catch(() => {
                console.log('Feedback Collection module preload failed - will load on demand');
            });
        }, 2000);
        
        // Load modules in background without blocking
        setTimeout(() => {
            this.loadAdvancedAIModule().catch(() => {
                console.log('Advanced AI module preload failed - will load on demand');
            });
        }, 2000);

        setTimeout(() => {
            this.loadDailySummaryModule().catch(() => {
                console.log('Daily Summary module preload failed - will load on demand');
            });
        }, 5000);
    }
}

// Create global instance
window.moduleLoader = new ModuleLoader();

export default ModuleLoader;