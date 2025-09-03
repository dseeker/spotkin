describe('Error Detection Validation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.startConsoleErrorDetection();
  });

  afterEach(() => {
    cy.restoreConsole();
  });

  describe('CI/CD Integration', () => {
    it('should pass CI/CD error validation requirements', () => {
      // Extended wait for full page load
      cy.wait(5000);
      
      // Basic functionality test for CI/CD
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
          /Failed to fetch.*v2/i,
          /Load failed/i,
          /Warning:/i
        ],
        logErrors: true
      });
      
      cy.log('✅ CI/CD Error Detection Test Passed');
    });

    it('should provide error metrics for monitoring', () => {
      cy.wait(3000);
      
      cy.getConsoleErrors().then((cypressErrors) => {
        cy.window().then((win) => {
          const appErrors = win.testErrors || [];
          const allErrors = [...cypressErrors, ...appErrors];
          
          // Generate metrics report
          const metrics = {
            timestamp: new Date().toISOString(),
            totalErrors: allErrors.length,
            cypressErrors: cypressErrors.length,
            appErrors: appErrors.length,
            criticalErrors: allErrors.filter(e => 
              !e.message.includes('puter') &&
              !e.message.includes('Script error') &&
              !e.message.includes('CustomElementRegistry')
            ).length,
            errorRate: allErrors.length / (Date.now() / 1000), // errors per second
            browserInfo: navigator.userAgent
          };
          
          // Store metrics for reporting
          win.errorMetrics = metrics;
          
          cy.log('📊 Error Metrics Generated:');
          cy.log(`Total Errors: ${metrics.totalErrors}`);
          cy.log(`Critical Errors: ${metrics.criticalErrors}`);
          cy.log(`Error Rate: ${metrics.errorRate.toFixed(4)} errors/sec`);
          
          // Assert acceptable error levels for CI/CD
          expect(metrics.criticalErrors).to.equal(0);
          expect(metrics.totalErrors).to.be.lessThan(10);
        });
      });
    });
  });

  describe('Final Validation', () => {
    it('should confirm all critical errors are resolved', () => {
      // Extended wait and interaction testing
      cy.wait(3000);
      
      // Test various interactions to trigger any remaining errors
      cy.get('#tab-history').click();
      cy.wait(500);
      cy.get('#tab-current').click();
      cy.wait(500);
      
      // Test camera toggle if available
      cy.get('#toggle-camera').click();
      cy.wait(2000);
      
      // Test preferences
      cy.get('#preferences-btn').click();
      cy.wait(1000);
      cy.get('#movement-threshold').invoke('val', '0.5').trigger('input');
      cy.wait(500);
      cy.get('#preferences-close').click();
      cy.wait(500);
      
      // Final comprehensive error assessment
      cy.getConsoleErrors().then((cypressErrors) => {
        cy.window().then((win) => {
          const appErrors = win.testErrors || [];
          const allErrors = [...cypressErrors, ...appErrors];
          
          // Analyze error types
          const criticalErrors = allErrors.filter(e => 
            e.message && 
            !e.message.includes('Script error') &&
            !e.message.toLowerCase().includes('puter') &&
            !e.message.includes('CustomElementRegistry') &&
            !e.message.includes('ResizeObserver') &&
            !e.message.includes('load failed') &&
            !e.message.includes('network error')
          );
          
          const addEventListenerErrors = allErrors.filter(e => 
            e.message && e.message.includes('addEventListener')
          );
          
          const dailySummaryErrors = allErrors.filter(e => 
            e.message && e.message.includes('initialize daily summary')
          );
          
          // Log comprehensive results
          cy.log('🎯 FINAL VALIDATION RESULTS:');
          cy.log(`Total errors: ${allErrors.length}`);
          cy.log(`Critical errors: ${criticalErrors.length}`);
          cy.log(`addEventListener errors: ${addEventListenerErrors.length}`);
          cy.log(`Daily summary errors: ${dailySummaryErrors.length}`);
          
          // Specific validations for our fixes
          expect(addEventListenerErrors, 'addEventListener errors should be fixed').to.have.length(0);
          expect(dailySummaryErrors, 'Daily summary errors should be fixed').to.have.length(0);
          expect(criticalErrors, 'No critical errors should remain').to.have.length(0);
          
          if (criticalErrors.length === 0) {
            cy.log('🎉 SUCCESS: All critical errors have been resolved!');
          }
        });
      });
      
      // Take final validation screenshot
      cy.screenshot('final-error-validation-complete');
    });

    it('should demonstrate error detection system functionality', () => {
      // Show that the system works by detecting intentional errors
      cy.window().then((win) => {
        // Clear existing errors
        if (win.cypressConsoleErrors) {
          win.cypressConsoleErrors.length = 0;
        }
        if (win.testErrors) {
          win.testErrors.length = 0;
        }
      });
      
      cy.wait(1000);
      
      // Trigger intentional test errors
      cy.window().then((win) => {
        // This should be detected by our system
        win.console.error('TEST ERROR: Intentional error for validation');
        
        // This should be filtered out
        win.dispatchEvent(new ErrorEvent('error', {
          message: 'Script error.',
          filename: '',
          lineno: 0,
          colno: 0
        }));
      });
      
      cy.wait(1000);
      
      cy.getConsoleErrors().then((errors) => {
        const testErrors = errors.filter(e => e.message.includes('TEST ERROR'));
        const filteredErrors = errors.filter(e => e.message === 'Script error.');
        
        // Should detect intentional error
        expect(testErrors).to.have.length.at.least(1);
        
        // Should filter generic script error
        expect(filteredErrors).to.have.length(0);
        
        cy.log('✅ Error detection system working correctly');
        cy.log(`Detected intentional errors: ${testErrors.length}`);
        cy.log(`Filtered script errors: ${filteredErrors.length}`);
      });
    });

    it('should validate system performance under load', () => {
      // Generate multiple rapid interactions to test stability
      for (let i = 0; i < 5; i++) {
        cy.get('#tab-current').click();
        cy.wait(100);
        cy.get('#tab-history').click();
        cy.wait(100);
      }
      
      // Rapid preference modal toggles
      for (let i = 0; i < 3; i++) {
        cy.get('#preferences-btn').click();
        cy.wait(200);
        cy.get('#preferences-close').click();
        cy.wait(200);
      }
      
      // Check system stability
      cy.getConsoleErrors().then((errors) => {
        const stressTestErrors = errors.filter(e => 
          e.message && 
          !e.message.includes('puter') &&
          !e.message.includes('Script error') &&
          !e.message.includes('CustomElementRegistry')
        );
        
        expect(stressTestErrors).to.have.length(0);
        cy.log(`✅ System stable under load: ${errors.length} total errors, ${stressTestErrors.length} critical`);
      });
    });
  });

  describe('Production Readiness', () => {
    it('should meet production error standards', () => {
      // Simulate production-like usage
      cy.wait(4000); // Full initialization
      
      // Standard user workflow
      cy.get('#preferences-btn').click();
      cy.wait(1000);
      cy.get('#refresh-rate').select('5000');
      cy.get('#movement-threshold').invoke('val', '0.4').trigger('input');
      cy.get('#notifications-enabled').check({ force: true });
      cy.get('#preferences-save').click();
      cy.wait(1000);
      
      // Check production error standards
      cy.checkForConsoleErrors({
        failOnError: true,
        failOnWarning: false,
        ignorePatterns: [
          /puter/i,
          /CustomElementRegistry/i,
          /Script error\.$/,
          /ResizeObserver/i,
          /Failed to fetch.*puter/i,
          /NotAllowedError/i // Camera/notification permissions
        ]
      });
      
      cy.log('✅ Production error standards met');
    });

    it('should provide deployment confidence metrics', () => {
      cy.wait(3000);
      
      cy.getConsoleErrors().then((errors) => {
        const deploymentMetrics = {
          totalErrors: errors.length,
          criticalErrors: errors.filter(e => 
            !e.message.includes('puter') &&
            !e.message.includes('Script error') &&
            !e.message.includes('CustomElementRegistry')
          ).length,
          knownIssues: errors.filter(e => 
            e.message.includes('puter') ||
            e.message.includes('CustomElementRegistry')
          ).length,
          deploymentReady: true
        };
        
        deploymentMetrics.deploymentReady = deploymentMetrics.criticalErrors === 0;
        
        cy.log('🚀 Deployment Readiness Report:');
        cy.log(`Critical Errors: ${deploymentMetrics.criticalErrors}`);
        cy.log(`Known Non-Critical Issues: ${deploymentMetrics.knownIssues}`);
        cy.log(`Deployment Ready: ${deploymentMetrics.deploymentReady ? 'YES ✅' : 'NO ❌'}`);
        
        expect(deploymentMetrics.deploymentReady).to.be.true;
        expect(deploymentMetrics.criticalErrors).to.equal(0);
      });
    });
  });
});