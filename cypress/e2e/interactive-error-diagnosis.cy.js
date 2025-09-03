describe('Interactive Error Diagnosis', () => {
  it('should show detailed error information on screen for manual review', () => {
    cy.visit('/');
    
    // Add detailed error display to page
    cy.window().then((win) => {
      // Create comprehensive error display
      const errorDiv = win.document.createElement('div');
      errorDiv.id = 'error-diagnosis-panel';
      errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 50%;
        height: 100vh;
        background: rgba(0,0,0,0.95);
        color: #00ff00;
        padding: 20px;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        z-index: 99999;
        overflow-y: auto;
        border-left: 3px solid #00ff00;
      `;
      
      errorDiv.innerHTML = `
        <div style="color: #00ff00; font-weight: bold; margin-bottom: 20px;">
          🔍 LIVE ERROR DIAGNOSIS PANEL
          <div style="font-size: 10px; color: #888;">Waiting for errors...</div>
        </div>
        <div id="error-content">No errors detected yet...</div>
      `;
      
      win.document.body.appendChild(errorDiv);
      
      // Enhanced error display function
      win.displayDetailedErrors = () => {
        const cypressErrors = win.cypressConsoleErrors || [];
        const appErrors = win.testErrors || [];
        const allErrors = [...cypressErrors, ...appErrors];
        
        let html = `
          <div style="color: #00ff00; font-weight: bold; margin-bottom: 15px;">
            🔍 ERROR DIAGNOSIS REPORT
            <div style="color: #888; font-size: 10px;">Generated: ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div style="color: #yellow; margin-bottom: 10px;">
            📊 SUMMARY: ${allErrors.length} total errors found
            <br>├─ Cypress: ${cypressErrors.length}
            <br>└─ App Handler: ${appErrors.length}
          </div>
          
          <hr style="border-color: #333; margin: 15px 0;">
        `;
        
        if (allErrors.length === 0) {
          html += `<div style="color: #4CAF50; font-size: 14px;">✅ NO ERRORS FOUND!</div>`;
        } else {
          allErrors.forEach((error, index) => {
            const isScriptError = error.message.includes('Script error');
            const isPuterError = error.message.toLowerCase().includes('puter') || 
                               error.message.includes('CustomElementRegistry');
            const isCritical = !isScriptError && !isPuterError && 
                             !error.message.includes('ResizeObserver');
            
            const severity = isCritical ? '🚨 CRITICAL' : 
                           isScriptError ? '⚠️ GENERIC' : 
                           isPuterError ? 'ℹ️ EXTERNAL' : '⚠️ MINOR';
            
            const color = isCritical ? '#ff4444' : 
                         isScriptError ? '#ffaa44' : 
                         isPuterError ? '#4488ff' : '#888';
            
            html += `
              <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid ${color}; background: rgba(255,255,255,0.05);">
                <div style="color: ${color}; font-weight: bold;">
                  ERROR #${index + 1} - ${severity}
                </div>
                
                <div style="margin: 5px 0;">
                  <strong>Type:</strong> <span style="color: #ccc;">${error.type}</span>
                </div>
                
                <div style="margin: 5px 0;">
                  <strong>Message:</strong><br>
                  <span style="color: #fff; background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 3px;">
                    "${error.message}"
                  </span>
                </div>
                
                <div style="margin: 5px 0; font-size: 10px; color: #999;">
                  📍 <strong>Location:</strong> ${error.filename || error.source || 'unknown'}:${error.lineno || '?'}:${error.colno || '?'}
                </div>
                
                <div style="margin: 5px 0; font-size: 10px; color: #999;">
                  🕐 <strong>Time:</strong> ${error.timestamp ? new Date(error.timestamp).toLocaleTimeString() : 'unknown'}
                </div>
            `;
            
            // Add specific analysis
            if (isScriptError) {
              html += `
                <div style="margin: 5px 0; padding: 5px; background: rgba(255,170,68,0.1); border-radius: 3px; font-size: 10px;">
                  💡 <strong>Analysis:</strong> Generic "Script error" - usually from external resources or CORS. Often harmless.
                </div>
              `;
            } else if (isPuterError) {
              html += `
                <div style="margin: 5px 0; padding: 5px; background: rgba(68,136,255,0.1); border-radius: 3px; font-size: 10px;">
                  💡 <strong>Analysis:</strong> Puter.js/external service error. Doesn't affect core app functionality.
                </div>
              `;
            } else if (isCritical) {
              html += `
                <div style="margin: 5px 0; padding: 5px; background: rgba(255,68,68,0.1); border-radius: 3px; font-size: 10px;">
                  🚨 <strong>Analysis:</strong> CRITICAL ERROR - This needs immediate attention as it may affect functionality.
                </div>
              `;
            }
            
            if (error.stack && error.stack !== error.message) {
              const stackLines = error.stack.split('\n').slice(0, 3);
              html += `
                <div style="margin: 5px 0; font-size: 9px; color: #666;">
                  📋 <strong>Stack (top 3 lines):</strong><br>
                  ${stackLines.map(line => `<div style="margin-left: 10px;">${line}</div>`).join('')}
                </div>
              `;
            }
            
            html += `</div>`;
          });
          
          // Add recommendations
          const criticalErrors = allErrors.filter(e => 
            !e.message.includes('Script error') &&
            !e.message.toLowerCase().includes('puter') &&
            !e.message.includes('CustomElementRegistry')
          );
          
          html += `
            <hr style="border-color: #333; margin: 15px 0;">
            <div style="color: #00ff00; font-weight: bold;">
              🎯 RECOMMENDATIONS:
            </div>
          `;
          
          if (criticalErrors.length > 0) {
            html += `
              <div style="color: #ff4444; margin: 10px 0;">
                🚨 ${criticalErrors.length} CRITICAL ERROR(S) REQUIRE IMMEDIATE ATTENTION
              </div>
            `;
            criticalErrors.forEach((error, index) => {
              html += `
                <div style="margin: 5px 0; font-size: 10px; color: #ff4444;">
                  ${index + 1}. Fix: ${error.message} (${error.filename || error.source}:${error.lineno})
                </div>
              `;
            });
          } else {
            html += `
              <div style="color: #4CAF50; margin: 10px 0;">
                ✅ No critical errors found - all errors are expected/harmless
              </div>
            `;
          }
        }
        
        win.document.getElementById('error-content').innerHTML = html;
      };
      
      // Auto-refresh the display
      win.errorDisplayInterval = setInterval(() => {
        win.displayDetailedErrors();
      }, 2000);
    });
    
    cy.startConsoleErrorDetection();
    
    // Wait and update display multiple times
    cy.wait(3000);
    cy.window().then(win => win.displayDetailedErrors());
    
    cy.wait(3000);
    cy.window().then(win => win.displayDetailedErrors());
    
    cy.wait(3000);
    cy.window().then(win => win.displayDetailedErrors());
    
    // Take a final screenshot showing the diagnosis
    cy.screenshot('error-diagnosis-panel', { capture: 'fullPage' });
    
    // Log summary to Cypress console as well
    cy.window().then((win) => {
      const cypressErrors = win.cypressConsoleErrors || [];
      const appErrors = win.testErrors || [];
      const allErrors = [...cypressErrors, ...appErrors];
      
      cy.log(`🔍 DIAGNOSIS COMPLETE: ${allErrors.length} total errors`);
      
      allErrors.forEach((error, index) => {
        cy.log(`ERROR ${index + 1}: [${error.type}] "${error.message}" at ${error.filename || error.source}:${error.lineno}`);
      });
      
      // Clear interval
      if (win.errorDisplayInterval) {
        clearInterval(win.errorDisplayInterval);
      }
    });
  });
});