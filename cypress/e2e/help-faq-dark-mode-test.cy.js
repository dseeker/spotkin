describe('Help & FAQ Dark Mode Analysis', () => {
    it('should capture Help & FAQ modal in dark mode for analysis', () => {
        // Force dark mode with CSS injection
        cy.visit('/?test=true');
        
        // Inject CSS to force dark mode
        cy.get('html').invoke('attr', 'style', 'color-scheme: dark');
        cy.get('body').invoke('attr', 'style', 'background-color: #1f2937; color: #f3f4f6');
        
        // Wait for page to load
        cy.wait(2000);
        
        // Open Help & FAQ modal
        cy.get('#help-btn').click();
        cy.wait(1000);
        
        // Take screenshot of the Help & FAQ modal in dark mode
        cy.screenshot('help-faq-dark-mode-analysis', { 
            capture: 'viewport',
            overwrite: true
        });
        
        // Click on different categories to see their dark mode
        cy.get('[data-category="getting-started"]').click();
        cy.wait(500);
        cy.screenshot('help-faq-getting-started-dark', { capture: 'viewport' });
        
        // Click on another category
        cy.get('[data-category="technical"]').click();
        cy.wait(500);
        cy.screenshot('help-faq-technical-dark', { capture: 'viewport' });
        
        // Test search functionality
        cy.get('#faq-search').type('camera');
        cy.wait(500);
        cy.screenshot('help-faq-search-dark', { capture: 'viewport' });
        
        console.log('Help & FAQ dark mode analysis screenshots captured');
    });
});