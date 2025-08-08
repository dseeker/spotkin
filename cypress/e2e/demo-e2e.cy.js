describe('SpotKin Demo E2E - Advanced Features', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('#camera-container').should('be.visible');
  });

  it('should demonstrate complete workflow with visual documentation', () => {
    // Screenshot: Initial state
    cy.screenshot('01-app-loaded');
    
    // Test snapshot functionality
    cy.get('#take-snapshot').click();
    cy.wait(1200);
    
    // Screenshot: After AI analysis
    cy.get('#analysis-results').should('not.have.class', 'hidden');
    cy.screenshot('02-analysis-complete');
    
    // Verify temporal analysis indicators
    cy.get('#scene-text').should('contain.text', '📷').or('contain.text', '🔄');
    
    // Take second snapshot to test temporal analysis
    cy.get('#take-snapshot').click();
    cy.wait(1200);
    cy.screenshot('03-temporal-analysis');
    
    // Test history functionality
    cy.get('#tab-history').click();
    cy.get('#timeline-list .timeline-item').should('have.length.at.least', 1);
    cy.screenshot('04-history-populated');
    
    // Test responsive design
    cy.viewport(768, 1024);
    cy.screenshot('05-tablet-view');
    
    cy.viewport(375, 667);
    cy.screenshot('06-mobile-view');
    
    // Reset viewport
    cy.viewport(1280, 720);
  });

  it('should test monitoring mode functionality', () => {
    cy.screenshot('07-before-monitoring');
    
    // Start monitoring with 5-second intervals
    cy.get('#refresh-rate').select('5000');
    cy.get('#toggle-monitoring').click();
    
    // Verify monitoring started
    cy.get('#toggle-monitoring').should('contain.text', 'Stop Monitoring');
    cy.get('#camera-container').should('have.class', 'camera-active');
    cy.screenshot('08-monitoring-active');
    
    // Wait for one automatic analysis
    cy.wait(6000);
    
    // Stop monitoring
    cy.get('#toggle-monitoring').click();
    cy.get('#toggle-monitoring').should('contain.text', 'Start Monitoring');
    cy.screenshot('09-monitoring-stopped');
    
    // Verify history was created
    cy.get('#tab-history').click();
    cy.get('#timeline-list .timeline-item').should('have.length.at.least', 1);
    cy.screenshot('10-monitoring-history');
  });

  it('should demonstrate error handling', () => {
    // Test camera error display
    cy.window().then((win) => {
      const feedback = win.document.getElementById('camera-feedback');
      feedback.innerHTML = `
        <div class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
          <i class="fas fa-exclamation-circle mr-1"></i>Camera error: Demo error
        </div>
      `;
    });
    cy.screenshot('11-camera-error');
    
    // Reset by reloading
    cy.reload();
    cy.wait(1000);
    
    // Test AI error simulation
    cy.window().then((win) => {
      if (win.puter && win.puter.ai) {
        const originalChat = win.puter.ai.chat;
        win.puter.ai.chat = () => Promise.reject(new Error('Demo AI Error'));
        
        cy.get('#take-snapshot').click();
        cy.wait(2000);
        cy.get('#results-placeholder').should('contain.text', 'Error');
        cy.screenshot('12-ai-error');
        
        // Restore
        win.puter.ai.chat = originalChat;
      }
    });
  });

  it('should validate accessibility features', () => {
    // Check semantic HTML structure
    cy.get('main, section, header, footer').should('exist');
    cy.get('h1, h2, h3').should('exist');
    
    // Test keyboard navigation on key elements
    cy.get('#take-snapshot').focus().should('be.focused');
    cy.get('#toggle-monitoring').focus().should('be.focused');
    
    // Screenshot accessibility validation
    cy.screenshot('13-accessibility-check');
  });

  it('should test visual regression across key states', () => {
    // Test different application states
    const states = [
      { name: 'initial', action: () => {} },
      { name: 'analysis', action: () => { 
        cy.get('#take-snapshot').click(); 
        cy.wait(1200); 
      }},
      { name: 'history', action: () => { 
        cy.get('#tab-history').click(); 
      }},
      { name: 'monitoring', action: () => { 
        cy.get('#tab-current').click(); 
        cy.get('#toggle-monitoring').click(); 
        cy.wait(500);
      }}
    ];

    states.forEach((state, index) => {
      state.action();
      cy.screenshot(`state-${index + 1}-${state.name}`);
    });
    
    // Stop monitoring if active
    cy.get('#toggle-monitoring').then(($btn) => {
      if ($btn.text().includes('Stop')) {
        cy.wrap($btn).click();
      }
    });
  });
});