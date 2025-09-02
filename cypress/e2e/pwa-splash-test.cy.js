describe('PWA Splash Screen Test', () => {
    it('should skip splash screen in test mode', () => {
        cy.visit('/?test=true');
        
        // Verify splash screen is skipped in test mode
        cy.get('#pwa-splash').should('not.exist');
        
        // Wait 1 second for page to fully load
        cy.wait(1000);
        
        // Verify main content is visible
        cy.get('#camera-container').should('be.visible');
        cy.get('#take-snapshot').should('be.visible');
        
        console.log('Test mode - splash screen skipped, main app content is immediately visible');
    });
});