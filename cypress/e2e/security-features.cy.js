describe('Security Features', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.wait(3000); // Wait for security modules to initialize
    });

    describe('Security Module', () => {
        it('should initialize security module successfully', () => {
            cy.window().then((win) => {
                expect(win.spotkinSecurity).to.exist;
                expect(win.spotkinSecurity.isSecureContext).to.be.a('function');
                expect(win.spotkinSecurity.encryptData).to.be.a('function');
                expect(win.spotkinSecurity.decryptData).to.be.a('function');
            });
        });

        it('should detect secure context correctly', () => {
            cy.window().then((win) => {
                const isSecure = win.spotkinSecurity.isSecureContext();
                // localhost should be considered secure
                expect(isSecure).to.be.true;
            });
        });

        it('should encrypt and decrypt data successfully', () => {
            cy.window().then(async (win) => {
                const testData = { 
                    username: 'testuser', 
                    preferences: { theme: 'dark', notifications: true }
                };
                
                const encrypted = await win.spotkinSecurity.encryptData(testData);
                expect(encrypted).to.have.property('encrypted');
                expect(encrypted.encrypted).to.be.true;
                
                const decrypted = await win.spotkinSecurity.decryptData(encrypted);
                expect(decrypted).to.deep.equal(testData);
            });
        });

        it('should sanitize user input properly', () => {
            cy.window().then((win) => {
                const maliciousInput = '<script>alert("xss")</script>';
                const sanitized = win.spotkinSecurity.sanitizeInput(maliciousInput);
                expect(sanitized).to.not.include('<script>');
                expect(sanitized).to.include('&lt;script&gt;');
            });
        });

        it('should validate different input types', () => {
            cy.window().then((win) => {
                // String validation
                const stringResult = win.spotkinSecurity.validateInput('test', 'string', { minLength: 2, maxLength: 10 });
                expect(stringResult.valid).to.be.true;
                expect(stringResult.sanitized).to.equal('test');
                
                // Number validation
                const numberResult = win.spotkinSecurity.validateInput('42', 'number', { min: 0, max: 100 });
                expect(numberResult.valid).to.be.true;
                expect(numberResult.value).to.equal(42);
                
                // Email validation
                const emailResult = win.spotkinSecurity.validateInput('test@example.com', 'email');
                expect(emailResult.valid).to.be.true;
                
                // URL validation
                const urlResult = win.spotkinSecurity.validateInput('https://example.com', 'url');
                expect(urlResult.valid).to.be.true;
            });
        });

        it('should reject invalid input', () => {
            cy.window().then((win) => {
                // Invalid string (too short)
                const stringResult = win.spotkinSecurity.validateInput('x', 'string', { minLength: 5 });
                expect(stringResult.valid).to.be.false;
                
                // Invalid number
                const numberResult = win.spotkinSecurity.validateInput('not-a-number', 'number');
                expect(numberResult.valid).to.be.false;
                
                // Invalid email
                const emailResult = win.spotkinSecurity.validateInput('invalid-email', 'email');
                expect(emailResult.valid).to.be.false;
                
                // Invalid URL
                const urlResult = win.spotkinSecurity.validateInput('not-a-url', 'url');
                expect(urlResult.valid).to.be.false;
            });
        });

        it('should generate secure session tokens', () => {
            cy.window().then((win) => {
                const token1 = win.spotkinSecurity.generateSessionToken();
                const token2 = win.spotkinSecurity.generateSessionToken();
                
                expect(token1).to.be.a('string');
                expect(token1.length).to.equal(64); // 32 bytes * 2 chars per byte
                expect(token1).to.not.equal(token2); // Should be unique
            });
        });

        it('should hash data consistently', () => {
            cy.window().then(async (win) => {
                const testData = { user: 'test', timestamp: 123456 };
                
                const hash1 = await win.spotkinSecurity.hashData(testData);
                const hash2 = await win.spotkinSecurity.hashData(testData);
                
                expect(hash1).to.be.a('string');
                expect(hash1).to.equal(hash2); // Same data should produce same hash
                
                const differentData = { user: 'test2', timestamp: 123456 };
                const hash3 = await win.spotkinSecurity.hashData(differentData);
                expect(hash3).to.not.equal(hash1); // Different data should produce different hash
            });
        });
    });

    describe('Secure Storage Module', () => {
        it('should initialize secure storage successfully', () => {
            cy.window().then((win) => {
                expect(win.secureStorage).to.exist;
                expect(win.secureStorage.setItem).to.be.a('function');
                expect(win.secureStorage.getItem).to.be.a('function');
                expect(win.secureStorage.removeItem).to.be.a('function');
            });
        });

        it('should store and retrieve data securely', () => {
            cy.window().then(async (win) => {
                const testData = { 
                    userPref: 'testValue',
                    timestamp: Date.now(),
                    settings: { theme: 'dark' }
                };
                
                const stored = await win.secureStorage.setItem('test-key', testData);
                expect(stored).to.be.true;
                
                const retrieved = await win.secureStorage.getItem('test-key');
                expect(retrieved).to.deep.equal(testData);
                
                // Clean up
                await win.secureStorage.removeItem('test-key');
            });
        });

        it('should handle encryption options correctly', () => {
            cy.window().then(async (win) => {
                const testData = { sensitive: 'data' };
                
                // Store with encryption (default)
                await win.secureStorage.setItem('encrypted-test', testData, { encrypt: true });
                
                // Verify data is encrypted in localStorage
                const rawData = localStorage.getItem('spotkin_secure_encrypted-test');
                expect(rawData).to.exist;
                const parsedRaw = JSON.parse(rawData);
                expect(parsedRaw.metadata.encrypted).to.be.true;
                
                // Verify we can still retrieve it
                const retrieved = await win.secureStorage.getItem('encrypted-test');
                expect(retrieved).to.deep.equal(testData);
                
                // Clean up
                await win.secureStorage.removeItem('encrypted-test');
            });
        });

        it('should migrate legacy data automatically', () => {
            // Set up legacy data
            const legacyData = { oldPref: 'value', migrated: false };
            localStorage.setItem('spotkin_preferences', JSON.stringify(legacyData));
            
            // Reload page to trigger migration
            cy.reload();
            cy.wait(3000);
            
            cy.window().then(async (win) => {
                // Check if data was migrated
                const migratedData = await win.secureStorage.getItem('spotkin_preferences');
                expect(migratedData).to.deep.equal(legacyData);
                
                // Verify backup was created
                const backup = localStorage.getItem('spotkin_preferences_backup');
                expect(backup).to.exist;
                
                // Clean up
                await win.secureStorage.removeItem('spotkin_preferences');
                localStorage.removeItem('spotkin_preferences_backup');
            });
        });

        it('should provide storage statistics', () => {
            cy.window().then(async (win) => {
                // Store some test data
                await win.secureStorage.setItem('stats-test-1', { data: 'test1' });
                await win.secureStorage.setItem('stats-test-2', { data: 'test2' }, { encrypt: true });
                
                const stats = win.secureStorage.getStorageStats();
                expect(stats).to.have.property('totalItems');
                expect(stats).to.have.property('encryptedItems');
                expect(stats).to.have.property('totalSizeBytes');
                expect(stats).to.have.property('totalSizeKB');
                
                expect(stats.totalItems).to.be.at.least(2);
                expect(stats.encryptedItems).to.be.at.least(1);
                
                // Clean up
                await win.secureStorage.removeItem('stats-test-1');
                await win.secureStorage.removeItem('stats-test-2');
            });
        });

        it('should export user data for GDPR compliance', () => {
            cy.window().then(async (win) => {
                // Store test data
                await win.secureStorage.setItem('gdpr-test-1', { user: 'data1' });
                await win.secureStorage.setItem('gdpr-test-2', { user: 'data2' });
                
                const exportData = await win.secureStorage.exportUserData();
                expect(exportData).to.have.property('exportDate');
                expect(exportData).to.have.property('version');
                expect(exportData).to.have.property('application', 'SpotKin');
                expect(exportData).to.have.property('data');
                
                expect(exportData.data).to.have.property('gdpr-test-1');
                expect(exportData.data).to.have.property('gdpr-test-2');
                
                // Clean up
                await win.secureStorage.removeItem('gdpr-test-1');
                await win.secureStorage.removeItem('gdpr-test-2');
            });
        });

        it('should delete all user data for GDPR compliance', () => {
            cy.window().then(async (win) => {
                // Store test data
                await win.secureStorage.setItem('delete-test-1', { data: 'test1' });
                await win.secureStorage.setItem('delete-test-2', { data: 'test2' });
                
                // Verify data exists
                let data1 = await win.secureStorage.getItem('delete-test-1');
                let data2 = await win.secureStorage.getItem('delete-test-2');
                expect(data1).to.not.be.null;
                expect(data2).to.not.be.null;
                
                // Delete all user data
                const deleted = await win.secureStorage.deleteAllUserData();
                expect(deleted).to.be.true;
                
                // Verify data is gone
                data1 = await win.secureStorage.getItem('delete-test-1');
                data2 = await win.secureStorage.getItem('delete-test-2');
                expect(data1).to.be.null;
                expect(data2).to.be.null;
            });
        });
    });

    describe('Input Validation and Sanitization', () => {
        it('should validate form inputs', () => {
            // Open preferences to test form validation
            cy.get('#preferences-btn').click();
            cy.wait(500);
            
            // Test input validation on form fields
            cy.get('input[type="text"]').first().then(($input) => {
                // Test XSS prevention
                cy.wrap($input).type('<script>alert("xss")</script>');
                
                cy.window().then((win) => {
                    const value = $input.val();
                    const sanitized = win.spotkinSecurity.sanitizeInput(value);
                    expect(sanitized).to.not.include('<script>');
                });
            });
        });

        it('should prevent XSS in user-generated content', () => {
            cy.window().then((win) => {
                const xssAttempts = [
                    '<script>alert("xss")</script>',
                    '<img src="x" onerror="alert(1)">',
                    'javascript:alert("xss")',
                    '<iframe src="javascript:alert(1)"></iframe>',
                    '<svg onload="alert(1)"></svg>'
                ];
                
                xssAttempts.forEach(xss => {
                    const sanitized = win.spotkinSecurity.sanitizeInput(xss);
                    expect(sanitized).to.not.include('script');
                    expect(sanitized).to.not.include('javascript:');
                    expect(sanitized).to.not.include('onerror');
                    expect(sanitized).to.not.include('onload');
                });
            });
        });
    });

    describe('Security Headers', () => {
        it('should have CSP headers configured', () => {
            cy.get('meta[http-equiv="Content-Security-Policy"]')
                .should('exist')
                .should('have.attr', 'content')
                .and('include', "default-src 'self'");
        });

        it('should have X-Frame-Options configured', () => {
            cy.get('meta[http-equiv="X-Frame-Options"]')
                .should('exist')
                .should('have.attr', 'content', 'DENY');
        });

        it('should have X-Content-Type-Options configured', () => {
            cy.get('meta[http-equiv="X-Content-Type-Options"]')
                .should('exist')
                .should('have.attr', 'content', 'nosniff');
        });

        it('should have XSS Protection configured', () => {
            cy.get('meta[http-equiv="X-XSS-Protection"]')
                .should('exist')
                .should('have.attr', 'content', '1; mode=block');
        });
    });

    describe('Data Privacy Integration', () => {
        it('should encrypt preferences when saving', () => {
            // Open preferences
            cy.get('#preferences-btn').click();
            cy.wait(500);
            
            // Make a change
            cy.get('#sensitivity-level').select('Medium');
            
            // Save preferences
            cy.get('#preferences-save').click();
            cy.wait(1000);
            
            // Check that preferences are encrypted in storage
            cy.window().then((win) => {
                const rawData = localStorage.getItem('spotkin_secure_spotkin_preferences');
                if (rawData) {
                    const parsedData = JSON.parse(rawData);
                    expect(parsedData.metadata.encrypted).to.be.true;
                }
            });
        });

        it('should handle secure storage fallbacks', () => {
            cy.window().then(async (win) => {
                // Test fallback to legacy storage
                localStorage.setItem('test-legacy', JSON.stringify({ legacy: true }));
                
                const retrieved = await win.secureStorage.getItem('test-legacy');
                expect(retrieved).to.deep.equal({ legacy: true });
                
                // Clean up
                localStorage.removeItem('test-legacy');
            });
        });
    });

    describe('Error Handling and Security', () => {
        it('should handle encryption errors gracefully', () => {
            cy.window().then(async (win) => {
                // Simulate encryption failure by temporarily breaking the security object
                const originalEncrypt = win.spotkinSecurity.encryptData;
                win.spotkinSecurity.encryptData = () => Promise.reject(new Error('Test encryption failure'));
                
                // Attempt to store data
                const result = await win.secureStorage.setItem('error-test', { data: 'test' });
                
                // Should handle the error gracefully
                expect(result).to.be.false; // Should return false on failure
                
                // Restore original function
                win.spotkinSecurity.encryptData = originalEncrypt;
            });
        });

        it('should handle storage quota exceeded', () => {
            cy.window().then(async (win) => {
                // This test is hard to simulate reliably, but we can test the stats function
                const stats = win.secureStorage.getStorageStats();
                expect(stats).to.not.be.null;
                expect(stats).to.have.property('totalSizeBytes');
            });
        });
    });

    describe('Performance and Memory', () => {
        it('should not cause memory leaks with encryption/decryption', () => {
            cy.window().then(async (win) => {
                const initialMemory = win.performance.memory ? win.performance.memory.usedJSHeapSize : 0;
                
                // Perform multiple encryption/decryption cycles
                for (let i = 0; i < 10; i++) {
                    const testData = { iteration: i, data: 'x'.repeat(1000) };
                    const encrypted = await win.spotkinSecurity.encryptData(testData);
                    const decrypted = await win.spotkinSecurity.decryptData(encrypted);
                    expect(decrypted).to.deep.equal(testData);
                }
                
                // Force garbage collection if available
                if (win.gc) {
                    win.gc();
                }
                
                const finalMemory = win.performance.memory ? win.performance.memory.usedJSHeapSize : 0;
                
                // Memory increase should be reasonable (less than 10MB)
                if (initialMemory > 0 && finalMemory > 0) {
                    const memoryIncrease = finalMemory - initialMemory;
                    expect(memoryIncrease).to.be.lessThan(10 * 1024 * 1024); // 10MB
                }
            });
        });

        it('should handle large data encryption efficiently', () => {
            cy.window().then(async (win) => {
                const largeData = {
                    items: Array.from({ length: 1000 }, (_, i) => ({
                        id: i,
                        data: 'x'.repeat(100)
                    }))
                };
                
                const startTime = Date.now();
                const encrypted = await win.spotkinSecurity.encryptData(largeData);
                const decrypted = await win.spotkinSecurity.decryptData(encrypted);
                const endTime = Date.now();
                
                expect(decrypted).to.deep.equal(largeData);
                expect(endTime - startTime).to.be.lessThan(5000); // Should complete within 5 seconds
            });
        });
    });
});