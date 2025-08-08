describe('Setup Wizard', () => {
    beforeEach(() => {
        cy.visit('/');
        // Clear setup completion flag to ensure wizard shows
        cy.window().then((win) => {
            win.localStorage.removeItem('spotkin-setup-completed');
        });
    });

    it('should show setup wizard on first visit', () => {
        cy.reload();
        cy.get('#setup-wizard', { timeout: 10000 }).should('be.visible');
        cy.get('#setup-wizard .wizard-title').should('contain', 'Welcome to SpotKin');
    });

    it('should complete full setup wizard flow - Baby Monitor', () => {
        // Trigger setup wizard manually
        cy.window().then((win) => {
            win.showSetupWizard();
        });

        cy.get('#setup-wizard').should('be.visible');

        // Step 1: Monitor Type Selection
        cy.get('#setup-wizard .wizard-content h3').should('contain', 'What would you like to monitor?');
        cy.get('[data-monitor-type="baby"]').click();
        cy.get('.wizard-nav .next-step').click();

        // Step 2: Camera Setup
        cy.get('#setup-wizard .wizard-content h3').should('contain', 'Camera Positioning');
        cy.get('[data-camera-position="above-crib"]').click();
        cy.get('.wizard-nav .next-step').click();

        // Step 3: Monitoring Zones
        cy.get('#setup-wizard .wizard-content h3').should('contain', 'Monitoring Zones');
        cy.get('[data-zone-preset="crib-safety"]').click();
        cy.get('.wizard-nav .next-step').click();

        // Step 4: Alert Preferences
        cy.get('#setup-wizard .wizard-content h3').should('contain', 'Alert Preferences');
        cy.get('[data-alert-type="movement"]').check();
        cy.get('[data-alert-type="crying"]').check();
        cy.get('.wizard-nav .complete-setup').click();

        // Verify completion
        cy.get('#setup-wizard').should('not.be.visible');
        cy.get('.bg-green-600').should('be.visible').and('contain', 'Setup Complete!');
    });

    it('should complete full setup wizard flow - Pet Monitor', () => {
        cy.window().then((win) => {
            win.showSetupWizard();
        });

        cy.get('#setup-wizard').should('be.visible');

        // Step 1: Pet monitoring
        cy.get('[data-monitor-type="pet"]').click();
        cy.get('.wizard-nav .next-step').click();

        // Step 2: Camera positioning for pet
        cy.get('[data-camera-position="corner-view"]').click();
        cy.get('.wizard-nav .next-step').click();

        // Step 3: Pet monitoring zones
        cy.get('[data-zone-preset="play-area"]').click();
        cy.get('.wizard-nav .next-step').click();

        // Step 4: Pet alerts
        cy.get('[data-alert-type="movement"]').check();
        cy.get('[data-alert-type="distress"]').check();
        cy.get('.wizard-nav .complete-setup').click();

        cy.get('#setup-wizard').should('not.be.visible');
    });

    it('should handle navigation between steps', () => {
        cy.window().then((win) => {
            win.showSetupWizard();
        });

        // Go forward through steps
        cy.get('[data-monitor-type="general"]').click();
        cy.get('.wizard-nav .next-step').click();
        
        cy.get('[data-camera-position="wall-mount"]').click();
        cy.get('.wizard-nav .next-step').click();

        // Go back
        cy.get('.wizard-nav .prev-step').click();
        cy.get('#setup-wizard .wizard-content h3').should('contain', 'Camera Positioning');

        // Go back again
        cy.get('.wizard-nav .prev-step').click();
        cy.get('#setup-wizard .wizard-content h3').should('contain', 'What would you like to monitor?');
    });

    it('should show validation errors for incomplete steps', () => {
        cy.window().then((win) => {
            win.showSetupWizard();
        });

        // Try to proceed without selecting monitor type
        cy.get('.wizard-nav .next-step').click();
        cy.get('.bg-red-600').should('be.visible').and('contain', 'Please select a monitoring type');

        // Select type and proceed
        cy.get('[data-monitor-type="baby"]').click();
        cy.get('.wizard-nav .next-step').click();

        // Try to proceed without camera position
        cy.get('.wizard-nav .next-step').click();
        cy.get('.bg-red-600').should('be.visible').and('contain', 'Please select a camera position');
    });

    it('should close wizard without completing', () => {
        cy.window().then((win) => {
            win.showSetupWizard();
        });

        cy.get('#setup-wizard').should('be.visible');
        cy.get('.close-wizard').click();
        cy.get('#setup-wizard').should('not.be.visible');

        // Setup should not be marked as completed
        cy.window().then((win) => {
            const completed = win.localStorage.getItem('spotkin-setup-completed');
            expect(completed).to.be.null;
        });
    });

    it('should persist setup data to localStorage', () => {
        cy.window().then((win) => {
            win.showSetupWizard();
        });

        // Complete setup
        cy.get('[data-monitor-type="baby"]').click();
        cy.get('.wizard-nav .next-step').click();
        
        cy.get('[data-camera-position="above-crib"]').click();
        cy.get('.wizard-nav .next-step').click();
        
        cy.get('[data-zone-preset="crib-safety"]').click();
        cy.get('.wizard-nav .next-step').click();
        
        cy.get('[data-alert-type="movement"]').check();
        cy.get('.wizard-nav .complete-setup').click();

        // Verify data persisted
        cy.window().then((win) => {
            const completed = win.localStorage.getItem('spotkin-setup-completed');
            expect(completed).to.equal('true');
        });
    });

    it('should not show wizard on subsequent visits', () => {
        // Complete setup first
        cy.window().then((win) => {
            win.localStorage.setItem('spotkin-setup-completed', 'true');
        });

        cy.reload();
        cy.get('#setup-wizard').should('not.be.visible');
    });

    it('should allow manual access to setup wizard from preferences', () => {
        // Mark setup as completed
        cy.window().then((win) => {
            win.localStorage.setItem('spotkin-setup-completed', 'true');
        });

        // Open preferences
        cy.get('#preferences-btn').click();
        cy.get('#preferences-modal').should('be.visible');

        // Click setup wizard button
        cy.get('button').contains('Run Setup Wizard').click();
        cy.get('#setup-wizard').should('be.visible');
    });

    it('should show dynamic content based on monitor type selection', () => {
        cy.window().then((win) => {
            win.showSetupWizard();
        });

        // Test baby monitoring content
        cy.get('[data-monitor-type="baby"]').click();
        cy.get('.wizard-nav .next-step').click();
        cy.get('.wizard-content').should('contain', 'crib');
        cy.get('[data-camera-position="above-crib"]').should('be.visible');

        // Go back and test pet monitoring
        cy.get('.wizard-nav .prev-step').click();
        cy.get('[data-monitor-type="pet"]').click();
        cy.get('.wizard-nav .next-step').click();
        cy.get('.wizard-content').should('contain', 'play area');
        cy.get('[data-camera-position="corner-view"]').should('be.visible');
    });

    it('should integrate with existing preferences system', () => {
        // Set some initial preferences
        cy.window().then((win) => {
            win.localStorage.setItem('spotkin-preferences', JSON.stringify({
                sensitivity: 7,
                soundEnabled: true,
                monitoringEnabled: false
            }));
        });

        cy.window().then((win) => {
            win.showSetupWizard();
        });

        // Complete wizard
        cy.get('[data-monitor-type="baby"]').click();
        cy.get('.wizard-nav .next-step').click();
        cy.get('[data-camera-position="above-crib"]').click();
        cy.get('.wizard-nav .next-step').click();
        cy.get('[data-zone-preset="crib-safety"]').click();
        cy.get('.wizard-nav .next-step').click();
        cy.get('[data-alert-type="crying"]').check();
        cy.get('.wizard-nav .complete-setup').click();

        // Verify preferences were updated but existing ones preserved
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('spotkin-preferences'));
            expect(prefs.sensitivity).to.equal(7); // Preserved
            expect(prefs.soundEnabled).to.be.true; // Preserved
            expect(prefs.monitoringEnabled).to.be.true; // Updated by wizard
        });
    });
});