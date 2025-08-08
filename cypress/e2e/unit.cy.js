describe('Unit Tests for parseAIResponse', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.window().should('have.property', 'parseAIResponse');
  });

  it('should correctly parse a valid AI response with subjects', () => {
    const mockResponse = JSON.stringify({
      scene_description: "A baby is sleeping peacefully in a crib.",
      subjects: [
        { type: "Baby", state: "Sleeping", confidence: 0.95 }
      ],
      safety_assessment: {
        level: "Safe",
        reason: "The baby is sleeping safely in the crib."
      }
    });

    cy.window().then((win) => {
      const result = win.parseAIResponse(mockResponse);

      expect(result.scene).to.equal("A baby is sleeping peacefully in a crib.");
      expect(result.objects).to.have.length(1);
      expect(result.objects[0].type).to.equal("Baby");
      expect(result.objects[0].state).to.equal("Sleeping");
      expect(result.objects[0].confidence).to.equal(0.95);
      expect(result.alert.type).to.equal("safe");
      expect(result.alert.message).to.equal("The baby is sleeping safely in the crib.");
      expect(result.hasPetsOrBabies).to.be.true;
    });
  });

  it('should correctly parse a valid AI response with no subjects', () => {
    const mockResponse = JSON.stringify({
      scene_description: "An empty room with a couch and a coffee table.",
      subjects: [],
      safety_assessment: {
        level: "Safe",
        reason: "No subjects detected in the scene."
      }
    });

    cy.window().then((win) => {
      const result = win.parseAIResponse(mockResponse);

      expect(result.scene).to.equal("An empty room with a couch and a coffee table.");
      expect(result.objects).to.have.length(0);
      expect(result.alert.type).to.equal("safe");
      expect(result.alert.message).to.equal("No subjects detected in the scene.");
      expect(result.hasPetsOrBabies).to.be.false;
    });
  });

  it('should handle warning level safety assessment', () => {
    const mockResponse = JSON.stringify({
      scene_description: "A baby is sitting on the floor near some electrical cords.",
      subjects: [
        { type: "Baby", state: "Sitting", confidence: 0.92 }
      ],
      safety_assessment: {
        level: "Warning",
        reason: "The baby is close to electrical cords, which could be a potential hazard."
      }
    });

    cy.window().then((win) => {
      const result = win.parseAIResponse(mockResponse);

      expect(result.alert.type).to.equal("warning");
      expect(result.alert.message).to.equal("The baby is close to electrical cords, which could be a potential hazard.");
    });
  });

  it('should handle danger level safety assessment', () => {
    const mockResponse = JSON.stringify({
      scene_description: "A pet is on a high ledge and at risk of falling.",
      subjects: [
        { type: "Dog", state: "On ledge", confidence: 0.85 }
      ],
      safety_assessment: {
        level: "Danger",
        reason: "A pet is on a high ledge and at risk of falling."
      }
    });

    cy.window().then((win) => {
      const result = win.parseAIResponse(mockResponse);

      expect(result.alert.type).to.equal("danger");
      expect(result.alert.message).to.equal("A pet is on a high ledge and at risk of falling.");
    });
  });

  it('should handle malformed JSON gracefully', () => {
    const malformedResponse = "This is not JSON";
    
    cy.window().then((win) => {
      const result = win.parseAIResponse(malformedResponse);

      expect(result.scene).to.equal(malformedResponse);
      expect(result.alert.type).to.equal("danger");
      expect(result.alert.message).to.include("Error parsing AI response");
    });
  });

  it('should handle JSON with missing required fields gracefully', () => {
    const incompleteResponse = JSON.stringify({
      scene_description: "A partial response.",
      subjects: []
      // safety_assessment is missing
    });

    cy.window().then((win) => {
      const result = win.parseAIResponse(incompleteResponse);

      expect(result.scene).to.equal("A partial response.");
      expect(result.alert.type).to.equal("danger");
      expect(result.alert.message).to.include("Error parsing AI response");
    });
  });

  it('should clean JSON string wrapped in ```json', () => {
    const wrappedResponse = "```json\n{\"scene_description\": \"Wrapped scene.\", \"subjects\": [], \"safety_assessment\": {\"level\": \"Safe\", \"reason\": \"\"}}\n```";
    
    cy.window().then((win) => {
      const result = win.parseAIResponse(wrappedResponse);

      expect(result.scene).to.equal("Wrapped scene.");
    });
  });
});

describe('Unit Tests for Temporal Analysis', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.window().should('have.property', 'analyzeTemporalChanges');
    cy.window().should('have.property', 'createEnhancedAIPrompt');
  });

  it('should handle insufficient frame history', () => {
    cy.window().then((win) => {
      const result = win.analyzeTemporalChanges([]);
      
      expect(result.hasMovement).to.be.false;
      expect(result.movementLevel).to.equal('none');
      expect(result.temporalContext).to.include('Insufficient frame history');
    });
  });

  it('should detect movement with frame size differences', () => {
    cy.window().then((win) => {
      // Create frames with significant size difference (>1000 chars)
      const smallFrame = 'data:image/png;base64,small';
      const largeFrame = 'data:image/png;base64,small' + 'x'.repeat(1100); // Add 1100 chars to exceed threshold
      
      const frameHistory = [smallFrame, largeFrame];
      
      const result = win.analyzeTemporalChanges(frameHistory);
      
      expect(result.hasMovement).to.be.true;
      expect(result.movementLevel).to.not.equal('none');
      expect(result.frameCount).to.equal(2);
    });
  });

  it('should detect stable scenes', () => {
    cy.window().then((win) => {
      const frameHistory = [
        'data:image/png;base64,identical',
        'data:image/png;base64,identical',
        'data:image/png;base64,identical'
      ];
      
      const result = win.analyzeTemporalChanges(frameHistory);
      
      expect(result.hasMovement).to.be.false;
      expect(result.movementLevel).to.equal('none');
      expect(result.temporalContext).to.include('stable');
    });
  });

  it('should create enhanced AI prompt with temporal context', () => {
    cy.window().then((win) => {
      const temporalAnalysis = {
        hasMovement: true,
        movementLevel: 'high',
        temporalContext: 'Significant changes detected',
        frameCount: 3
      };
      
      const prompt = win.createEnhancedAIPrompt(temporalAnalysis);
      
      expect(prompt).to.include('Temporal Context');
      expect(prompt).to.include('Significant changes detected');
      expect(prompt).to.include('high movement level');
      expect(prompt).to.include('movement has been detected');
    });
  });

  it('should create enhanced AI prompt for stable scenes', () => {
    cy.window().then((win) => {
      const temporalAnalysis = {
        hasMovement: false,
        movementLevel: 'low',
        temporalContext: 'Scene appears stable',
        frameCount: 3
      };
      
      const prompt = win.createEnhancedAIPrompt(temporalAnalysis);
      
      expect(prompt).to.include('Temporal Context');
      expect(prompt).to.include('Scene appears stable');
      expect(prompt).to.include('low movement level');
      expect(prompt).to.include('scene appears stable');
    });
  });
});

describe('Setup Wizard Unit Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    // Clear setup state
    cy.window().then((win) => {
      win.localStorage.removeItem('spotkin-setup-completed');
    });
  });

  it('should initialize SetupWizard with default properties', () => {
    cy.window().then((win) => {
      const wizard = new win.SetupWizard();
      
      expect(wizard.currentStep).to.equal(1);
      expect(wizard.totalSteps).to.equal(4);
      expect(wizard.setupData.monitorType).to.be.null;
      expect(wizard.setupData.cameraPosition).to.be.null;
      expect(wizard.setupData.monitoringZones).to.be.an('array').and.be.empty;
      expect(wizard.setupData.alertPreferences).to.be.an('object').and.be.empty;
      expect(wizard.setupData.completed).to.be.false;
    });
  });

  it('should correctly detect if setup should be shown', () => {
    cy.window().then((win) => {
      // First visit - should show setup
      win.localStorage.removeItem('spotkin-setup-completed');
      expect(win.SetupWizard.shouldShowSetup()).to.be.true;
      
      // After marking as completed - should not show
      win.localStorage.setItem('spotkin-setup-completed', 'true');
      expect(win.SetupWizard.shouldShowSetup()).to.be.false;
      
      // Explicitly set to false - should not show
      win.localStorage.setItem('spotkin-setup-completed', 'false');
      expect(win.SetupWizard.shouldShowSetup()).to.be.false;
    });
  });

  it('should validate monitor type selection correctly', () => {
    cy.window().then((win) => {
      const wizard = new win.SetupWizard();
      
      // Initially no monitor type selected
      expect(wizard.validateCurrentStep()).to.be.false;
      
      // After selecting monitor type
      wizard.setupData.monitorType = 'baby';
      expect(wizard.validateCurrentStep()).to.be.true;
      
      wizard.setupData.monitorType = 'pet';
      expect(wizard.validateCurrentStep()).to.be.true;
      
      wizard.setupData.monitorType = 'general';
      expect(wizard.validateCurrentStep()).to.be.true;
    });
  });

  it('should save setup data to localStorage correctly', () => {
    cy.window().then((win) => {
      const wizard = new win.SetupWizard();
      
      wizard.setupData = {
        monitorType: 'baby',
        cameraPosition: 'above-crib',
        monitoringZones: ['crib-safety'],
        alertPreferences: { crying: true, movement: true },
        completed: true
      };
      
      wizard.saveSetupData();
      
      // Verify data saved to localStorage
      const savedPrefs = JSON.parse(win.localStorage.getItem('spotkin-preferences'));
      expect(savedPrefs.monitorType).to.equal('baby');
      expect(savedPrefs.cameraPosition).to.equal('above-crib');
      
      const setupCompleted = win.localStorage.getItem('spotkin-setup-completed');
      expect(setupCompleted).to.equal('true');
    });
  });

  it('should integrate with existing preferences without overwriting', () => {
    cy.window().then((win) => {
      // Set existing preferences
      const existingPrefs = {
        sensitivity: 8,
        soundEnabled: true,
        notificationsEnabled: true,
        customSetting: 'preserved'
      };
      win.localStorage.setItem('spotkin-preferences', JSON.stringify(existingPrefs));
      
      const wizard = new win.SetupWizard();
      wizard.setupData = {
        monitorType: 'baby',
        cameraPosition: 'above-crib',
        monitoringZones: ['crib-safety'],
        alertPreferences: { crying: true },
        completed: true
      };
      
      wizard.saveSetupData();
      
      const updatedPrefs = JSON.parse(win.localStorage.getItem('spotkin-preferences'));
      
      // New setup data should be added
      expect(updatedPrefs.monitorType).to.equal('baby');
      expect(updatedPrefs.cameraPosition).to.equal('above-crib');
      
      // Existing preferences should be preserved
      expect(updatedPrefs.sensitivity).to.equal(8);
      expect(updatedPrefs.soundEnabled).to.be.true;
      expect(updatedPrefs.notificationsEnabled).to.be.true;
      expect(updatedPrefs.customSetting).to.equal('preserved');
    });
  });
});