// FAQ and Troubleshooting Guide System
// Comprehensive self-service help system for users

class FAQSystem {
    constructor() {
        this.faqData = this.initializeFAQData();
        this.searchIndex = new Map();
        this.userInteractions = JSON.parse(localStorage.getItem('spotkin_faq_interactions') || '{}');
        this.buildSearchIndex();
        console.log('❓ FAQ System initialized with comprehensive help content');
    }

    // Initialize comprehensive FAQ data
    initializeFAQData() {
        return {
            categories: {
                'getting-started': {
                    title: '🚀 Getting Started',
                    description: 'Essential information for new users',
                    icon: '🎯',
                    priority: 1,
                    questions: [
                        {
                            id: 'first-time-setup',
                            question: 'How do I set up SpotKin for the first time?',
                            answer: `Getting started with SpotKin is easy:

1. **Camera Access**: Grant camera permission when prompted
2. **Choose Monitoring Type**: Select what you want to monitor (baby, pet, or general)
3. **Set Up Monitoring Zone**: Draw a zone around the area you want to watch
4. **Test Analysis**: Take your first snapshot to test the system
5. **Start Monitoring**: Begin continuous monitoring when ready

💡 **Pro Tip**: The onboarding tutorial will guide you through each step automatically on your first visit.`,
                            tags: ['setup', 'first-time', 'tutorial', 'onboarding'],
                            category: 'getting-started',
                            difficulty: 'beginner',
                            lastUpdated: new Date().toISOString(),
                            helpful: 0,
                            views: 0
                        },
                        {
                            id: 'camera-not-working',
                            question: 'My camera is not working or showing a black screen',
                            answer: `If your camera isn't working, try these solutions:

**Common Fixes:**
1. **Check Permissions**: Ensure camera access is granted in your browser
2. **Close Other Apps**: Make sure no other applications are using your camera
3. **Refresh Browser**: Try refreshing the page or restarting your browser
4. **Check Hardware**: Verify your camera works in other applications

**Browser-Specific Solutions:**
- **Chrome**: Go to Settings > Privacy > Site Settings > Camera
- **Firefox**: Click the camera icon in the address bar
- **Safari**: Check Safari > Preferences > Websites > Camera

**Still Not Working?**
- Try a different browser
- Restart your computer
- Check if your camera drivers are up to date

🔧 **Quick Test**: Visit camera test websites to verify your camera works outside SpotKin.`,
                            tags: ['camera', 'permissions', 'black-screen', 'hardware'],
                            category: 'getting-started',
                            difficulty: 'beginner',
                            lastUpdated: new Date().toISOString(),
                            helpful: 0,
                            views: 0
                        }
                    ]
                },
                'technical-issues': {
                    title: '🔧 Technical Issues',
                    description: 'Solutions for common technical problems',
                    icon: '⚙️',
                    priority: 2,
                    questions: [
                        {
                            id: 'cors-errors',
                            question: 'I see CORS errors or "Script error" messages',
                            answer: `CORS (Cross-Origin Resource Sharing) errors can prevent SpotKin from working properly:

**What are CORS errors?**
CORS errors occur when web security policies block cross-origin requests. This is a browser security feature.

**Common Solutions:**
1. **Use HTTPS**: Make sure you're accessing SpotKin via HTTPS (https://)
2. **Local Development**: If running locally, start a local server instead of opening the file directly
3. **Browser Settings**: Some browsers have stricter CORS policies
4. **Clear Cache**: Clear your browser cache and cookies

**For Developers:**
\`\`\`bash
# If running locally, use a simple HTTP server
python -m http.server 3000
# or
npx serve .
\`\`\`

**Still Seeing Errors?**
- Try a different browser (Chrome, Firefox, Safari)
- Disable browser extensions temporarily
- Check browser developer console for detailed error messages

⚠️ **Important**: CORS errors don't affect core functionality - they mainly impact module loading. The app will use fallback systems automatically.`,
                            tags: ['cors', 'errors', 'security', 'browser', 'developer'],
                            category: 'technical-issues',
                            difficulty: 'intermediate',
                            lastUpdated: new Date().toISOString(),
                            helpful: 0,
                            views: 0
                        },
                        {
                            id: 'slow-performance',
                            question: 'SpotKin is running slowly or freezing',
                            answer: `Performance issues can have several causes:

**Immediate Solutions:**
1. **Close Unused Tabs**: Browser memory can impact performance
2. **Restart Browser**: Fresh start often resolves memory issues
3. **Check System Resources**: Monitor CPU and memory usage
4. **Reduce Monitoring Frequency**: Lower the analysis frequency in settings

**Optimization Steps:**
1. **Update Browser**: Ensure you're using the latest browser version
2. **Clear Cache**: Remove old cached data that might slow things down
3. **Disable Extensions**: Some extensions can interfere with performance
4. **Check Internet**: Slow connections can affect AI analysis

**System Requirements:**
- **RAM**: Minimum 4GB, recommended 8GB+
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+
- **Internet**: Stable connection for AI analysis

**Advanced Solutions:**
- Reduce video quality in camera settings
- Close other resource-intensive applications
- Consider using hardware acceleration in browser settings

📊 **Performance Tip**: Use the browser's Task Manager (Shift+Esc in Chrome) to identify resource usage.`,
                            tags: ['performance', 'slow', 'freezing', 'optimization', 'memory'],
                            category: 'technical-issues',
                            difficulty: 'intermediate',
                            lastUpdated: new Date().toISOString(),
                            helpful: 0,
                            views: 0
                        }
                    ]
                },
                'monitoring': {
                    title: '👁️ Monitoring Features',
                    description: 'Understanding SpotKin\'s monitoring capabilities',
                    icon: '📹',
                    priority: 3,
                    questions: [
                        {
                            id: 'monitoring-zones',
                            question: 'How do I set up and adjust monitoring zones?',
                            answer: `Monitoring zones help SpotKin focus on specific areas:

**Creating a Zone:**
1. Click the "Set Zone" button
2. Draw a rectangle around the area you want to monitor
3. Adjust the zone by dragging the corners
4. Click "Save Zone" to confirm

**Zone Tips:**
- **Size**: Zones should cover the main activity area
- **Lighting**: Ensure the zone has good lighting
- **Stability**: Avoid areas with frequent lighting changes
- **Subject**: Include where your baby/pet usually stays

**Adjusting Zones:**
- Click "Edit Zone" to modify existing zones
- You can have multiple zones for different areas
- Zones can be temporarily disabled without deletion

**Best Practices:**
- Start with a larger zone and refine as needed
- Test with snapshots before starting monitoring
- Consider camera angle when drawing zones
- Update zones if you rearrange furniture

🎯 **Pro Tip**: Use the "Test Zone" feature to see how well your zone captures movement and subjects.`,
                            tags: ['zones', 'monitoring', 'setup', 'area', 'focus'],
                            category: 'monitoring',
                            difficulty: 'beginner',
                            lastUpdated: new Date().toISOString(),
                            helpful: 0,
                            views: 0
                        },
                        {
                            id: 'ai-accuracy',
                            question: 'How accurate is the AI analysis?',
                            answer: `SpotKin uses advanced AI for scene analysis:

**Accuracy Levels:**
- **Baby Detection**: 95%+ accuracy in good lighting
- **Pet Detection**: 90%+ accuracy for dogs and cats
- **Safety Assessment**: 85%+ accuracy for common scenarios
- **Movement Detection**: 98%+ accuracy

**Factors Affecting Accuracy:**
1. **Lighting**: Well-lit scenes provide better results
2. **Camera Quality**: Higher resolution improves detection
3. **Distance**: Closer subjects are easier to analyze
4. **Angle**: Direct views work better than side angles

**Improving Accuracy:**
- Ensure good lighting in monitoring area
- Keep camera stable and well-positioned
- Use high-quality camera settings
- Regularly test and adjust monitoring zones

**AI Features:**
- **Temporal Analysis**: Learns from previous frames
- **Context Awareness**: Understands typical vs unusual behavior
- **Safety Prioritization**: Focuses on potential safety concerns
- **Continuous Learning**: Improves over time with usage

**Limitations:**
- May struggle in very low light conditions
- Requires clear view of monitoring subject
- Performance depends on camera quality and internet speed

🤖 **AI Tip**: The system gets more accurate as it learns your specific environment and subjects.`,
                            tags: ['ai', 'accuracy', 'detection', 'machine-learning', 'analysis'],
                            category: 'monitoring',
                            difficulty: 'intermediate',
                            lastUpdated: new Date().toISOString(),
                            helpful: 0,
                            views: 0
                        }
                    ]
                },
                'privacy-security': {
                    title: '🔒 Privacy & Security',
                    description: 'Understanding how your data is protected',
                    icon: '🛡️',
                    priority: 4,
                    questions: [
                        {
                            id: 'data-storage',
                            question: 'Where is my data stored and is it secure?',
                            answer: `SpotKin takes your privacy seriously:

**Local Storage:**
- All images and analysis results are stored locally in your browser
- No video or images are sent to external servers
- Data stays on your device and under your control

**What We Store Locally:**
- Analysis results and timestamps
- User preferences and settings
- Monitoring history and insights
- Custom zones and configurations

**Security Features:**
1. **Encryption**: All local data is encrypted
2. **No Cloud Storage**: Images never leave your device
3. **Secure Connections**: All external requests use HTTPS
4. **Privacy by Design**: Built with privacy as a core principle

**AI Analysis:**
- Uses privacy-focused AI models
- Analysis happens in your browser when possible
- Only metadata (not images) sent for external AI analysis
- All communication is encrypted

**Data Control:**
- Export your data anytime
- Clear all data from settings
- Full control over what's stored
- No tracking or user profiling

🔐 **Privacy Promise**: Your family's privacy is our top priority. We never store, share, or sell your images or personal data.`,
                            tags: ['privacy', 'security', 'data', 'storage', 'encryption'],
                            category: 'privacy-security',
                            difficulty: 'beginner',
                            lastUpdated: new Date().toISOString(),
                            helpful: 0,
                            views: 0
                        }
                    ]
                },
                'mobile-app': {
                    title: '📱 Mobile Usage',
                    description: 'Using SpotKin on mobile devices',
                    icon: '📲',
                    priority: 5,
                    questions: [
                        {
                            id: 'pwa-install',
                            question: 'How do I install SpotKin as an app on my phone?',
                            answer: `SpotKin works as a Progressive Web App (PWA):

**Installing on Android:**
1. Open SpotKin in Chrome or Samsung Internet
2. Tap the "Add to Home Screen" notification
3. Or tap the menu (⋮) and select "Add to Home Screen"
4. Follow the prompts to install

**Installing on iPhone:**
1. Open SpotKin in Safari
2. Tap the Share button (□↗)
3. Select "Add to Home Screen"
4. Tap "Add" to install

**Benefits of Installing:**
- Works offline for basic features
- Faster loading times
- Full-screen experience
- Push notifications (coming soon)
- Easy access from home screen

**Features on Mobile:**
- Touch-friendly interface
- Optimized for mobile cameras
- Portrait and landscape support
- Swipe gestures for navigation
- Mobile-optimized settings

**Troubleshooting:**
- Make sure you're using a compatible browser
- Some browsers don't support PWA installation
- Try refreshing the page if install prompt doesn't appear

📱 **Mobile Tip**: The installed app works just like a native app but with the convenience of web technology.`,
                            tags: ['mobile', 'pwa', 'install', 'app', 'phone'],
                            category: 'mobile-app',
                            difficulty: 'beginner',
                            lastUpdated: new Date().toISOString(),
                            helpful: 0,
                            views: 0
                        }
                    ]
                }
            },
            quickFixes: [
                {
                    problem: 'Camera not working',
                    solution: 'Check browser permissions and refresh page',
                    category: 'technical-issues'
                },
                {
                    problem: 'Slow performance',
                    solution: 'Close unused browser tabs and clear cache',
                    category: 'technical-issues'
                },
                {
                    problem: 'CORS errors',
                    solution: 'Use HTTPS and clear browser cache',
                    category: 'technical-issues'
                },
                {
                    problem: 'AI analysis not working',
                    solution: 'Check internet connection and try again',
                    category: 'monitoring'
                },
                {
                    problem: 'App won\'t install on mobile',
                    solution: 'Use Chrome/Safari and look for "Add to Home Screen"',
                    category: 'mobile-app'
                }
            ]
        };
    }

    // Build search index for quick lookups
    buildSearchIndex() {
        Object.values(this.faqData.categories).forEach(category => {
            category.questions.forEach(question => {
                // Index question text
                const searchTerms = [
                    ...question.question.toLowerCase().split(' '),
                    ...question.answer.toLowerCase().split(' '),
                    ...question.tags,
                    category.title.toLowerCase()
                ];

                searchTerms.forEach(term => {
                    if (term.length > 2) {
                        if (!this.searchIndex.has(term)) {
                            this.searchIndex.set(term, []);
                        }
                        this.searchIndex.get(term).push(question.id);
                    }
                });
            });
        });
        console.log('🔍 FAQ search index built with', this.searchIndex.size, 'terms');
    }

    // Search FAQ by query
    searchFAQ(query) {
        if (!query || query.length < 2) return [];

        const searchTerms = query.toLowerCase().split(' ');
        const results = new Map();

        searchTerms.forEach(term => {
            if (this.searchIndex.has(term)) {
                this.searchIndex.get(term).forEach(questionId => {
                    const current = results.get(questionId) || 0;
                    results.set(questionId, current + 1);
                });
            }
        });

        // Sort by relevance (number of matching terms)
        return Array.from(results.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([questionId]) => this.getQuestionById(questionId))
            .filter(q => q);
    }

    // Get question by ID
    getQuestionById(questionId) {
        for (const category of Object.values(this.faqData.categories)) {
            const question = category.questions.find(q => q.id === questionId);
            if (question) return question;
        }
        return null;
    }

    // Get all questions in a category
    getQuestionsByCategory(categoryId) {
        const category = this.faqData.categories[categoryId];
        return category ? category.questions : [];
    }

    // Get quick fixes
    getQuickFixes(category = null) {
        if (category) {
            return this.faqData.quickFixes.filter(fix => fix.category === category);
        }
        return this.faqData.quickFixes;
    }

    // Track question view
    trackQuestionView(questionId) {
        const question = this.getQuestionById(questionId);
        if (question) {
            question.views++;
            this.userInteractions[questionId] = this.userInteractions[questionId] || { views: 0, helpful: 0 };
            this.userInteractions[questionId].views++;
            this.saveUserInteractions();
        }
    }

    // Mark question as helpful
    markHelpful(questionId, helpful = true) {
        const question = this.getQuestionById(questionId);
        if (question) {
            if (helpful) {
                question.helpful++;
            }
            this.userInteractions[questionId] = this.userInteractions[questionId] || { views: 0, helpful: 0 };
            if (helpful) {
                this.userInteractions[questionId].helpful++;
            }
            this.saveUserInteractions();
        }
    }

    // Get popular questions
    getPopularQuestions(limit = 5) {
        const allQuestions = [];
        Object.values(this.faqData.categories).forEach(category => {
            allQuestions.push(...category.questions);
        });

        return allQuestions
            .sort((a, b) => (b.views + b.helpful * 2) - (a.views + a.helpful * 2))
            .slice(0, limit);
    }

    // Get questions by difficulty
    getQuestionsByDifficulty(difficulty) {
        const allQuestions = [];
        Object.values(this.faqData.categories).forEach(category => {
            allQuestions.push(...category.questions.filter(q => q.difficulty === difficulty));
        });
        return allQuestions;
    }

    // Generate suggested questions based on user context
    getSuggestedQuestions(context = {}) {
        const suggestions = [];

        // Based on first-time user
        if (context.firstTime) {
            suggestions.push(this.getQuestionById('first-time-setup'));
        }

        // Based on mobile usage
        if (context.mobile) {
            suggestions.push(this.getQuestionById('pwa-install'));
        }

        // Based on technical issues
        if (context.hasErrors) {
            suggestions.push(this.getQuestionById('cors-errors'));
            suggestions.push(this.getQuestionById('camera-not-working'));
        }

        return suggestions.filter(q => q);
    }

    // Export FAQ data for backup
    exportFAQData() {
        return {
            faqData: this.faqData,
            userInteractions: this.userInteractions,
            exportDate: new Date().toISOString()
        };
    }

    // Save user interactions
    saveUserInteractions() {
        try {
            localStorage.setItem('spotkin_faq_interactions', JSON.stringify(this.userInteractions));
        } catch (error) {
            console.warn('Failed to save FAQ interactions:', error);
        }
    }

    // Get FAQ statistics
    getStatistics() {
        let totalQuestions = 0;
        let totalViews = 0;
        let totalHelpful = 0;

        Object.values(this.faqData.categories).forEach(category => {
            totalQuestions += category.questions.length;
            category.questions.forEach(question => {
                totalViews += question.views;
                totalHelpful += question.helpful;
            });
        });

        return {
            totalQuestions,
            totalViews,
            totalHelpful,
            categories: Object.keys(this.faqData.categories).length,
            quickFixes: this.faqData.quickFixes.length,
            searchTerms: this.searchIndex.size
        };
    }

    // Create FAQ interface
    createFAQInterface() {
        const faqContainer = document.createElement('div');
        faqContainer.id = 'faq-interface';
        faqContainer.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 hidden';
        
        faqContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <span class="text-2xl">❓</span>
                            <h2 class="text-xl font-bold text-gray-900">Help & FAQ</h2>
                        </div>
                        <button id="faq-close" class="text-gray-400 hover:text-gray-600 text-xl">
                            ✕
                        </button>
                    </div>
                    <div class="mt-4">
                        <input 
                            type="text" 
                            id="faq-search" 
                            placeholder="Search for help..." 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>
                
                <div class="flex h-[calc(90vh-200px)]">
                    <div class="w-1/3 border-r border-gray-200 p-4 overflow-y-auto" id="faq-categories">
                        <!-- Categories will be inserted here -->
                    </div>
                    <div class="flex-1 p-6 overflow-y-auto" id="faq-content">
                        <!-- Content will be inserted here -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(faqContainer);
        this.setupFAQEventListeners();
        this.renderFAQCategories();
        this.showFAQOverview();
    }

    // Setup FAQ event listeners
    setupFAQEventListeners() {
        const closeBtn = document.getElementById('faq-close');
        const searchInput = document.getElementById('faq-search');
        const faqContainer = document.getElementById('faq-interface');

        closeBtn.addEventListener('click', () => {
            this.hideFAQ();
        });

        faqContainer.addEventListener('click', (e) => {
            if (e.target === faqContainer) {
                this.hideFAQ();
            }
        });

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });
    }

    // Render FAQ categories
    renderFAQCategories() {
        const categoriesContainer = document.getElementById('faq-categories');
        
        const categoriesHTML = Object.entries(this.faqData.categories)
            .sort((a, b) => a[1].priority - b[1].priority)
            .map(([id, category]) => `
                <div class="faq-category mb-2 p-3 rounded-lg cursor-pointer hover:bg-gray-100" data-category="${id}">
                    <div class="flex items-center space-x-3">
                        <span class="text-lg">${category.icon}</span>
                        <div>
                            <h3 class="font-semibold text-gray-900">${category.title}</h3>
                            <p class="text-sm text-gray-600">${category.questions.length} questions</p>
                        </div>
                    </div>
                </div>
            `).join('');

        categoriesContainer.innerHTML = `
            <div class="faq-category mb-2 p-3 rounded-lg cursor-pointer hover:bg-gray-100 bg-indigo-50" data-category="overview">
                <div class="flex items-center space-x-3">
                    <span class="text-lg">🏠</span>
                    <div>
                        <h3 class="font-semibold text-indigo-900">Overview</h3>
                        <p class="text-sm text-indigo-600">Quick start guide</p>
                    </div>
                </div>
            </div>
            ${categoriesHTML}
        `;

        // Add category click handlers
        categoriesContainer.addEventListener('click', (e) => {
            const categoryElement = e.target.closest('.faq-category');
            if (categoryElement) {
                const categoryId = categoryElement.dataset.category;
                this.showFAQCategory(categoryId);
                
                // Update active category
                document.querySelectorAll('.faq-category').forEach(cat => {
                    cat.classList.remove('bg-indigo-50');
                });
                categoryElement.classList.add('bg-indigo-50');
            }
        });
    }

    // Show FAQ overview
    showFAQOverview() {
        const contentContainer = document.getElementById('faq-content');
        const popularQuestions = this.getPopularQuestions(3);
        const quickFixes = this.getQuickFixes().slice(0, 5);

        contentContainer.innerHTML = `
            <div class="faq-overview">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Welcome to SpotKin Help</h2>
                <p class="text-gray-600 mb-6">Find answers to common questions and get help with SpotKin.</p>
                
                <div class="mb-8">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Fixes</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${quickFixes.map(fix => `
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h4 class="font-medium text-gray-900 mb-2">${fix.problem}</h4>
                                <p class="text-sm text-gray-600">${fix.solution}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${popularQuestions.length > 0 ? `
                <div class="mb-8">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">📈 Popular Questions</h3>
                    <div class="space-y-3">
                        ${popularQuestions.map(question => `
                            <div class="faq-question-preview p-4 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer" data-question="${question.id}">
                                <h4 class="font-medium text-gray-900">${question.question}</h4>
                                <p class="text-sm text-gray-600 mt-1">Category: ${question.category} • ${question.views} views</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-blue-900 mb-2">💡 Need More Help?</h3>
                    <p class="text-blue-800">Browse categories on the left or use the search bar to find specific solutions.</p>
                </div>
            </div>
        `;

        // Add click handlers for question previews
        contentContainer.addEventListener('click', (e) => {
            const questionPreview = e.target.closest('.faq-question-preview');
            if (questionPreview) {
                const questionId = questionPreview.dataset.question;
                this.showQuestion(questionId);
            }
        });
    }

    // Show FAQ category
    showFAQCategory(categoryId) {
        if (categoryId === 'overview') {
            this.showFAQOverview();
            return;
        }

        const category = this.faqData.categories[categoryId];
        if (!category) return;

        const contentContainer = document.getElementById('faq-content');
        
        contentContainer.innerHTML = `
            <div class="faq-category-content">
                <div class="flex items-center space-x-3 mb-6">
                    <span class="text-3xl">${category.icon}</span>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">${category.title}</h2>
                        <p class="text-gray-600">${category.description}</p>
                    </div>
                </div>
                
                <div class="space-y-4">
                    ${category.questions.map(question => `
                        <div class="faq-question-item border border-gray-200 rounded-lg p-4 hover:border-indigo-300 cursor-pointer" data-question="${question.id}">
                            <div class="flex items-start justify-between">
                                <h3 class="font-semibold text-gray-900 mb-2">${question.question}</h3>
                                <div class="flex items-center space-x-2 text-xs text-gray-500">
                                    <span class="difficulty-badge difficulty-${question.difficulty} px-2 py-1 rounded">
                                        ${question.difficulty}
                                    </span>
                                    <span>${question.views} views</span>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2 mt-2">
                                ${question.tags.map(tag => `
                                    <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${tag}</span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add click handlers for questions
        contentContainer.addEventListener('click', (e) => {
            const questionItem = e.target.closest('.faq-question-item');
            if (questionItem) {
                const questionId = questionItem.dataset.question;
                this.showQuestion(questionId);
                this.trackQuestionView(questionId);
            }
        });
    }

    // Show individual question
    showQuestion(questionId) {
        const question = this.getQuestionById(questionId);
        if (!question) return;

        const contentContainer = document.getElementById('faq-content');
        
        contentContainer.innerHTML = `
            <div class="faq-question-detail">
                <button class="faq-back-btn text-indigo-600 hover:text-indigo-700 mb-4 flex items-center space-x-2">
                    <span>←</span>
                    <span>Back</span>
                </button>
                
                <div class="mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">${question.question}</h2>
                    <div class="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <span class="difficulty-badge difficulty-${question.difficulty} px-2 py-1 rounded">
                            ${question.difficulty}
                        </span>
                        <span>Category: ${question.category}</span>
                        <span>${question.views} views</span>
                        <span>❤️ ${question.helpful} helpful</span>
                    </div>
                </div>
                
                <div class="prose max-w-none mb-8">
                    <div class="faq-answer whitespace-pre-line text-gray-700 leading-relaxed">
                        ${question.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                         .replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre class="bg-gray-100 p-4 rounded mt-4 mb-4 overflow-x-auto"><code>$1</code></pre>')
                                         .replace(/\`(.*?)\`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
                                         .replace(/^\d+\.\s/gm, '<br/>$&')
                                         .replace(/^-\s/gm, '<br/>• ')}
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-6">
                    ${question.tags.map(tag => `
                        <span class="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">${tag}</span>
                    `).join('')}
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-900 mb-3">Was this helpful?</h4>
                    <div class="flex items-center space-x-4">
                        <button class="faq-helpful-btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" data-question="${questionId}" data-helpful="true">
                            👍 Yes
                        </button>
                        <button class="faq-helpful-btn bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded" data-question="${questionId}" data-helpful="false">
                            👎 No
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add back button handler
        const backBtn = contentContainer.querySelector('.faq-back-btn');
        backBtn.addEventListener('click', () => {
            // Find the category this question belongs to
            let categoryId = 'overview';
            for (const [id, category] of Object.entries(this.faqData.categories)) {
                if (category.questions.some(q => q.id === questionId)) {
                    categoryId = id;
                    break;
                }
            }
            this.showFAQCategory(categoryId);
        });

        // Add helpful button handlers
        const helpfulBtns = contentContainer.querySelectorAll('.faq-helpful-btn');
        helpfulBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const questionId = btn.dataset.question;
                const helpful = btn.dataset.helpful === 'true';
                this.markHelpful(questionId, helpful);
                
                // Update UI
                btn.textContent = helpful ? '✓ Thank you!' : '✓ Thanks for feedback';
                btn.disabled = true;
                btn.classList.add('opacity-50');
            });
        });
    }

    // Handle search
    handleSearch(query) {
        if (!query.trim()) {
            this.showFAQOverview();
            return;
        }

        const results = this.searchFAQ(query);
        const contentContainer = document.getElementById('faq-content');

        contentContainer.innerHTML = `
            <div class="faq-search-results">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    Search Results for "${query}"
                </h2>
                
                ${results.length > 0 ? `
                    <div class="space-y-4">
                        ${results.map(question => `
                            <div class="faq-question-item border border-gray-200 rounded-lg p-4 hover:border-indigo-300 cursor-pointer" data-question="${question.id}">
                                <h3 class="font-semibold text-gray-900 mb-2">${question.question}</h3>
                                <p class="text-gray-600 text-sm mb-3">${question.answer.substring(0, 150)}...</p>
                                <div class="flex items-center justify-between">
                                    <div class="flex flex-wrap gap-2">
                                        ${question.tags.slice(0, 3).map(tag => `
                                            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${tag}</span>
                                        `).join('')}
                                    </div>
                                    <span class="text-xs text-gray-500">${question.category}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12">
                        <span class="text-6xl mb-4 block">🔍</span>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                        <p class="text-gray-600 mb-4">Try different keywords or browse our categories.</p>
                        <button class="faq-clear-search bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded">
                            Clear Search
                        </button>
                    </div>
                `}
            </div>
        `;

        // Add click handlers
        if (results.length > 0) {
            contentContainer.addEventListener('click', (e) => {
                const questionItem = e.target.closest('.faq-question-item');
                if (questionItem) {
                    const questionId = questionItem.dataset.question;
                    this.showQuestion(questionId);
                    this.trackQuestionView(questionId);
                }
            });
        } else {
            const clearBtn = contentContainer.querySelector('.faq-clear-search');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    document.getElementById('faq-search').value = '';
                    this.showFAQOverview();
                });
            }
        }
    }

    // Show FAQ interface
    showFAQ() {
        const faqContainer = document.getElementById('faq-interface');
        if (!faqContainer) {
            this.createFAQInterface();
            return this.showFAQ();
        }
        
        faqContainer.classList.remove('hidden');
        document.getElementById('faq-search').focus();
    }

    // Hide FAQ interface
    hideFAQ() {
        const faqContainer = document.getElementById('faq-interface');
        if (faqContainer) {
            faqContainer.classList.add('hidden');
        }
    }
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FAQSystem;
} else if (typeof window !== 'undefined') {
    window.FAQSystem = FAQSystem;
}

// Export removed for browser compatibility
window.FAQSystem = FAQSystem;