// Daily Summary Module - Lazy Loaded
// This module handles AI-powered daily summaries and insights

export class DailySummaryManager {
    constructor() {
        this.summaryCache = new Map();
        this.isGenerating = false;
        
        console.log('📊 Daily Summary Module loaded');
    }

    // Generate AI summary prompt with context
    createDailySummaryPrompt(dailyData) {
        const { events, totalAnalyses, subjects, alerts } = dailyData;
        
        const subjectSummary = subjects.reduce((acc, subj) => {
            acc[subj.type] = (acc[subj.type] || 0) + 1;
            return acc;
        }, {});
        
        const alertSummary = alerts.reduce((acc, alert) => {
            acc[alert.level] = (acc[alert.level] || 0) + 1;
            return acc;
        }, {});

        return `Please analyze this monitoring session data and provide a caring, insightful daily summary in JSON format.

Monitoring Session Data:
- Total analyses performed: ${totalAnalyses}
- Time periods covered: ${events.length} monitoring events
- Subjects detected: ${Object.entries(subjectSummary).map(([type, count]) => `${count} ${type.toLowerCase()}(s)`).join(', ') || 'None'}
- Alert levels: ${Object.entries(alertSummary).map(([level, count]) => `${count} ${level} alerts`).join(', ') || 'No alerts'}

Recent Events Summary:
${events.slice(-10).map(event => `- ${new Date(event.timestamp).toLocaleTimeString()}: ${event.summary}`).join('\n')}

Please provide a JSON response with the following structure:
{
    "summary": "main narrative summary (2-3 sentences)",
    "highlights": ["positive moments", "peaceful periods", "milestones"],
    "insights": ["helpful patterns observed", "gentle recommendations"], 
    "mood": "positive/neutral/concerned"
}`;
    }

    // Aggregate daily data from monitoring history
    aggregateDailyData(targetDate) {
        const dateKey = targetDate.toISOString().split('T')[0];
        
        // Get monitoring history from localStorage
        const history = JSON.parse(localStorage.getItem('monitoringHistory') || '[]');
        
        // Filter events for the target date
        const dayEvents = history.filter(event => {
            const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
            return eventDate === dateKey;
        });

        // Aggregate data
        const subjects = [];
        const alerts = [];
        let totalAnalyses = dayEvents.length;

        dayEvents.forEach(event => {
            if (event.subjects && Array.isArray(event.subjects)) {
                subjects.push(...event.subjects);
            }
            if (event.alert) {
                alerts.push({
                    level: event.alert.type || 'info',
                    message: event.alert.message || '',
                    timestamp: event.timestamp
                });
            }
        });

        return {
            events: dayEvents,
            totalAnalyses,
            subjects,
            alerts,
            date: dateKey
        };
    }

    // Generate fallback summary when AI is unavailable
    generateFallbackSummary(dailyData, targetDate) {
        const { events, totalAnalyses, subjects, alerts } = dailyData;
        
        // Create summary based on data analysis
        let mood = 'positive';
        let highlights = ['Monitoring session completed'];
        let insights = ['System functioning normally'];
        
        if (alerts.length > 0) {
            const dangerAlerts = alerts.filter(a => a.level === 'danger').length;
            if (dangerAlerts > 0) {
                mood = 'concerned';
                insights.push('Review alert notifications for important updates');
            } else {
                mood = 'neutral';
            }
        }
        
        if (subjects.length > 0) {
            const subjectTypes = [...new Set(subjects.map(s => s.type))];
            highlights.push(`Detected ${subjectTypes.join(' and ').toLowerCase()} activity`);
        }
        
        if (totalAnalyses > 10) {
            insights.push('Regular monitoring maintained throughout the day');
        }

        const summary = {
            summary: `Today's monitoring included ${totalAnalyses} analyses with ${subjects.length} subject detections and ${alerts.length} notifications.`,
            highlights,
            insights,
            mood,
            date: targetDate.toISOString().split('T')[0],
            fallback: true
        };

        // Cache the fallback summary
        const dateKey = targetDate.toISOString().split('T')[0];
        this.summaryCache.set(dateKey, summary);

        return summary;
    }

    // Generate daily summary using AI
    async generateDailySummary(targetDate = new Date()) {
        const dateKey = targetDate.toISOString().split('T')[0];
        
        // Check cache first
        if (this.summaryCache.has(dateKey)) {
            console.log('📋 Using cached daily summary for', dateKey);
            return this.summaryCache.get(dateKey);
        }

        if (this.isGenerating) {
            throw new Error('Summary generation already in progress');
        }

        this.isGenerating = true;
        
        try {
            const dailyData = this.aggregateDailyData(targetDate);
            const prompt = this.createDailySummaryPrompt(dailyData);
            
            // Ensure Puter.js is loaded before generating summary
            const puterLoaded = await window.ensurePuterLoaded();
            if (!puterLoaded || typeof puter === 'undefined' || !puter.ai || !puter.ai.chat) {
                console.warn('Puter.js AI not available, generating fallback summary');
                return this.generateFallbackSummary(dailyData, targetDate);
            }

            const response = await puter.ai.chat(prompt, null, false, {
                max_tokens: 600,
                temperature: 0.7
            });
            
            console.log('🤖 Raw AI summary response:', response);
            
            let summary;
            try {
                // Parse AI response (handle both string and object responses)
                summary = typeof response === 'string' ? JSON.parse(response) : response;
            } catch (parseError) {
                console.warn('Failed to parse AI response, generating fallback:', parseError);
                return this.generateFallbackSummary(dailyData, targetDate);
            }
            
            // Enhance summary with metadata
            summary.date = dateKey;
            summary.generated_at = new Date().toISOString();
            summary.analysis_count = dailyData.totalAnalyses;
            summary.ai_generated = true;
            
            // Cache the summary
            this.summaryCache.set(dateKey, summary);
            
            console.log('✅ Daily summary generated successfully');
            return summary;
            
        } catch (error) {
            console.error('❌ Error generating daily summary:', error);
            
            // Generate fallback summary on error
            const dailyData = this.aggregateDailyData(targetDate);
            return this.generateFallbackSummary(dailyData, targetDate);
        } finally {
            this.isGenerating = false;
        }
    }

    // Clear summary cache
    clearCache() {
        this.summaryCache.clear();
        console.log('📋 Daily summary cache cleared');
    }

    // Get cached summary if available
    getCachedSummary(targetDate = new Date()) {
        const dateKey = targetDate.toISOString().split('T')[0];
        return this.summaryCache.get(dateKey) || null;
    }
}

// Export for dynamic import
export default DailySummaryManager;