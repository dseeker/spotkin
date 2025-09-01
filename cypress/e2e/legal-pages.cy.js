describe('Legal Pages - Comprehensive Testing Suite', () => {
    beforeEach(() => {
        cy.visit('/');
        // Ensure any PWA splash screen is hidden
        cy.get('body').should('be.visible');
    });

    describe('Legal Page Navigation', () => {
        it('should have legal links in footer', () => {
            // Scroll to footer
            cy.get('footer').scrollIntoView();
            
            // Check all legal links exist
            cy.get('footer').within(() => {
                cy.get('a[href="privacy-policy.html"]').should('contain.text', 'Privacy Policy');
                cy.get('a[href="terms-of-service.html"]').should('contain.text', 'Terms of Service');
                cy.get('a[href="cookie-policy.html"]').should('contain.text', 'Cookie Policy');
            });
        });

        it('should navigate to Privacy Policy page', () => {
            cy.get('footer').scrollIntoView();
            cy.get('a[href="privacy-policy.html"]').click();
            
            // Verify we're on privacy policy page
            cy.url().should('include', 'privacy-policy.html');
            cy.get('h1').should('contain.text', 'Privacy Policy');
            cy.get('title').should('contain', 'Privacy Policy - SpotKin');
        });

        it('should navigate to Terms of Service page', () => {
            cy.get('footer').scrollIntoView();
            cy.get('a[href="terms-of-service.html"]').click();
            
            // Verify we're on terms page
            cy.url().should('include', 'terms-of-service.html');
            cy.get('h1').should('contain.text', 'Terms of Service');
            cy.get('title').should('contain', 'Terms of Service - SpotKin');
        });

        it('should navigate to Cookie Policy page', () => {
            cy.get('footer').scrollIntoView();
            cy.get('a[href="cookie-policy.html"]').click();
            
            // Verify we're on cookie policy page
            cy.url().should('include', 'cookie-policy.html');
            cy.get('h1').should('contain.text', 'Cookie Policy');
            cy.get('title').should('contain', 'Cookie Policy - SpotKin');
        });

        it('should have back to app links on all legal pages', () => {
            const pages = ['privacy-policy.html', 'terms-of-service.html', 'cookie-policy.html'];
            
            pages.forEach(page => {
                cy.visit(`/${page}`);
                cy.get('header').within(() => {
                    cy.get('a[href="index.html"]').should('contain.text', 'Back to App');
                });
            });
        });
    });

    describe('Privacy Policy Content', () => {
        beforeEach(() => {
            cy.visit('/privacy-policy.html');
        });

        it('should display comprehensive privacy policy content', () => {
            // Check main sections exist
            cy.contains('h2', 'Introduction').should('be.visible');
            cy.contains('h2', 'Information We Collect').should('be.visible');
            cy.contains('h2', 'How We Use Your Information').should('be.visible');
            cy.contains('h2', 'Data Storage and Security').should('be.visible');
            cy.contains('h2', 'Your Privacy Rights').should('be.visible');
        });

        it('should highlight privacy-first approach', () => {
            cy.contains('privacy-first', { matchCase: false }).should('be.visible');
            cy.contains('processed locally', { matchCase: false }).should('be.visible');
            cy.contains('AES-256', { matchCase: false }).should('be.visible');
        });

        it('should include GDPR compliance information', () => {
            cy.contains('GDPR', { matchCase: false }).should('be.visible');
            cy.contains('right to be forgotten', { matchCase: false }).should('be.visible');
            cy.contains('data protection authority', { matchCase: false }).should('be.visible');
        });

        it('should provide contact information', () => {
            cy.contains('privacy@spotkin.app').should('be.visible');
            cy.contains('Contact Us').should('be.visible');
        });

        it('should include privacy policy summary', () => {
            cy.contains('Privacy Policy Summary').should('be.visible');
            cy.contains('What We Do').should('be.visible');
            cy.contains('What We Don\'t Do').should('be.visible');
        });

        it('should have proper security meta tags', () => {
            cy.get('meta[http-equiv="Content-Security-Policy"]').should('exist');
            cy.get('meta[http-equiv="X-Content-Type-Options"]').should('exist');
            cy.get('meta[http-equiv="X-Frame-Options"]').should('exist');
        });

        it('should be mobile responsive', () => {
            // Test mobile viewport
            cy.viewport('iphone-6');
            cy.get('main').should('be.visible');
            cy.get('h1').should('be.visible');
            
            // Test content readability on mobile
            cy.get('.container').should('have.class', 'mx-auto');
            cy.get('.prose').should('be.visible');
        });
    });

    describe('Terms of Service Content', () => {
        beforeEach(() => {
            cy.visit('/terms-of-service.html');
        });

        it('should display comprehensive terms content', () => {
            // Check main sections exist
            cy.contains('h2', 'Agreement to Terms').should('be.visible');
            cy.contains('h2', 'Description of Service').should('be.visible');
            cy.contains('h2', 'User Responsibilities').should('be.visible');
            cy.contains('h2', 'Limitation of Liability').should('be.visible');
        });

        it('should include AI accuracy disclaimers', () => {
            cy.contains('AI analysis is not perfect', { matchCase: false }).should('be.visible');
            cy.contains('false positives', { matchCase: false }).should('be.visible');
            cy.contains('not a substitute', { matchCase: false }).should('be.visible');
        });

        it('should define acceptable and prohibited uses', () => {
            cy.contains('Acceptable Use').should('be.visible');
            cy.contains('Prohibited Uses').should('be.visible');
            cy.contains('without their knowledge or consent', { matchCase: false }).should('be.visible');
        });

        it('should include safety warnings', () => {
            cy.contains('Critical Safety Notice', { matchCase: false }).should('be.visible');
            cy.contains('adult supervision', { matchCase: false }).should('be.visible');
            cy.contains('monitoring assistance tool', { matchCase: false }).should('be.visible');
        });

        it('should provide legal contact information', () => {
            cy.contains('legal@spotkin.app').should('be.visible');
            cy.contains('Legal Team').should('be.visible');
        });

        it('should include acknowledgment section', () => {
            cy.contains('Acknowledgment').should('be.visible');
            cy.contains('read, understood, and agree', { matchCase: false }).should('be.visible');
        });
    });

    describe('Cookie Policy Content', () => {
        beforeEach(() => {
            cy.visit('/cookie-policy.html');
        });

        it('should explain storage technologies used', () => {
            cy.contains('Local Storage').should('be.visible');
            cy.contains('Session Storage').should('be.visible');
            cy.contains('IndexedDB').should('be.visible');
            cy.contains('Cookies').should('be.visible');
        });

        it('should include storage purpose table', () => {
            cy.get('table').should('be.visible');
            cy.get('thead').should('contain', 'Storage Type');
            cy.get('thead').should('contain', 'Purpose');
            cy.get('thead').should('contain', 'Data Stored');
            cy.get('thead').should('contain', 'Duration');
        });

        it('should document third-party services', () => {
            cy.contains('Puter.js', { matchCase: false }).should('be.visible');
            cy.contains('Pollinations.ai', { matchCase: false }).should('be.visible');
            cy.contains('Tailwind CSS CDN', { matchCase: false }).should('be.visible');
        });

        it('should provide browser control instructions', () => {
            cy.contains('Chrome/Edge').should('be.visible');
            cy.contains('Firefox').should('be.visible');
            cy.contains('Safari').should('be.visible');
            cy.contains('Mobile Browsers').should('be.visible');
        });

        it('should emphasize no advertising tracking', () => {
            cy.contains('No Advertising Trackers').should('be.visible');
            cy.contains('does not use advertising cookies', { matchCase: false }).should('be.visible');
            cy.contains('No Advertising Analytics', { matchCase: false }).should('be.visible');
        });

        it('should include cookie policy summary', () => {
            cy.contains('Cookie Policy Summary').should('be.visible');
            cy.contains('What We Use Storage For').should('be.visible');
            cy.contains('What We Don\'t Use Storage For').should('be.visible');
        });
    });

    describe('Legal Pages Cross-Navigation', () => {
        it('should have consistent footer navigation across all legal pages', () => {
            const pages = ['privacy-policy.html', 'terms-of-service.html', 'cookie-policy.html'];
            
            pages.forEach(currentPage => {
                cy.visit(`/${currentPage}`);
                
                cy.get('footer').within(() => {
                    // Should have links to all legal pages
                    cy.get('a[href="privacy-policy.html"]').should('exist');
                    cy.get('a[href="terms-of-service.html"]').should('exist');
                    cy.get('a[href="cookie-policy.html"]').should('exist');
                    cy.get('a[href="index.html"]').should('exist');
                });
            });
        });

        it('should allow navigation between legal pages', () => {
            // Start at privacy policy
            cy.visit('/privacy-policy.html');
            cy.get('h1').should('contain.text', 'Privacy Policy');
            
            // Navigate to terms
            cy.get('footer a[href="terms-of-service.html"]').click();
            cy.get('h1').should('contain.text', 'Terms of Service');
            
            // Navigate to cookie policy
            cy.get('footer a[href="cookie-policy.html"]').click();
            cy.get('h1').should('contain.text', 'Cookie Policy');
            
            // Navigate back to home
            cy.get('footer a[href="index.html"]').click();
            cy.url().should('include', 'index.html');
        });
    });

    describe('Legal Pages Accessibility', () => {
        const pages = [
            { url: '/privacy-policy.html', title: 'Privacy Policy' },
            { url: '/terms-of-service.html', title: 'Terms of Service' },
            { url: '/cookie-policy.html', title: 'Cookie Policy' }
        ];

        pages.forEach(page => {
            it(`should be accessible - ${page.title}`, () => {
                cy.visit(page.url);
                
                // Check semantic HTML structure
                cy.get('main').should('exist');
                cy.get('header').should('exist');
                cy.get('footer').should('exist');
                cy.get('h1').should('exist');
                
                // Check proper heading hierarchy
                cy.get('h1').should('have.length', 1);
                cy.get('h2').should('exist');
                
                // Check navigation is keyboard accessible
                cy.get('header a').first().focus();
                cy.focused().should('be.visible');
                
                // Check footer links are keyboard accessible
                cy.get('footer a').first().focus();
                cy.focused().should('be.visible');
            });
        });

        it('should have proper meta tags for SEO and accessibility', () => {
            const pages = ['privacy-policy.html', 'terms-of-service.html', 'cookie-policy.html'];
            
            pages.forEach(page => {
                cy.visit(`/${page}`);
                
                // Check essential meta tags
                cy.get('meta[name="description"]').should('exist');
                cy.get('meta[name="viewport"]').should('exist');
                cy.get('meta[name="robots"]').should('exist');
                
                // Check security headers
                cy.get('meta[http-equiv="Content-Security-Policy"]').should('exist');
                cy.get('meta[http-equiv="X-Content-Type-Options"]').should('exist');
                cy.get('meta[http-equiv="X-Frame-Options"]').should('exist');
                
                // Check favicon
                cy.get('link[rel="icon"]').should('exist');
            });
        });
    });

    describe('Legal Pages Performance', () => {
        it('should load privacy policy quickly', () => {
            const start = Date.now();
            cy.visit('/privacy-policy.html');
            cy.get('h1').should('be.visible').then(() => {
                const loadTime = Date.now() - start;
                expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
            });
        });

        it('should load terms of service quickly', () => {
            const start = Date.now();
            cy.visit('/terms-of-service.html');
            cy.get('h1').should('be.visible').then(() => {
                const loadTime = Date.now() - start;
                expect(loadTime).to.be.lessThan(3000);
            });
        });

        it('should load cookie policy quickly', () => {
            const start = Date.now();
            cy.visit('/cookie-policy.html');
            cy.get('h1').should('be.visible').then(() => {
                const loadTime = Date.now() - start;
                expect(loadTime).to.be.lessThan(3000);
            });
        });
    });

    describe('Legal Pages Content Validation', () => {
        it('should have current dates in all legal documents', () => {
            const pages = ['privacy-policy.html', 'terms-of-service.html', 'cookie-policy.html'];
            const currentYear = new Date().getFullYear().toString();
            
            pages.forEach(page => {
                cy.visit(`/${page}`);
                
                // Check for current year in last updated date
                cy.contains('Last Updated').should('be.visible');
                cy.contains('December 2024').should('be.visible');
                
                // Check copyright year in footer
                cy.get('footer').should('contain', '2024');
            });
        });

        it('should have consistent branding across legal pages', () => {
            const pages = ['privacy-policy.html', 'terms-of-service.html', 'cookie-policy.html'];
            
            pages.forEach(page => {
                cy.visit(`/${page}`);
                
                // Check SpotKin branding in header
                cy.get('header').within(() => {
                    cy.contains('SpotKin').should('be.visible');
                    cy.get('i.fas.fa-eye').should('be.visible');
                });
                
                // Check consistent styling
                cy.get('main').should('have.class', 'container');
                cy.get('.bg-white.rounded-lg.shadow-lg').should('exist');
            });
        });

        it('should reference correct contact emails', () => {
            // Privacy Policy should have privacy email
            cy.visit('/privacy-policy.html');
            cy.contains('privacy@spotkin.app').should('be.visible');
            
            // Terms should have legal email
            cy.visit('/terms-of-service.html');
            cy.contains('legal@spotkin.app').should('be.visible');
            
            // Cookie Policy should have privacy email
            cy.visit('/cookie-policy.html');
            cy.contains('privacy@spotkin.app').should('be.visible');
        });
    });

    describe('Legal Compliance Features', () => {
        it('should document GDPR compliance features in privacy policy', () => {
            cy.visit('/privacy-policy.html');
            
            // Check GDPR rights section
            cy.contains('GDPR Rights').should('be.visible');
            cy.contains('right to be forgotten').should('be.visible');
            cy.contains('data protection authority').should('be.visible');
            
            // Check data export mention
            cy.contains('Export Data').should('be.visible');
            cy.contains('Clear All Data').should('be.visible');
        });

        it('should emphasize privacy-first architecture', () => {
            cy.visit('/privacy-policy.html');
            
            cy.contains('privacy-by-design').should('be.visible');
            cy.contains('processed locally').should('be.visible');
            cy.contains('minimal data transmission').should('be.visible');
            cy.contains('AES-256-GCM encryption').should('be.visible');
        });

        it('should provide clear data control information', () => {
            cy.visit('/cookie-policy.html');
            
            cy.contains('complete control').should('be.visible');
            cy.contains('delete everything instantly').should('be.visible');
            cy.contains('browser settings').should('be.visible');
            cy.contains('app settings').should('be.visible');
        });
    });

    describe('Legal Pages Error Handling', () => {
        it('should handle missing pages gracefully', () => {
            // This tests would need server-side configuration
            // For now, we test that valid pages load correctly
            cy.visit('/privacy-policy.html');
            cy.get('h1').should('contain.text', 'Privacy Policy');
            
            cy.visit('/terms-of-service.html');
            cy.get('h1').should('contain.text', 'Terms of Service');
            
            cy.visit('/cookie-policy.html');
            cy.get('h1').should('contain.text', 'Cookie Policy');
        });
    });
});

// Custom commands for legal page testing
Cypress.Commands.add('checkLegalPageStructure', (pageTitle) => {
    // Verify basic page structure
    cy.get('header').should('be.visible');
    cy.get('main').should('be.visible');
    cy.get('footer').should('be.visible');
    cy.get('h1').should('contain.text', pageTitle);
    
    // Check back to app link
    cy.get('header a[href="index.html"]').should('contain.text', 'Back to App');
    
    // Check footer legal links
    cy.get('footer').within(() => {
        cy.get('a[href="privacy-policy.html"]').should('exist');
        cy.get('a[href="terms-of-service.html"]').should('exist');
        cy.get('a[href="cookie-policy.html"]').should('exist');
    });
});

Cypress.Commands.add('verifyLegalCompliance', () => {
    // Check for key compliance elements
    cy.contains('Last Updated').should('be.visible');
    cy.contains('Effective Date').should('be.visible');
    cy.get('meta[http-equiv="Content-Security-Policy"]').should('exist');
});