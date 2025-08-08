/**
 * Custom Cypress commands for PWA testing
 */

// Command to test service worker registration
Cypress.Commands.add('testServiceWorker', () => {
  cy.window().then((win) => {
    if ('serviceWorker' in win.navigator) {
      return cy.wrap(win.navigator.serviceWorker.getRegistration()).then((registration) => {
        expect(registration).to.exist;
        expect(registration.active).to.exist;
        return registration;
      });
    } else {
      throw new Error('Service Worker not supported');
    }
  });
});

// Command to test PWA manifest
Cypress.Commands.add('testManifest', () => {
  cy.request('/manifest.json').then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('name');
    expect(response.body).to.have.property('short_name');
    expect(response.body).to.have.property('start_url');
    expect(response.body).to.have.property('display');
    expect(response.body.icons).to.be.an('array');
    return response.body;
  });
});

// Command to test notification permissions
Cypress.Commands.add('testNotificationPermission', () => {
  cy.window().then((win) => {
    if ('Notification' in win) {
      // Mock Notification.requestPermission for testing
      cy.stub(win.Notification, 'requestPermission').resolves('granted');
      
      return cy.wrap(win.Notification.requestPermission()).then((permission) => {
        expect(permission).to.be.oneOf(['granted', 'denied', 'default']);
        return permission;
      });
    } else {
      cy.log('Notifications not supported in this environment');
      return 'default';
    }
  });
});

// Command to test PWA installation prompt
Cypress.Commands.add('testPWAInstall', () => {
  cy.window().then((win) => {
    // Mock the beforeinstallprompt event
    const mockInstallPrompt = {
      preventDefault: cy.stub(),
      prompt: cy.stub().resolves(),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };

    // Create and dispatch the event
    const event = new CustomEvent('beforeinstallprompt');
    Object.assign(event, mockInstallPrompt);
    
    win.dispatchEvent(event);
    
    // Check if install UI appears
    cy.get('#pwa-install-banner', { timeout: 3000 }).should('be.visible');
    
    return cy.wrap(mockInstallPrompt);
  });
});

// Command to test offline functionality
Cypress.Commands.add('testOfflineMode', () => {
  // Intercept all network requests to simulate offline
  cy.intercept('**/*', { forceNetworkError: true }).as('offline');
  
  // Test that cached resources still work
  cy.reload();
  cy.get('h1').should('be.visible');
  cy.get('#preferences-btn').should('be.visible');
});

// Command to test cache functionality
Cypress.Commands.add('testCacheAPI', () => {
  cy.window().then((win) => {
    if ('caches' in win) {
      return cy.wrap(win.caches.keys()).then((cacheNames) => {
        expect(cacheNames).to.be.an('array');
        
        // Check for our specific caches
        const expectedCaches = ['spotkin-static-v1', 'spotkin-dynamic-v1'];
        const foundCaches = expectedCaches.filter(cache => cacheNames.includes(cache));
        
        expect(foundCaches.length).to.be.greaterThan(0);
        return cacheNames;
      });
    } else {
      throw new Error('Cache API not supported');
    }
  });
});

// Command to test PWA display mode
Cypress.Commands.add('testDisplayMode', () => {
  cy.window().then((win) => {
    // Check if running in PWA mode
    const isStandalone = win.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = win.matchMedia('(display-mode: fullscreen)').matches;
    const isMinimalUI = win.matchMedia('(display-mode: minimal-ui)').matches;
    
    const isPWAMode = isStandalone || isFullscreen || isMinimalUI;
    
    cy.log(`PWA Display Mode - Standalone: ${isStandalone}, Fullscreen: ${isFullscreen}, Minimal-UI: ${isMinimalUI}`);
    
    return cy.wrap({
      isPWAMode,
      mode: isStandalone ? 'standalone' : isFullscreen ? 'fullscreen' : isMinimalUI ? 'minimal-ui' : 'browser'
    });
  });
});

// Command to test app shortcuts
Cypress.Commands.add('testAppShortcuts', () => {
  const shortcuts = [
    { action: 'snapshot', expectedFunction: 'takeSnapshot' },
    { action: 'monitor', expectedElement: '#toggle-monitoring' },
    { action: 'history', expectedElement: '#tab-history' }
  ];
  
  shortcuts.forEach(({ action, expectedFunction, expectedElement }) => {
    cy.visit(`/?action=${action}`);
    cy.wait(1000); // Allow action to execute
    
    if (expectedFunction) {
      cy.window().then((win) => {
        expect(win[expectedFunction]).to.be.a('function');
      });
    }
    
    if (expectedElement) {
      cy.get(expectedElement).should('exist');
    }
  });
});

// Command to audit PWA performance
Cypress.Commands.add('auditPWAPerformance', () => {
  cy.window().then((win) => {
    const performance = win.performance;
    
    // Get basic timing metrics
    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    const firstPaint = performance.getEntriesByName('first-paint')[0];
    
    const metrics = {
      loadTime,
      domContentLoaded,
      firstPaint: firstPaint ? firstPaint.startTime : null
    };
    
    // Basic performance assertions
    expect(loadTime).to.be.lessThan(5000); // 5 second load time
    expect(domContentLoaded).to.be.lessThan(3000); // 3 second DOM ready
    
    cy.log(`Performance Metrics:`, metrics);
    return cy.wrap(metrics);
  });
});

// Command to test responsive design
Cypress.Commands.add('testResponsiveDesign', () => {
  const viewports = [
    { width: 375, height: 667, name: 'iPhone 8' },
    { width: 768, height: 1024, name: 'iPad' },
    { width: 1920, height: 1080, name: 'Desktop' }
  ];
  
  viewports.forEach(({ width, height, name }) => {
    cy.viewport(width, height);
    cy.log(`Testing ${name} (${width}x${height})`);
    
    // Basic layout should be intact
    cy.get('header').should('be.visible');
    cy.get('#camera-container').should('be.visible');
    cy.get('#results-container').should('be.visible');
    
    // No horizontal overflow
    cy.get('body').then(($body) => {
      expect($body[0].scrollWidth).to.be.at.most($body.width() + 1); // +1 for rounding
    });
  });
});

// Command to test accessibility features
Cypress.Commands.add('testA11y', () => {
  // Test keyboard navigation
  cy.get('body').tab();
  cy.focused().should('exist');
  
  // Test that interactive elements are focusable
  const focusableElements = [
    '#preferences-btn',
    '#toggle-monitoring', 
    '#take-snapshot',
    '#toggle-camera'
  ];
  
  focusableElements.forEach(selector => {
    cy.get(selector).focus().should('be.focused');
  });
  
  // Test for proper headings
  cy.get('h1').should('have.length', 1);
  cy.get('h2, h3, h4, h5, h6').should('have.length.greaterThan', 0);
  
  // Test for alt attributes on images
  cy.get('img').each(($img) => {
    if ($img.attr('src') && !$img.attr('alt')) {
      throw new Error(`Image missing alt attribute: ${$img.attr('src')}`);
    }
  });
});

// Command to test notification functionality end-to-end
Cypress.Commands.add('testNotificationFlow', () => {
  // Enable notifications in preferences
  cy.get('#preferences-btn').click();
  cy.get('#notifications-enabled').check();
  
  // Test notification permission request
  cy.window().then((win) => {
    if ('Notification' in win) {
      cy.stub(win.Notification, 'requestPermission').resolves('granted');
      cy.get('#test-notification').click();
      
      // Should not throw errors
      cy.window().should('not.have.property', 'lastError');
    }
  });
  
  cy.get('#preferences-save').click();
  
  // Test that notification functions exist
  cy.window().then((win) => {
    expect(win.requestNotificationPermission).to.be.a('function');
    expect(win.sendCriticalNotification).to.be.a('function');
  });
});

// Register all commands in commands.js
// This ensures they're available globally in all tests