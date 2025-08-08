describe('User Preferences Panel', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(1000); // Allow app to initialize
  });

  it('should show and hide preferences modal', () => {
    // Check that preferences button exists
    cy.get('#preferences-btn').should('be.visible');
    
    // Check that modal is hidden initially
    cy.get('#preferences-modal').should('have.class', 'hidden');
    
    // Click preferences button to open modal
    cy.get('#preferences-btn').click();
    cy.get('#preferences-modal').should('not.have.class', 'hidden');
    
    // Close modal using close button
    cy.get('#preferences-close').click();
    cy.get('#preferences-modal').should('have.class', 'hidden');
  });

  it('should load and save user preferences', () => {
    // Open preferences modal
    cy.get('#preferences-btn').click();
    
    // Check default values
    cy.get('#analysis-sensitivity').should('have.value', 'medium');
    cy.get('#alert-movement').should('be.checked');
    cy.get('#alert-safety').should('be.checked');
    cy.get('#alert-unusual').should('be.checked');
    cy.get('#sound-on').should('be.checked');
    cy.get('#default-refresh-rate').should('have.value', '10000');
    cy.get('#movement-threshold').should('have.value', '1000');
    
    // Change some values
    cy.get('#analysis-sensitivity').select('high');
    cy.get('#alert-movement').uncheck();
    cy.get('#sound-off').check();
    cy.get('#movement-threshold').invoke('val', '1500').trigger('input');
    
    // Save preferences
    cy.get('#preferences-save').click();
    
    // Verify modal closed
    cy.get('#preferences-modal').should('have.class', 'hidden');
    
    // Reopen modal to verify settings persisted
    cy.get('#preferences-btn').click();
    cy.get('#analysis-sensitivity').should('have.value', 'high');
    cy.get('#alert-movement').should('not.be.checked');
    cy.get('#sound-off').should('be.checked');
    cy.get('#movement-threshold').should('have.value', '1500');
  });

  it('should reset preferences to default', () => {
    // Open preferences and change some values
    cy.get('#preferences-btn').click();
    cy.get('#analysis-sensitivity').select('low');
    cy.get('#alert-safety').uncheck();
    cy.get('#movement-threshold').invoke('val', '500').trigger('input');
    
    // Reset to defaults
    cy.get('#preferences-reset').click();
    
    // Handle confirmation dialog
    cy.on('window:confirm', () => true);
    
    // Verify values reset to defaults
    cy.get('#analysis-sensitivity').should('have.value', 'medium');
    cy.get('#alert-safety').should('be.checked');
    cy.get('#movement-threshold').should('have.value', '1000');
  });

  it('should update movement threshold display', () => {
    cy.get('#preferences-btn').click();
    
    // Check initial threshold display
    cy.get('#movement-threshold-value').should('contain', '1000');
    
    // Change threshold and verify display updates
    cy.get('#movement-threshold').invoke('val', '1500').trigger('input');
    cy.get('#movement-threshold-value').should('contain', '1500');
  });

  it('should close modal with ESC key', () => {
    // Open modal
    cy.get('#preferences-btn').click();
    cy.get('#preferences-modal').should('not.have.class', 'hidden');
    
    // Press ESC key
    cy.get('body').type('{esc}');
    
    // Verify modal closed
    cy.get('#preferences-modal').should('have.class', 'hidden');
  });

  it('should close modal when clicking outside', () => {
    // Open modal
    cy.get('#preferences-btn').click();
    cy.get('#preferences-modal').should('not.have.class', 'hidden');
    
    // Click on the modal backdrop (outside the modal content)
    cy.get('#preferences-modal').click(10, 10);
    
    // Verify modal closed
    cy.get('#preferences-modal').should('have.class', 'hidden');
  });

  it('should integrate with temporal analysis', () => {
    // This test verifies that the preferences affect the actual analysis
    cy.window().then((win) => {
      // Check that global preferences functions are available
      expect(win.getMovementThreshold).to.be.a('function');
      expect(win.getSensitivityMultiplier).to.be.a('function');
      expect(win.isAlertEnabled).to.be.a('function');
      expect(win.playAlertSound).to.be.a('function');
      
      // Test default values
      expect(win.getMovementThreshold()).to.equal(1000);
      expect(win.getSensitivityMultiplier()).to.equal(1.0);
      expect(win.isAlertEnabled('movement')).to.be.true;
    });
  });
});