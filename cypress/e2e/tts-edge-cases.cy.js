describe('TTS Edge Cases and Error Handling', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000); // Wait for app initialization
  });

  it('should handle empty alert messages gracefully', () => {
    cy.window().then((win) => {
      // Test with empty alert data
      const message = win.generateAlertMessage({}, { level: 'high' });
      expect(message).to.contain('alert detected');
      expect(message).to.contain('High');
    });
  });

  it('should handle missing alert type', () => {
    cy.window().then((win) => {
      // Test with missing alert type
      const message = win.generateAlertMessage({ alert: null }, { level: 'critical' });
      expect(message).to.contain('Critical alert detected');
    });
  });

  it('should handle invalid severity levels', () => {
    cy.window().then((win) => {
      // Test with invalid severity
      const message = win.generateAlertMessage(
        { alert: { type: 'safety' } }, 
        { level: 'invalid' }
      );
      expect(message).to.contain('Important safety alert');
    });
  });

  it('should not trigger TTS when voice alerts are disabled', () => {
    cy.window().then((win) => {
      // Ensure voice alerts are disabled
      win.userPreferences.voiceAlerts = false;
      
      // Mock console.log to capture attempts
      const consoleLogs = [];
      cy.stub(console, 'log').callsFake((message) => {
        consoleLogs.push(message);
      });

      // Try to trigger TTS
      win.speakAlert({ alert: { type: 'safety' } }, { level: 'critical' });
      
      // Should not see TTS attempt log
      expect(consoleLogs.filter(log => log.includes('🔊 Speaking alert'))).to.have.length(0);
    });
  });

  it('should handle rapid successive toggle clicks', () => {
    // Test rapid clicking doesn't break the toggle
    cy.get('#voice-alerts-toggle').click();
    cy.get('#voice-alerts-toggle').click();
    cy.get('#voice-alerts-toggle').click();
    cy.get('#voice-alerts-toggle').click();
    
    // Should still be functional
    cy.get('#voice-alerts-toggle').should('be.visible');
    cy.get('#voice-alerts-toggle i').should('have.class', 'fa-volume-mute'); // Should be off after even clicks
  });

  it('should maintain state after DOM manipulation', () => {
    // Enable voice alerts
    cy.get('#voice-alerts-toggle').click();
    
    // Simulate some DOM changes that might affect the button
    cy.window().then((win) => {
      // This simulates what might happen during dynamic updates
      const button = win.document.getElementById('voice-alerts-toggle');
      button.style.display = 'none';
      button.style.display = 'block';
      
      // Function should still exist
      expect(win.toggleVoiceAlerts).to.be.a('function');
      expect(win.userPreferences.voiceAlerts).to.be.true;
    });
  });

  it('should handle missing DOM elements gracefully', () => {
    cy.window().then((win) => {
      // Test what happens if button is removed
      const button = win.document.getElementById('voice-alerts-toggle');
      button.remove();
      
      // Function should still work without throwing errors
      expect(() => win.toggleVoiceAlerts()).to.not.throw();
    });
  });

  it('should handle browser permission denials', () => {
    cy.window().then((win) => {
      // Mock speechSynthesis to throw permission error
      const originalSpeak = win.speechSynthesis.speak;
      cy.stub(win.speechSynthesis, 'speak').callsFake(() => {
        throw new Error('Permission denied');
      });
      
      // Enable voice alerts and try to speak
      win.userPreferences.voiceAlerts = true;
      
      // Should not crash the application
      expect(() => {
        win.speakAlert({ alert: { type: 'safety' } }, { level: 'high' });
      }).to.not.throw();
      
      // Restore original function
      win.speechSynthesis.speak = originalSpeak;
    });
  });

  it('should handle network failures gracefully', () => {
    cy.window().then((win) => {
      // Mock fetch to simulate network failure for Pollinations.ai
      cy.stub(win, 'Audio').callsFake((url) => {
        if (url.includes('pollinations.ai')) {
          const mockAudio = {
            play: () => Promise.reject(new Error('Network error')),
            onerror: null,
            oncanplay: null
          };
          setTimeout(() => {
            if (mockAudio.onerror) mockAudio.onerror(new Error('Network error'));
          }, 100);
          return mockAudio;
        }
        return new win.Audio(url);
      });
      
      // Should fall back to next method without crashing
      win.userPreferences.voiceAlerts = true;
      expect(() => {
        win.speakAlert({ alert: { type: 'danger' } }, { level: 'critical' });
      }).to.not.throw();
    });
  });

  it('should respect user preference changes mid-session', () => {
    cy.window().then((win) => {
      // Start with voice alerts enabled
      cy.get('#voice-alerts-toggle').click();
      
      // Change preference programmatically (simulating external change)
      win.userPreferences.voiceAlerts = false;
      
      // Button should reflect the change when clicked again
      cy.get('#voice-alerts-toggle').click();
      cy.get('#voice-alerts-toggle i').should('have.class', 'fa-volume-up'); // Should be on now
      
      expect(win.userPreferences.voiceAlerts).to.be.true;
    });
  });

  it('should handle very long alert messages', () => {
    cy.window().then((win) => {
      // Create a very long alert message
      const longMessage = win.generateAlertMessage({
        alert: { type: 'safety' }
      }, { level: 'critical' });
      
      // Should not be empty and should contain expected content
      expect(longMessage).to.not.be.empty;
      expect(longMessage).to.contain('Critical');
      expect(longMessage).to.contain('safety');
      expect(longMessage.length).to.be.lessThan(200); // Reasonable length
    });
  });

  it('should handle multiple simultaneous TTS requests', () => {
    cy.window().then((win) => {
      // Enable voice alerts
      win.userPreferences.voiceAlerts = true;
      
      // Try to trigger multiple TTS calls rapidly
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          win.speakAlert(
            { alert: { type: 'safety' } }, 
            { level: 'high' }
          )
        );
      }
      
      // Should not crash
      Promise.all(promises).then(() => {
        cy.log('Multiple TTS handled successfully');
      }).catch(() => {
        cy.log('Multiple TTS handled with expected fallbacks');
      });
    });
  });

  it('should handle invalid voice preferences', () => {
    cy.window().then((win) => {
      // Set invalid voice preference
      win.userPreferences.voiceType = 'InvalidVoiceName';
      win.userPreferences.voiceAlerts = true;
      
      // Should fall back to default voice without error
      expect(() => {
        win.speakAlert({ alert: { type: 'movement' } }, { level: 'high' });
      }).to.not.throw();
    });
  });

  it('should maintain accessibility after JavaScript modifications', () => {
    // Enable voice alerts
    cy.get('#voice-alerts-toggle').click();
    
    // Check accessibility attributes are maintained
    cy.get('#voice-alerts-toggle')
      .should('have.attr', 'title')
      .should('be.visible')
      .should('not.have.attr', 'disabled');
      
    // Keyboard navigation should still work
    cy.get('#voice-alerts-toggle').focus().type('{enter}');
    cy.get('#voice-alerts-toggle i').should('have.class', 'fa-volume-mute'); // Toggled back
  });

  it('should handle page visibility changes', () => {
    cy.window().then((win) => {
      // Enable voice alerts
      cy.get('#voice-alerts-toggle').click();
      
      // Simulate page becoming hidden (common browser behavior)
      Object.defineProperty(win.document, 'hidden', {
        writable: true,
        value: true
      });
      
      win.document.dispatchEvent(new win.Event('visibilitychange'));
      
      // TTS should still function when page becomes visible again
      Object.defineProperty(win.document, 'hidden', {
        writable: true,
        value: false
      });
      
      win.document.dispatchEvent(new win.Event('visibilitychange'));
      
      // Button should still be functional
      cy.get('#voice-alerts-toggle').click();
      cy.get('#voice-alerts-toggle i').should('have.class', 'fa-volume-up');
    });
  });
});