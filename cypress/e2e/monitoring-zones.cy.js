describe('Monitoring Zone Selection Feature', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(1000); // Allow app to initialize
  });

  it('should allow enabling and configuring monitoring zones', () => {
    // Open preferences modal
    cy.get('#preferences-btn').click();
    
    // Check that zone controls are initially hidden
    cy.get('#zone-controls').should('have.class', 'hidden');
    
    // Enable monitoring zones
    cy.get('#zones-enabled').check();
    
    // Zone controls should now be visible
    cy.get('#zone-controls').should('not.have.class', 'hidden');
    
    // Check zone control buttons exist
    cy.get('#add-zone').should('be.visible').and('contain.text', 'Add monitoring zone');
    cy.get('#clear-zones').should('be.visible').and('contain.text', 'Clear all zones');
    
    // Save preferences
    cy.get('#preferences-save').click();
    
    // Verify zone toggle button appears in camera view
    cy.get('#zone-toggle').should('be.visible');
  });

  it('should allow creating monitoring zones', () => {
    // Enable zones first
    cy.get('#preferences-btn').click();
    cy.get('#zones-enabled').check();
    cy.get('#add-zone').click(); // This should close modal and enter zone mode
    
    // Verify we're in zone drawing mode
    cy.get('#zone-status').should('contain.text', 'Drawing Mode');
    cy.get('#zone-overlay').should('not.have.class', 'hidden');
    
    // Simulate drawing a zone by clicking and dragging
    cy.get('#zone-overlay')
      .trigger('mousedown', { clientX: 100, clientY: 100 })
      .trigger('mousemove', { clientX: 200, clientY: 200 })
      .trigger('mouseup', { clientX: 200, clientY: 200 });
    
    // Exit zone mode
    cy.get('#zone-toggle').click();
    
    // Verify zone was created
    cy.window().then((win) => {
      expect(win.currentZones).to.have.length(1);
      expect(win.currentZones[0].name).to.equal('Zone 1');
    });
  });

  it('should manage zone properties and settings', () => {
    cy.window().then((win) => {
      // Create mock zones directly
      win.currentZones = [
        {
          id: 1,
          name: 'Test Zone 1',
          x: 10, y: 10, width: 30, height: 20,
          enabled: true
        },
        {
          id: 2,
          name: 'Test Zone 2', 
          x: 50, y: 30, width: 25, height: 25,
          enabled: false
        }
      ];
      
      // Enable zones and update display
      win.userPreferences.zonesEnabled = true;
      win.updateZoneList();
      
      // Open preferences to see zone list
      cy.get('#preferences-btn').click();
      cy.get('#zones-enabled').check();
      
      // Verify zones appear in list
      cy.get('#zone-list').within(() => {
        cy.get('.zone-checkbox').should('have.length', 2);
        cy.get('.zone-name').first().should('contain.text', 'Test Zone 1');
        cy.get('.zone-name').last().should('contain.text', 'Test Zone 2');
        
        // First zone should be checked, second unchecked
        cy.get('.zone-checkbox').first().should('be.checked');
        cy.get('.zone-checkbox').last().should('not.be.checked');
      });
    });
  });

  it('should clear all zones when requested', () => {
    cy.window().then((win) => {
      // Create some mock zones
      win.currentZones = [
        { id: 1, name: 'Zone 1', x: 10, y: 10, width: 20, height: 20, enabled: true },
        { id: 2, name: 'Zone 2', x: 40, y: 40, width: 20, height: 20, enabled: true }
      ];
      win.updateZoneList();
      
      // Open preferences
      cy.get('#preferences-btn').click();
      cy.get('#zones-enabled').check();
      
      // Clear all zones (auto-confirm for testing)
      cy.window().then((win) => {
        // Mock confirm dialog to return true
        cy.stub(win, 'confirm').returns(true);
      });
      
      cy.get('#clear-zones').click();
      
      // Verify zones were cleared
      cy.get('#zone-list').should('be.empty');
    });
  });

  it('should save and load zone preferences', () => {
    cy.window().then((win) => {
      // Test the preferences integration
      expect(win.collectPreferencesFromForm).to.be.a('function');
      
      // Mock some zones
      win.currentZones = [
        { id: 1, name: 'Saved Zone', x: 25, y: 25, width: 50, height: 50, enabled: true }
      ];
      
      // Enable zones
      cy.get('#preferences-btn').click();
      cy.get('#zones-enabled').check();
      
      // Collect preferences
      const prefs = win.collectPreferencesFromForm();
      expect(prefs.zonesEnabled).to.be.true;
      expect(prefs.monitoringZones).to.have.length(1);
      expect(prefs.monitoringZones[0].name).to.equal('Saved Zone');
    });
  });

  it('should integrate zones with AI analysis', () => {
    cy.window().then((win) => {
      // Test the getActiveZones function
      expect(win.getActiveZones).to.be.a('function');
      
      // Mock zones and preferences
      win.currentZones = [
        { id: 1, name: 'Active Zone', x: 20, y: 30, width: 40, height: 50, enabled: true },
        { id: 2, name: 'Disabled Zone', x: 60, y: 10, width: 30, height: 30, enabled: false }
      ];
      win.userPreferences.zonesEnabled = true;
      
      const activeZones = win.getActiveZones();
      expect(activeZones).to.have.length(1);
      expect(activeZones[0].name).to.equal('Active Zone');
      expect(activeZones[0].x).to.equal(0.2); // 20% converted to 0.2
      expect(activeZones[0].y).to.equal(0.3); // 30% converted to 0.3
      
      // Test when zones are disabled
      win.userPreferences.zonesEnabled = false;
      const disabledZones = win.getActiveZones();
      expect(disabledZones).to.have.length(0);
    });
  });

  it('should handle zone drawing interactions', () => {
    // Test zone mode toggling
    cy.get('#preferences-btn').click();
    cy.get('#zones-enabled').check();
    cy.get('#preferences-save').click();
    
    // Toggle zone mode on
    cy.get('#zone-toggle').click();
    cy.get('#zone-status').should('contain.text', 'Drawing Mode');
    cy.get('#zone-overlay').should('not.have.class', 'hidden');
    
    // Toggle zone mode off
    cy.get('#zone-toggle').click();
    cy.get('#zone-status').should('contain.text', 'Setup Zone');
    
    // Test ESC key to exit zone mode
    cy.get('#zone-toggle').click(); // Enter zone mode
    cy.get('body').type('{esc}');
    cy.get('#zone-status').should('contain.text', 'Setup Zone');
  });

  it('should display zones visually on camera overlay', () => {
    cy.window().then((win) => {
      // Mock a zone and enable zones
      win.currentZones = [
        { id: 1, name: 'Visual Zone', x: 25, y: 25, width: 50, height: 30, enabled: true }
      ];
      win.userPreferences.zonesEnabled = true;
      
      // Update zone display
      win.updateZoneDisplay();
      
      // Check that SVG elements were created
      cy.get('#zone-svg').within(() => {
        cy.get('rect').should('exist');
        cy.get('text').should('contain.text', 'Visual Zone');
      });
    });
  });
});