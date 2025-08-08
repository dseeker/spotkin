describe('Help Modal & Documentation', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should open help modal when help button is clicked', () => {
        cy.get('#help-btn').click();
        cy.get('#help-modal').should('be.visible');
        cy.get('#help-modal .modal-header h2').should('contain', 'Help & Documentation');
    });

    it('should close help modal with close button', () => {
        cy.get('#help-btn').click();
        cy.get('#help-modal').should('be.visible');
        
        cy.get('#help-modal .close-help').click();
        cy.get('#help-modal').should('not.be.visible');
    });

    it('should close help modal when clicking backdrop', () => {
        cy.get('#help-btn').click();
        cy.get('#help-modal').should('be.visible');
        
        // Click on the modal backdrop (not the modal content)
        cy.get('#help-modal').click({ force: true });
        cy.get('#help-modal').should('not.be.visible');
    });

    it('should close help modal with Escape key', () => {
        cy.get('#help-btn').click();
        cy.get('#help-modal').should('be.visible');
        
        cy.get('#help-modal').type('{esc}');
        cy.get('#help-modal').should('not.be.visible');
    });

    it('should have all help tabs visible and clickable', () => {
        cy.get('#help-btn').click();
        
        // Check all tabs are present
        cy.get('.help-tab[data-tab="getting-started"]').should('be.visible').and('contain', 'Getting Started');
        cy.get('.help-tab[data-tab="features"]').should('be.visible').and('contain', 'Features');
        cy.get('.help-tab[data-tab="setup"]').should('be.visible').and('contain', 'Setup Guide');
        cy.get('.help-tab[data-tab="troubleshooting"]').should('be.visible').and('contain', 'Troubleshooting');
        cy.get('.help-tab[data-tab="faq"]').should('be.visible').and('contain', 'FAQ');
    });

    it('should switch between help tab contents correctly', () => {
        cy.get('#help-btn').click();
        
        // Default should be Getting Started active
        cy.get('.help-tab[data-tab="getting-started"]').click();
        cy.get('#help-getting-started').should('be.visible');
        cy.get('#help-features').should('not.be.visible');
        
        // Switch to Features tab
        cy.get('.help-tab[data-tab="features"]').click();
        cy.get('#help-features').should('be.visible');
        cy.get('#help-getting-started').should('not.be.visible');
        
        // Switch to Setup tab
        cy.get('.help-tab[data-tab="setup"]').click();
        cy.get('#help-setup').should('be.visible');
        cy.get('#help-features').should('not.be.visible');
        
        // Switch to Troubleshooting tab
        cy.get('.help-tab[data-tab="troubleshooting"]').click();
        cy.get('#help-troubleshooting').should('be.visible');
        cy.get('#help-setup').should('not.be.visible');
        
        // Switch to FAQ tab
        cy.get('.help-tab[data-tab="faq"]').click();
        cy.get('#help-faq').should('be.visible');
        cy.get('#help-troubleshooting').should('not.be.visible');
    });

    it('should show active tab styling', () => {
        cy.get('#help-btn').click();
        
        // Click Features tab and verify active styling
        cy.get('.help-tab[data-tab="features"]').click();
        cy.get('.help-tab[data-tab="features"]')
            .should('have.class', 'border-blue-500')
            .and('have.class', 'text-blue-600');
        
        // Other tabs should not have active styling
        cy.get('.help-tab[data-tab="getting-started"]')
            .should('not.have.class', 'border-blue-500')
            .and('not.have.class', 'text-blue-600');
    });

    it('should contain comprehensive getting started content', () => {
        cy.get('#help-btn').click();
        cy.get('.help-tab[data-tab="getting-started"]').click();
        
        cy.get('#help-getting-started').should('be.visible');
        cy.get('#help-getting-started').should('contain', 'Welcome to SpotKin');
        cy.get('#help-getting-started').should('contain', 'intelligent monitoring application');
        cy.get('#help-getting-started').should('contain', 'First Time Setup');
        cy.get('#help-getting-started').should('contain', 'Quick Start');
    });

    it('should contain detailed features documentation', () => {
        cy.get('#help-btn').click();
        cy.get('.help-tab[data-tab="features"]').click();
        
        cy.get('#help-features').should('be.visible');
        cy.get('#help-features').should('contain', 'AI Scene Analysis');
        cy.get('#help-features').should('contain', 'Smart Alerts');
        cy.get('#help-features').should('contain', 'Monitoring Zones');
        cy.get('#help-features').should('contain', 'User Preferences');
        cy.get('#help-features').should('contain', 'Timeline History');
    });

    it('should contain setup guide with step-by-step instructions', () => {
        cy.get('#help-btn').click();
        cy.get('.help-tab[data-tab="setup"]').click();
        
        cy.get('#help-setup').should('be.visible');
        cy.get('#help-setup').should('contain', 'Camera Setup');
        cy.get('#help-setup').should('contain', 'Monitoring Configuration');
        cy.get('#help-setup').should('contain', 'Alert Preferences');
        cy.get('#help-setup').should('contain', 'Best Practices');
    });

    it('should contain troubleshooting section with common issues', () => {
        cy.get('#help-btn').click();
        cy.get('.help-tab[data-tab="troubleshooting"]').click();
        
        cy.get('#help-troubleshooting').should('be.visible');
        cy.get('#help-troubleshooting').should('contain', 'Camera Issues');
        cy.get('#help-troubleshooting').should('contain', 'AI Analysis Problems');
        cy.get('#help-troubleshooting').should('contain', 'Permission Denied');
        cy.get('#help-troubleshooting').should('contain', 'Performance Issues');
    });

    it('should contain FAQ with answers to common questions', () => {
        cy.get('#help-btn').click();
        cy.get('.help-tab[data-tab="faq"]').click();
        
        cy.get('#help-faq').should('be.visible');
        cy.get('#help-faq').should('contain', 'How accurate is the AI?');
        cy.get('#help-faq').should('contain', 'Can I use multiple cameras?');
        cy.get('#help-faq').should('contain', 'Is my data private?');
        cy.get('#help-faq').should('contain', 'What devices are supported?');
    });

    it('should be responsive on mobile viewport', () => {
        cy.viewport('iphone-x');
        
        cy.get('#help-btn').click();
        cy.get('#help-modal').should('be.visible');
        
        // Modal should adapt to mobile
        cy.get('#help-modal .modal-content').should('be.visible');
        cy.get('.help-tabs').should('be.visible');
        
        // Tabs should be scrollable on mobile
        cy.get('.help-tab[data-tab="features"]').click();
        cy.get('#help-features').should('be.visible');
    });

    it('should have accessible keyboard navigation', () => {
        cy.get('#help-btn').click();
        
        // Tab navigation should work
        cy.get('.help-tab[data-tab="getting-started"]').focus().type('{enter}');
        cy.get('#help-getting-started').should('be.visible');
        
        // Arrow keys or tab should move between tabs
        cy.get('.help-tab[data-tab="features"]').focus().type('{enter}');
        cy.get('#help-features').should('be.visible');
    });

    it('should integrate with setup wizard when mentioned in setup guide', () => {
        cy.get('#help-btn').click();
        cy.get('.help-tab[data-tab="setup"]').click();
        
        // Setup guide should reference the setup wizard
        cy.get('#help-setup').should('contain', 'Setup Wizard');
        cy.get('#help-setup').should('contain', 'first-time setup');
    });

    it('should persist help modal state during session', () => {
        // Open help modal and switch to features
        cy.get('#help-btn').click();
        cy.get('.help-tab[data-tab="features"]').click();
        cy.get('#help-features').should('be.visible');
        
        // Close and reopen
        cy.get('.close-help').click();
        cy.get('#help-btn').click();
        
        // Should start with getting started tab (default behavior)
        cy.get('.help-tab[data-tab="getting-started"]').click();
        cy.get('#help-getting-started').should('be.visible');
    });

    it('should handle missing content gracefully', () => {
        cy.get('#help-btn').click();
        
        // All tabs should exist and be clickable even if content is minimal
        cy.get('.help-tab').each(($tab) => {
            cy.wrap($tab).click();
            const tabId = $tab.attr('data-tab');
            cy.get(`#help-${tabId}`).should('exist');
        });
    });

    it('should work with keyboard shortcuts for accessibility', () => {
        cy.get('body').type('{alt}h'); // Hypothetical keyboard shortcut
        // Note: This would require implementing keyboard shortcuts in the app
        
        // For now, test that help button is accessible via tab navigation
        cy.get('body').tab();
        cy.focused().should('have.id', 'help-btn');
    });
});