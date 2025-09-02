describe('Dark Mode Visual Test', () => {
    it('should display properly in dark mode', () => {
        // Set dark mode preference and skip splash screen
        cy.visit('/?test=true', {
            onBeforeLoad(win) {
                // Mock prefers-color-scheme: dark
                Object.defineProperty(win, 'matchMedia', {
                    writable: true,
                    value: cy.stub().returns({
                        matches: true,
                        media: '(prefers-color-scheme: dark)',
                        onchange: null,
                        addListener: cy.stub(),
                        removeListener: cy.stub(),
                        addEventListener: cy.stub(),
                        removeEventListener: cy.stub(),
                        dispatchEvent: cy.stub()
                    })
                });
            }
        });
        
        // Verify splash screen is skipped in test mode
        cy.get('#pwa-splash').should('not.exist');
        
        // Wait 1 second for page to fully load
        cy.wait(1000);
        
        // Wait for app to load
        cy.get('#camera-container').should('be.visible');
        
        // Take screenshot of main app in dark mode
        cy.screenshot('dark-mode-main-app', { 
            capture: 'viewport',
            clip: { x: 0, y: 0, width: 1280, height: 720 }
        });
        
        // Open help modal to test dark mode
        cy.get('#help-btn').click();
        cy.wait(1000);
        
        // Take screenshot of help modal in dark mode
        cy.screenshot('dark-mode-help-modal', { 
            capture: 'viewport',
            clip: { x: 0, y: 0, width: 1280, height: 720 }
        });
        
        // Close help modal
        cy.get('body').then(($body) => {
            if ($body.find('#help-modal-close').length > 0) {
                cy.get('#help-modal-close').click();
            } else if ($body.find('#faq-close').length > 0) {
                cy.get('#faq-close').click();
            }
        });
        
        // Test AI analysis result display
        cy.get('#take-snapshot').click();
        cy.wait(3000);
        
        // Take screenshot of analysis results in dark mode
        cy.screenshot('dark-mode-analysis-results', { 
            capture: 'viewport',
            clip: { x: 0, y: 0, width: 1280, height: 720 }
        });
        
        console.log('Dark mode visual test completed - check screenshots folder');
    });
});