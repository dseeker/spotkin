describe('Desktop Demo Section Layout Check', () => {
    beforeEach(() => {
        // Clear all caches to force fresh load
        cy.clearLocalStorage();
        cy.clearCookies();
        cy.visit('http://localhost:3000', {
            onBeforeLoad: (win) => {
                // Clear any cached stylesheets
                win.localStorage.clear();
                win.sessionStorage.clear();
            }
        });
        cy.viewport(1920, 1080);
        
        // Reload page to ensure fresh content
        cy.reload(true);
        
        // Wait for page to load
        cy.wait(5000);
    });

    it('should show demo section side-by-side on desktop', () => {
        // First, dismiss any welcome popup if it appears
        cy.get('body').then($body => {
            if ($body.find('[data-cy="onboarding-overlay"], #setup-wizard, #welcome-message').length > 0) {
                cy.get('[data-cy="onboarding-overlay"], #setup-wizard, #welcome-message').then($popup => {
                    if ($popup.length > 0) {
                        // Try to find and click close button
                        cy.get('button').contains('×').click({ force: true });
                        cy.wait(500);
                    }
                });
            }
        });
        
        // Wait to ensure any popups are gone
        cy.wait(2000);
        
        // Scroll to demo section
        cy.get('#demo').should('exist');
        cy.get('#demo').scrollIntoView();
        
        // Wait for any animations
        cy.wait(1000);
        
        // Take screenshot of demo section WITHOUT popup
        cy.screenshot('desktop-demo-section-no-popup-1920x1080', { 
            capture: 'viewport',
            clip: { x: 0, y: 0, width: 1920, height: 1080 }
        });
        
        // Check if the demo section has the grid layout
        cy.get('#demo').within(() => {
            cy.get('.demo-container').should('exist');
            
            // Check if both camera and analysis sections exist
            cy.contains('Camera Feed').should('be.visible');
            cy.contains('Scene Analysis').should('be.visible');
        });
        
        // Additional check: verify demo container class is applied correctly at desktop resolution
        cy.get('.demo-container').should('exist');
        
        // Verify the grid layout is actually applied via CSS
        cy.get('.demo-container').should('have.css', 'display', 'grid');
    });
    
    it('should capture the full page including demo section', () => {
        // Scroll to top first
        cy.scrollTo('top');
        cy.wait(1000);
        
        // Take full page screenshot
        cy.screenshot('desktop-full-page-1920x1080', { 
            capture: 'fullPage'
        });
        
        // Then scroll to demo section specifically
        cy.get('#demo').scrollIntoView({ duration: 1000 });
        cy.wait(1000);
        
        // Take demo section screenshot
        cy.screenshot('desktop-demo-focused-1920x1080', { 
            capture: 'viewport'
        });
    });
});