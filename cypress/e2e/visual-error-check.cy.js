describe('Visual Error Check', () => {
  it('should display errors on page for manual inspection', () => {
    cy.visit('/');
    
    // Add error display to page
    cy.window().then((win) => {
      // Create error display area
      const errorDiv = win.document.createElement('div');
      errorDiv.id = 'cypress-error-display';
      errorDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 400px;
        max-height: 80vh;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 20px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        overflow-y: auto;
      `;
      win.document.body.appendChild(errorDiv);
      
      // Function to update error display
      win.updateErrorDisplay = () => {
        const cypressErrors = win.cypressConsoleErrors || [];
        const appErrors = win.testErrors || [];
        const allErrors = [...cypressErrors, ...appErrors];
        
        let html = '<h3>🚨 Error Report</h3>';
        html += `<p>Total: ${allErrors.length} errors</p>`;
        html += `<p>Cypress: ${cypressErrors.length} | App: ${appErrors.length}</p><hr>`;
        
        if (allErrors.length === 0) {
          html += '<p style="color: #4CAF50;">✅ No errors found!</p>';
        } else {
          allErrors.slice(0, 10).forEach((error, index) => {
            const location = error.filename || error.source || 'unknown';
            const line = error.lineno || '?';
            html += `<div style="margin-bottom: 10px; border-left: 3px solid #f44336; padding-left: 8px;">`;
            html += `<strong>${index + 1}. [${error.type}]</strong><br>`;
            html += `<em>${error.message}</em><br>`;
            html += `<small>📍 ${location}:${line}</small>`;
            html += `</div>`;
          });
          
          if (allErrors.length > 10) {
            html += `<p>... and ${allErrors.length - 10} more errors</p>`;
          }
        }
        
        errorDiv.innerHTML = html;
      };
      
      // Initial update
      win.updateErrorDisplay();
    });
    
    cy.startConsoleErrorDetection();
    
    // Wait and update display multiple times
    cy.wait(2000);
    cy.window().then(win => win.updateErrorDisplay());
    
    cy.wait(3000);
    cy.window().then(win => win.updateErrorDisplay());
    
    cy.wait(3000);
    cy.window().then(win => win.updateErrorDisplay());
    
    // Take screenshot to capture error display
    cy.screenshot('error-display', { capture: 'fullPage' });
    
    // Also log to Cypress console
    cy.window().then((win) => {
      const cypressErrors = win.cypressConsoleErrors || [];
      const appErrors = win.testErrors || [];
      
      cypressErrors.forEach((error, index) => {
        cy.log(`CYPRESS ERROR ${index + 1}: [${error.type}] ${error.message}`);
        if (error.filename) {
          cy.log(`  → ${error.filename}:${error.lineno}`);
        }
      });
      
      appErrors.forEach((error, index) => {
        cy.log(`APP ERROR ${index + 1}: [${error.type}] ${error.message}`);
        if (error.source) {
          cy.log(`  → ${error.source}:${error.lineno}`);
        }
      });
      
      cy.log(`TOTAL ERRORS: ${cypressErrors.length + appErrors.length}`);
    });
  });
});