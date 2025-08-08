describe('Alert Severity Classification System', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(1000); // Allow app to initialize
  });

  it('should classify alert severity based on alert type and conditions', () => {
    cy.window().then((win) => {
      // Test basic severity classification
      
      // Safe alert
      const safeAlert = { type: 'safe', message: 'All clear' };
      const safeResults = { objects: [], temporalAnalysis: { hasMovement: false } };
      const safeSeverity = win.classifyAlertSeverity(safeAlert, safeResults);
      
      expect(safeSeverity.level).to.equal('minimal');
      expect(safeSeverity.score).to.be.at.most(2);
      expect(safeSeverity.priority).to.equal('LOW');
      
      // Warning alert
      const warningAlert = { type: 'warning', message: 'Baby near electrical outlet' };
      const warningResults = { 
        objects: [{ type: 'Baby', state: 'Crawling', confidence: 0.9 }],
        temporalAnalysis: { hasMovement: true, movementLevel: 'medium' }
      };
      const warningSeverity = win.classifyAlertSeverity(warningAlert, warningResults);
      
      expect(warningSeverity.level).to.be.oneOf(['medium', 'high', 'critical']);
      expect(warningSeverity.score).to.be.at.least(4);
      
      // Danger alert
      const dangerAlert = { type: 'danger', message: 'Immediate falling risk detected' };
      const dangerResults = { 
        objects: [{ type: 'Baby', state: 'Climbing on furniture', confidence: 0.8 }],
        temporalAnalysis: { hasMovement: true, movementLevel: 'high' }
      };
      const dangerSeverity = win.classifyAlertSeverity(dangerAlert, dangerResults);
      
      expect(dangerSeverity.level).to.be.oneOf(['high', 'critical']);
      expect(dangerSeverity.score).to.be.at.least(7);
      expect(dangerSeverity.priority).to.equal('HIGH');
    });
  });

  it('should increase severity based on danger keywords', () => {
    cy.window().then((win) => {
      const baseAlert = { type: 'warning', message: 'Baby approaching stairs' };
      const dangerAlert = { type: 'warning', message: 'Immediate falling risk - baby on stairs' };
      
      const baseResults = { objects: [], temporalAnalysis: { hasMovement: false } };
      
      const baseSeverity = win.classifyAlertSeverity(baseAlert, baseResults);
      const dangerSeverity = win.classifyAlertSeverity(dangerAlert, baseResults);
      
      expect(dangerSeverity.score).to.be.greaterThan(baseSeverity.score);
    });
  });

  it('should adjust severity based on movement analysis', () => {
    cy.window().then((win) => {
      const alert = { type: 'warning', message: 'Baby detected' };
      
      const stableResults = { 
        objects: [{ type: 'Baby', state: 'Sleeping', confidence: 0.9 }],
        temporalAnalysis: { hasMovement: false, movementLevel: 'none' }
      };
      
      const movingResults = { 
        objects: [{ type: 'Baby', state: 'Crawling', confidence: 0.9 }],
        temporalAnalysis: { hasMovement: true, movementLevel: 'high' }
      };
      
      const stableSeverity = win.classifyAlertSeverity(alert, stableResults);
      const movingSeverity = win.classifyAlertSeverity(alert, movingResults);
      
      expect(movingSeverity.score).to.be.greaterThan(stableSeverity.score);
    });
  });

  it('should increase severity for baby-specific concerns', () => {
    cy.window().then((win) => {
      const alert = { type: 'warning', message: 'Subject detected' };
      
      const petResults = { 
        objects: [{ type: 'Dog', state: 'Playing', confidence: 0.9 }],
        temporalAnalysis: { hasMovement: false }
      };
      
      const babyResults = { 
        objects: [{ type: 'Baby', state: 'Playing', confidence: 0.9 }],
        temporalAnalysis: { hasMovement: false }
      };
      
      const petSeverity = win.classifyAlertSeverity(alert, petResults);
      const babySeverity = win.classifyAlertSeverity(alert, babyResults);
      
      expect(babySeverity.score).to.be.greaterThan(petSeverity.score);
    });
  });

  it('should create appropriate severity displays', () => {
    cy.window().then((win) => {
      const criticalSeverity = { level: 'critical', score: 10, priority: 'HIGH' };
      const lowSeverity = { level: 'low', score: 2, priority: 'LOW' };
      
      const criticalDisplay = win.createSeverityDisplay(criticalSeverity, { type: 'danger', message: 'Test' });
      const lowDisplay = win.createSeverityDisplay(lowSeverity, { type: 'safe', message: 'Test' });
      
      // Critical should have red styling and multiple indicators
      expect(criticalDisplay.badge).to.include('🚨 CRITICAL');
      expect(criticalDisplay.badge).to.include('bg-red-600');
      expect(criticalDisplay.indicator).to.include('SEVERITY 10/10');
      expect(criticalDisplay.indicator).to.include('bg-red-600');
      
      // Low should have blue/gray styling
      expect(lowDisplay.badge).to.include('🟢 LOW');
      expect(lowDisplay.badge).to.include('bg-blue-500');
      expect(lowDisplay.indicator).to.include('SEVERITY 2/10');
    });
  });

  it('should play different sound patterns for different severities', () => {
    // Open preferences and ensure sound is enabled
    cy.get('#preferences-btn').click();
    cy.get('#sound-on').check();
    cy.get('#preferences-save').click();
    
    cy.window().then((win) => {
      // Mock audio context to test sound patterns
      let audioContextCalls = [];
      const originalAudioContext = win.AudioContext || win.webkitAudioContext;
      
      win.AudioContext = win.webkitAudioContext = function() {
        const mockContext = {
          currentTime: 0,
          createOscillator: () => {
            const mockOscillator = {
              connect: () => {},
              frequency: { 
                value: 0,
                setValueAtTime: () => {},
                linearRampToValueAtTime: () => {}
              },
              start: (time) => audioContextCalls.push({ action: 'start', time }),
              stop: (time) => audioContextCalls.push({ action: 'stop', time })
            };
            return mockOscillator;
          },
          createGain: () => ({
            connect: () => {},
            gain: { value: 0 }
          })
        };
        return mockContext;
      };
      
      // Test different severity levels
      win.playAlertSound('minimal');
      expect(audioContextCalls.length).to.equal(2); // 1 beep = start + stop
      
      audioContextCalls = [];
      win.playAlertSound('critical');
      expect(audioContextCalls.length).to.equal(8); // 4 beeps = 4 * (start + stop)
      
      // Restore original AudioContext
      win.AudioContext = win.webkitAudioContext = originalAudioContext;
    });
  });

  it('should integrate severity classification with displayResults', () => {
    // Test integration by directly calling displayResults with mock data
    cy.window().then((win) => {
      const mockResults = {
        scene: 'A test scene with a baby',
        objects: [{ type: 'Baby', state: 'Crawling near stairs', confidence: 0.85 }],
        alert: { type: 'warning', message: 'Baby approaching potentially dangerous area' },
        hasPetsOrBabies: true,
        temporalAnalysis: { hasMovement: true, movementLevel: 'high' }
      };
      
      // Call displayResults directly to test the integration
      win.displayResults(mockResults);
      
      // Check that severity indicators are now displayed
      cy.get('#safety-assessment-display').should('be.visible');
      cy.get('#safety-assessment-display').should('contain.text', 'SEVERITY');
      
      // Check for severity badge in the updated display
      cy.get('#safety-assessment-display').within(() => {
        cy.get('span').should('exist').then(($badges) => {
          const badgeText = $badges.text();
          expect(badgeText).to.match(/(MINIMAL|LOW|MEDIUM|HIGH|CRITICAL)/);
        });
        
        // Check for severity bar indicators
        cy.get('div[class*="w-1 h-4"]').should('have.length', 10); // 10 severity bars
      });
    });
  });

  it('should handle low confidence alerts appropriately', () => {
    cy.window().then((win) => {
      const alert = { type: 'danger', message: 'Potential hazard detected' };
      
      const highConfidenceResults = { 
        objects: [{ type: 'Baby', state: 'Sleeping', confidence: 0.95 }],
        temporalAnalysis: { hasMovement: false }
      };
      
      const lowConfidenceResults = { 
        objects: [{ type: 'Baby', state: 'Sleeping', confidence: 0.4 }],
        temporalAnalysis: { hasMovement: false }
      };
      
      const highConfSeverity = win.classifyAlertSeverity(alert, highConfidenceResults);
      const lowConfSeverity = win.classifyAlertSeverity(alert, lowConfidenceResults);
      
      // Low confidence in dangerous situations should increase severity
      // Note: the max severity is capped at 10, so this might be equal if both hit the cap
      expect(lowConfSeverity.score).to.be.at.least(highConfSeverity.score);
    });
  });
});