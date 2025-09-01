describe('Settings and Help Button Functionality', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000');
        
        // Wait for page to fully load
        cy.wait(2000);
        
        // Setup console log capture
        cy.window().then((win) => {
            win.testLogs = [];
            const originalLog = win.console.log;
            win.console.log = (...args) => {
                win.testLogs.push(args.join(' '));
                originalLog.apply(win.console, args);
            };
        });
    });

    describe('Settings Button', () => {
        it('should be visible and clickable', () => {
            // Verify settings button exists and is visible
            cy.get('#preferences-btn')
                .should('be.visible')
                .should('contain', 'Settings');
                
            // Verify button has proper styling
            cy.get('#preferences-btn')
                .should('have.class', 'bg-gray-600')
                .should('have.class', 'hover:bg-gray-500');
        });

        it('should log to console when clicked', () => {
            // Click the settings button
            cy.get('#preferences-btn').click();
            
            // Check that console log was captured
            cy.window().then((win) => {
                expect(win.testLogs.some(log => 
                    log.includes('🔧 INLINE: Settings clicked!')
                )).to.be.true;
                
                expect(win.testLogs.some(log => 
                    log.includes('🔧 showPreferencesModal() called')
                )).to.be.true;
            });
        });

        it('should show settings modal when clicked', () => {
            // Verify modal is initially hidden
            cy.get('#preferences-modal').should('not.be.visible');
            
            // Click settings button
            cy.get('#preferences-btn').click();
            
            // Handle the alert that appears
            cy.window().then((win) => {
                cy.stub(win, 'alert').as('windowAlert');
            });
            
            // Wait a moment for modal to appear
            cy.wait(500);
            
            // Verify modal becomes visible
            cy.get('#preferences-modal').should('be.visible');
            
            // Verify modal content is present
            cy.get('#preferences-modal')
                .should('contain', 'SpotKin Settings')
                .should('contain', 'Analysis Sensitivity')
                .should('contain', 'Alert Settings');
        });

        it('should be able to close the modal', () => {
            // Open the modal first
            cy.get('#preferences-btn').click();
            cy.wait(500);
            
            // Verify modal is open
            cy.get('#preferences-modal').should('be.visible');
            
            // Close the modal using the close button
            cy.get('#preferences-close').click();
            
            // Verify modal is hidden
            cy.get('#preferences-modal').should('not.be.visible');
        });

        it('should have functional form elements in the modal', () => {
            // Open modal
            cy.get('#preferences-btn').click();
            cy.wait(500);
            
            // Test sensitivity dropdown
            cy.get('#analysis-sensitivity')
                .should('be.visible')
                .select('high')
                .should('have.value', 'high');
            
            // Test alert checkboxes
            cy.get('#alert-movement')
                .should('be.visible')
                .check()
                .should('be.checked');
                
            cy.get('#alert-safety')
                .should('be.visible')
                .check()
                .should('be.checked');
            
            // Test sound alerts toggle
            cy.get('#sound-on')
                .should('be.visible')
                .check()
                .should('be.checked');
        });
    });

    describe('Help Button', () => {
        it('should be visible and clickable', () => {
            // Verify help button exists and is visible
            cy.get('#help-btn')
                .should('be.visible')
                .should('contain', 'Help');
                
            // Verify button styling
            cy.get('#help-btn')
                .should('have.class', 'bg-blue-600')
                .should('have.class', 'hover:bg-blue-500');
        });

        it('should show help modal when clicked', () => {
            // Verify help modal is initially hidden
            cy.get('#help-modal').should('not.be.visible');
            
            // Click help button
            cy.get('#help-btn').click();
            
            // Wait for modal to appear
            cy.wait(500);
            
            // Verify modal becomes visible
            cy.get('#help-modal').should('be.visible');
            
            // Verify modal content
            cy.get('#help-modal')
                .should('contain', 'SpotKin Help')
                .should('contain', 'Getting Started');
        });

        it('should have functional help tabs', () => {
            // Open help modal
            cy.get('#help-btn').click();
            cy.wait(500);
            
            // Test different help tabs
            const tabs = ['getting-started', 'advanced-features', 'troubleshooting', 'faq'];
            
            tabs.forEach(tab => {
                // Click tab
                cy.get(`[data-tab="${tab}"]`)
                    .should('be.visible')
                    .click();
                
                // Verify corresponding content is visible
                cy.get(`#help-content-${tab}`)
                    .should('be.visible');
                
                // Wait a moment between tab clicks
                cy.wait(300);
            });
        });

        it('should log help system activity', () => {
            // Click help button
            cy.get('#help-btn').click();
            cy.wait(500);
            
            // Check for FAQ system initialization logs
            cy.window().then((win) => {
                expect(win.testLogs.some(log => 
                    log.includes('FAQ System initialized') || 
                    log.includes('FAQ search index built')
                )).to.be.true;
            });
        });

        it('should be able to close help modal', () => {
            // Open help modal
            cy.get('#help-btn').click();
            cy.wait(500);
            
            // Verify modal is open
            cy.get('#help-modal').should('be.visible');
            
            // Close modal using close button
            cy.get('#help-close').click();
            
            // Verify modal is closed
            cy.get('#help-modal').should('not.be.visible');
        });
    });

    describe('Button Interaction Integration', () => {
        it('should be able to open both modals independently', () => {
            // Open settings modal
            cy.get('#preferences-btn').click();
            cy.wait(500);
            cy.get('#preferences-modal').should('be.visible');
            
            // Close settings modal
            cy.get('#preferences-close').click();
            cy.get('#preferences-modal').should('not.be.visible');
            
            // Open help modal
            cy.get('#help-btn').click();
            cy.wait(500);
            cy.get('#help-modal').should('be.visible');
            
            // Close help modal
            cy.get('#help-close').click();
            cy.get('#help-modal').should('not.be.visible');
        });

        it('should handle rapid clicking without errors', () => {
            // Rapidly click settings button
            cy.get('#preferences-btn')
                .click()
                .click()
                .click();
            
            cy.wait(500);
            cy.get('#preferences-modal').should('be.visible');
            cy.get('#preferences-close').click();
            
            // Rapidly click help button
            cy.get('#help-btn')
                .click()
                .click()
                .click();
            
            cy.wait(500);
            cy.get('#help-modal').should('be.visible');
            cy.get('#help-close').click();
        });
    });

    describe('Console Log Verification', () => {
        it('should capture all expected debug logs', () => {
            // Click settings button
            cy.get('#preferences-btn').click();
            cy.wait(500);
            cy.get('#preferences-close').click();
            
            // Click help button  
            cy.get('#help-btn').click();
            cy.wait(500);
            cy.get('#help-close').click();
            
            // Verify comprehensive logging
            cy.window().then((win) => {
                const logs = win.testLogs.join(' ');
                
                // Settings-related logs
                expect(logs).to.include('INLINE: Settings clicked');
                expect(logs).to.include('showPreferencesModal() called');
                
                // Help system logs
                expect(logs).to.include('FAQ System initialized');
                
                // General system logs
                expect(logs).to.include('SpotKin Application Initializing');
            });
        });
    });
});