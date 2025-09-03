describe('Error Detection System - Production Ready', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.startConsoleErrorDetection();
  });

  afterEach(() => {
    cy.restoreConsole();
  });

  it('should monitor and report console errors during normal usage', () => {
    cy.wait(2000); // Let page fully load
    
    // Test basic interactions
    cy.get('#tab-current').click();
    cy.wait(500);
    
    cy.get('#tab-history').click();
    cy.wait(500);
    
    cy.get('#preferences-btn').click();
    cy.wait(1000);
    
    cy.get('#preferences-close').click();
    cy.wait(500);
    
    // Check for critical errors only (ignore warnings and known issues)
    cy.checkForConsoleErrors({
      failOnError: true,
      failOnWarning: false,
      ignorePatterns: [
        // Known safe patterns to ignore
        /puter/i,
        /CustomElementRegistry/i,
        /Script error/i,
        /Non-Error promise rejection/i,
        /ResizeObserver loop limit exceeded/i,
        /Warning:/i,
        /The above error occurred/i,
        // Development-specific warnings
        /Failed to fetch/i,
        /Load failed/i,
        // Expected during testing
        /getUserMedia/i,
        /NotAllowedError/i
      ],
      logErrors: true
    });
  });

  it('should detect our fixed addEventListener errors are resolved', () => {
    // Test the specific scenarios that used to cause errors
    cy.get('#preferences-btn').click();
    cy.wait(1000);
    
    // These actions used to cause "Cannot read properties of undefined" errors
    cy.get('body').click(); // Click outside modal (tests preferencesModal listener)
    cy.wait(500);
    
    cy.get('#preferences-btn').click();
    cy.wait(500);
    
    // Test movement threshold input (tests movementThreshold listener)
    cy.get('#movement-threshold').should('exist').invoke('val', '0.4').trigger('input');
    cy.wait(500);
    
    cy.get('#preferences-close').click();
    cy.wait(500);
    
    // Should have no addEventListener-related errors
    cy.getConsoleErrors().then((errors) => {
      const addEventListenerErrors = errors.filter(e => 
        e.message.includes('addEventListener') || 
        e.message.includes('Cannot read properties of undefined')
      );
      
      if (addEventListenerErrors.length > 0) {
        cy.log('❌ addEventListener errors still exist:');
        addEventListenerErrors.forEach(error => {
          cy.log(`- ${error.message}`);
        });
      } else {
        cy.log('✅ No addEventListener errors found - fixes are working!');
      }
      
      expect(addEventListenerErrors).to.have.length(0);
    });
  });

  it('should provide detailed error reports for debugging', () => {
    // Collect all errors during a complete user workflow
    cy.get('#toggle-camera').click();
    cy.wait(2000);
    
    cy.get('#take-snapshot').click();
    cy.wait(3000);
    
    cy.get('#tab-history').click();
    cy.wait(500);
    
    cy.get('#preferences-btn').click();
    cy.wait(1000);
    
    cy.get('#notifications-enabled').check({ force: true });
    cy.wait(500);
    
    cy.get('#preferences-save').click();
    cy.wait(1000);
    
    // Generate comprehensive error report
    cy.getConsoleErrors().then((errors) => {
      cy.log(`📊 Error Detection Summary:`);
      cy.log(`Total errors/warnings captured: ${errors.length}`);
      
      const errorsByType = errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(errorsByType).forEach(([type, count]) => {
        cy.log(`  ${type}: ${count}`);
      });
      
      // Log critical errors for fixing
      const criticalErrors = errors.filter(e => 
        e.type === 'uncaught.error' && 
        !e.message.includes('puter') &&
        !e.message.includes('CustomElementRegistry') &&
        !e.message.includes('Script error')
      );
      
      if (criticalErrors.length > 0) {
        cy.log('🚨 Critical errors that need fixing:');
        criticalErrors.forEach((error, index) => {
          cy.log(`${index + 1}. ${error.message} (${error.filename}:${error.lineno})`);
        });
      } else {
        cy.log('✅ No critical errors found');
      }
    });
    
    // Also check app-level errors
    cy.window().then((win) => {
      const appErrors = win.testErrors || [];
      const criticalAppErrors = appErrors.filter(e => 
        e.type === 'javascript' &&
        !e.message.includes('puter') &&
        !e.message.includes('Script error')
      );
      
      cy.log(`📱 App Error Handler Summary:`);
      cy.log(`Total app errors: ${appErrors.length}`);
      cy.log(`Critical app errors: ${criticalAppErrors.length}`);
      
      if (criticalAppErrors.length > 0) {
        criticalAppErrors.forEach((error, index) => {
          cy.log(`${index + 1}. ${error.message} (${error.source}:${error.lineno})`);
        });
      }
    });
  });

  it('should work with CI/CD pipeline requirements', () => {
    // Test that represents typical CI/CD usage
    cy.wait(3000); // Full page load
    
    // Basic functionality test
    cy.get('#tab-history').click();
    cy.get('#tab-current').click();
    
    // Settings test
    cy.get('#preferences-btn').click();
    cy.wait(500);
    cy.get('#preferences-close').click();
    
    // Final error check with CI/CD friendly settings
    cy.checkForConsoleErrors({
      failOnError: true,
      failOnWarning: false,
      ignorePatterns: [
        /puter/i,
        /CustomElementRegistry/i,
        /Script error\.$/,
        /ResizeObserver/i,
        /Non-Error promise rejection/i,
        /Failed to fetch.*v2/i, // Puter API calls
        /Load failed/i,
        /Warning:/i
      ],
      logErrors: true
    });
    
    cy.log('✅ CI/CD Error Detection Test Passed');
  });
});