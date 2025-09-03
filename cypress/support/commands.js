Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

// ***********************************************
// Custom commands for SpotKin E2E testing
// ***********************************************

// Custom command for keyboard navigation
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', { keyCode: 9 });
});

// Custom command to wait for AI analysis to complete
Cypress.Commands.add('waitForAIAnalysis', (timeout = 5000) => {
  cy.get('#results-placeholder', { timeout }).should('not.contain.text', 'Analyzing');
  cy.get('#analysis-results', { timeout }).should('not.have.class', 'hidden');
});

// Custom command to trigger camera snapshot with AI analysis
Cypress.Commands.add('takeSnapshotAndAnalyze', () => {
  cy.get('#take-snapshot').click();
  cy.get('#results-placeholder').should('contain.text', 'Analyzing');
  cy.waitForAIAnalysis();
});

// Custom command to start monitoring mode
Cypress.Commands.add('startMonitoring', (refreshRate = '10000') => {
  cy.get('#refresh-rate').select(refreshRate);
  cy.get('#toggle-monitoring').should('contain.text', 'Start Monitoring').click();
  cy.get('#toggle-monitoring').should('contain.text', 'Stop Monitoring');
  cy.get('#camera-container').should('have.class', 'camera-active');
});

// Custom command to stop monitoring mode
Cypress.Commands.add('stopMonitoring', () => {
  cy.get('#toggle-monitoring').should('contain.text', 'Stop Monitoring').click();
  cy.get('#toggle-monitoring').should('contain.text', 'Start Monitoring');
  cy.get('#camera-container').should('not.have.class', 'camera-active');
});

// Custom command to verify temporal analysis indicators
Cypress.Commands.add('verifyTemporalAnalysis', () => {
  cy.get('#scene-text').should('not.be.empty').then(($text) => {
    const text = $text.text();
    expect(text).to.match(/🔄|📷/); // Should contain movement or stable scene icon
  });
});

// Custom command to check AI analysis results structure
Cypress.Commands.add('verifyAnalysisResults', () => {
  cy.get('#analysis-results').should('not.have.class', 'hidden');
  cy.get('#scene-description').should('be.visible');
  cy.get('#detection-results').should('be.visible');
  cy.get('#safety-assessment-display').should('be.visible');
  cy.get('#scene-text').should('not.be.empty');
});

// Custom command to create history entries
Cypress.Commands.add('createHistoryEntries', (count = 3) => {
  for (let i = 0; i < count; i++) {
    cy.takeSnapshotAndAnalyze();
    cy.wait(500); // Brief pause between snapshots
  }
});

// Custom command to verify history tab functionality
Cypress.Commands.add('verifyHistoryTab', () => {
  cy.get('#tab-history').click();
  cy.get('#history-tab').should('not.have.class', 'hidden');
  cy.get('#current-tab').should('have.class', 'hidden');
});

// Custom command for visual regression testing
Cypress.Commands.add('visualSnapshot', (name, options = {}) => {
  const defaultOptions = {
    capture: 'viewport',
    overwrite: true,
    ...options
  };
  cy.screenshot(name, defaultOptions);
});

// Custom command to test responsive design
Cypress.Commands.add('testResponsiveLayout', (testName) => {
  const viewports = [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height);
    cy.wait(500); // Allow layout to settle
    cy.visualSnapshot(`${testName}-${viewport.name}`);
  });

  // Reset to default
  cy.viewport(1280, 720);
});

// Custom command to simulate camera errors
Cypress.Commands.add('simulateCameraError', (errorMessage = 'Mock camera error for testing') => {
  cy.window().then((win) => {
    const cameraFeedback = win.document.getElementById('camera-feedback');
    if (cameraFeedback) {
      cameraFeedback.innerHTML = `
        <div class="bg-red-50 text-red-900 px-3 py-1 rounded-full text-sm">
          <i class="fas fa-exclamation-circle mr-1"></i>Camera error: ${errorMessage}
        </div>
      `;
    }
  });
});

// Custom command to simulate AI errors
Cypress.Commands.add('simulateAIError', () => {
  cy.window().then((win) => {
    if (win.puter && win.puter.ai) {
      win.puter.ai.chat = () => Promise.reject(new Error('Mock AI Error'));
    }
  });
});

// Custom command to restore normal AI functionality
Cypress.Commands.add('restoreAI', () => {
  cy.window().then((win) => {
    // This would restore the original mock AI functionality
    // The actual restoration logic would depend on how the mock is implemented
    win.location.reload();
  });
});

// Custom command to check accessibility
Cypress.Commands.add('checkA11y', (selector = null) => {
  // Basic accessibility checks
  if (selector) {
    cy.get(selector).should('be.visible');
  }
  
  // Check for semantic HTML elements
  cy.get('main, section, header, footer').should('exist');
  
  // Check for proper heading hierarchy (basic)
  cy.get('h1').should('exist');
  
  // Check for alt text on images
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });
});

// Custom command to test keyboard navigation
Cypress.Commands.add('testKeyboardNavigation', () => {
  const focusableElements = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];

  cy.get(focusableElements.join(', ')).each(($el, index) => {
    cy.wrap($el).focus().should('be.focused');
  });
});

// Import PWA-specific commands
import './pwa-commands.js';

// Import test helper commands
import './test-helpers.js';

// ***********************************************
// Console Error Detection Commands
// ***********************************************

// Command to set up console error monitoring
Cypress.Commands.add('startConsoleErrorDetection', () => {
  cy.window().then((win) => {
    // Initialize error collection array
    win.cypressConsoleErrors = [];
    
    // Store original console methods
    win.originalConsoleError = win.console.error;
    win.originalConsoleWarn = win.console.warn;
    
    // Override console.error to capture errors
    win.console.error = (...args) => {
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      win.cypressConsoleErrors.push({
        type: 'console.error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
      
      // Still call original method for debugging
      win.originalConsoleError.apply(win.console, args);
    };
    
    // Override console.warn for warnings (optional)
    win.console.warn = (...args) => {
      const warnMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      win.cypressConsoleErrors.push({
        type: 'console.warn',
        message: warnMessage,
        timestamp: new Date().toISOString()
      });
      
      win.originalConsoleWarn.apply(win.console, args);
    };
    
    // Capture uncaught JavaScript errors
    win.addEventListener('error', (event) => {
      win.cypressConsoleErrors.push({
        type: 'uncaught.error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Capture unhandled promise rejections
    win.addEventListener('unhandledrejection', (event) => {
      win.cypressConsoleErrors.push({
        type: 'unhandled.rejection',
        message: event.reason?.message || String(event.reason),
        timestamp: new Date().toISOString()
      });
    });
  });
});

// Command to check for console errors and fail test if found
Cypress.Commands.add('checkForConsoleErrors', (options = {}) => {
  const { 
    failOnError = true, 
    failOnWarning = false,
    ignorePatterns = [],
    logErrors = true 
  } = options;
  
  cy.window().then((win) => {
    const errors = win.cypressConsoleErrors || [];
    
    // Filter errors based on options
    const filteredErrors = errors.filter(error => {
      // Skip warnings if not configured to fail on them
      if (!failOnWarning && error.type === 'console.warn') return false;
      
      // Skip errors matching ignore patterns
      return !ignorePatterns.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(error.message);
        }
        return error.message.includes(pattern);
      });
    });
    
    if (logErrors && filteredErrors.length > 0) {
      cy.log(`🚨 Console Errors Found (${filteredErrors.length}):`);
      filteredErrors.forEach((error, index) => {
        cy.log(`${index + 1}. ${error.type}: ${error.message}`);
      });
    }
    
    if (failOnError && filteredErrors.length > 0) {
      const errorSummary = filteredErrors.map(e => 
        `[${e.type}] ${e.message}`
      ).join('\n');
      
      throw new Error(`Console errors detected:\n${errorSummary}`);
    }
    
    return filteredErrors;
  });
});

// Command to clear collected console errors
Cypress.Commands.add('clearConsoleErrors', () => {
  cy.window().then((win) => {
    if (win.cypressConsoleErrors) {
      win.cypressConsoleErrors.length = 0;
    }
  });
});

// Command to restore original console methods
Cypress.Commands.add('restoreConsole', () => {
  cy.window().then((win) => {
    if (win.originalConsoleError) {
      win.console.error = win.originalConsoleError;
    }
    if (win.originalConsoleWarn) {
      win.console.warn = win.originalConsoleWarn;
    }
  });
});

// Command to get current console errors without failing
Cypress.Commands.add('getConsoleErrors', () => {
  return cy.window().then((win) => {
    return win.cypressConsoleErrors || [];
  });
});