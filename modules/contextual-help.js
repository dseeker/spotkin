// Contextual Help System for SpotKin
// Provides in-context tooltips, guided hints, and interactive help throughout the application

class ContextualHelp {
    constructor() {
        this.tooltips = new Map();
        this.activeTooltip = null;
        this.helpEnabled = true;
        this.userHelpLevel = 'beginner'; // beginner, intermediate, advanced
        this.shownHints = new Set();
        
        this.init();
    }

    init() {
        console.log('💡 Contextual Help System initialized');
        this.loadHelpState();
        this.setupTooltipSystem();
        this.registerHelpElements();
        this.bindGlobalEvents();
        
        // Show contextual hints for new users
        setTimeout(() => {
            this.showContextualHints();
        }, 3000);
    }

    loadHelpState() {
        try {
            const saved = localStorage.getItem('spotkin_help_state');
            if (saved) {
                const state = JSON.parse(saved);
                this.userHelpLevel = state.helpLevel || 'beginner';
                this.helpEnabled = state.enabled !== false;
                this.shownHints = new Set(state.shownHints || []);
            }
        } catch (error) {
            console.warn('Failed to load help state:', error);
        }
    }

    saveHelpState() {
        try {
            const state = {
                helpLevel: this.userHelpLevel,
                enabled: this.helpEnabled,
                shownHints: Array.from(this.shownHints),
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('spotkin_help_state', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save help state:', error);
        }
    }

    setupTooltipSystem() {
        // Create tooltip container
        if (!document.getElementById('tooltip-container')) {
            const container = document.createElement('div');
            container.id = 'tooltip-container';
            container.className = 'fixed inset-0 pointer-events-none z-50';
            document.body.appendChild(container);
        }
    }

    registerHelpElements() {
        // Define help content for different elements
        this.helpContent = {
            '#take-snapshot': {
                title: 'Take Snapshot',
                content: 'Analyze the current camera view with AI to detect subjects and assess safety.',
                level: 'beginner',
                position: 'bottom',
                trigger: 'hover'
            },
            '#toggle-monitoring': {
                title: 'Continuous Monitoring',
                content: 'Start automatic monitoring that analyzes scenes every few seconds.',
                level: 'beginner',
                position: 'bottom',
                trigger: 'hover'
            },
            '#preferences-btn': {
                title: 'Settings',
                content: 'Customize AI sensitivity, alert preferences, and monitoring behavior.',
                level: 'beginner',
                position: 'left',
                trigger: 'hover'
            },
            '#help-btn': {
                title: 'Help Center',
                content: 'Access comprehensive documentation, tutorials, and troubleshooting guides.',
                level: 'beginner',
                position: 'left',
                trigger: 'hover'
            },
            '#tab-current': {
                title: 'Current Analysis',
                content: 'View real-time AI analysis results and safety assessments.',
                level: 'beginner',
                position: 'bottom',
                trigger: 'hover'
            },
            '#tab-history': {
                title: 'Monitoring History',
                content: 'Review past monitoring events and track patterns over time.',
                level: 'beginner',
                position: 'bottom',
                trigger: 'hover'
            },
            '#camera-container': {
                title: 'Camera Feed',
                content: 'Live camera view for monitoring. Position your camera for optimal coverage.',
                level: 'beginner',
                position: 'top',
                trigger: 'click',
                showOnce: true
            },
            '#analysis-sensitivity': {
                title: 'AI Sensitivity',
                content: 'Higher sensitivity detects smaller changes but may increase false alerts.',
                level: 'intermediate',
                position: 'right',
                trigger: 'focus'
            },
            '#alert-movement': {
                title: 'Movement Alerts',
                content: 'Enable notifications when significant movement is detected.',
                level: 'beginner',
                position: 'right',
                trigger: 'hover'
            },
            '#monitoring-frequency': {
                title: 'Analysis Frequency',
                content: 'How often the AI analyzes the scene. Higher frequency uses more battery.',
                level: 'intermediate',
                position: 'right',
                trigger: 'focus'
            }
        };

        // Register tooltip events for all help elements
        this.registerTooltipEvents();
    }

    registerTooltipEvents() {
        Object.entries(this.helpContent).forEach(([selector, config]) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (config.trigger === 'hover') {
                    element.addEventListener('mouseenter', (e) => this.showTooltip(e, selector, config));
                    element.addEventListener('mouseleave', () => this.hideTooltip());
                } else if (config.trigger === 'focus') {
                    element.addEventListener('focus', (e) => this.showTooltip(e, selector, config));
                    element.addEventListener('blur', () => this.hideTooltip());
                } else if (config.trigger === 'click') {
                    element.addEventListener('click', (e) => {
                        if (!config.showOnce || !this.shownHints.has(selector)) {
                            this.showTooltip(e, selector, config);
                            if (config.showOnce) {
                                this.shownHints.add(selector);
                                this.saveHelpState();
                            }
                        }
                    });
                }
            });
        });
    }

    showTooltip(event, selector, config) {
        if (!this.helpEnabled) return;
        
        // Check if user level matches
        if (!this.shouldShowForLevel(config.level)) return;

        this.hideTooltip(); // Hide any existing tooltip

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-popup bg-gray-900 text-white p-3 rounded-lg shadow-2xl max-w-xs z-50 pointer-events-auto';
        tooltip.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-sm text-blue-200">${config.title}</h4>
                <button class="tooltip-close text-gray-400 hover:text-white ml-2 text-xs">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-xs text-gray-200 leading-relaxed">${config.content}</p>
            ${config.level !== 'beginner' ? `<div class="mt-2 text-xs text-blue-300 opacity-75">💡 ${config.level} tip</div>` : ''}
        `;

        // Position tooltip
        this.positionTooltip(tooltip, event.target, config.position);
        
        // Add to container
        const container = document.getElementById('tooltip-container');
        container.appendChild(tooltip);
        
        this.activeTooltip = tooltip;
        
        // Add close event
        const closeBtn = tooltip.querySelector('.tooltip-close');
        closeBtn.addEventListener('click', () => this.hideTooltip());
        
        // Auto-hide after delay for hover tooltips
        if (config.trigger === 'hover') {
            this.tooltipTimeout = setTimeout(() => this.hideTooltip(), 5000);
        }
        
        // Track tooltip shown
        this.trackHelpEvent('tooltip_shown', { selector, title: config.title, level: config.level });
    }

    positionTooltip(tooltip, targetElement, position) {
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = { width: 300, height: 100 }; // Approximate size
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 10;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                tooltip.classList.add('tooltip-arrow-bottom');
                break;
            case 'bottom':
                top = rect.bottom + 10;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                tooltip.classList.add('tooltip-arrow-top');
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 10;
                tooltip.classList.add('tooltip-arrow-right');
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 10;
                tooltip.classList.add('tooltip-arrow-left');
                break;
        }
        
        // Ensure tooltip stays within viewport
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        if (left < 10) left = 10;
        if (left + tooltipRect.width > viewport.width - 10) {
            left = viewport.width - tooltipRect.width - 10;
        }
        if (top < 10) top = 10;
        if (top + tooltipRect.height > viewport.height - 10) {
            top = viewport.height - tooltipRect.height - 10;
        }
        
        tooltip.style.position = 'fixed';
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }

    hideTooltip() {
        if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
        }
        
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = null;
        }
    }

    shouldShowForLevel(level) {
        const levels = { beginner: 0, intermediate: 1, advanced: 2 };
        return levels[this.userHelpLevel] <= levels[level];
    }

    showContextualHints() {
        if (!this.helpEnabled) return;
        
        // Show progressive hints based on user actions
        const hints = [
            {
                id: 'welcome_hint',
                condition: () => !localStorage.getItem('spotkin_first_snapshot'),
                element: '#take-snapshot',
                message: 'Start by taking your first snapshot!',
                type: 'highlight',
                delay: 2000
            },
            {
                id: 'monitoring_hint',
                condition: () => localStorage.getItem('spotkin_first_snapshot') && !localStorage.getItem('spotkin_first_monitoring'),
                element: '#toggle-monitoring',
                message: 'Try continuous monitoring for hands-free operation',
                type: 'pulse',
                delay: 5000
            },
            {
                id: 'settings_hint',
                condition: () => localStorage.getItem('spotkin_first_monitoring') && this.userHelpLevel === 'beginner',
                element: '#preferences-btn',
                message: 'Customize your monitoring preferences',
                type: 'glow',
                delay: 10000
            }
        ];

        hints.forEach(hint => {
            if (!this.shownHints.has(hint.id) && hint.condition()) {
                setTimeout(() => this.showContextualHint(hint), hint.delay);
            }
        });
    }

    showContextualHint(hint) {
        const element = document.querySelector(hint.element);
        if (!element) return;

        // Create hint indicator
        const indicator = document.createElement('div');
        indicator.className = `contextual-hint contextual-hint-${hint.type}`;
        indicator.innerHTML = `
            <div class="hint-bubble bg-indigo-600 text-white p-2 rounded-lg shadow-lg text-xs max-w-48">
                <div class="flex items-center justify-between">
                    <span>${hint.message}</span>
                    <button class="hint-dismiss ml-2 text-indigo-200 hover:text-white">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        `;

        // Position relative to target element
        const rect = element.getBoundingClientRect();
        indicator.style.position = 'fixed';
        indicator.style.top = `${rect.bottom + 10}px`;
        indicator.style.left = `${rect.left}px`;
        indicator.style.zIndex = '45';

        document.body.appendChild(indicator);

        // Add visual effect to target element
        element.classList.add(`help-${hint.type}`);

        // Dismiss handlers
        const dismissHint = () => {
            indicator.remove();
            element.classList.remove(`help-${hint.type}`);
            this.shownHints.add(hint.id);
            this.saveHelpState();
        };

        indicator.querySelector('.hint-dismiss').addEventListener('click', dismissHint);
        
        // Auto-dismiss after 10 seconds
        setTimeout(dismissHint, 10000);

        // Track hint shown
        this.trackHelpEvent('contextual_hint_shown', { 
            hint_id: hint.id, 
            element: hint.element,
            type: hint.type 
        });
    }

    bindGlobalEvents() {
        // Hide tooltips when scrolling or resizing
        window.addEventListener('scroll', () => this.hideTooltip());
        window.addEventListener('resize', () => this.hideTooltip());
        
        // Keyboard shortcuts for help
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1' || (e.ctrlKey && e.key === '?')) {
                e.preventDefault();
                this.toggleHelpMode();
            }
            if (e.key === 'Escape') {
                this.hideTooltip();
            }
        });

        // Re-register help elements when DOM changes
        const observer = new MutationObserver(() => {
            setTimeout(() => this.registerTooltipEvents(), 100);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    toggleHelpMode() {
        this.helpEnabled = !this.helpEnabled;
        this.saveHelpState();
        
        const status = this.helpEnabled ? 'enabled' : 'disabled';
        this.showSystemMessage(`Contextual help ${status}`, 'info');
        
        if (!this.helpEnabled) {
            this.hideTooltip();
        }
        
        this.trackHelpEvent('help_mode_toggled', { enabled: this.helpEnabled });
    }

    setHelpLevel(level) {
        this.userHelpLevel = level;
        this.saveHelpState();
        this.trackHelpEvent('help_level_changed', { level });
    }

    showSystemMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-3 rounded-lg shadow-lg z-50 text-white ${
            type === 'info' ? 'bg-blue-600' : type === 'success' ? 'bg-green-600' : 'bg-gray-600'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : 'bell'} mr-2"></i>
                <span class="text-sm">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    trackHelpEvent(eventName, properties = {}) {
        try {
            console.log('💡 Help Event:', eventName, properties);
            
            // Store locally for analytics
            const events = JSON.parse(localStorage.getItem('spotkin_help_events') || '[]');
            events.push({
                event: eventName,
                properties,
                timestamp: new Date().toISOString(),
                userLevel: this.userHelpLevel
            });
            
            // Keep only last 50 events
            if (events.length > 50) {
                events.splice(0, events.length - 50);
            }
            
            localStorage.setItem('spotkin_help_events', JSON.stringify(events));
        } catch (error) {
            console.warn('Failed to track help event:', error);
        }
    }

    // Public API methods
    showHelpForElement(selector) {
        const config = this.helpContent[selector];
        if (config) {
            const element = document.querySelector(selector);
            if (element) {
                this.showTooltip({ target: element }, selector, config);
            }
        }
    }

    addCustomHelp(selector, config) {
        this.helpContent[selector] = config;
        this.registerTooltipEvents();
    }

    removeCustomHelp(selector) {
        delete this.helpContent[selector];
    }

    getHelpStats() {
        return {
            helpLevel: this.userHelpLevel,
            enabled: this.helpEnabled,
            shownHints: this.shownHints.size,
            totalHelpElements: Object.keys(this.helpContent).length
        };
    }

    resetHelpState() {
        this.shownHints.clear();
        this.userHelpLevel = 'beginner';
        this.helpEnabled = true;
        this.saveHelpState();
        this.showSystemMessage('Help state reset', 'success');
    }
}

// Export for dynamic import
export default ContextualHelp;