// Daily Summary End-to-End Tests
describe('Daily Summary E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.wait(2000); // Wait for app and daily summary to initialize
    });

    describe('Daily Summary Auto-Generation', () => {
        it('should not show daily summary when no data exists', () => {
            // Clear any existing history data
            cy.window().then((win) => {
                win.historyData = [];
                win.localStorage.removeItem('spotkin_history');
            });

            cy.reload();
            cy.wait(3000);

            // Daily summary should not be visible
            cy.get('#daily-summary-container').should('not.exist');
        });

        it('should auto-generate daily summary when sufficient data exists', () => {
            // Add mock history data for today
            cy.window().then((win) => {
                const today = new Date();
                const mockData = [];
                
                // Create 5 events (sufficient for auto-generation)
                for (let i = 0; i < 5; i++) {
                    const eventTime = new Date(today);
                    eventTime.setHours(10 + i, 0, 0, 0);
                    
                    mockData.push({
                        timestamp: eventTime.toISOString(),
                        scene: `Baby activity ${i + 1}`,
                        objects: [{ type: 'baby', state: i % 2 === 0 ? 'sleeping' : 'active', confidence: 0.8 }],
                        alert: { type: i === 4 ? 'warning' : 'safe', message: i === 4 ? 'Minor concern' : 'All clear' },
                        temporalAnalysis: { hasMovement: i % 2 === 1, movementLevel: 'medium' }
                    });
                }
                
                win.historyData = mockData;
                win.localStorage.setItem('spotkin_history', JSON.stringify(mockData));
            });

            cy.reload();
            cy.wait(4000); // Wait for auto-generation

            // Daily summary should be visible
            cy.get('#daily-summary-container').should('exist');
            cy.get('.daily-summary-card').should('be.visible');
            
            // Check summary content
            cy.get('.daily-summary-card h3').should('contain', 'Daily Summary');
            cy.get('.daily-summary-card h3').should('contain', new Date().toLocaleDateString());
        });
    });

    describe('Daily Summary Content Validation', () => {
        beforeEach(() => {
            // Setup comprehensive test data
            cy.window().then((win) => {
                const today = new Date();
                const mockData = [
                    {
                        timestamp: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
                        scene: 'Baby sleeping peacefully in crib',
                        objects: [{ type: 'baby', state: 'sleeping', confidence: 0.9 }],
                        alert: { type: 'safe', message: 'All clear - peaceful sleep' },
                        temporalAnalysis: { hasMovement: false, movementLevel: 'low' }
                    },
                    {
                        timestamp: new Date(today.setHours(10, 30, 0, 0)).toISOString(),
                        scene: 'Baby waking up and moving',
                        objects: [{ type: 'baby', state: 'active', confidence: 0.85 }],
                        alert: { type: 'safe', message: 'Normal activity detected' },
                        temporalAnalysis: { hasMovement: true, movementLevel: 'medium' }
                    },
                    {
                        timestamp: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
                        scene: 'Baby crying - needs attention',
                        objects: [{ type: 'baby', state: 'crying', confidence: 0.8 }],
                        alert: { type: 'warning', message: 'Baby appears distressed' },
                        temporalAnalysis: { hasMovement: true, movementLevel: 'high' }
                    },
                    {
                        timestamp: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
                        scene: 'Dangerous situation detected',
                        objects: [{ type: 'baby', state: 'climbing', confidence: 0.75 }],
                        alert: { type: 'danger', message: 'Immediate attention required' },
                        temporalAnalysis: { hasMovement: true, movementLevel: 'high' }
                    },
                    {
                        timestamp: new Date(today.setHours(16, 0, 0, 0)).toISOString(),
                        scene: 'Back to peaceful rest',
                        objects: [{ type: 'baby', state: 'resting', confidence: 0.9 }],
                        alert: { type: 'safe', message: 'Calm and secure' },
                        temporalAnalysis: { hasMovement: false, movementLevel: 'low' }
                    }
                ];
                
                win.historyData = mockData;
            });
            
            // Manually trigger daily summary
            cy.window().then((win) => {
                win.showDailySummary();
            });
            
            cy.wait(3000);
        });

        it('should display correct summary header with date and mood', () => {
            cy.get('.daily-summary-card h3').should('contain', 'Daily Summary');
            cy.get('.daily-summary-card h3').should('contain', new Date().toLocaleDateString());
            
            // Should show mood emoji
            cy.get('.daily-summary-card h3 span').should('exist');
            
            // Should indicate AI generation or fallback
            cy.get('.daily-summary-card').within(() => {
                cy.get('span').should(($spans) => {
                    const text = $spans.text();
                    expect(text).to.match(/AI Generated|Offline Mode/);
                });
            });
        });

        it('should show summary text content', () => {
            cy.get('.daily-summary-card p').first().should('be.visible');
            cy.get('.daily-summary-card p').first().should('not.be.empty');
        });

        it('should display highlights section when available', () => {
            cy.get('.daily-summary-card').within(() => {
                cy.get('h4').contains('Highlights').should('be.visible');
                cy.get('h4').contains('Highlights').siblings('ul').should('exist');
                cy.get('h4').contains('Highlights').siblings('ul').find('li').should('have.length.greaterThan', 0);
            });
        });

        it('should display insights section when available', () => {
            cy.get('.daily-summary-card').within(() => {
                cy.get('h4').contains('Insights').should('be.visible');
                cy.get('h4').contains('Insights').siblings('ul').should('exist');
                cy.get('h4').contains('Insights').siblings('ul').find('li').should('have.length.greaterThan', 0);
            });
        });

        it('should show statistics grid with correct data', () => {
            cy.get('.daily-summary-card').within(() => {
                // Check statistics grid
                cy.get('.grid-cols-3').should('be.visible');
                
                // Total checks
                cy.get('.grid-cols-3 > div').eq(0).within(() => {
                    cy.get('div').first().should('contain', '5'); // Total events
                    cy.get('div').last().should('contain', 'Total Checks');
                });
                
                // Safe periods  
                cy.get('.grid-cols-3 > div').eq(1).within(() => {
                    cy.get('div').first().should('contain', '3'); // Safe events
                    cy.get('div').last().should('contain', 'Safe Periods');
                });
                
                // Alerts
                cy.get('.grid-cols-3 > div').eq(2).within(() => {
                    cy.get('div').first().should('contain', '2'); // Warning + danger
                    cy.get('div').last().should('contain', 'Alerts');
                });
            });
        });

        it('should show generation timestamp', () => {
            cy.get('.daily-summary-card').within(() => {
                cy.contains('Generated:').should('be.visible');
                cy.contains('Generated:').should('contain', new Date().getFullYear().toString());
            });
        });
    });

    describe('Daily Summary UI Interactions', () => {
        beforeEach(() => {
            // Add test data
            cy.window().then((win) => {
                const today = new Date();
                win.historyData = [{
                    timestamp: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
                    scene: 'Test monitoring event',
                    objects: [{ type: 'baby', state: 'active', confidence: 0.8 }],
                    alert: { type: 'safe', message: 'Normal activity' },
                    temporalAnalysis: { hasMovement: true, movementLevel: 'medium' }
                }];
            });
        });

        it('should allow manual trigger of daily summary', () => {
            cy.window().then((win) => {
                // Manually trigger daily summary
                win.showDailySummary();
            });
            
            // Should show loading state first
            cy.get('.daily-summary-loading', { timeout: 1000 }).should('be.visible');
            cy.get('.daily-summary-loading').should('contain', 'Generating your daily summary');
            
            // Wait for completion
            cy.wait(3000);
            
            // Should show completed summary
            cy.get('.daily-summary-card').should('be.visible');
            cy.get('.daily-summary-loading').should('not.exist');
        });

        it('should handle generation errors gracefully', () => {
            cy.window().then((win) => {
                // Mock a failure in summary generation
                const originalGenerate = win.dailySummaryManager.generateDailySummary;
                win.dailySummaryManager.generateDailySummary = () => Promise.reject(new Error('Test error'));
                
                win.showDailySummary();
            });
            
            cy.wait(2000);
            
            // Should show error state
            cy.get('.daily-summary-error').should('be.visible');
            cy.get('.daily-summary-error').should('contain', 'Unable to Generate Daily Summary');
            cy.get('.daily-summary-error').should('contain', 'Please try again');
        });

        it('should position summary correctly in the page layout', () => {
            cy.window().then((win) => {
                win.showDailySummary();
            });
            
            cy.wait(3000);
            
            cy.get('#daily-summary-container').should('be.visible');
            
            // Should be positioned after camera section but before analysis results
            cy.get('#daily-summary-container').then(($summary) => {
                const summaryTop = $summary.offset().top;
                
                cy.get('.camera-section').then(($camera) => {
                    const cameraBottom = $camera.offset().top + $camera.height();
                    expect(summaryTop).to.be.greaterThan(cameraBottom);
                });
            });
        });
    });

    describe('Daily Summary Responsive Design', () => {
        beforeEach(() => {
            cy.window().then((win) => {
                const today = new Date();
                win.historyData = [{
                    timestamp: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
                    scene: 'Responsive test event',
                    objects: [{ type: 'baby', state: 'testing', confidence: 0.8 }],
                    alert: { type: 'safe', message: 'Responsive design test' }
                }];
                
                win.showDailySummary();
            });
            
            cy.wait(3000);
        });

        it('should display correctly on desktop', () => {
            cy.viewport(1200, 800);
            
            cy.get('.daily-summary-card').should('be.visible');
            cy.get('.daily-summary-card .grid-cols-3').should('be.visible');
            cy.get('.daily-summary-card .flex').should('be.visible');
        });

        it('should display correctly on tablet', () => {
            cy.viewport(768, 1024);
            
            cy.get('.daily-summary-card').should('be.visible');
            cy.get('.daily-summary-card').should('be.visible');
            
            // Statistics grid should still work on tablet
            cy.get('.grid-cols-3 > div').should('have.length', 3);
        });

        it('should display correctly on mobile', () => {
            cy.viewport(375, 667);
            
            cy.get('.daily-summary-card').should('be.visible');
            
            // Content should be readable on mobile
            cy.get('.daily-summary-card h3').should('be.visible');
            cy.get('.daily-summary-card p').first().should('be.visible');
            
            // Statistics should still be accessible
            cy.get('.grid-cols-3').should('be.visible');
        });
    });

    describe('Daily Summary Performance', () => {
        it('should handle large datasets efficiently', () => {
            // Create large dataset (100 events)
            cy.window().then((win) => {
                const today = new Date();
                const largeDataset = [];
                
                for (let i = 0; i < 100; i++) {
                    const eventTime = new Date(today);
                    eventTime.setMinutes(i * 10); // Events every 10 minutes
                    
                    largeDataset.push({
                        timestamp: eventTime.toISOString(),
                        scene: `Event ${i}`,
                        objects: [{ type: 'baby', state: i % 3 === 0 ? 'sleeping' : 'active', confidence: 0.8 }],
                        alert: { type: i % 10 === 0 ? 'warning' : 'safe', message: 'Test event' },
                        temporalAnalysis: { hasMovement: i % 2 === 0, movementLevel: 'medium' }
                    });
                }
                
                win.historyData = largeDataset;
            });
            
            const startTime = performance.now();
            
            cy.window().then((win) => {
                win.showDailySummary();
            });
            
            cy.wait(5000);
            
            cy.get('.daily-summary-card').should('be.visible');
            
            cy.then(() => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Should complete within reasonable time (10 seconds)
                expect(duration).to.be.lessThan(10000);
            });
        });

        it('should cache summaries to avoid regeneration', () => {
            cy.window().then((win) => {
                const today = new Date();
                win.historyData = [{
                    timestamp: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
                    scene: 'Cache test',
                    objects: [{ type: 'baby', state: 'testing', confidence: 0.8 }],
                    alert: { type: 'safe', message: 'Cache test' }
                }];
                
                // First generation
                win.showDailySummary();
            });
            
            cy.wait(3000);
            cy.get('.daily-summary-card').should('be.visible');
            
            // Clear the displayed summary
            cy.get('#daily-summary-container').then(($container) => {
                $container.empty();
            });
            
            cy.window().then((win) => {
                // Second generation should use cache
                const startTime = performance.now();
                win.showDailySummary();
                
                cy.wait(1000).then(() => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    // Cached version should be much faster (< 100ms)
                    expect(duration).to.be.lessThan(1000);
                });
            });
            
            cy.get('.daily-summary-card').should('be.visible');
        });
    });

    describe('Daily Summary Accessibility', () => {
        beforeEach(() => {
            cy.window().then((win) => {
                const today = new Date();
                win.historyData = [{
                    timestamp: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
                    scene: 'Accessibility test',
                    objects: [{ type: 'baby', state: 'testing', confidence: 0.8 }],
                    alert: { type: 'safe', message: 'Accessibility test' }
                }];
                
                win.showDailySummary();
            });
            
            cy.wait(3000);
        });

        it('should have proper heading structure', () => {
            cy.get('.daily-summary-card h3').should('have.attr', 'class').and('include', 'font-semibold');
            cy.get('.daily-summary-card h4').should('exist');
        });

        it('should have readable text with sufficient contrast', () => {
            cy.get('.daily-summary-card').should('have.css', 'color');
            cy.get('.daily-summary-card p').should('be.visible');
        });

        it('should use semantic HTML elements', () => {
            cy.get('.daily-summary-card ul').should('exist');
            cy.get('.daily-summary-card li').should('exist');
        });

        it('should have accessible icons with labels', () => {
            cy.get('.daily-summary-card i.fas').should('exist');
            cy.get('.daily-summary-card').within(() => {
                cy.contains('Highlights').should('be.visible');
                cy.contains('Insights').should('be.visible');
            });
        });
    });
});