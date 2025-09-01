describe('AI Endpoint Interaction', () => {
  beforeEach(() => {
    // Visit the page and wait for the app to initialize
    cy.visit('/');
    // Wait for the appReady flag we added to app.js
    cy.window().should('have.prop', 'appReady', true);
  });

  it('should display analysis results on a successful API call', () => {
    // Mock a successful response from the AI
    const mockResponse = {
      scene_description: 'A baby is sleeping peacefully in a crib.',
      subjects: [{
        type: 'Baby',
        state: 'Sleeping',
        confidence: 0.95
      }],
      safety_assessment: {
        level: 'Safe',
        reason: 'The baby is sleeping safely in the crib.'
      }
    };

    // Stub the puter.ai.chat function before the action
    cy.window().then((win) => {
      // Ensure puter.ai exists, creating a mock if it doesn't
      if (!win.puter) win.puter = {};
      if (!win.puter.ai) win.puter.ai = {};
      cy.stub(win.puter.ai, 'chat').resolves(JSON.stringify(mockResponse));
    });

    // Trigger the action that calls the AI
    cy.get('#take-snapshot').click();

    // Assert that the UI updates with the results
    cy.get('#analysis-results').should('not.be.hidden');
    cy.get('#scene-text').should('contain.text', 'A baby is sleeping peacefully');
    cy.get('#detection-list').should('contain.text', 'Baby');
    cy.get('#safety-level').should('contain.text', 'Safe');
  });

  it('should show an error state when the API call fails (network error)', () => {
    // Stub the puter.ai.chat function to reject the promise
    cy.window().then((win) => {
      if (!win.puter) win.puter = {};
      if (!win.puter.ai) win.puter.ai = {};
      cy.stub(win.puter.ai, 'chat').rejects(new Error('Network request failed'));
    });

    // Trigger the action
    cy.get('#take-snapshot').click();

    // Assert that the error UI is shown
    cy.get('#results-placeholder').should('not.be.hidden');
    cy.get('#results-placeholder').should('contain.text', 'Error connecting to AI service');
  });

  it('should show an error state when the AI returns an unparsable response', () => {
    // Stub the puter.ai.chat function to return malformed JSON
    cy.window().then((win) => {
      if (!win.puter) win.puter = {};
      if (!win.puter.ai) win.puter.ai = {};
      cy.stub(win.puter.ai, 'chat').resolves('This is not valid JSON');
    });

    // Trigger the action
    cy.get('#take-snapshot').click();

    // Assert that the error UI is shown
    cy.get('#results-placeholder').should('not.be.hidden');
    cy.get('#results-placeholder').should('contain.text', "The AI couldn't analyze this image properly");
  });

  it('should show an error state when the AI refuses to analyze the image', () => {
    // Stub the puter.ai.chat function to return a refusal message
    cy.window().then((win) => {
      if (!win.puter) win.puter = {};
      if (!win.puter.ai) win.puter.ai = {};
      cy.stub(win.puter.ai, 'chat').resolves('I am unable to provide an analysis of this image.');
    });

    // Trigger the action
    cy.get('#take-snapshot').click();

    // Assert that the error UI is shown
    cy.get('#results-placeholder').should('not.be.hidden');
    cy.get('#results-placeholder').should('contain.text', "The AI couldn't analyze this image properly");
  });
});