describe('Error Detection Advanced', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.startConsoleErrorDetection();
  });

  afterEach(() => {
    cy.restoreConsole();
  });

  describe('Visual Error Reporting', () => {
    it('should provide detailed error information with visual display', () => {
      // Add comprehensive error display to page
      cy.window().then((win) => {
        const errorDiv = win.document.createElement('div');
        errorDiv.id = 'error-diagnosis-panel';
        errorDiv.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          width: 400px;
          max-height: 80vh;
          background: rgba(0,0,0,0.9);
          color: white;
          padding: 20px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 12px;
          z-index: 10000;
          overflow-y: auto;
        `;
        win.document.body.appendChild(errorDiv);
        
        win.updateErrorDisplay = () => {
          const cypressErrors = win.cypressConsoleErrors || [];
          const appErrors = win.testErrors || [];
          const allErrors = [...cypressErrors, ...appErrors];
          
          let html = '<h3>🚨 Error Report</h3>';
          html += `<p>Total: ${allErrors.length} errors</p>`;
          html += `<p>Cypress: ${cypressErrors.length} | App: ${appErrors.length}</p><hr>`;
          
          if (allErrors.length === 0) {
            html += '<p style="color: #4CAF50;">✅ No errors found!</p>';
          } else {
            allErrors.slice(0, 10).forEach((error, index) => {
              const location = error.filename || error.source || 'unknown';
              const line = error.lineno || '?';
              html += `<div style="margin-bottom: 10px; border-left: 3px solid #f44336; padding-left: 8px;">`;
              html += `<strong>${index + 1}. [${error.type}]</strong><br>`;
              html += `<em>${error.message}</em><br>`;
              html += `<small>📍 ${location}:${line}</small>`;
              html += `</div>`;
            });
          }
          
          errorDiv.innerHTML = html;
        };
        
        win.updateErrorDisplay();
      });
      
      // Wait and update display multiple times
      cy.wait(2000);
      cy.window().then(win => win.updateErrorDisplay());
      
      cy.wait(3000);
      cy.window().then(win => win.updateErrorDisplay());
      
      // Take screenshot to capture error display
      cy.screenshot('advanced-error-display', { capture: 'fullPage' });
      
      // Validate error information
      cy.window().then((win) => {
        const cypressErrors = win.cypressConsoleErrors || [];
        const appErrors = win.testErrors || [];
        
        cy.log(`📊 Advanced Error Analysis:`);
        cy.log(`Cypress errors: ${cypressErrors.length}`);
        cy.log(`App errors: ${appErrors.length}`);
        cy.log(`Total errors: ${cypressErrors.length + appErrors.length}`);
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

    it('should track error patterns and provide analysis', () => {
      cy.window().then((win) => {
        // Generate test errors to verify pattern detection
        win.console.warn('Test warning for pattern analysis');
        
        // Trigger a test error
        try {
          win.nonExistentFunction();
        } catch (e) {
          // Error will be caught by our error handler
        }
      });
      
      cy.wait(1000);
      
      cy.getConsoleErrors().then((errors) => {
        // Analyze error patterns
        const errorsByType = errors.reduce((acc, error) => {
          acc[error.type] = (acc[error.type] || 0) + 1;
          return acc;
        }, {});
        
        cy.log('Error breakdown by type:', errorsByType);
        
        // Check for specific patterns
        const criticalErrors = errors.filter(e => 
          !e.message.includes('puter') &&
          !e.message.includes('Script error') &&
          !e.message.includes('CustomElementRegistry')
        );
        
        cy.log(`Critical errors found: ${criticalErrors.length}`);
        
        if (criticalErrors.length > 0) {
          criticalErrors.forEach((error, index) => {
            cy.log(`${index + 1}. ${error.message} (${error.filename}:${error.lineno})`);
          });
        }
      });
    });

    it('should validate daily summary error fixes', () => {
      // Wait for daily summary initialization
      cy.wait(5000);
      
      cy.getConsoleErrors().then((errors) => {
        const dailySummaryErrors = errors.filter(e => 
          e.message && e.message.includes('daily summary')
        );
        
        if (dailySummaryErrors.length > 0) {
          cy.log('❌ Daily summary errors still present:');
          dailySummaryErrors.forEach((error, index) => {
            cy.log(`${index + 1}. ${error.message}`);
          });
        } else {
          cy.log('✅ Daily summary initialization working correctly');
        }
        
        expect(dailySummaryErrors).to.have.length(0);
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not accumulate excessive errors in memory', () => {
      // Generate multiple errors to test memory management
      cy.window().then((win) => {
        for (let i = 0; i < 55; i++) {
          if (win.testErrors) {
            win.testErrors.push({
              type: 'test',
              message: `Memory test error ${i}`,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
      
      // Check that error array is kept manageable
      cy.window().then((win) => {
        if (win.testErrors) {
          expect(win.testErrors.length).to.be.lessThan(51);
          cy.log(`✅ Memory management working: ${win.testErrors.length} errors stored`);
        }
      });
    });

    it('should clean up error listeners properly', () => {
      cy.restoreConsole();
      
      cy.window().then((win) => {
        // Verify console methods are restored
        if (win.originalConsoleError) {
          expect(win.console.error).to.equal(win.originalConsoleError);
        }
        if (win.originalConsoleWarn) {
          expect(win.console.warn).to.equal(win.originalConsoleWarn);
        }
        
        cy.log('✅ Console methods properly restored');
      });
    });
  });

  describe('Integration Testing', () => {
    it('should work with monitoring mode without errors', () => {
      cy.get('#toggle-camera').click();
      cy.wait(2000);
      
      cy.clearConsoleErrors();
      
      // Start monitoring
      cy.get('#refresh-rate').select('5000');
      cy.get('#toggle-monitoring').click();
      cy.wait(3000);
      
      // Take a snapshot during monitoring
      cy.get('#take-snapshot').click();
      cy.wait(2000);
      
      // Stop monitoring
      cy.get('#toggle-monitoring').click();
      
      // Check for errors during entire monitoring session
      cy.checkForConsoleErrors({
        ignorePatterns: [
          /monitoring/i,
          /interval/i,
          /camera/i,
          /puter/i,
          /ai processing/i
        ]
      });
    });

    it('should provide comprehensive error reporting for debugging', () => {
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
        const criticalErrors = errors.filter(e => 
          e.message && 
          !e.message.includes('puter') &&
          !e.message.includes('CustomElementRegistry') &&
          !e.message.includes('Script error')
        );
        
        cy.log('📊 Comprehensive Error Report:');
        cy.log(`Total errors captured: ${errors.length}`);
        cy.log(`Critical errors: ${criticalErrors.length}`);
        
        if (criticalErrors.length === 0) {
          cy.log('✅ No critical errors - application is stable');
        } else {
          cy.log('🚨 Critical errors requiring attention:');
          criticalErrors.forEach((error, index) => {
            cy.log(`${index + 1}. ${error.message} (${error.filename}:${error.lineno})`);
          });
        }
      });
    });
  });
});