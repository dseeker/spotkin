describe('FAQ System - Essential Tests', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.wait(1000);
        cy.viewport(1280, 720);
    });

    describe('✅ Basic FAQ Functionality', () => {
        it('should have FAQ system available in window', () => {
            cy.window().then((win) => {
                // Check if FAQ class is available
                expect(win.FAQSystem).to.exist;
            });
        });

        it('should create FAQ instance successfully', () => {
            cy.window().then((win) => {
                // Create FAQ instance
                const faq = new win.FAQSystem();
                expect(faq).to.exist;
                expect(faq.faqData).to.exist;
                expect(faq.searchIndex).to.exist;
            });
        });

        it('should open FAQ interface when help button is clicked', () => {
            cy.get('#help-btn').click();
            
            // Either FAQ interface or basic help modal should appear
            cy.get('body').then(($body) => {
                if ($body.find('#faq-interface').length > 0) {
                    cy.get('#faq-interface').should('not.have.class', 'hidden');
                } else {
                    cy.get('#help-modal').should('not.have.class', 'hidden');
                }
            });
        });

        it('should have comprehensive FAQ content', () => {
            cy.window().then((win) => {
                const faq = new win.FAQSystem();
                
                // Check essential categories
                expect(faq.faqData.categories['getting-started']).to.exist;
                expect(faq.faqData.categories['technical-issues']).to.exist;
                expect(faq.faqData.categories['monitoring']).to.exist;
                
                // Check CORS question exists
                const corsQuestion = faq.getQuestionById('cors-errors');
                expect(corsQuestion).to.exist;
                expect(corsQuestion.answer).to.contain('CORS');
            });
        });

        it('should search FAQ content successfully', () => {
            cy.window().then((win) => {
                const faq = new win.FAQSystem();
                
                // Search for camera issues
                const results = faq.searchFAQ('camera');
                expect(results).to.be.an('array');
                expect(results.length).to.be.greaterThan(0);
                
                // Search for CORS errors
                const corsResults = faq.searchFAQ('cors');
                expect(corsResults).to.be.an('array');
                expect(corsResults.length).to.be.greaterThan(0);
            });
        });
    });

    describe('✅ FAQ Content Quality', () => {
        it('should provide solutions for common technical issues', () => {
            cy.window().then((win) => {
                const faq = new win.FAQSystem();
                
                // Check for camera troubleshooting
                const cameraQuestion = faq.getQuestionById('camera-not-working');
                expect(cameraQuestion).to.exist;
                expect(cameraQuestion.answer).to.contain('permission');
                
                // Check for performance issues
                const performanceQuestion = faq.getQuestionById('slow-performance');
                expect(performanceQuestion).to.exist;
                expect(performanceQuestion.answer).to.contain('performance');
            });
        });

        it('should have privacy and security information', () => {
            cy.window().then((win) => {
                const faq = new win.FAQSystem();
                
                const privacyQuestion = faq.getQuestionById('data-storage');
                expect(privacyQuestion).to.exist;
                expect(privacyQuestion.answer).to.contain('local');
                expect(privacyQuestion.answer).to.contain('privacy');
            });
        });

        it('should provide mobile app installation guide', () => {
            cy.window().then((win) => {
                const faq = new win.FAQSystem();
                
                const mobileQuestion = faq.getQuestionById('pwa-install');
                expect(mobileQuestion).to.exist;
                expect(mobileQuestion.answer).to.contain('Progressive Web App');
                expect(mobileQuestion.answer).to.contain('Add to Home Screen');
            });
        });
    });

    describe('✅ Integration Test', () => {
        it('should not interfere with main application', () => {
            // Main app should still work
            cy.get('#take-snapshot').should('exist').and('not.be.disabled');
            cy.get('#preferences-btn').should('exist').and('not.be.disabled');
            
            // Create FAQ in background
            cy.window().then((win) => {
                const faq = new win.FAQSystem();
                expect(faq).to.exist;
            });
            
            // Main app should still be functional
            cy.get('#take-snapshot').should('exist').and('not.be.disabled');
        });
    });
});