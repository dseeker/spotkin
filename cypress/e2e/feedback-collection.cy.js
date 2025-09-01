describe('Feedback Collection System Tests', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        cy.window().then((win) => {
            win.localStorage.clear();
        });
        
        cy.visit('/');
        cy.wait(1000);
        cy.viewport(1280, 720);
    });

    describe('✅ Feedback System Initialization', () => {
        it('should have feedback system available in window', () => {
            cy.window().then((win) => {
                expect(win.FeedbackCollectionSystem).to.exist;
            });
        });

        it('should create feedback instance successfully', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                expect(feedback).to.exist;
                expect(feedback.feedbackTypes).to.exist;
                expect(feedback.sessionData).to.exist;
            });
        });

        it('should initialize feedback types correctly', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                
                // Check essential feedback types
                expect(feedback.feedbackTypes.bug).to.exist;
                expect(feedback.feedbackTypes.feature).to.exist;
                expect(feedback.feedbackTypes.usability).to.exist;
                expect(feedback.feedbackTypes.performance).to.exist;
                expect(feedback.feedbackTypes.general).to.exist;
                expect(feedback.feedbackTypes.ai).to.exist;
                
                // Each type should have required properties
                Object.values(feedback.feedbackTypes).forEach(type => {
                    expect(type.icon).to.exist;
                    expect(type.title).to.exist;
                    expect(type.description).to.exist;
                    expect(type.fields).to.be.an('array');
                });
            });
        });

        it('should initialize session tracking', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                
                expect(feedback.sessionData.sessionId).to.exist;
                expect(feedback.sessionData.startTime).to.be.a('number');
                expect(feedback.sessionData.userAgent).to.equal(win.navigator.userAgent);
                expect(feedback.sessionData.viewport).to.exist;
                expect(feedback.sessionData.actions).to.be.an('array');
                expect(feedback.sessionData.errors).to.be.an('array');
            });
        });
    });

    describe('✅ Privacy and Preferences', () => {
        it('should respect user privacy preference', () => {
            cy.window().then((win) => {
                // Initially disabled (no preference set)
                const feedback = new win.FeedbackCollectionSystem();
                expect(feedback.isEnabled).to.be.false;
                
                // Enable feedback
                feedback.setFeedbackPreference(true);
                expect(feedback.isEnabled).to.be.true;
                expect(win.localStorage.getItem('spotkin_feedback_enabled')).to.equal('true');
                
                // Disable feedback
                feedback.setFeedbackPreference(false);
                expect(feedback.isEnabled).to.be.false;
                expect(win.localStorage.getItem('spotkin_feedback_enabled')).to.equal('false');
            });
        });

        it('should show privacy notice when feedback is disabled', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(false);
                
                // Try to show feedback modal
                feedback.showFeedbackModal();
                
                // Should show privacy notice instead
                cy.get('body').should('contain', 'Privacy Notice');
            });
        });

        it('should allow enabling feedback from privacy notice', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.showFeedbackModal();
                
                // Accept privacy
                cy.contains('Enable Feedback').click();
                
                // Should now show feedback modal
                cy.get('#feedback-modal').should('exist');
                expect(feedback.isEnabled).to.be.true;
            });
        });
    });

    describe('✅ Feedback Modal Interface', () => {
        it('should show feedback modal when enabled', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal();
                
                cy.get('#feedback-modal').should('exist').and('be.visible');
                cy.get('#feedback-modal').should('contain', 'Share Your Feedback');
            });
        });

        it('should display all feedback types', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal();
                
                // Check feedback type options
                cy.get('.feedback-type-option').should('have.length', 6);
                cy.get('.feedback-type-option').should('contain', 'Bug Report');
                cy.get('.feedback-type-option').should('contain', 'Feature Request');
                cy.get('.feedback-type-option').should('contain', 'Usability Feedback');
                cy.get('.feedback-type-option').should('contain', 'Performance Issue');
                cy.get('.feedback-type-option').should('contain', 'General Feedback');
                cy.get('.feedback-type-option').should('contain', 'AI Analysis Feedback');
            });
        });

        it('should update form fields when feedback type is changed', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal('bug');
                
                // Should show bug-specific fields
                cy.get('#feedback-description').should('exist');
                cy.get('#feedback-steps').should('exist');
                cy.get('#feedback-expected').should('exist');
                cy.get('#feedback-actual').should('exist');
                
                // Switch to feature request
                cy.get('[data-type="feature"]').click();
                
                // Should show feature-specific fields
                cy.get('#feedback-description').should('exist');
                cy.get('#feedback-usecase').should('exist');
                cy.get('#feedback-priority').should('exist');
            });
        });

        it('should close modal when close button is clicked', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal();
                
                cy.get('#feedback-close').click();
                cy.get('#feedback-modal').should('not.exist');
            });
        });

        it('should close modal when cancel button is clicked', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal();
                
                cy.get('#feedback-cancel').click();
                cy.get('#feedback-modal').should('not.exist');
            });
        });
    });

    describe('✅ Form Validation and Submission', () => {
        it('should validate required fields', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal();
                
                // Try to submit without description
                cy.get('#feedback-submit').click();
                
                // Should show error
                cy.get('body').should('contain', 'detailed description');
            });
        });

        it('should collect form data correctly', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal('bug');
                
                // Fill form
                cy.get('#feedback-description').type('Test bug description that is long enough');
                cy.get('#feedback-steps').type('1. Step one\n2. Step two');
                cy.get('#feedback-email').type('test@example.com');
                
                // Mock submitFeedback to capture data
                let capturedData = null;
                cy.stub(feedback, 'sendFeedback').callsFake((data) => {
                    capturedData = data;
                    return Promise.resolve({ success: true, id: 'test123' });
                });
                
                cy.get('#feedback-submit').click();
                
                cy.then(() => {
                    expect(capturedData).to.not.be.null;
                    expect(capturedData.type).to.equal('bug');
                    expect(capturedData.description).to.contain('Test bug description');
                    expect(capturedData.email).to.equal('test@example.com');
                });
            });
        });

        it('should handle star ratings correctly', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal('general');
                
                // Click on 4th star
                cy.get('.rating-star[data-rating="4"]').click();
                
                // Stars 1-4 should be highlighted
                cy.get('.rating-star.text-yellow-400').should('have.length', 4);
            });
        });

        it('should show success message on successful submission', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal();
                
                // Fill required field
                cy.get('#feedback-description').type('Test feedback message that is long enough');
                
                // Submit
                cy.get('#feedback-submit').click();
                
                // Should show success message
                cy.get('body', { timeout: 5000 }).should('contain', 'Thank you!');
                cy.get('#feedback-modal').should('not.exist');
            });
        });
    });

    describe('✅ Smart Feedback Prompts', () => {
        it('should detect and track errors', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                
                // Simulate error
                const errorEvent = new ErrorEvent('error', {
                    message: 'Test error',
                    filename: 'test.js',
                    lineno: 123
                });
                
                win.dispatchEvent(errorEvent);
                
                // Should track error
                expect(feedback.sessionData.errors.length).to.be.greaterThan(0);
                expect(feedback.sessionData.errors[0].message).to.equal('Test error');
            });
        });

        it('should show smart prompt for repeated errors', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                
                // Simulate multiple errors quickly
                for (let i = 0; i < 3; i++) {
                    feedback.trackError({
                        message: `Test error ${i}`,
                        timestamp: Date.now()
                    });
                }
                
                // Should show feedback prompt
                cy.get('.feedback-prompt', { timeout: 2000 }).should('exist');
            });
        });

        it('should detect frustration from rapid clicking', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                
                // Simulate rapid clicking
                const button = win.document.querySelector('#take-snapshot');
                for (let i = 0; i < 6; i++) {
                    button.dispatchEvent(new Event('click', { bubbles: true }));
                }
                
                cy.wait(2100); // Wait for detection
                
                // Should detect frustration
                const frustrationEvents = feedback.sessionData.actions.filter(
                    action => action.type === 'frustration_detected'
                );
                expect(frustrationEvents.length).to.be.greaterThan(0);
            });
        });
    });

    describe('✅ Feedback Button Integration', () => {
        it('should create feedback button when enabled', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                
                const button = feedback.createFeedbackButton();
                expect(button).to.exist;
                expect(button.id).to.equal('feedback-button');
            });
        });

        it('should open feedback modal when button is clicked', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.createFeedbackButton();
                
                cy.get('#feedback-button').click();
                cy.get('#feedback-modal').should('exist');
            });
        });
    });

    describe('✅ Data Storage and Statistics', () => {
        it('should store feedback locally', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                
                const testFeedback = {
                    type: 'test',
                    description: 'Test feedback',
                    metadata: {
                        timestamp: new Date().toISOString()
                    }
                };
                
                feedback.storeFeedbackLocally(testFeedback);
                
                const stored = JSON.parse(win.localStorage.getItem('spotkin_feedback_queue'));
                expect(stored).to.be.an('array');
                expect(stored[0].description).to.equal('Test feedback');
            });
        });

        it('should provide feedback statistics', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                
                // Store some test feedback
                const testFeedback = [
                    { type: 'bug', metadata: { timestamp: new Date().toISOString() } },
                    { type: 'feature', metadata: { timestamp: new Date().toISOString() } },
                    { type: 'bug', metadata: { timestamp: new Date().toISOString() } }
                ];
                
                win.localStorage.setItem('spotkin_feedback_queue', JSON.stringify(testFeedback));
                
                const stats = feedback.getFeedbackStatistics();
                expect(stats.total).to.equal(3);
                expect(stats.byType.bug).to.equal(2);
                expect(stats.byType.feature).to.equal(1);
            });
        });

        it('should export feedback data', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                
                // Store some test feedback
                const testFeedback = [
                    { type: 'bug', description: 'Test bug' }
                ];
                
                win.localStorage.setItem('spotkin_feedback_queue', JSON.stringify(testFeedback));
                
                const exportData = feedback.exportFeedbackData();
                expect(exportData).to.exist;
                expect(exportData.feedback).to.be.an('array');
                expect(exportData.version).to.equal('4.0.0');
                expect(exportData.statistics).to.exist;
            });
        });
    });

    describe('✅ Session Context and Analytics', () => {
        it('should track session context', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                
                const context = feedback.getSessionContext();
                expect(context.sessionDuration).to.be.a('number');
                expect(context.viewport).to.exist;
                expect(context.actionsCount).to.be.a('number');
                expect(context.errorsCount).to.be.a('number');
            });
        });

        it('should include session context in feedback when requested', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal();
                
                // Fill form and keep context checkbox checked
                cy.get('#feedback-description').type('Test feedback with context');
                cy.get('#feedback-include-data').should('be.checked');
                
                let capturedData = null;
                cy.stub(feedback, 'sendFeedback').callsFake((data) => {
                    capturedData = data;
                    return Promise.resolve({ success: true });
                });
                
                cy.get('#feedback-submit').click();
                
                cy.then(() => {
                    expect(capturedData.sessionContext).to.exist;
                    expect(capturedData.sessionContext.viewport).to.exist;
                });
            });
        });
    });

    describe('✅ Error Handling and Resilience', () => {
        it('should handle localStorage errors gracefully', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                
                // Mock localStorage to throw errors
                const originalSetItem = win.localStorage.setItem;
                cy.stub(win.localStorage, 'setItem').throws(new Error('Storage quota exceeded'));
                
                // Should not crash when storing feedback
                expect(() => {
                    feedback.storeFeedbackLocally({ test: true });
                }).to.not.throw();
                
                // Restore localStorage
                win.localStorage.setItem = originalSetItem;
            });
        });

        it('should handle submission errors gracefully', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal();
                
                // Fill form
                cy.get('#feedback-description').type('Test feedback');
                
                // Mock sendFeedback to fail
                cy.stub(feedback, 'sendFeedback').rejects(new Error('Network error'));
                
                cy.get('#feedback-submit').click();
                
                // Should show error message
                cy.get('body', { timeout: 5000 }).should('contain', 'Error');
            });
        });

        it('should not show multiple prompts rapidly', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                
                // Show prompt
                feedback.showSmartFeedbackPrompt('bug', 'Test prompt');
                
                // Try to show another immediately
                feedback.showSmartFeedbackPrompt('feature', 'Another prompt');
                
                // Should only show one prompt
                cy.get('.feedback-prompt').should('have.length', 1);
            });
        });
    });

    describe('✅ Mobile Responsiveness', () => {
        it('should work on mobile viewport', () => {
            cy.viewport(375, 667);
            
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.showFeedbackModal();
                
                // Modal should be responsive
                cy.get('#feedback-modal').should('exist');
                cy.get('#feedback-modal .grid-cols-3').should('have.class', 'grid-cols-2');
            });
        });

        it('should position feedback button appropriately on mobile', () => {
            cy.viewport(375, 667);
            
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.createFeedbackButton();
                
                cy.get('#feedback-button').should('exist');
                // Button should be positioned to avoid bottom navigation
            });
        });
    });

    describe('✅ Integration with Main Application', () => {
        it('should initialize automatically in main app', () => {
            cy.window().then((win) => {
                // Feedback system should be available
                expect(win.FeedbackCollectionSystem).to.exist;
            });
        });

        it('should not interfere with main application', () => {
            cy.window().then((win) => {
                const feedback = new win.FeedbackCollectionSystem();
                feedback.setFeedbackPreference(true);
                feedback.createFeedbackButton();
                
                // Main app should still work
                cy.get('#take-snapshot').should('exist').and('not.be.disabled');
                cy.get('#preferences-btn').should('exist').and('not.be.disabled');
            });
        });
    });
});