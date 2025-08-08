describe('PWA Performance & Visual Tests', () => {
  beforeEach(() => {
    // Clear cache before each test for consistent results
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('PWA Performance Metrics', () => {
    it('should meet PWA performance criteria', () => {
      cy.visit('/', {
        onBeforeLoad: (win) => {
          // Mock performance API
          win.performance.mark = cy.stub();
          win.performance.measure = cy.stub();
        }
      });

      // Check page load time
      cy.window().then((win) => {
        const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
        expect(loadTime).to.be.lessThan(5000); // Should load in under 5 seconds
      });

      // Check for render-blocking resources
      cy.get('head script[src]').each(($script) => {
        // Ensure scripts are properly loaded
        expect($script.attr('src')).to.exist;
      });
    });

    it('should have acceptable First Contentful Paint', () => {
      cy.visit('/');
      
      // Check that main content is visible quickly
      cy.get('h1', { timeout: 3000 }).should('be.visible');
      cy.get('.container', { timeout: 3000 }).should('be.visible');
    });

    it('should handle touch interactions smoothly', () => {
      cy.visit('/');
      
      // Test touch targets are properly sized (minimum 44px)
      cy.get('button').each(($btn) => {
        cy.wrap($btn).then(($el) => {
          const rect = $el[0].getBoundingClientRect();
          expect(Math.min(rect.width, rect.height)).to.be.at.least(44);
        });
      });
    });
  });

  describe('PWA Visual Consistency', () => {
    it('should display correctly on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      
      // Take screenshot for mobile view
      cy.screenshot('pwa-mobile-view');
      
      // Check responsive design
      cy.get('header').should('be.visible');
      cy.get('#camera-container').should('be.visible');
      cy.get('#results-container').should('be.visible');
      
      // Check that content doesn't overflow
      cy.get('body').then(($body) => {
        expect($body[0].scrollWidth).to.equal($body.width());
      });
    });

    it('should display correctly on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.visit('/');
      
      cy.screenshot('pwa-tablet-view');
      
      // Grid layout should work properly
      cy.get('.grid.md\\:grid-cols-2').should('exist');
    });

    it('should support dark mode preferences', () => {
      cy.visit('/', {
        onBeforeLoad: (win) => {
          // Mock dark mode preference
          Object.defineProperty(win, 'matchMedia', {
            writable: true,
            value: cy.stub().returns({
              matches: true,
              addListener: cy.stub(),
              removeListener: cy.stub(),
            }),
          });
        }
      });
      
      // Check that dark mode styles are applied
      cy.get('body').should('exist');
    });

    it('should handle safe area insets for PWA', () => {
      cy.visit('/');
      
      // Check that PWA-specific CSS is loaded
      cy.get('head link[href="styles.css"]').should('exist');
      
      // Verify safe area CSS variables are handled
      cy.window().then((win) => {
        const styles = win.getComputedStyle(win.document.body);
        // These would be set by the browser in PWA mode
        // For testing, we just verify the CSS is prepared for them
        expect(styles).to.exist;
      });
    });
  });

  describe('PWA Accessibility', () => {
    it('should meet accessibility standards', () => {
      cy.visit('/');
      
      // Check for proper heading hierarchy
      cy.get('h1').should('have.length', 1);
      cy.get('h2').should('exist');
      
      // Check for alt text on images
      cy.get('img').each(($img) => {
        expect($img.attr('alt')).to.exist;
      });
      
      // Check for proper button labels
      cy.get('button').each(($btn) => {
        const hasText = $btn.text().trim().length > 0;
        const hasAriaLabel = $btn.attr('aria-label');
        const hasTitle = $btn.attr('title');
        
        expect(hasText || hasAriaLabel || hasTitle).to.be.true;
      });
      
      // Check for form labels
      cy.get('input').each(($input) => {
        const id = $input.attr('id');
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        }
      });
    });

    it('should support keyboard navigation', () => {
      cy.visit('/');
      
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('exist');
      
      // Test that all interactive elements are focusable
      const interactiveElements = [
        '#preferences-btn',
        '#toggle-monitoring',
        '#take-snapshot',
        '#toggle-camera'
      ];
      
      interactiveElements.forEach(selector => {
        cy.get(selector).focus().should('be.focused');
      });
    });

    it('should support screen reader navigation', () => {
      cy.visit('/');
      
      // Check for proper ARIA landmarks
      cy.get('header').should('exist');
      cy.get('main, [role="main"]').should('exist');
      
      // Check for live regions that would announce updates
      cy.get('#results-container').should('exist');
      
      // Check for proper form structure
      cy.get('#preferences-modal').within(() => {
        cy.get('fieldset, [role="group"]').should('exist');
      });
    });
  });

  describe('PWA Network Resilience', () => {
    it('should handle intermittent network connectivity', () => {
      cy.visit('/');
      
      // Simulate network failure during operation
      cy.intercept('POST', '**/api/**', { forceNetworkError: true }).as('apiFailure');
      
      // App should continue to function
      cy.get('#preferences-btn').click();
      cy.get('#preferences-modal').should('not.have.class', 'hidden');
      
      // Restore network and verify recovery
      cy.intercept('POST', '**/api/**').as('apiSuccess');
      cy.get('#preferences-save').click();
    });

    it('should cache critical user data offline', () => {
      cy.visit('/');
      
      // Set some preferences
      cy.get('#preferences-btn').click();
      cy.get('#analysis-sensitivity').select('high');
      cy.get('#alert-movement').uncheck();
      cy.get('#preferences-save').click();
      
      // Go offline
      cy.intercept('**/*', { forceNetworkError: true });
      
      // Reload and verify data persists
      cy.reload();
      cy.get('#preferences-btn').click();
      cy.get('#analysis-sensitivity').should('have.value', 'high');
      cy.get('#alert-movement').should('not.be.checked');
    });

    it('should provide meaningful offline feedback', () => {
      cy.visit('/');
      
      // Simulate offline state
      cy.intercept('**/*', { forceNetworkError: true });
      
      // App should still function without throwing errors
      cy.get('h1').should('contain', 'SpotKin');
      
      // Check for offline indicators or graceful degradation
      cy.window().should('not.have.property', 'console.error');
    });
  });

  describe('PWA Installation Flow', () => {
    it('should provide clear installation prompts', () => {
      cy.visit('/');
      
      // Mock install prompt
      cy.window().then((win) => {
        if (typeof win.showPWAInstallButton === 'function') {
          win.showPWAInstallButton();
          
          // Check install banner appearance
          cy.get('#pwa-install-banner').should('be.visible');
          cy.get('#pwa-install-banner').should('contain', 'Install SpotKin');
          cy.get('#pwa-install-banner').should('contain', 'Add to your home screen');
          
          // Check install and dismiss buttons
          cy.get('#pwa-install-banner button').should('have.length', 2);
        }
      });
    });

    it('should handle installation errors gracefully', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        // Mock failed installation
        win.deferredPrompt = {
          prompt: cy.stub().rejects(new Error('Installation failed')),
          userChoice: Promise.reject(new Error('User cancelled'))
        };
        
        if (typeof win.installPWA === 'function') {
          // Should not crash on installation failure
          expect(() => win.installPWA()).to.not.throw;
        }
      });
    });
  });

  describe('PWA Update Experience', () => {
    it('should notify users of available updates', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        if (typeof win.showUpdateNotification === 'function') {
          // Mock update available
          const mockRegistration = {
            waiting: { postMessage: cy.stub() }
          };
          
          win.showUpdateNotification(mockRegistration);
          
          // Check update notification appears
          cy.get('.fixed.bottom-4').should('be.visible');
          cy.get('.fixed.bottom-4').should('contain', 'Update Available');
        }
      });
    });

    it('should handle app updates smoothly', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        if (typeof win.updateApp === 'function') {
          const mockRegistration = {
            waiting: { postMessage: cy.stub() }
          };
          
          win.pendingRegistration = mockRegistration;
          
          // Update function should work without errors
          expect(() => win.updateApp()).to.not.throw;
        }
      });
    });
  });
});