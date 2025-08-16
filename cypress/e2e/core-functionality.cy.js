describe('Core Functionality Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(3000); // Allow app initialization
    cy.viewport(1280, 720);
    cy.scrollTo('top');
  });

  it('should load the application successfully', () => {
    // Check that main elements are present
    cy.get('#camera-section').should('exist');
    cy.get('#results-container').should('exist');
    cy.get('#tab-current').should('exist');
    cy.get('#tab-history').should('exist');
    
    // Check that buttons are present
    cy.get('#preferences-btn').should('exist');
    cy.get('#help-btn').should('exist');
  });

  it('should have security modules properly loaded', () => {
    cy.window().then((win) => {
      expect(win.spotkinSecurity).to.exist;
      expect(win.secureStorage).to.exist;
      expect(win.spotkinSecurity.encryptData).to.be.a('function');
      expect(win.secureStorage.setItem).to.be.a('function');
    });
  });

  it('should open and close help modal', () => {
    cy.get('#help-btn').click({ force: true });
    cy.get('#help-modal').should('not.have.class', 'hidden');
    cy.get('#help-close').click({ force: true });
    cy.get('#help-modal').should('have.class', 'hidden');
  });

  it('should open and close preferences modal', () => {
    cy.get('#preferences-btn').scrollIntoView().click({ force: true });
    cy.get('#preferences-modal').should('not.have.class', 'hidden');
    cy.get('#preferences-close').click({ force: true });
    cy.get('#preferences-modal').should('have.class', 'hidden');
  });

  it('should switch between current and history tabs', () => {
    // Start on current tab
    cy.get('#current-tab').should('not.have.class', 'hidden');
    cy.get('#history-tab').should('have.class', 'hidden');
    
    // Switch to history
    cy.get('#tab-history').click();
    cy.get('#current-tab').should('have.class', 'hidden');
    cy.get('#history-tab').should('not.have.class', 'hidden');
    
    // Switch back to current
    cy.get('#tab-current').click();
    cy.get('#current-tab').should('not.have.class', 'hidden');
    cy.get('#history-tab').should('have.class', 'hidden');
  });

  it('should have proper security headers', () => {
    // Check CSP headers
    cy.get('meta[http-equiv="Content-Security-Policy"]')
      .should('exist')
      .should('have.attr', 'content')
      .and('include', "default-src 'self'");
      
    // Check other security headers
    cy.get('meta[http-equiv="X-Frame-Options"]').should('exist');
    cy.get('meta[http-equiv="X-Content-Type-Options"]').should('exist');
    cy.get('meta[http-equiv="X-XSS-Protection"]').should('exist');
  });

  it('should have working encryption functionality', () => {
    cy.window().then(async (win) => {
      const testData = { test: 'encryption works' };
      const encrypted = await win.spotkinSecurity.encryptData(testData);
      expect(encrypted).to.have.property('encrypted', true);
      
      const decrypted = await win.spotkinSecurity.decryptData(encrypted);
      expect(decrypted).to.deep.equal(testData);
    });
  });

  it('should have working secure storage functionality', () => {
    cy.window().then(async (win) => {
      const testKey = 'core-test';
      const testData = { coreTest: true, timestamp: Date.now() };
      
      // Store data
      const stored = await win.secureStorage.setItem(testKey, testData);
      expect(stored).to.be.true;
      
      // Retrieve data
      const retrieved = await win.secureStorage.getItem(testKey);
      expect(retrieved).to.deep.equal(testData);
      
      // Clean up
      await win.secureStorage.removeItem(testKey);
    });
  });

  it('should sanitize dangerous input', () => {
    cy.window().then((win) => {
      const dangerousInput = '<script>alert("xss")</script>';
      const sanitized = win.spotkinSecurity.sanitizeInput(dangerousInput);
      expect(sanitized).to.not.include('<script>');
      expect(sanitized).to.include('&lt;script&gt;');
    });
  });

  it('should have app initialization completed', () => {
    // Check that the app has properly initialized by looking for global functions
    cy.window().then((win) => {
      expect(win.getMovementThreshold).to.be.a('function');
      expect(win.getSensitivityMultiplier).to.be.a('function');
      expect(win.isAlertEnabled).to.be.a('function');
    });
  });
});