describe('Enhanced AI Prompt System', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(1000); // Allow app to initialize
  });

  it('should integrate user preferences with AI prompts', () => {
    cy.window().then((win) => {
      // Test that enhanced prompt function exists and uses preferences
      expect(win.createEnhancedAIPrompt).to.be.a('function');
      
      // Mock temporal analysis
      const mockTemporalAnalysis = {
        hasMovement: true,
        movementLevel: 'medium',
        temporalContext: 'Movement detected between frames'
      };
      
      // Test with different sensitivity levels by mocking the global functions
      // Mock high sensitivity
      win.getSensitivityMultiplier = () => 1.5;
      const highSensitivityPrompt = win.createEnhancedAIPrompt(mockTemporalAnalysis);
      expect(highSensitivityPrompt).to.include('SENSITIVE detection');
      expect(highSensitivityPrompt).to.include('moderate confidence levels (>0.6)');
      
      // Mock low sensitivity  
      win.getSensitivityMultiplier = () => 0.5;
      const lowSensitivityPrompt = win.createEnhancedAIPrompt(mockTemporalAnalysis);
      expect(lowSensitivityPrompt).to.include('CONSERVATIVE detection');
      expect(lowSensitivityPrompt).to.include('high confidence levels (>0.8)');
      
      // Mock medium sensitivity
      win.getSensitivityMultiplier = () => 1.0;
      const mediumSensitivityPrompt = win.createEnhancedAIPrompt(mockTemporalAnalysis);
      expect(mediumSensitivityPrompt).to.include('BALANCED detection');
      expect(mediumSensitivityPrompt).to.include('standard confidence thresholds (>0.7)');
    });
  });

  it('should generate different prompts for movement vs stable scenes', () => {
    cy.window().then((win) => {
      const movementAnalysis = {
        hasMovement: true,
        movementLevel: 'high',
        temporalContext: 'Significant movement detected'
      };
      
      const stableAnalysis = {
        hasMovement: false,
        movementLevel: 'none',
        temporalContext: 'Scene appears stable'
      };
      
      const movementPrompt = win.createEnhancedAIPrompt(movementAnalysis);
      const stablePrompt = win.createEnhancedAIPrompt(stableAnalysis);
      
      // Movement prompts should focus on dynamic hazards
      expect(movementPrompt).to.include('MOVEMENT DETECTED');
      expect(movementPrompt).to.include('dynamic hazards');
      expect(movementPrompt).to.include('trajectory');
      
      // Stable prompts should focus on static hazards
      expect(stablePrompt).to.include('STABLE SCENE');
      expect(stablePrompt).to.include('static hazards');
      expect(stablePrompt).to.include('positioning safety');
    });
  });

  it('should include comprehensive safety focus areas', () => {
    cy.window().then((win) => {
      const analysis = {
        hasMovement: false,
        movementLevel: 'none',
        temporalContext: 'Test scene'
      };
      
      const prompt = win.createEnhancedAIPrompt(analysis);
      
      // Check for key safety areas
      expect(prompt).to.include('stairs, windows, doors');
      expect(prompt).to.include('Electrical outlets, cords');
      expect(prompt).to.include('choking hazards');
      expect(prompt).to.include('Sharp furniture corners');
      expect(prompt).to.include('Temperature hazards');
      expect(prompt).to.include('toxic plants');
    });
  });

  it('should require specific response format', () => {
    cy.window().then((win) => {
      const analysis = {
        hasMovement: true,
        movementLevel: 'medium',
        temporalContext: 'Test context'
      };
      
      const prompt = win.createEnhancedAIPrompt(analysis);
      
      // Check for format requirements
      expect(prompt).to.include('Return ONLY the JSON object');
      expect(prompt).to.include('no markdown');
      expect(prompt).to.include('scene_description');
      expect(prompt).to.include('subjects');
      expect(prompt).to.include('safety_assessment');
      expect(prompt).to.include('EXACTLY one of: "Baby", "Toddler", "Dog", "Cat", "Bird", "Other Pet"');
    });
  });

  it('should handle alert preferences correctly', () => {
    // Open preferences and modify alert settings
    cy.get('#preferences-btn').click();
    cy.get('#alert-movement').uncheck();
    cy.get('#alert-safety').check();
    cy.get('#alert-unusual').check();
    cy.get('#preferences-save').click();

    // Test that preferences affect alert decisions
    cy.window().then((win) => {
      // Mock functions should be available
      expect(win.isAlertEnabled).to.be.a('function');
      
      // Test alert preferences
      expect(win.isAlertEnabled('movement')).to.be.false;
      expect(win.isAlertEnabled('safety')).to.be.true;
      expect(win.isAlertEnabled('unusual')).to.be.true;
    });
  });

  it('should update movement threshold in temporal analysis', () => {
    // Change movement threshold in preferences
    cy.get('#preferences-btn').click();
    cy.get('#movement-threshold').invoke('val', '1500').trigger('input');
    cy.get('#preferences-save').click();

    // Test that the threshold is applied
    cy.window().then((win) => {
      expect(win.getMovementThreshold()).to.equal(1500);
      
      // Test temporal analysis with new threshold
      const frameHistory = [
        'data:image/png;base64,' + 'a'.repeat(1000), // Frame 1
        'data:image/png;base64,' + 'a'.repeat(1400)  // Frame 2 - difference of 400
      ];
      
      const analysis = win.analyzeTemporalChanges(frameHistory);
      // With threshold of 1500, difference of 400 should not trigger movement
      expect(analysis.hasMovement).to.be.false;
      expect(analysis.movementLevel).to.equal('none');
    });
  });

  it('should provide better subject type specificity', () => {
    cy.window().then((win) => {
      const analysis = {
        hasMovement: true,
        movementLevel: 'low',
        temporalContext: 'Test'
      };
      
      const prompt = win.createEnhancedAIPrompt(analysis);
      
      // Should distinguish between Baby and Toddler
      expect(prompt).to.include('"Baby", "Toddler"');
      expect(prompt).to.include('age-appropriate hazards');
      expect(prompt).to.include('babies vs toddlers have different risk profiles');
    });
  });
});