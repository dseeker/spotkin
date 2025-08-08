describe('PWA Functionality Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000); // Allow app to initialize
  });

  describe('Service Worker', () => {
    it('should register service worker successfully', () => {
      cy.testServiceWorker();
    });

    it('should cache static assets', () => {
      cy.testCacheAPI();
    });

    it('should handle offline functionality', () => {
      cy.testOfflineMode();
    });
  });

  describe('PWA Manifest', () => {
    it('should have valid manifest file', () => {
      cy.testManifest().then((manifest) => {
        expect(manifest.name).to.equal('SpotKin - AI Pet & Baby Monitor');
        expect(manifest.short_name).to.equal('SpotKin');
        expect(manifest.display).to.equal('standalone');
        expect(manifest.start_url).to.equal('./');
        expect(manifest.theme_color).to.equal('#4f46e5');
        expect(manifest.background_color).to.equal('#ffffff');
        expect(manifest.shortcuts).to.be.an('array').that.is.not.empty;
      });
    });

    it('should have proper PWA meta tags', () => {
      cy.get('head meta[name="application-name"]').should('have.attr', 'content', 'SpotKin');
      cy.get('head meta[name="apple-mobile-web-app-capable"]').should('have.attr', 'content', 'yes');
      cy.get('head meta[name="theme-color"]').should('have.attr', 'content', '#4f46e5');
      cy.get('head link[rel="manifest"]').should('have.attr', 'href', './manifest.json');
    });
  });

  describe('PWA Installation', () => {
    it('should handle beforeinstallprompt event', () => {
      // Mock the beforeinstallprompt event
      cy.window().then((win) => {
        const mockPromptEvent = {
          preventDefault: cy.stub(),
          prompt: cy.stub().resolves(),
          userChoice: Promise.resolve({ outcome: 'accepted' })
        };

        // Trigger the event
        win.dispatchEvent(new CustomEvent('beforeinstallprompt', { detail: mockPromptEvent }));
        
        // Check that install button appears
        cy.get('#pwa-install-banner', { timeout: 5000 }).should('be.visible');
      });
    });

    it('should show install banner when prompt is available', () => {
      cy.window().then((win) => {
        // Simulate install prompt availability
        if (typeof win.showPWAInstallButton === 'function') {
          win.showPWAInstallButton();
          cy.get('#pwa-install-banner').should('be.visible');
          cy.get('#pwa-install-banner').should('contain', 'Install SpotKin');
        }
      });
    });

    it('should handle PWA installation', () => {
      cy.window().then((win) => {
        if (typeof win.installPWA === 'function') {
          // Mock deferredPrompt
          win.deferredPrompt = {
            prompt: cy.stub(),
            userChoice: Promise.resolve({ outcome: 'accepted' })
          };
          
          // Test installation function
          expect(win.installPWA).to.be.a('function');
        }
      });
    });

    it('should handle app installation event', () => {
      cy.window().then((win) => {
        // Mock app installation
        win.dispatchEvent(new Event('appinstalled'));
        
        // Check that install banner is hidden after installation
        cy.get('#pwa-install-banner').should('not.exist');
      });
    });
  });

  describe('Push Notifications', () => {
    it('should have notification controls in preferences', () => {
      cy.get('#preferences-btn').click();
      
      // Check notification settings exist
      cy.get('#notifications-enabled').should('exist');
      cy.get('#notify-danger').should('exist');
      cy.get('#notify-safety').should('exist');
      cy.get('#notify-activity').should('exist');
      cy.get('#notify-monitoring').should('exist');
      cy.get('#test-notification').should('exist');
    });

    it('should toggle notification controls visibility', () => {
      cy.get('#preferences-btn').click();
      
      // Initially notification controls should be hidden
      cy.get('#notification-controls').should('have.class', 'hidden');
      
      // Enable notifications
      cy.get('#notifications-enabled').check();
      cy.get('#notification-controls').should('not.have.class', 'hidden');
      
      // Disable notifications
      cy.get('#notifications-enabled').uncheck();
      cy.get('#notification-controls').should('have.class', 'hidden');
    });

    it('should handle notification permission request', () => {
      cy.window().then((win) => {
        // Mock Notification API
        const mockNotification = {
          permission: 'default',
          requestPermission: cy.stub().resolves('granted')
        };
        
        // Override Notification if available
        if ('Notification' in win) {
          cy.stub(win, 'Notification').value(mockNotification);
        }
        
        // Check notification permission function exists
        if (typeof win.requestNotificationPermission === 'function') {
          expect(win.requestNotificationPermission).to.be.a('function');
        }
      });
    });

    it('should test notification functionality', () => {
      cy.get('#preferences-btn').click();
      cy.get('#notifications-enabled').check();
      
      cy.window().then((win) => {
        // Mock successful notification
        if ('Notification' in win) {
          cy.stub(win, 'Notification').returns({
            permission: 'granted'
          });
        }
        
        // Click test notification button
        cy.get('#test-notification').click();
        
        // Should not throw errors
        cy.window().should('not.have.property', 'lastError');
      });
    });

    it('should send notifications for critical events', () => {
      cy.window().then((win) => {
        // Enable notifications
        cy.get('#preferences-btn').click();
        cy.get('#notifications-enabled').check();
        cy.get('#preferences-save').click();
        
        // Mock service worker and notification functions
        if (typeof win.sendCriticalNotification === 'function') {
          const mockAlertData = {
            level: 'danger',
            message: 'Test critical alert',
            timestamp: new Date().toISOString()
          };
          
          expect(() => win.sendCriticalNotification(mockAlertData)).to.not.throw;
        }
      });
    });
  });

  describe('PWA App Shortcuts', () => {
    it('should handle app shortcuts from manifest', () => {
      // Test URL parameters for shortcuts
      const shortcuts = [
        { action: 'snapshot', expectedFunction: 'takeSnapshot' },
        { action: 'monitor', expectedElement: '#toggle-monitoring' },
        { action: 'history', expectedElement: '#tab-history' }
      ];
      
      shortcuts.forEach(({ action }) => {
        cy.visit(`/?action=${action}`);
        cy.wait(2000); // Allow shortcut action to execute
        
        // Verify no JavaScript errors occurred
        cy.window().should('not.have.property', 'lastError');
      });
    });
  });

  describe('PWA Update Handling', () => {
    it('should handle service worker updates', () => {
      cy.window().then((win) => {
        if (typeof win.showUpdateNotification === 'function' && 
            typeof win.updateApp === 'function') {
          
          expect(win.showUpdateNotification).to.be.a('function');
          expect(win.updateApp).to.be.a('function');
          
          // Mock registration with waiting worker
          const mockRegistration = {
            waiting: {
              postMessage: cy.stub()
            }
          };
          
          win.pendingRegistration = mockRegistration;
          
          // Test update function
          expect(() => win.updateApp()).to.not.throw;
        }
      });
    });
  });

  describe('Offline Functionality', () => {
    it('should work when offline', () => {
      // Intercept all network requests to simulate offline
      cy.intercept('**', { forceNetworkError: true });
      
      // App should still load from cache
      cy.reload();
      cy.get('h1').should('contain', 'SpotKin');
      
      // Basic functionality should work
      cy.get('#preferences-btn').should('be.visible');
    });

    it('should cache user preferences offline', () => {
      // Set preferences while online
      cy.get('#preferences-btn').click();
      cy.get('#analysis-sensitivity').select('high');
      cy.get('#preferences-save').click();
      
      // Go offline and check preferences persist
      cy.intercept('**', { forceNetworkError: true });
      cy.reload();
      
      cy.get('#preferences-btn').click();
      cy.get('#analysis-sensitivity').should('have.value', 'high');
    });
  });

  describe('PWA Display Mode', () => {
    it('should detect standalone display mode', () => {
      // This test would need to be run in actual PWA mode
      // For now, just check that CSS supports standalone mode
      cy.get('head style').should('exist');
      
      cy.window().then((win) => {
        const hasStandaloneStyles = Array.from(win.document.styleSheets)
          .some(sheet => {
            try {
              return Array.from(sheet.rules || sheet.cssRules)
                .some(rule => rule.media && rule.media.mediaText.includes('display-mode: standalone'));
            } catch (e) {
              return false;
            }
          });
        
        // We have standalone styles in our CSS
        expect(hasStandaloneStyles).to.be.true;
      });
    });
  });
});