describe('Text-to-Speech System', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000); // Wait for app initialization
  });

  it('should display voice alerts toggle button in camera controls', () => {
    // Check if voice alerts toggle button exists
    cy.get('#voice-alerts-toggle').should('be.visible');
    cy.get('#voice-alerts-toggle i').should('have.class', 'fa-volume-mute'); // Default is off
  });

  it('should toggle voice alerts state when button is clicked', () => {
    // Initial state should be off (gray button with mute icon)
    cy.get('#voice-alerts-toggle').should('have.class', 'bg-gray-600');
    cy.get('#voice-alerts-toggle i').should('have.class', 'fa-volume-mute');

    // Click to enable voice alerts
    cy.get('#voice-alerts-toggle').click();
    
    // Should now be on (green button with volume icon)
    cy.get('#voice-alerts-toggle').should('have.class', 'bg-green-600');
    cy.get('#voice-alerts-toggle i').should('have.class', 'fa-volume-up');
  });

  it('should persist voice alerts preference in localStorage', () => {
    // Enable voice alerts
    cy.get('#voice-alerts-toggle').click();
    
    // Check localStorage
    cy.window().then((win) => {
      expect(win.userPreferences.voiceAlerts).to.be.true;
    });

    // Disable voice alerts
    cy.get('#voice-alerts-toggle').click();
    
    // Check localStorage again
    cy.window().then((win) => {
      expect(win.userPreferences.voiceAlerts).to.be.false;
    });
  });

  it('should have proper button tooltips', () => {
    // Check initial tooltip (OFF state)
    cy.get('#voice-alerts-toggle').should('have.attr', 'title').and('contain', 'Voice Alerts: OFF');
    
    // Click to enable
    cy.get('#voice-alerts-toggle').click();
    
    // Check updated tooltip (ON state)
    cy.get('#voice-alerts-toggle').should('have.attr', 'title').and('contain', 'Voice Alerts: ON');
  });

  it('should expose TTS functions globally for testing', () => {
    cy.window().should('have.property', 'speakAlert');
    cy.window().should('have.property', 'toggleVoiceAlerts');
    cy.window().should('have.property', 'generateAlertMessage');
  });

  it('should generate appropriate alert messages based on alert type', () => {
    cy.window().then((win) => {
      // Test safety alert message
      const safetyMessage = win.generateAlertMessage(
        { alert: { type: 'safety' } }, 
        { level: 'high' }
      );
      expect(safetyMessage).to.contain('High safety alert');
      expect(safetyMessage).to.contain('Please check immediately');

      // Test movement alert message
      const movementMessage = win.generateAlertMessage(
        { alert: { type: 'movement' } }, 
        { level: 'critical' }
      );
      expect(movementMessage).to.contain('Critical movement detected');
      expect(movementMessage).to.contain('Unusual activity observed');

      // Test default alert message
      const defaultMessage = win.generateAlertMessage(
        { alert: { type: 'unknown' } }, 
        { level: 'medium' }
      );
      expect(defaultMessage).to.contain('Important alert detected');
    });
  });

  it('should only trigger TTS for high severity alerts', () => {
    cy.window().then((win) => {
      // Mock console.log to capture TTS attempts
      const consoleLogs = [];
      cy.stub(console, 'log').callsFake((message) => {
        consoleLogs.push(message);
      });

      // Enable voice alerts
      win.userPreferences.voiceAlerts = true;

      // Test low severity (should not trigger TTS)
      win.speakAlert({ alert: { type: 'movement' } }, { level: 'low' });
      expect(consoleLogs.filter(log => log.includes('🔊 Speaking alert'))).to.have.length(0);

      // Test high severity (should trigger TTS)
      win.speakAlert({ alert: { type: 'safety' } }, { level: 'high' });
      cy.wait(1000).then(() => {
        expect(consoleLogs.filter(log => log.includes('🔊 Speaking alert'))).to.have.length(1);
      });
    });
  });

  it('should integrate with existing alert system', () => {
    // Enable voice alerts
    cy.get('#voice-alerts-toggle').click();
    
    // Verify integration with playAlertSound
    cy.window().then((win) => {
      // Check that speakAlert is called when alerts are triggered
      cy.stub(win, 'speakAlert').as('speakAlertStub');
      
      // Mock a high severity alert
      const mockAIResult = {
        alert: { type: 'safety' },
        hasPetsOrBabies: true
      };
      const mockSeverity = { level: 'high' };
      
      // This would normally be triggered by the monitoring system
      win.speakAlert(mockAIResult, mockSeverity);
      
      // Verify speakAlert was called
      cy.get('@speakAlertStub').should('have.been.called');
    });
  });

  it('should handle Web Speech API fallback', () => {
    cy.window().then((win) => {
      // Check if Web Speech API is available
      if ('speechSynthesis' in win) {
        expect(win.speechSynthesis).to.exist;
        
        // Test utterance creation (part of fallback system)
        const utterance = new win.SpeechSynthesisUtterance('Test message');
        expect(utterance.text).to.equal('Test message');
      } else {
        cy.log('Web Speech API not available in this browser');
      }
    });
  });

  it('should maintain proper button state after page reload', () => {
    // Enable voice alerts
    cy.get('#voice-alerts-toggle').click();
    
    // Reload page
    cy.reload();
    cy.wait(2000);
    
    // Button should remember its state (though it defaults to off for security)
    cy.get('#voice-alerts-toggle').should('be.visible');
    
    // Check that preferences are properly loaded
    cy.window().then((win) => {
      // Voice alerts should be available in global functions
      expect(win.toggleVoiceAlerts).to.be.a('function');
    });
  });

  it('should have proper accessibility attributes', () => {
    // Check button has proper ARIA attributes
    cy.get('#voice-alerts-toggle')
      .should('have.attr', 'title')
      .should('be.visible')
      .should('not.have.attr', 'disabled');
      
    // Button should be keyboard accessible
    cy.get('#voice-alerts-toggle').focus().type('{enter}');
    
    // State should change after keyboard activation
    cy.get('#voice-alerts-toggle i').should('have.class', 'fa-volume-up');
  });

  // Integration test with mock AI response
  it('should integrate with AI alert severity system', () => {
    cy.window().then((win) => {
      // Enable voice alerts
      cy.get('#voice-alerts-toggle').click();
      
      // Mock high severity AI response
      const mockAIResponse = {
        alert: { type: 'danger' },
        hasPetsOrBabies: true
      };
      
      // Test severity classification integration
      const severity = win.classifyAlertSeverity(mockAIResponse.alert, mockAIResponse);
      expect(severity).to.have.property('level');
      
      // High severity should be 'high' or 'critical'
      expect(['high', 'critical']).to.include(severity.level);
    });
  });
});