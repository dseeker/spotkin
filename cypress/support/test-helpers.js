// Test helper functions for SpotKin

/**
 * Open preferences modal with proper error handling and retries
 */
Cypress.Commands.add('openPreferences', () => {
  cy.viewport(1280, 720);
  cy.scrollTo('top');
  cy.wait(500);
  
  // Ensure app is fully loaded before attempting to open preferences
  cy.get('#preferences-btn')
    .should('exist')
    .and('be.visible')
    .scrollIntoView()
    .wait(1000); // Longer wait for stability
  
  // Try multiple click strategies
  cy.get('#preferences-btn').then($btn => {
    if ($btn.is(':visible')) {
      cy.wrap($btn).click();
    } else {
      cy.wrap($btn).click({ force: true });
    }
  });
    
  // Wait for modal to be fully visible with increased timeout
  cy.get('#preferences-modal', { timeout: 15000 })
    .should('exist')
    .and('not.have.class', 'hidden');
    
  // Additional wait for modal content to be ready
  cy.get('#analysis-sensitivity', { timeout: 10000 })
    .should('exist');
});

/**
 * Close preferences modal
 */
Cypress.Commands.add('closePreferences', () => {
  cy.get('#preferences-close')
    .should('exist')
    .click({ force: true });
    
  cy.get('#preferences-modal')
    .should('have.class', 'hidden');
});

/**
 * Save preferences with proper error handling
 */
Cypress.Commands.add('savePreferences', () => {
  cy.get('#preferences-save')
    .should('exist')
    .scrollIntoView()
    .click({ force: true });
    
  // Wait for save to complete and modal to close
  cy.get('#preferences-modal')
    .should('have.class', 'hidden');
});

/**
 * Wait for app initialization including security modules
 */
Cypress.Commands.add('waitForAppInit', () => {
  cy.wait(3000); // Base wait
  
  // Wait for security modules to be available
  cy.window().should('have.property', 'spotkinSecurity');
  cy.window().should('have.property', 'secureStorage');
  
  // Wait for DOM to be fully ready
  cy.get('#preferences-btn').should('exist');
  cy.get('#help-btn').should('exist');
  cy.get('#camera-container').should('exist');
  
  // Wait for any async initialization to complete
  cy.wait(1000);
});

/**
 * Robust element interaction with retries
 */
Cypress.Commands.add('forceInteract', (selector, action = 'click', options = {}) => {
  cy.get(selector)
    .should('exist')
    .scrollIntoView()
    .wait(200)
    .then($el => {
      if (action === 'click') {
        cy.wrap($el).click({ force: true, ...options });
      } else if (action === 'type') {
        cy.wrap($el).clear({ force: true }).type(options.text, { force: true });
      } else if (action === 'select') {
        cy.wrap($el).select(options.value, { force: true });
      }
    });
});