describe('Full Page Dark Mode Analysis', () => {
    it('should capture full page in dark mode for analysis', () => {
        // Force dark mode with CSS injection
        cy.visit('/?test=true');
        
        // Inject CSS to force dark mode
        cy.get('html').invoke('attr', 'style', 'color-scheme: dark');
        cy.get('body').invoke('attr', 'style', 'background-color: #1f2937; color: #f3f4f6');
        
        // Wait for page to load
        cy.wait(2000);
        
        // Ensure we're in the demo/main section
        cy.get('#camera-container').should('be.visible');
        
        // Take full page screenshot to analyze all sections
        cy.screenshot('full-page-dark-mode-analysis', { 
            capture: 'fullPage',
            overwrite: true
        });
        
        // Scroll to different sections to capture them
        cy.scrollTo('top');
        cy.wait(500);
        cy.screenshot('section-1-header-hero', { capture: 'viewport' });
        
        // Scroll to features section
        cy.get('body').then(($body) => {
            if ($body.find('.feature-card, .key-features, #key-features').length > 0) {
                cy.get('.feature-card, .key-features, #key-features').first().scrollIntoView();
                cy.wait(500);
                cy.screenshot('section-2-features', { capture: 'viewport' });
            }
        });
        
        // Scroll to demo section
        cy.get('#camera-container').scrollIntoView();
        cy.wait(500);
        cy.screenshot('section-3-demo', { capture: 'viewport' });
        
        // Try to scroll to any other sections
        cy.get('body').then(($body) => {
            if ($body.find('footer, .footer').length > 0) {
                cy.get('footer, .footer').first().scrollIntoView();
                cy.wait(500);
                cy.screenshot('section-4-footer', { capture: 'viewport' });
            }
        });
        
        console.log('Full page dark mode analysis screenshots captured');
    });
});