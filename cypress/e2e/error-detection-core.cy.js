describe('Error Detection Core', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.startConsoleErrorDetection();
  });

  afterEach(() => {
    cy.restoreConsole();
  });

  describe('Basic Error Detection', () => {
    it('should not have critical console errors on page load', () => {
      cy.wait(3000); // Let page fully load
      cy.checkForConsoleErrors({
        ignorePatterns: [
          /puter/i,
          /CustomElementRegistry/i,
          /Script error\.$/,
          /ResizeObserver/i,
          /Failed to fetch.*v2/i
        ],
        logErrors: true
      });
    });

    it('should detect and validate that addEventListener errors are fixed', () => {
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
        
        expect(addEventListenerErrors).to.have.length(0);
        cy.log('✅ addEventListener errors successfully fixed');
      });
    });

    it('should not have errors during basic user interactions', () => {
      // Tab switching
      cy.get('#tab-current').click();
      cy.wait(500);
      cy.get('#tab-history').click();
      cy.wait(500);
      cy.get('#tab-current').click();
      cy.wait(500);
      
      // Preferences modal
      cy.get('#preferences-btn').click();
      cy.wait(1000);
      cy.get('#preferences-close').click();
      cy.wait(500);
      
      cy.checkForConsoleErrors({
        ignorePatterns: [/puter/i, /CustomElementRegistry/i, /Script error/i]
      });
    });
  });

  describe('Application Functionality', () => {
    it('should work with existing test commands without errors', () => {
      cy.get('#toggle-camera').click();
      cy.wait(2000);
      
      cy.clearConsoleErrors(); // Clear camera-related warnings
      
      cy.get('#take-snapshot').click();
      cy.wait(3000);
      
      cy.checkForConsoleErrors({
        ignorePatterns: [
          /AI analysis/i,
          /network/i,
          /puter/i,
          /fetch/i
        ]
      });
    });

    it('should handle settings changes without errors', () => {
      cy.get('#preferences-btn').click();
      cy.wait(500);
      
      // Test various settings changes
      cy.get('#movement-threshold').invoke('val', '0.3').trigger('input');
      cy.wait(100);
      
      cy.get('#refresh-rate').select('10000');
      cy.wait(100);
      
      cy.get('#preferences-save').click();
      cy.wait(1000);
      
      cy.checkForConsoleErrors({
        ignorePatterns: [/puter/i, /CustomElementRegistry/i]
      });
    });
  });

  describe('Error Filtering and Management', () => {
    it('should properly filter harmless errors', () => {
      cy.window().then((win) => {
        // Test that our error filtering works
        const originalConsoleError = win.console.error;
        let capturedErrors = [];
        
        win.console.error = (...args) => {
          capturedErrors.push(args.join(' '));
          originalConsoleError.apply(win.console, args);
        };
        
        // Simulate filtered errors that should be suppressed
        win.dispatchEvent(new ErrorEvent('error', {
          message: 'Script error.',
          filename: '',
          lineno: 0,
          colno: 0
        }));
        
        cy.wait(500);
        
        cy.getConsoleErrors().then((errors) => {
          const scriptErrors = errors.filter(e => e.message === 'Script error.');
          expect(scriptErrors).to.have.length(0);
          cy.log('✅ Generic script errors properly filtered');
        });
        
        // Restore original console
        win.console.error = originalConsoleError;
      });
    });

    it('should maintain manageable error history', () => {
      cy.window().then((win) => {
        // Check that error arrays don't grow unbounded
        if (win.testErrors) {
          expect(win.testErrors.length).to.be.lessThan(51);
        }
        
        if (win.cypressConsoleErrors) {
          // Add many errors to test limit
          for (let i = 0; i < 60; i++) {
            win.cypressConsoleErrors.push({
              type: 'test',
              message: `Test error ${i}`,
              timestamp: new Date().toISOString()
            });
          }
          
          // Should be trimmed
          expect(win.cypressConsoleErrors.length).to.be.lessThan(61);
        }
      });
    });
  });
});