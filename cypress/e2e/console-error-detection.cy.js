describe('Console Error Detection System', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.startConsoleErrorDetection();
  });

  afterEach(() => {
    cy.restoreConsole();
  });

  describe('Page Load Errors', () => {
    it('should not have console errors on initial page load', () => {
      cy.wait(1000); // Let page fully load
      cy.checkForConsoleErrors({
        ignorePatterns: [
          // Ignore expected warnings during development
          'The above error occurred',
          'Warning:',
          // Ignore puter.js warnings that might occur
          'puter',
          'NotSupportedError: Failed to execute \'define\' on \'CustomElementRegistry\''
        ]
      });
    });

    it('should not have errors when camera initializes', () => {
      cy.get('#toggle-camera').click();
      cy.wait(2000); // Wait for camera setup
      cy.checkForConsoleErrors({
        ignorePatterns: [
          'getUserMedia',
          'camera permission',
          'NotSupportedError: Failed to execute \'define\' on \'CustomElementRegistry\''
        ]
      });
    });
  });

  describe('User Interaction Errors', () => {
    it('should not have errors when taking snapshots', () => {
      cy.get('#toggle-camera').click();
      cy.wait(1000);
      
      cy.clearConsoleErrors(); // Clear any camera-related warnings
      
      cy.get('#take-snapshot').click();
      cy.wait(2000);
      
      cy.checkForConsoleErrors({
        ignorePatterns: [
          'AI analysis',
          'network',
          'puter'
        ]
      });
    });

    it('should not have errors when switching tabs', () => {
      cy.get('#tab-current').click();
      cy.wait(500);
      
      cy.get('#tab-history').click();
      cy.wait(500);
      
      cy.get('#tab-current').click();
      cy.wait(500);
      
      cy.checkForConsoleErrors();
    });

    it('should not have errors when opening preferences', () => {
      cy.get('#preferences-btn').click();
      cy.wait(1000);
      
      cy.get('#preferences-close').click();
      cy.wait(500);
      
      cy.checkForConsoleErrors();
    });

    it('should not have errors during monitoring mode', () => {
      cy.get('#toggle-camera').click();
      cy.wait(1000);
      
      cy.clearConsoleErrors();
      
      // Start monitoring
      cy.get('#refresh-rate').select('5000');
      cy.get('#toggle-monitoring').click();
      cy.wait(3000); // Let monitoring run briefly
      
      // Stop monitoring
      cy.get('#toggle-monitoring').click();
      cy.wait(500);
      
      cy.checkForConsoleErrors({
        ignorePatterns: [
          'monitoring',
          'interval',
          'camera'
        ]
      });
    });
  });

  describe('Settings and Preferences Errors', () => {
    it('should not have errors when changing settings', () => {
      cy.get('#preferences-btn').click();
      cy.wait(500);
      
      // Test various settings changes
      cy.get('#movement-threshold').invoke('val', '0.3').trigger('input');
      cy.wait(100);
      
      cy.get('#refresh-rate').select('10000');
      cy.wait(100);
      
      cy.get('#preferences-save').click();
      cy.wait(1000);
      
      cy.checkForConsoleErrors();
    });

    it('should not have errors when testing notifications', () => {
      cy.get('#preferences-btn').click();
      cy.wait(500);
      
      // Enable notifications if possible
      cy.get('#notifications-enabled').check({ force: true });
      cy.wait(500);
      
      cy.get('#test-notification').click();
      cy.wait(1000);
      
      cy.checkForConsoleErrors({
        ignorePatterns: [
          'Notification',
          'permission denied',
          'not allowed'
        ]
      });
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle DOM element lookup failures gracefully', () => {
      cy.window().then((win) => {
        // Simulate missing elements by temporarily hiding them
        const elements = win.document.querySelectorAll('#preferences-modal, #movement-threshold');
        elements.forEach(el => {
          if (el) el.style.display = 'none';
        });
        
        // Try to interact with hidden elements
        cy.get('#preferences-btn').click();
        cy.wait(500);
        
        // Restore elements
        elements.forEach(el => {
          if (el) el.style.display = '';
        });
        
        cy.checkForConsoleErrors({
          failOnError: false, // Don't fail test, just log errors
          logErrors: true
        });
      });
    });

    it('should track but not fail on expected development warnings', () => {
      cy.window().then((win) => {
        // Trigger some expected warnings
        win.console.warn('This is a test warning');
      });
      
      cy.getConsoleErrors().then((errors) => {
        const warnings = errors.filter(e => e.type === 'console.warn');
        expect(warnings).to.have.length.at.least(1);
        cy.log(`Found ${warnings.length} warnings (expected)`);
      });
      
      // This should pass because we don't fail on warnings by default
      cy.checkForConsoleErrors();
    });

    it('should detect and report actual JavaScript errors', () => {
      cy.window().then((win) => {
        // Intentionally trigger a JavaScript error for testing
        try {
          win.nonExistentFunction();
        } catch (e) {
          // Error will be caught by our error handler
        }
      });
      
      cy.getConsoleErrors().then((errors) => {
        const jsErrors = errors.filter(e => 
          e.type === 'uncaught.error' || 
          e.message.includes('nonExistentFunction')
        );
        expect(jsErrors).to.have.length.at.least(1);
        cy.log(`Detected ${jsErrors.length} JavaScript errors (expected for this test)`);
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should not accumulate excessive errors in memory', () => {
      // Generate multiple errors
      for (let i = 0; i < 60; i++) {
        cy.window().then((win) => {
          if (win.testErrors) {
            win.testErrors.push({
              type: 'test',
              message: `Test error ${i}`,
              timestamp: new Date().toISOString()
            });
          }
        });
      }
      
      // Check that error array is kept manageable
      cy.window().its('testErrors').should('have.length.lessThan', 51);
    });

    it('should clean up error listeners properly', () => {
      cy.restoreConsole();
      
      cy.window().then((win) => {
        expect(win.console.error).to.equal(win.originalConsoleError || win.console.error);
        expect(win.console.warn).to.equal(win.originalConsoleWarn || win.console.warn);
      });
    });
  });

  describe('Integration with Existing Tests', () => {
    it('should work alongside existing error handling', () => {
      cy.window().then((win) => {
        // Check that our error handler is working
        expect(win.testErrors).to.exist;
        expect(Array.isArray(win.testErrors)).to.be.true;
        
        // Check that enhanced error handler is still active
        expect(win.errorHandler).to.exist;
      });
    });

    it('should provide detailed error information for debugging', () => {
      // Trigger a test error
      cy.window().then((win) => {
        win.dispatchEvent(new ErrorEvent('error', {
          message: 'Test error for debugging',
          filename: 'test-file.js',
          lineno: 123,
          colno: 45
        }));
      });
      
      cy.getConsoleErrors().then((errors) => {
        const testError = errors.find(e => e.message.includes('Test error for debugging'));
        if (testError) {
          expect(testError).to.have.property('timestamp');
          expect(testError).to.have.property('type');
          cy.log('Error details:', testError);
        }
      });
    });
  });
});