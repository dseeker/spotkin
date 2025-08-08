const fs = require('fs');
const path = require('path');

/**
 * PWA Audit Script
 * Analyzes Lighthouse PWA results and provides actionable recommendations
 */

class PWAAudit {
    constructor() {
        this.lighthouseReportPath = path.join(__dirname, '..', 'reports', 'lighthouse-pwa.json');
        this.validationReportPath = path.join(__dirname, '..', 'reports', 'pwa-validation.json');
        this.auditResults = {};
    }

    async runAudit() {
        console.log('🔍 Starting PWA Audit Analysis...\n');
        
        try {
            await this.loadReports();
            this.analyzePWACapabilities();
            this.analyzePerformance();
            this.analyzeAccessibility();
            this.generateRecommendations();
            this.generateFinalReport();
        } catch (error) {
            console.error('❌ PWA Audit failed:', error.message);
            process.exit(1);
        }
    }

    async loadReports() {
        console.log('📄 Loading audit reports...');
        
        // Load Lighthouse report if available
        if (fs.existsSync(this.lighthouseReportPath)) {
            const lighthouseContent = fs.readFileSync(this.lighthouseReportPath, 'utf-8');
            this.lighthouseReport = JSON.parse(lighthouseContent);
            console.log('  ✅ Lighthouse PWA report loaded');
        } else {
            console.log('  ⚠️ Lighthouse PWA report not found');
            this.lighthouseReport = null;
        }

        // Load validation report if available
        if (fs.existsSync(this.validationReportPath)) {
            const validationContent = fs.readFileSync(this.validationReportPath, 'utf-8');
            this.validationReport = JSON.parse(validationContent);
            console.log('  ✅ PWA validation report loaded');
        } else {
            console.log('  ⚠️ PWA validation report not found');
            this.validationReport = null;
        }
        
        console.log('');
    }

    analyzePWACapabilities() {
        console.log('⚡ Analyzing PWA Capabilities...');
        
        this.auditResults.pwaCapabilities = {
            score: 0,
            issues: [],
            recommendations: []
        };

        if (this.lighthouseReport && this.lighthouseReport.categories && this.lighthouseReport.categories.pwa) {
            const pwaCategory = this.lighthouseReport.categories.pwa;
            this.auditResults.pwaCapabilities.score = Math.round(pwaCategory.score * 100);
            
            console.log(`  📊 Lighthouse PWA Score: ${this.auditResults.pwaCapabilities.score}%`);
            
            // Analyze individual PWA audits
            const pwaAudits = [
                'service-worker',
                'installable-manifest',
                'splash-screen',
                'themed-omnibox',
                'content-width',
                'viewport',
                'apple-touch-icon',
                'maskable-icon'
            ];

            pwaAudits.forEach(auditKey => {
                const audit = this.lighthouseReport.audits[auditKey];
                if (audit) {
                    if (audit.score === 1) {
                        console.log(`    ✅ ${audit.title}`);
                    } else {
                        console.log(`    ❌ ${audit.title}: ${audit.description}`);
                        this.auditResults.pwaCapabilities.issues.push({
                            audit: auditKey,
                            title: audit.title,
                            description: audit.description,
                            score: audit.score
                        });
                    }
                }
            });
        } else {
            console.log('  ⚠️ No Lighthouse PWA data available');
        }

        // Add validation results
        if (this.validationReport) {
            const validationScore = this.validationReport.score;
            console.log(`  📊 Custom Validation Score: ${validationScore}%`);
            
            this.validationReport.errors.forEach(error => {
                this.auditResults.pwaCapabilities.issues.push({
                    type: 'validation-error',
                    description: error
                });
            });
        }

        console.log('');
    }

    analyzePerformance() {
        console.log('🚀 Analyzing Performance...');
        
        this.auditResults.performance = {
            score: 0,
            metrics: {},
            issues: []
        };

        if (this.lighthouseReport && this.lighthouseReport.categories && this.lighthouseReport.categories.performance) {
            const perfCategory = this.lighthouseReport.categories.performance;
            this.auditResults.performance.score = Math.round(perfCategory.score * 100);
            
            console.log(`  📊 Performance Score: ${this.auditResults.performance.score}%`);
            
            // Key performance metrics
            const performanceMetrics = [
                'first-contentful-paint',
                'largest-contentful-paint',
                'speed-index',
                'cumulative-layout-shift',
                'first-meaningful-paint'
            ];

            performanceMetrics.forEach(metricKey => {
                const audit = this.lighthouseReport.audits[metricKey];
                if (audit && audit.numericValue) {
                    this.auditResults.performance.metrics[metricKey] = {
                        value: audit.numericValue,
                        displayValue: audit.displayValue,
                        score: audit.score
                    };
                    
                    const status = audit.score >= 0.9 ? '✅' : audit.score >= 0.5 ? '⚠️' : '❌';
                    console.log(`    ${status} ${audit.title}: ${audit.displayValue}`);
                }
            });

            // Check for performance opportunities
            const opportunities = [
                'unused-css-rules',
                'unused-javascript',
                'render-blocking-resources',
                'unminified-css',
                'unminified-javascript',
                'efficient-animated-content',
                'offscreen-images'
            ];

            opportunities.forEach(opKey => {
                const audit = this.lighthouseReport.audits[opKey];
                if (audit && audit.score < 1 && audit.details && audit.details.overallSavingsMs > 100) {
                    this.auditResults.performance.issues.push({
                        type: 'opportunity',
                        title: audit.title,
                        description: audit.description,
                        savings: audit.displayValue
                    });
                }
            });
        }

        console.log('');
    }

    analyzeAccessibility() {
        console.log('♿ Analyzing Accessibility...');
        
        this.auditResults.accessibility = {
            score: 0,
            issues: []
        };

        if (this.lighthouseReport && this.lighthouseReport.categories && this.lighthouseReport.categories.accessibility) {
            const a11yCategory = this.lighthouseReport.categories.accessibility;
            this.auditResults.accessibility.score = Math.round(a11yCategory.score * 100);
            
            console.log(`  📊 Accessibility Score: ${this.auditResults.accessibility.score}%`);
            
            // Key accessibility audits
            const a11yAudits = [
                'button-name',
                'color-contrast',
                'image-alt',
                'label',
                'link-name',
                'aria-labels',
                'heading-order',
                'html-has-lang',
                'meta-viewport'
            ];

            a11yAudits.forEach(auditKey => {
                const audit = this.lighthouseReport.audits[auditKey];
                if (audit && audit.score < 1) {
                    this.auditResults.accessibility.issues.push({
                        audit: auditKey,
                        title: audit.title,
                        description: audit.description,
                        score: audit.score
                    });
                    console.log(`    ❌ ${audit.title}`);
                }
            });
        }

        console.log('');
    }

    generateRecommendations() {
        console.log('💡 Generating Recommendations...');
        
        this.recommendations = [];

        // PWA-specific recommendations
        if (this.auditResults.pwaCapabilities.score < 90) {
            this.recommendations.push({
                category: 'PWA',
                priority: 'High',
                title: 'Improve PWA Implementation',
                actions: [
                    'Ensure service worker caches all critical resources',
                    'Add maskable icons for better install experience',
                    'Implement proper offline fallbacks',
                    'Add app shortcuts to manifest'
                ]
            });
        }

        // Performance recommendations
        if (this.auditResults.performance.score < 75) {
            const perfActions = [];
            
            if (this.auditResults.performance.issues.length > 0) {
                this.auditResults.performance.issues.forEach(issue => {
                    perfActions.push(`Address ${issue.title}: ${issue.description}`);
                });
            }

            this.recommendations.push({
                category: 'Performance',
                priority: 'High',
                title: 'Optimize Application Performance',
                actions: perfActions.length > 0 ? perfActions : [
                    'Minimize and compress JavaScript and CSS',
                    'Optimize images and use modern formats (WebP)',
                    'Implement lazy loading for images',
                    'Use CDN for static assets'
                ]
            });
        }

        // Accessibility recommendations
        if (this.auditResults.accessibility.score < 90) {
            this.recommendations.push({
                category: 'Accessibility',
                priority: 'Medium',
                title: 'Improve Accessibility',
                actions: [
                    'Add proper ARIA labels to interactive elements',
                    'Ensure sufficient color contrast ratios',
                    'Provide alternative text for images',
                    'Implement proper keyboard navigation'
                ]
            });
        }

        // Notification-specific recommendations
        this.recommendations.push({
            category: 'Notifications',
            priority: 'Medium',
            title: 'Enhance Notification System',
            actions: [
                'Test notification permissions across different browsers',
                'Implement notification action buttons',
                'Add notification badges and icons',
                'Test offline notification queueing'
            ]
        });

        this.recommendations.forEach(rec => {
            console.log(`  🎯 ${rec.category} (${rec.priority} Priority): ${rec.title}`);
            rec.actions.forEach(action => {
                console.log(`    • ${action}`);
            });
            console.log('');
        });
    }

    generateFinalReport() {
        console.log('📋 Final PWA Audit Report');
        console.log('=' .repeat(60));

        const overallScore = Math.round((
            (this.auditResults.pwaCapabilities.score * 0.4) +
            (this.auditResults.performance.score * 0.3) +
            (this.auditResults.accessibility.score * 0.3)
        ));

        console.log(`\n🏆 Overall PWA Score: ${overallScore}/100`);
        
        const scoreRating = this.getScoreRating(overallScore);
        console.log(`📈 Rating: ${scoreRating.emoji} ${scoreRating.label}`);

        console.log('\n📊 Category Breakdown:');
        console.log(`  PWA Capabilities: ${this.auditResults.pwaCapabilities.score}%`);
        console.log(`  Performance:      ${this.auditResults.performance.score}%`);
        console.log(`  Accessibility:    ${this.auditResults.accessibility.score}%`);

        console.log(`\n🔧 ${this.recommendations.length} recommendations generated`);
        console.log(`⚠️ ${this.auditResults.pwaCapabilities.issues.length} PWA issues found`);

        // Save comprehensive report
        const finalReport = {
            timestamp: new Date().toISOString(),
            overallScore: overallScore,
            rating: scoreRating,
            categoryScores: {
                pwaCapabilities: this.auditResults.pwaCapabilities.score,
                performance: this.auditResults.performance.score,
                accessibility: this.auditResults.accessibility.score
            },
            issues: this.auditResults.pwaCapabilities.issues,
            recommendations: this.recommendations,
            metrics: this.auditResults.performance.metrics
        };

        const reportPath = path.join(__dirname, '..', 'reports', 'pwa-audit-final.json');
        fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
        
        console.log(`\n📄 Complete audit report saved to: ${reportPath}`);

        if (overallScore < 70) {
            console.log('\n⚠️ PWA audit indicates significant improvements needed');
            process.exit(1);
        } else {
            console.log('\n✅ PWA audit completed successfully');
        }
    }

    getScoreRating(score) {
        if (score >= 90) return { emoji: '🟢', label: 'Excellent' };
        if (score >= 75) return { emoji: '🟡', label: 'Good' };
        if (score >= 60) return { emoji: '🟠', label: 'Needs Improvement' };
        return { emoji: '🔴', label: 'Poor' };
    }
}

// Run audit if called directly
if (require.main === module) {
    const audit = new PWAAudit();
    audit.runAudit().catch(error => {
        console.error('Audit failed:', error);
        process.exit(1);
    });
}

module.exports = PWAAudit;