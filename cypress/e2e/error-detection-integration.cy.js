describe('Error Detection Integration Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.startConsoleErrorDetection();
  });

  afterEach(() => {
    cy.restoreConsole();
  });

  it('should integrate error detection with existing test workflows', () => {
    // Use existing custom commands with error detection
    cy.get('#toggle-camera').click();
    cy.wait(1000);
    
    // Clear any camera setup errors/warnings
    cy.clearConsoleErrors();
    
    // Test snapshot with error monitoring
    cy.takeSnapshotAndAnalyze().then(() => {
      cy.checkForConsoleErrors({
        ignorePatterns: [
          'AI analysis',
          'network request',
          'puter',
          'analysis complete'
        ]
      });
    });
    
    // Test history functionality with error monitoring
    cy.verifyHistoryTab();
    cy.checkForConsoleErrors();
    
    // Test responsive layout with error monitoring
    cy.viewport(375, 667); // Mobile
    cy.wait(500);
    cy.checkForConsoleErrors();
    
    cy.viewport(1280, 720); // Desktop
    cy.wait(500);
    cy.checkForConsoleErrors();
  });

  it('should detect the specific addEventListener errors we fixed', () => {
    // This test verifies our fixes are working
    cy.get('#preferences-btn').click();
    cy.wait(1000);
    
    // Interact with elements that previously caused errors
    cy.get('#movement-threshold').should('exist').invoke('val', '0.5').trigger('input');
    cy.get('#notifications-enabled').should('exist');
    
    cy.get('#preferences-close').click();
    cy.wait(500);
    
    // Should have no addEventListener errors now
    cy.checkForConsoleErrors({
      ignorePatterns: [
        'puter',
        'NotSupportedError: Failed to execute \'define\'',
        'Warning:'
      ]
    });
  });

  it('should work with monitoring mode without errors', () => {
    cy.get('#toggle-camera').click();
    cy.wait(1000);
    
    cy.clearConsoleErrors();
    
    // Start monitoring
    cy.startMonitoring('5000');
    cy.wait(3000);
    
    // Take a snapshot during monitoring
    cy.get('#take-snapshot').click();
    cy.wait(2000);
    
    // Stop monitoring
    cy.stopMonitoring();
    
    // Check for errors during entire monitoring session
    cy.checkForConsoleErrors({
      ignorePatterns: [
        'monitoring interval',
        'camera stream',
        'AI processing'
      ]
    });
  });

  it('should provide useful error reports for CI/CD', () => {
    // Generate a controlled error for testing reporting
    cy.window().then((win) => {
      win.dispatchEvent(new ErrorEvent('error', {
        message: 'Controlled test error for CI/CD reporting',
        filename: '/app.js',
        lineno: 999,
        colno: 1
      }));
    });

    cy.getConsoleErrors().then((errors) => {
      expect(errors).to.have.length.at.least(1);
      
      const testError = errors.find(e => 
        e.message.includes('Controlled test error for CI/CD reporting')
      );
      
      if (testError) {
        cy.log('CI/CD Error Report:', {
          message: testError.message,
          type: testError.type,
          filename: testError.filename,
          line: testError.lineno,
          timestamp: testError.timestamp
        });
        
        // Verify error contains debugging information
        expect(testError).to.have.property('message');
        expect(testError).to.have.property('type');
        expect(testError).to.have.property('timestamp');
      }
    });
  });
});