describe('User Preferences Panel (Final)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForAppInit();
  });

  it('should open and close preferences modal reliably', () => {
    cy.openPreferences();
    cy.closePreferences();
  });

  it('should load and display default preferences', () => {
    cy.openPreferences();
    
    // Verify all default values
    cy.get('#analysis-sensitivity').should('have.value', 'medium');
    cy.get('#alert-movement').should('be.checked');
    cy.get('#alert-safety').should('be.checked');
    cy.get('#alert-unusual').should('be.checked');
    cy.get('#sound-on').should('be.checked');
    cy.get('#default-refresh-rate').should('have.value', '10000');
    cy.get('#movement-threshold').should('have.value', '1000');
    cy.get('#movement-threshold-value').should('contain', '1000');
    
    cy.closePreferences();
  });

  it('should save and persist preference changes', () => {
    cy.openPreferences();
    
    // Make changes
    cy.get('#analysis-sensitivity').select('high', { force: true });
    cy.get('#alert-movement').uncheck({ force: true });
    cy.get('#sound-off').check({ force: true });
    
    cy.savePreferences();
    
    // Verify persistence
    cy.openPreferences();
    cy.get('#analysis-sensitivity').should('have.value', 'high');
    cy.get('#alert-movement').should('not.be.checked');
    cy.get('#sound-off').should('be.checked');
    
    // Reset back to defaults for other tests
    cy.get('#analysis-sensitivity').select('medium', { force: true });
    cy.get('#alert-movement').check({ force: true });
    cy.get('#sound-on').check({ force: true });
    cy.savePreferences();
  });

  it('should handle movement threshold changes', () => {
    cy.openPreferences();
    
    // Test threshold display updates
    cy.get('#movement-threshold-value').should('contain', '1000');
    
    // Change threshold
    cy.get('#movement-threshold')
      .clear({ force: true })
      .type('1500', { force: true });
    
    cy.get('#movement-threshold-value').should('contain', '1500');
    
    cy.savePreferences();
    
    // Verify persistence
    cy.openPreferences();
    cy.get('#movement-threshold').should('have.value', '1500');
    
    // Reset back
    cy.get('#movement-threshold')
      .clear({ force: true })
      .type('1000', { force: true });
    cy.savePreferences();
  });

  it('should reset preferences to defaults', () => {
    cy.openPreferences();
    
    // Make some changes
    cy.get('#analysis-sensitivity').select('low', { force: true });
    cy.get('#alert-safety').uncheck({ force: true });
    
    // Stub the confirm dialog
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });
    
    // Reset preferences
    cy.get('#preferences-reset').click({ force: true });
    
    // Verify reset worked
    cy.get('#analysis-sensitivity').should('have.value', 'medium');
    cy.get('#alert-safety').should('be.checked');
    
    cy.closePreferences();
  });

  it('should close modal with ESC key', () => {
    cy.openPreferences();
    cy.get('body').type('{esc}');
    cy.get('#preferences-modal').should('have.class', 'hidden');
  });

  it('should close modal when clicking outside', () => {
    cy.openPreferences();
    cy.get('#preferences-modal').click(10, 10, { force: true });
    cy.get('#preferences-modal').should('have.class', 'hidden');
  });

  it('should have working global preference functions', () => {
    cy.window().then((win) => {
      expect(win.getMovementThreshold).to.be.a('function');
      expect(win.getSensitivityMultiplier).to.be.a('function');
      expect(win.isAlertEnabled).to.be.a('function');
      expect(win.playAlertSound).to.be.a('function');
      
      expect(win.getMovementThreshold()).to.equal(1000);
      expect(win.getSensitivityMultiplier()).to.equal(1.0);
      expect(win.isAlertEnabled('movement')).to.be.true;
    });
  });
});