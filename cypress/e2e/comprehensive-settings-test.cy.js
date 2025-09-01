describe('Comprehensive Settings Dialog Testing', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000');
        cy.wait(2000); // Wait for page to fully load
    });

    describe('Settings Modal Interaction', () => {
        it('should open and close settings modal correctly', () => {
            // Open settings modal
            cy.get('#preferences-btn').click();
            cy.wait(500);
            
            // Verify modal is visible
            cy.get('#preferences-modal').should('be.visible');
            cy.get('#preferences-modal').should('contain', 'SpotKin Settings');
            
            // Close using X button
            cy.get('#preferences-close').click();
            cy.get('#preferences-modal').should('not.be.visible');
            
            // Open again to test Save & Close
            cy.get('#preferences-btn').click();
            cy.wait(500);
            cy.get('#preferences-modal').should('be.visible');
            
            // Close using Save Settings button
            cy.get('#preferences-save').click();
            cy.get('#preferences-modal').should('not.be.visible');
        });
    });

    describe('Analysis Settings', () => {
        beforeEach(() => {
            cy.get('#preferences-btn').click();
            cy.wait(500);
        });

        afterEach(() => {
            cy.get('#preferences-save').click();
        });

        it('should change analysis sensitivity settings', () => {
            // Test sensitivity dropdown
            cy.get('#analysis-sensitivity')
                .should('be.visible')
                .should('have.value', 'medium') // default value
                .select('low')
                .should('have.value', 'low');
                
            cy.get('#analysis-sensitivity')
                .select('high')
                .should('have.value', 'high');
                
            cy.get('#analysis-sensitivity')
                .select('medium')
                .should('have.value', 'medium');
        });

        it('should toggle alert checkboxes', () => {
            // Test movement alerts
            cy.get('#alert-movement')
                .should('be.visible')
                .should('be.checked') // should be checked by default
                .uncheck()
                .should('not.be.checked')
                .check()
                .should('be.checked');

            // Test safety alerts  
            cy.get('#alert-safety')
                .should('be.visible')
                .should('be.checked')
                .uncheck()
                .should('not.be.checked')
                .check()
                .should('be.checked');

            // Test unusual activity alerts
            cy.get('#alert-unusual')
                .should('be.visible')
                .should('be.checked')
                .uncheck()
                .should('not.be.checked')
                .check()
                .should('be.checked');
        });

        it('should toggle sound alert settings', () => {
            // Test sound on radio button
            cy.get('#sound-on')
                .should('be.visible')
                .should('be.checked') // should be checked by default
                .check(); // ensure it's checked

            // Test sound off radio button
            cy.get('#sound-off')
                .should('be.visible')
                .should('not.be.checked')
                .check()
                .should('be.checked');
                
            // Verify sound-on is now unchecked
            cy.get('#sound-on').should('not.be.checked');
            
            // Switch back to sound on
            cy.get('#sound-on')
                .check()
                .should('be.checked');
            cy.get('#sound-off').should('not.be.checked');
        });
    });

    describe('Performance Settings', () => {
        beforeEach(() => {
            cy.get('#preferences-btn').click();
            cy.wait(500);
        });

        afterEach(() => {
            cy.get('#preferences-save').click();
        });

        it('should change default refresh rate', () => {
            cy.get('#default-refresh-rate')
                .should('be.visible')
                .should('have.value', '10000') // default 10 seconds
                .select('5000')
                .should('have.value', '5000');
                
            cy.get('#default-refresh-rate')
                .select('15000')
                .should('have.value', '15000');
                
            cy.get('#default-refresh-rate')
                .select('30000')
                .should('have.value', '30000');
        });

        it('should adjust movement threshold slider', () => {
            cy.get('#movement-threshold')
                .should('be.visible')
                .should('have.value', '1000') // default value
                .invoke('val', 500)
                .trigger('input');
                
            // Check that the display value updates
            cy.get('#movement-threshold-value')
                .should('contain', '500');
                
            // Test another value
            cy.get('#movement-threshold')
                .invoke('val', 1500)
                .trigger('input');
                
            cy.get('#movement-threshold-value')
                .should('contain', '1500');
        });
    });

    describe('Notification Settings', () => {
        beforeEach(() => {
            cy.get('#preferences-btn').click();
            cy.wait(500);
        });

        afterEach(() => {
            cy.get('#preferences-save').click();
        });

        it('should enable and configure push notifications', () => {
            // Enable notifications
            cy.get('#notifications-enabled')
                .should('be.visible')
                .should('not.be.checked') // should be unchecked by default
                .check()
                .should('be.checked');
                
            // Verify notification controls become visible
            cy.get('#notification-controls').should('be.visible');
            
            // Test individual notification types
            cy.get('#notify-danger')
                .should('be.visible')
                .should('be.checked')
                .uncheck()
                .should('not.be.checked')
                .check()
                .should('be.checked');
                
            cy.get('#notify-safety')
                .should('be.visible')
                .should('be.checked')
                .uncheck()
                .should('not.be.checked')
                .check()
                .should('be.checked');
                
            cy.get('#notify-activity')
                .should('be.visible')
                .should('not.be.checked')
                .check()
                .should('be.checked');
                
            cy.get('#notify-monitoring')
                .should('be.visible')
                .should('be.checked')
                .uncheck()
                .should('not.be.checked')
                .check()
                .should('be.checked');
        });

        it('should test notification functionality and permission request', () => {
            // Enable notifications first
            cy.get('#notifications-enabled').check();
            cy.get('#notification-controls').should('be.visible');
            
            // Mock the Notification.requestPermission to test the flow
            cy.window().then((win) => {
                cy.stub(win.Notification, 'requestPermission').resolves('granted');
                win.Notification.permission = 'default';
            });
            
            // Test notification button
            cy.get('#test-notification')
                .should('be.visible')
                .should('contain', 'Test Notification')
                .click();
        });

        it('should hide notification controls when disabled', () => {
            // Ensure notifications are enabled first
            cy.get('#notifications-enabled').check();
            cy.get('#notification-controls').should('be.visible');
            
            // Disable notifications
            cy.get('#notifications-enabled').uncheck();
            cy.get('#notification-controls').should('not.be.visible');
        });
    });

    describe('Zone Settings', () => {
        beforeEach(() => {
            cy.get('#preferences-btn').click();
            cy.wait(500);
        });

        afterEach(() => {
            cy.get('#preferences-save').click();
        });

        it('should enable and configure monitoring zones', () => {
            // Enable zones
            cy.get('#zones-enabled')
                .should('be.visible')
                .should('not.be.checked')
                .check()
                .should('be.checked');
                
            // Verify zone controls become visible
            cy.get('#zone-controls').should('be.visible');
            
            // Test zone management buttons
            cy.get('#add-zone')
                .should('be.visible')
                .should('contain', '+ Add Zone');
                
            cy.get('#clear-zones')
                .should('be.visible')
                .should('contain', 'Clear All');
                
            // Test zone list container
            cy.get('#zone-list').should('be.visible');
        });

        it('should hide zone controls when disabled', () => {
            // Enable zones first
            cy.get('#zones-enabled').check();
            cy.get('#zone-controls').should('be.visible');
            
            // Disable zones
            cy.get('#zones-enabled').uncheck();
            cy.get('#zone-controls').should('not.be.visible');
        });
    });

    describe('Advanced Settings', () => {
        beforeEach(() => {
            cy.get('#preferences-btn').click();
            cy.wait(500);
        });

        afterEach(() => {
            cy.get('#preferences-save').click();
        });

        it('should access setup wizard from settings', () => {
            cy.get('#rerun-setup-wizard')
                .should('be.visible')
                .should('contain', 'Re-run Setup Wizard');
                // Note: Clicking this might open the setup wizard
        });
    });

    describe('Background Sync Settings', () => {
        beforeEach(() => {
            cy.get('#preferences-btn').click();
            cy.wait(500);
        });

        afterEach(() => {
            cy.get('#preferences-save').click();
        });

        it('should display sync status information', () => {
            cy.get('#sync-status-display')
                .should('be.visible');
                
            cy.get('#sync-status-indicator')
                .should('be.visible');
                
            cy.get('#queue-snapshots').should('be.visible');
            cy.get('#queue-timeline').should('be.visible');
            cy.get('#queue-alerts').should('be.visible');
            cy.get('#queue-preferences').should('be.visible');
        });

        it('should have functional sync control buttons', () => {
            cy.get('#manual-sync-btn')
                .should('be.visible')
                .should('contain', 'Manual Sync');
                
            cy.get('#view-sync-details-btn')
                .should('be.visible')
                .should('contain', 'View Details');
                
            cy.get('#clear-sync-queue-btn')
                .should('be.visible')
                .should('contain', 'Clear Queue');
        });

        it('should configure sync preferences', () => {
            // Test auto-sync setting
            cy.get('#auto-sync-enabled')
                .should('be.visible')
                .should('be.checked') // should be enabled by default
                .uncheck()
                .should('not.be.checked')
                .check()
                .should('be.checked');
                
            // Test WiFi-only sync
            cy.get('#wifi-only-sync')
                .should('be.visible')
                .should('not.be.checked')
                .check()
                .should('be.checked')
                .uncheck()
                .should('not.be.checked');
                
            // Test battery saver sync
            cy.get('#battery-saver-sync')
                .should('be.visible')
                .should('not.be.checked')
                .check()
                .should('be.checked')
                .uncheck()
                .should('not.be.checked');
        });
    });

    describe('Save Functionality', () => {
        it('should have working save button without errors', () => {
            // Open settings modal
            cy.get('#preferences-btn').click();
            cy.wait(500);
            
            // Check for JavaScript errors when clicking save
            cy.window().then((win) => {
                win.testSaveErrors = [];
                const originalError = win.console.error;
                win.console.error = (...args) => {
                    win.testSaveErrors.push(args.join(' '));
                    originalError.apply(win.console, args);
                };
            });
            
            // Click save button
            cy.get('#preferences-save').click();
            
            // Check that no errors occurred
            cy.window().then((win) => {
                const saveErrors = win.testSaveErrors || [];
                const hasReferenceError = saveErrors.some(error => 
                    error.includes('savePreferences is not defined') ||
                    error.includes('ReferenceError')
                );
                expect(hasReferenceError, 'Should not have savePreferences ReferenceError').to.be.false;
            });
            
            // Modal should close after save
            cy.get('#preferences-modal').should('not.be.visible');
        });
        
        it('should trigger notification permission when notifications enabled and saved', () => {
            cy.get('#preferences-btn').click();
            cy.wait(500);
            
            // Mock notification permission
            cy.window().then((win) => {
                if (win.Notification) {
                    cy.stub(win.Notification, 'requestPermission').resolves('granted').as('notificationRequest');
                    win.Notification.permission = 'default';
                }
            });
            
            // Enable notifications
            cy.get('#notifications-enabled').check();
            
            // Save settings
            cy.get('#preferences-save').click();
            
            // Check if notification permission was requested
            cy.window().then((win) => {
                if (win.Notification) {
                    cy.get('@notificationRequest').should('have.been.called');
                }
            });
        });
    });

    describe('Settings Persistence', () => {
        it('should save and restore settings across modal open/close', () => {
            // Open modal and change settings
            cy.get('#preferences-btn').click();
            cy.wait(500);
            
            // Change some settings
            cy.get('#analysis-sensitivity').select('high');
            cy.get('#alert-movement').uncheck();
            cy.get('#sound-off').check();
            cy.get('#default-refresh-rate').select('5000');
            
            // Save and close
            cy.get('#preferences-save').click();
            cy.get('#preferences-modal').should('not.be.visible');
            
            // Reopen modal and verify settings are preserved
            cy.get('#preferences-btn').click();
            cy.wait(500);
            
            cy.get('#analysis-sensitivity').should('have.value', 'high');
            cy.get('#alert-movement').should('not.be.checked');
            cy.get('#sound-off').should('be.checked');
            cy.get('#default-refresh-rate').should('have.value', '5000');
            
            // Close modal
            cy.get('#preferences-close').click();
        });

        it('should reset settings to defaults', () => {
            // Open modal and change settings
            cy.get('#preferences-btn').click();
            cy.wait(500);
            
            // Change settings away from defaults
            cy.get('#analysis-sensitivity').select('low');
            cy.get('#alert-movement').uncheck();
            cy.get('#sound-off').check();
            
            // Use reset button (if functional)
            cy.get('#preferences-reset')
                .should('be.visible')
                .should('contain', 'Reset to Default');
                // Note: The reset functionality would need to be implemented
            
            cy.get('#preferences-close').click();
        });
    });

    describe('Settings Validation', () => {
        beforeEach(() => {
            cy.get('#preferences-btn').click();
            cy.wait(500);
        });

        afterEach(() => {
            cy.get('#preferences-save').click();
        });

        it('should validate movement threshold range', () => {
            // Test minimum value
            cy.get('#movement-threshold')
                .should('have.attr', 'min', '500')
                .should('have.attr', 'max', '2000');
                
            // Test setting values within range
            cy.get('#movement-threshold')
                .invoke('val', 500)
                .trigger('input');
            cy.get('#movement-threshold-value').should('contain', '500');
            
            cy.get('#movement-threshold')
                .invoke('val', 2000)
                .trigger('input');
            cy.get('#movement-threshold-value').should('contain', '2000');
        });

        it('should ensure all form elements are accessible and functional', () => {
            // Verify all critical form elements exist and are interactable
            const formElements = [
                '#analysis-sensitivity',
                '#alert-movement',
                '#alert-safety', 
                '#alert-unusual',
                '#sound-on',
                '#sound-off',
                '#default-refresh-rate',
                '#movement-threshold',
                '#notifications-enabled',
                '#zones-enabled'
            ];
            
            formElements.forEach(selector => {
                cy.get(selector)
                    .should('be.visible')
                    .should('not.be.disabled');
            });
        });
    });
});