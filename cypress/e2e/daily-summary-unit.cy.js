// Daily Summary Unit Tests
describe('Daily Summary Unit Tests', () => {
    let dailySummaryManager;

    beforeEach(() => {
        cy.visit('/');
        cy.wait(1000); // Wait for app to initialize
        
        cy.window().then((win) => {
            dailySummaryManager = win.dailySummaryManager;
            
            // Clear any existing data
            win.historyData = [];
            dailySummaryManager.summaryCache.clear();
        });
    });

    describe('DailySummaryManager - Data Aggregation', () => {
        it('should aggregate empty data correctly', () => {
            cy.window().then((win) => {
                const today = new Date('2025-01-09T12:00:00.000Z');
                const result = dailySummaryManager.aggregateDailyData(today);
                
                expect(result).to.deep.include({
                    totalEvents: 0,
                    hasData: false
                });
                expect(result.alertCounts).to.deep.equal({
                    safe: 0,
                    warning: 0, 
                    danger: 0
                });
                expect(result.activityPeriods).to.have.length(0);
                expect(result.mostCommonStates).to.have.length(0);
                expect(result.keyEvents).to.have.length(0);
            });
        });

        it('should aggregate daily data with mixed alert types', () => {
            cy.window().then((win) => {
                const today = new Date('2025-01-09T12:00:00.000Z');
                
                // Add mock history data
                win.historyData = [
                    {
                        timestamp: '2025-01-09T10:00:00.000Z',
                        scene: 'Baby sleeping',
                        objects: [{ type: 'baby', state: 'sleeping', confidence: 0.9 }],
                        alert: { type: 'safe', message: 'All clear' },
                        temporalAnalysis: { hasMovement: false, movementLevel: 'low' }
                    },
                    {
                        timestamp: '2025-01-09T11:00:00.000Z',
                        scene: 'Baby crying',
                        objects: [{ type: 'baby', state: 'crying', confidence: 0.8 }],
                        alert: { type: 'warning', message: 'Baby needs attention' },
                        temporalAnalysis: { hasMovement: true, movementLevel: 'medium' }
                    },
                    {
                        timestamp: '2025-01-09T14:00:00.000Z',
                        scene: 'Dangerous situation',
                        objects: [{ type: 'baby', state: 'climbing', confidence: 0.7 }],
                        alert: { type: 'danger', message: 'Immediate attention needed' },
                        temporalAnalysis: { hasMovement: true, movementLevel: 'high' }
                    }
                ];
                
                const result = dailySummaryManager.aggregateDailyData(today);
                
                expect(result.totalEvents).to.equal(3);
                expect(result.hasData).to.be.true;
                expect(result.alertCounts).to.deep.equal({
                    safe: 1,
                    warning: 1,
                    danger: 1
                });
                expect(result.activityPeriods).to.have.length(2); // Two separate movement periods
                expect(result.keyEvents).to.have.length(2); // Warning and danger events
            });
        });

        it('should filter data by correct date range', () => {
            cy.window().then((win) => {
                const today = new Date('2025-01-09T12:00:00.000Z');
                
                // Add events from different days
                win.historyData = [
                    {
                        timestamp: '2025-01-08T23:59:00.000Z', // Previous day
                        alert: { type: 'safe', message: 'Safe' }
                    },
                    {
                        timestamp: '2025-01-09T00:01:00.000Z', // Target day start
                        alert: { type: 'safe', message: 'Safe' }
                    },
                    {
                        timestamp: '2025-01-09T23:59:00.000Z', // Target day end
                        alert: { type: 'warning', message: 'Warning' }
                    },
                    {
                        timestamp: '2025-01-10T00:01:00.000Z', // Next day
                        alert: { type: 'danger', message: 'Danger' }
                    }
                ];
                
                const result = dailySummaryManager.aggregateDailyData(today);
                
                expect(result.totalEvents).to.equal(2); // Only events from target day
                expect(result.alertCounts.safe).to.equal(1);
                expect(result.alertCounts.warning).to.equal(1);
                expect(result.alertCounts.danger).to.equal(0);
            });
        });
    });

    describe('DailySummaryManager - Activity Period Extraction', () => {
        it('should extract activity periods correctly', () => {
            cy.window().then((win) => {
                const events = [
                    {
                        timestamp: '2025-01-09T10:00:00.000Z',
                        temporalAnalysis: { hasMovement: true, movementLevel: 'low' }
                    },
                    {
                        timestamp: '2025-01-09T10:05:00.000Z',
                        temporalAnalysis: { hasMovement: true, movementLevel: 'medium' }
                    },
                    {
                        timestamp: '2025-01-09T12:00:00.000Z', // 2-hour gap
                        temporalAnalysis: { hasMovement: true, movementLevel: 'high' }
                    }
                ];
                
                const periods = dailySummaryManager.extractActivityPeriods(events);
                
                expect(periods).to.have.length(2);
                expect(periods[0].movementLevel).to.equal('medium'); // Highest in first period
                expect(periods[0].eventCount).to.equal(2);
                expect(periods[1].movementLevel).to.equal('high');
                expect(periods[1].eventCount).to.equal(1);
            });
        });

        it('should ignore events without movement', () => {
            cy.window().then((win) => {
                const events = [
                    {
                        timestamp: '2025-01-09T10:00:00.000Z',
                        temporalAnalysis: { hasMovement: false, movementLevel: 'low' }
                    },
                    {
                        timestamp: '2025-01-09T10:05:00.000Z',
                        temporalAnalysis: { hasMovement: true, movementLevel: 'medium' }
                    }
                ];
                
                const periods = dailySummaryManager.extractActivityPeriods(events);
                
                expect(periods).to.have.length(1);
                expect(periods[0].eventCount).to.equal(1);
            });
        });
    });

    describe('DailySummaryManager - State Extraction', () => {
        it('should extract and rank common states', () => {
            cy.window().then((win) => {
                const events = [
                    {
                        objects: [
                            { state: 'sleeping' },
                            { state: 'peaceful' }
                        ]
                    },
                    {
                        objects: [
                            { state: 'sleeping' },
                            { state: 'playing' }
                        ]
                    },
                    {
                        objects: [{ state: 'sleeping' }]
                    }
                ];
                
                const states = dailySummaryManager.extractCommonStates(events);
                
                expect(states).to.have.length.greaterThan(0);
                expect(states[0]).to.deep.equal({ state: 'sleeping', count: 3 });
                expect(states.find(s => s.state === 'peaceful')).to.deep.equal({ state: 'peaceful', count: 1 });
            });
        });

        it('should handle events without objects', () => {
            cy.window().then((win) => {
                const events = [
                    { objects: [] },
                    { objects: null },
                    { objects: undefined }
                ];
                
                const states = dailySummaryManager.extractCommonStates(events);
                
                expect(states).to.have.length(0);
            });
        });
    });

    describe('DailySummaryManager - Key Events Extraction', () => {
        it('should identify danger and warning events as key events', () => {
            cy.window().then((win) => {
                const events = [
                    {
                        timestamp: '2025-01-09T10:00:00.000Z',
                        alert: { type: 'safe', message: 'All clear' },
                        objects: [{ state: 'sleeping' }]
                    },
                    {
                        timestamp: '2025-01-09T11:00:00.000Z',
                        alert: { type: 'warning', message: 'Minor concern' },
                        objects: [{ state: 'active' }]
                    },
                    {
                        timestamp: '2025-01-09T12:00:00.000Z',
                        alert: { type: 'danger', message: 'Immediate attention' },
                        objects: [{ state: 'distressed' }]
                    }
                ];
                
                const keyEvents = dailySummaryManager.extractKeyEvents(events);
                
                expect(keyEvents).to.have.length(2);
                expect(keyEvents[0].alert.type).to.equal('danger'); // Most recent first
                expect(keyEvents[1].alert.type).to.equal('warning');
            });
        });

        it('should identify events with concerning object states', () => {
            cy.window().then((win) => {
                const events = [
                    {
                        timestamp: '2025-01-09T10:00:00.000Z',
                        alert: { type: 'safe', message: 'All clear' },
                        objects: [{ state: 'crying baby detected' }]
                    },
                    {
                        timestamp: '2025-01-09T11:00:00.000Z',
                        alert: { type: 'safe', message: 'All clear' },
                        objects: [{ state: 'climbing on furniture' }]
                    }
                ];
                
                const keyEvents = dailySummaryManager.extractKeyEvents(events);
                
                expect(keyEvents).to.have.length(2);
                expect(keyEvents.some(e => e.objects[0].state.includes('crying'))).to.be.true;
                expect(keyEvents.some(e => e.objects[0].state.includes('climbing'))).to.be.true;
            });
        });
    });

    describe('DailySummaryManager - AI Prompt Generation', () => {
        it('should generate appropriate prompt for empty data', () => {
            cy.window().then((win) => {
                const dailyData = {
                    hasData: false,
                    timeSpan: { start: new Date('2025-01-09T00:00:00.000Z') }
                };
                
                const prompt = dailySummaryManager.createDailySummaryPrompt(dailyData);
                
                expect(prompt).to.include('no monitoring data was recorded');
                expect(prompt).to.include('peaceful day');
                expect(prompt).to.include('JSON');
            });
        });

        it('should generate detailed prompt for data with events', () => {
            cy.window().then((win) => {
                const dailyData = {
                    hasData: true,
                    totalEvents: 5,
                    alertCounts: { safe: 3, warning: 1, danger: 1 },
                    activityPeriods: [{ start: '10:00', end: '11:00' }],
                    mostCommonStates: [{ state: 'sleeping', count: 3 }],
                    keyEvents: [{ 
                        timestamp: '2025-01-09T12:00:00.000Z',
                        scene: 'Baby crying detected'
                    }],
                    timeSpan: { start: new Date('2025-01-09T00:00:00.000Z') }
                };
                
                const prompt = dailySummaryManager.createDailySummaryPrompt(dailyData);
                
                expect(prompt).to.include('Total monitoring events: 5');
                expect(prompt).to.include('3 safe periods, 1 minor concerns, 1 alerts');
                expect(prompt).to.include('sleeping (3x)');
                expect(prompt).to.include('12:00:00 PM: Baby crying detected');
                expect(prompt).to.include('JSON');
            });
        });
    });

    describe('DailySummaryManager - Fallback Summary Generation', () => {
        it('should generate fallback summary for empty data', () => {
            cy.window().then((win) => {
                const dailyData = { hasData: false };
                const targetDate = new Date('2025-01-09T12:00:00.000Z');
                
                const summary = dailySummaryManager.generateFallbackSummary(dailyData, targetDate);
                
                expect(summary.summary).to.include('No monitoring activity was recorded');
                expect(summary.mood).to.equal('positive');
                expect(summary.highlights).to.include('Peaceful day with no monitoring needed');
                expect(summary.fallback).to.be.true;
                expect(summary.date).to.equal('2025-01-09');
            });
        });

        it('should generate appropriate mood based on alert ratio', () => {
            cy.window().then((win) => {
                const concerningData = {
                    hasData: true,
                    totalEvents: 10,
                    alertCounts: { safe: 3, warning: 4, danger: 3 }, // 70% alerts
                    activityPeriods: []
                };
                const targetDate = new Date('2025-01-09T12:00:00.000Z');
                
                const summary = dailySummaryManager.generateFallbackSummary(concerningData, targetDate);
                
                expect(summary.mood).to.equal('concerned');
                expect(summary.summary).to.include('Several alerts were detected');
            });
        });

        it('should calculate safety rate correctly', () => {
            cy.window().then((win) => {
                const dailyData = {
                    hasData: true,
                    totalEvents: 10,
                    alertCounts: { safe: 8, warning: 1, danger: 1 }, // 80% safe
                    activityPeriods: []
                };
                const targetDate = new Date('2025-01-09T12:00:00.000Z');
                
                const summary = dailySummaryManager.generateFallbackSummary(dailyData, targetDate);
                
                expect(summary.insights.some(insight => insight.includes('80%'))).to.be.true;
                expect(summary.highlights).to.include('High safety rate');
            });
        });
    });

    describe('DailySummaryManager - Cache Management', () => {
        it('should cache generated summaries', () => {
            cy.window().then((win) => {
                const mockSummary = {
                    summary: 'Test summary',
                    mood: 'positive',
                    date: '2025-01-09'
                };
                
                // Manually add to cache
                dailySummaryManager.summaryCache.set('2025-01-09', mockSummary);
                
                expect(dailySummaryManager.summaryCache.has('2025-01-09')).to.be.true;
                expect(dailySummaryManager.summaryCache.get('2025-01-09')).to.deep.equal(mockSummary);
            });
        });

        it('should clean old cache entries', () => {
            cy.window().then((win) => {
                // Add entries with different dates
                const oldDate = new Date();
                oldDate.setDate(oldDate.getDate() - 35); // 35 days ago
                const oldDateKey = oldDate.toISOString().split('T')[0];
                
                const recentDate = new Date();
                recentDate.setDate(recentDate.getDate() - 1); // 1 day ago  
                const recentDateKey = recentDate.toISOString().split('T')[0];
                
                dailySummaryManager.summaryCache.set(oldDateKey, { summary: 'old' });
                dailySummaryManager.summaryCache.set(recentDateKey, { summary: 'recent' });
                
                expect(dailySummaryManager.summaryCache.size).to.equal(2);
                
                // Clean cache
                dailySummaryManager.cleanCache();
                
                // Old entry should be removed, recent should remain
                expect(dailySummaryManager.summaryCache.has(oldDateKey)).to.be.false;
                expect(dailySummaryManager.summaryCache.has(recentDateKey)).to.be.true;
                expect(dailySummaryManager.summaryCache.size).to.equal(1);
            });
        });
    });

    describe('DailySummaryManager - Movement Level Helper', () => {
        it('should return higher movement level correctly', () => {
            cy.window().then((win) => {
                expect(dailySummaryManager.getHigherMovementLevel('low', 'high')).to.equal('high');
                expect(dailySummaryManager.getHigherMovementLevel('medium', 'low')).to.equal('medium');
                expect(dailySummaryManager.getHigherMovementLevel('high', 'medium')).to.equal('high');
                expect(dailySummaryManager.getHigherMovementLevel('invalid', 'medium')).to.equal('medium');
                expect(dailySummaryManager.getHigherMovementLevel('invalid', 'invalid')).to.equal('low');
            });
        });
    });
});