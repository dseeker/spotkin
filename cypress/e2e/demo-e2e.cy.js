describe('SpotKin Demo E2E - Advanced Features', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('#camera-container').should('be.visible');
  });

  it('should demonstrate complete workflow with visual documentation', () => {
    // Screenshot: Initial state
    cy.screenshot('01-app-loaded');
    
    // Test snapshot functionality - click button
    cy.get('#take-snapshot').should('be.visible').click();
    
    // Wait for processing state or results (either loading or complete)
    cy.get('body').should('exist'); // Basic wait
    cy.wait(3000); // Allow processing time
    
    // Take screenshot regardless of AI response
    cy.screenshot('02-after-snapshot');
    
    // Test UI elements exist
    cy.get('#scene-text').should('exist');
    cy.get('#analysis-results').should('exist');
    
    // Test history functionality - switch to history tab
    cy.get('#tab-history').click();
    cy.get('#timeline-container').should('exist');
    cy.screenshot('03-history-tab');
    
    // Switch back to current tab
    cy.get('#tab-current').click();
    
    // Test responsive design
    cy.viewport(768, 1024);
    cy.screenshot('04-tablet-view');
    
    cy.viewport(375, 667);
    cy.screenshot('05-mobile-view');
    
    // Reset viewport
    cy.viewport(1280, 720);
  });

  it('should test monitoring mode functionality', () => {
    cy.screenshot('06-before-monitoring');
    
    // Test monitoring controls exist and work
    cy.get('#refresh-rate').should('be.visible').select('5000');
    cy.get('#toggle-monitoring').should('be.visible').click();
    
    // Verify monitoring UI state changed
    cy.get('#toggle-monitoring').should('contain.text', 'Stop Monitoring');
    cy.get('#camera-container').should('have.class', 'camera-active');
    cy.screenshot('07-monitoring-active');
    
    // Wait briefly then stop monitoring
    cy.wait(1000);
    
    // Stop monitoring
    cy.get('#toggle-monitoring').click();
    cy.get('#toggle-monitoring').should('contain.text', 'Start Monitoring');
    cy.get('#camera-container').should('not.have.class', 'camera-active');
    cy.screenshot('08-monitoring-stopped');
    
    // Test history tab accessibility
    cy.get('#tab-history').click();
    cy.get('#timeline-container').should('exist');
    cy.screenshot('09-history-tab');
  });

  it('should demonstrate error handling', () => {
    // Test that error handling components exist
    cy.window().then((win) => {
      // Verify error manager exists
      expect(win.errorManager).to.exist;
      expect(win.errorManager.getErrorStats).to.be.a('function');
    });
    
    // Test camera feedback element exists
    cy.get('#camera-feedback').should('exist');
    cy.screenshot('10-error-handling-ready');
    
    // Test that results placeholder exists for error display
    cy.get('#results-placeholder').should('exist');
    
    // Verify global error handling functions are available
    cy.window().then((win) => {
      expect(win.parseAIResponse).to.be.a('function');
      expect(win.errorManager).to.have.property('handleError');
    });
  });

  it('should validate accessibility features', () => {
    // Check semantic HTML structure
    cy.get('main, section, header, footer').should('exist');
    cy.get('h1, h2, h3').should('exist');
    
    // Test keyboard navigation on key elements
    cy.get('#take-snapshot').focus().should('be.focused');
    cy.get('#toggle-monitoring').focus().should('be.focused');
    
    // Screenshot accessibility validation
    cy.screenshot('13-accessibility-check');
  });

  it('should test visual regression across key states', () => {
    // Test different application states - simplified
    cy.screenshot('state-1-initial');
    
    // Test history tab
    cy.get('#tab-history').click();
    cy.screenshot('state-2-history');
    
    // Test back to current
    cy.get('#tab-current').click();
    cy.screenshot('state-3-current');
    
    // Test monitoring toggle (without waiting for AI)
    cy.get('#toggle-monitoring').click();
    cy.screenshot('state-4-monitoring-on');
    
    // Stop monitoring
    cy.get('#toggle-monitoring').click();
    cy.screenshot('state-5-monitoring-off');
  });
});