describe('Security Integration Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(5000); // Wait for full app and security module initialization
  });

  it('should have security modules properly initialized', () => {
    cy.window().then((win) => {
      // Check that security modules are loaded
      expect(win.spotkinSecurity).to.exist;
      expect(win.secureStorage).to.exist;
      
      // Check core security functions
      expect(win.spotkinSecurity.encryptData).to.be.a('function');
      expect(win.spotkinSecurity.decryptData).to.be.a('function');
      expect(win.spotkinSecurity.sanitizeInput).to.be.a('function');
      expect(win.spotkinSecurity.validateInput).to.be.a('function');
      
      // Check secure storage functions
      expect(win.secureStorage.setItem).to.be.a('function');
      expect(win.secureStorage.getItem).to.be.a('function');
      expect(win.secureStorage.removeItem).to.be.a('function');
    });
  });

  it('should successfully encrypt and decrypt data', () => {
    cy.window().then(async (win) => {
      const testData = { test: 'data', timestamp: Date.now() };
      
      // Test encryption
      const encrypted = await win.spotkinSecurity.encryptData(testData);
      expect(encrypted).to.have.property('encrypted', true);
      expect(encrypted).to.have.property('data');
      expect(encrypted).to.have.property('iv');
      
      // Test decryption
      const decrypted = await win.spotkinSecurity.decryptData(encrypted);
      expect(decrypted).to.deep.equal(testData);
    });
  });

  it('should store and retrieve data securely', () => {
    cy.window().then(async (win) => {
      const testKey = 'test-security-integration';
      const testData = { 
        userPreference: 'testValue',
        timestamp: Date.now(),
        securityTest: true
      };
      
      // Store data securely
      const stored = await win.secureStorage.setItem(testKey, testData);
      expect(stored).to.be.true;
      
      // Retrieve and verify data
      const retrieved = await win.secureStorage.getItem(testKey);
      expect(retrieved).to.deep.equal(testData);
      
      // Clean up
      await win.secureStorage.removeItem(testKey);
      
      // Verify deletion
      const deletedData = await win.secureStorage.getItem(testKey);
      expect(deletedData).to.be.null;
    });
  });

  it('should sanitize dangerous input correctly', () => {
    cy.window().then((win) => {
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];
      
      dangerousInputs.forEach(input => {
        const sanitized = win.spotkinSecurity.sanitizeInput(input);
        expect(sanitized).to.not.include('<script>');
        expect(sanitized).to.not.include('javascript:');
        expect(sanitized).to.not.include('onerror');
        expect(sanitized).to.not.include('<iframe>');
      });
    });
  });

  it('should validate input according to type constraints', () => {
    cy.window().then((win) => {
      // Test valid inputs
      const validString = win.spotkinSecurity.validateInput('valid text', 'string', { minLength: 2, maxLength: 20 });
      expect(validString.valid).to.be.true;
      
      const validNumber = win.spotkinSecurity.validateInput('42', 'number', { min: 0, max: 100 });
      expect(validNumber.valid).to.be.true;
      expect(validNumber.value).to.equal(42);
      
      const validEmail = win.spotkinSecurity.validateInput('test@example.com', 'email');
      expect(validEmail.valid).to.be.true;
      
      // Test invalid inputs
      const invalidString = win.spotkinSecurity.validateInput('x', 'string', { minLength: 5 });
      expect(invalidString.valid).to.be.false;
      
      const invalidNumber = win.spotkinSecurity.validateInput('not-a-number', 'number');
      expect(invalidNumber.valid).to.be.false;
      
      const invalidEmail = win.spotkinSecurity.validateInput('invalid-email', 'email');
      expect(invalidEmail.valid).to.be.false;
    });
  });

  it('should have proper CSP headers configured', () => {
    // Check for security meta tags
    cy.get('meta[http-equiv="Content-Security-Policy"]')
      .should('exist')
      .should('have.attr', 'content')
      .and('include', "default-src 'self'");
      
    cy.get('meta[http-equiv="X-Frame-Options"]')
      .should('exist')
      .should('have.attr', 'content', 'DENY');
      
    cy.get('meta[http-equiv="X-Content-Type-Options"]')
      .should('exist')
      .should('have.attr', 'content', 'nosniff');
      
    cy.get('meta[http-equiv="X-XSS-Protection"]')
      .should('exist')
      .should('have.attr', 'content', '1; mode=block');
  });

  it('should provide GDPR compliance features', () => {
    cy.window().then(async (win) => {
      // Test data export
      const exportData = await win.secureStorage.exportUserData();
      expect(exportData).to.have.property('exportDate');
      expect(exportData).to.have.property('version');
      expect(exportData).to.have.property('application', 'SpotKin');
      expect(exportData).to.have.property('data');
      
      // Test storage statistics
      const stats = win.secureStorage.getStorageStats();
      expect(stats).to.have.property('totalItems');
      expect(stats).to.have.property('encryptedItems');
      expect(stats).to.have.property('totalSizeBytes');
    });
  });

  it('should handle encryption errors gracefully', () => {
    cy.window().then(async (win) => {
      // Temporarily break encryption to test error handling
      const originalEncrypt = win.spotkinSecurity.encryptData;
      win.spotkinSecurity.encryptData = () => Promise.reject(new Error('Test encryption failure'));
      
      // Attempt to store data
      const result = await win.secureStorage.setItem('error-test', { data: 'test' });
      
      // Should handle error gracefully
      expect(result).to.be.false;
      
      // Restore original function
      win.spotkinSecurity.encryptData = originalEncrypt;
    });
  });

  it('should maintain app functionality with security enabled', () => {
    // Check that core app elements are still present and functional
    cy.get('#camera-section').should('exist');
    cy.get('#results-container').should('exist');
    cy.get('#tab-current').should('exist');
    cy.get('#tab-history').should('exist');
    
    // Check that help button is accessible
    cy.get('#help-btn').should('be.visible').click();
    cy.get('#help-modal').should('not.have.class', 'hidden');
    cy.get('#help-close').click();
    cy.get('#help-modal').should('have.class', 'hidden');
  });
});