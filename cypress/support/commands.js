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
        <div class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
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