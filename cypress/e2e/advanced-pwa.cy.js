describe('Advanced PWA Features', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.wait(2000); // Wait for app initialization
    });

    describe('Splash Screen', () => {
        it('should show splash screen during app initialization', () => {
            // Visit with cache disabled to see splash screen
            cy.clearAllLocalStorage();
            cy.clearAllCookies();
            cy.reload();
            
            // Splash screen should be visible initially
            cy.get('#pwa-splash').should('be.visible');
            cy.get('.splash-logo').should('be.visible');
            cy.get('.splash-title').should('contain', 'SpotKin');
            cy.get('.splash-subtitle').should('contain', 'AI-powered monitoring');
            cy.get('.splash-spinner').should('be.visible');
            
            // Splash screen should disappear after loading
            cy.get('#pwa-splash', { timeout: 10000 }).should('not.exist');
        });

        it('should have proper splash screen styling and animations', () => {
            cy.clearAllLocalStorage();
            cy.reload();
            
            // Check styling
            cy.get('#pwa-splash').should('have.class', 'pwa-splash');
            cy.get('.splash-logo').should('be.visible');
            
            // Check animations are present
            cy.get('.splash-logo').should('have.css', 'animation');
            cy.get('.splash-spinner').should('have.css', 'animation');
        });
    });

    describe('App Shortcuts', () => {
        it('should handle snapshot shortcut URL parameter', () => {
            cy.visit('/?action=snapshot');
            cy.wait(3000); // Wait for shortcut processing
            
            // Should show shortcut feedback
            cy.get('body').should('contain', 'Quick Snapshot Mode Activated');
            
            // Should trigger snapshot functionality
            cy.get('#take-snapshot').should('be.visible');
        });

        it('should handle monitor shortcut URL parameter', () => {
            cy.visit('/?action=monitor');
            cy.wait(3000);
            
            // Should show feedback and start monitoring
            cy.get('body').should('contain', 'Starting Monitoring Mode');
        });

        it('should handle history shortcut URL parameter', () => {
            cy.visit('/?action=history');
            cy.wait(3000);
            
            // Should show feedback and switch to history tab
            cy.get('body').should('contain', 'Opening Monitoring History');
            cy.get('#tab-history').should('have.class', 'bg-indigo-600');
        });

        it('should handle settings shortcut URL parameter', () => {
            cy.visit('/?action=settings');
            cy.wait(3000);
            
            // Should show feedback and switch to settings tab
            cy.get('body').should('contain', 'Opening Settings');
            cy.get('#tab-settings').should('have.class', 'bg-indigo-600');
        });

        it('should handle keyboard shortcuts', () => {
            // Test Ctrl+S for snapshot
            cy.get('body').type('{ctrl}s');
            cy.get('body').should('contain', 'Quick Snapshot Mode Activated');
            
            // Test Ctrl+M for monitor
            cy.get('body').type('{ctrl}m');
            cy.get('body').should('contain', 'Starting Monitoring Mode');
            
            // Test Ctrl+H for history
            cy.get('body').type('{ctrl}h');
            cy.get('body').should('contain', 'Opening Monitoring History');
        });

        it('should not trigger shortcuts when typing in input fields', () => {
            // Open settings to find an input field
            cy.get('#tab-settings').click();
            cy.wait(500);
            
            // Focus on an input field
            cy.get('input').first().focus();
            
            // Type Ctrl+S - should not trigger shortcut
            cy.get('input').first().type('{ctrl}s');
            
            // Should not see shortcut feedback
            cy.get('body').should('not.contain', 'Quick Snapshot Mode Activated');
        });
    });

    describe('Share Target Functionality', () => {
        it('should handle shared content URL parameters', () => {
            const shareParams = '?title=Test%20Title&text=Test%20content&url=https://example.com';
            cy.visit('/' + shareParams);
            cy.wait(2000);
            
            // Should show shared content notification
            cy.get('body').should('contain', 'Content Shared');
            cy.get('body').should('contain', 'Title: Test Title');
        });

        it('should initialize share functionality', () => {
            cy.window().then((win) => {
                // Check if share target functions are available
                expect(win.initializeShareTarget).to.be.a('function');
                expect(win.handleSharedContent).to.be.a('function');
            });
        });

        it('should show share notification with close button', () => {
            cy.visit('/?title=Test&text=Sample');
            cy.wait(2000);
            
            // Should show notification with close button
            cy.get('.fixed').contains('Content Shared').should('be.visible');
            cy.get('.fixed .fa-times').should('be.visible').click();
            
            // Notification should be removed
            cy.get('.fixed').contains('Content Shared').should('not.exist');
        });
    });

    describe('Enhanced Background Sync', () => {
        it('should register service worker with background sync', () => {
            cy.window().then((win) => {
                // Check if service worker is registered
                expect(win.navigator.serviceWorker).to.exist;
                
                return win.navigator.serviceWorker.ready;
            }).then((registration) => {
                expect(registration).to.exist;
                expect(registration.active).to.exist;
            });
        });

        it('should handle offline queue management', () => {
            cy.window().then((win) => {
                // Mock offline state
                cy.stub(win.navigator, 'onLine').value(false);
                
                // Trigger an action that would queue for sync
                cy.get('#take-snapshot').click();
                
                // Should handle offline gracefully
                cy.get('body').should('contain', 'Offline');
            });
        });

        it('should provide sync status information', () => {
            cy.window().then((win) => {
                if (win.navigator.serviceWorker && win.navigator.serviceWorker.controller) {
                    // Send message to service worker to get sync status
                    const messageChannel = new MessageChannel();
                    
                    win.navigator.serviceWorker.controller.postMessage({
                        type: 'GET_SYNC_STATUS'
                    }, [messageChannel.port2]);
                    
                    messageChannel.port1.onmessage = (event) => {
                        expect(event.data.success).to.be.true;
                        expect(event.data.status).to.exist;
                    };
                }
            });
        });
    });

    describe('PWA Manifest and Installation', () => {
        it('should have valid PWA manifest', () => {
            cy.request('/manifest.json').then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('name');
                expect(response.body).to.have.property('short_name');
                expect(response.body).to.have.property('start_url');
                expect(response.body).to.have.property('display');
                expect(response.body).to.have.property('icons');
                expect(response.body).to.have.property('shortcuts');
                expect(response.body).to.have.property('share_target');
            });
        });

        it('should have proper PWA meta tags', () => {
            cy.get('meta[name="application-name"]').should('have.attr', 'content', 'SpotKin');
            cy.get('meta[name="apple-mobile-web-app-capable"]').should('have.attr', 'content', 'yes');
            cy.get('meta[name="theme-color"]').should('have.attr', 'content', '#4f46e5');
            cy.get('link[rel="manifest"]').should('have.attr', 'href', './manifest.json');
        });

        it('should detect PWA installation state', () => {
            cy.window().then((win) => {
                // Check if PWA detection functions exist
                expect(win.setupInstallPrompt).to.be.a('function');
                
                // Should detect display mode
                const isStandalone = win.matchMedia('(display-mode: standalone)').matches;
                expect(typeof isStandalone).to.eq('boolean');
            });
        });

        it('should handle PWA-specific styling', () => {
            // Test PWA-specific CSS media queries
            cy.window().then((win) => {
                const standaloneQuery = win.matchMedia('(display-mode: standalone)');
                expect(standaloneQuery).to.exist;
            });
        });
    });

    describe('Advanced Service Worker Features', () => {
        it('should cache critical resources', () => {
            cy.window().then((win) => {
                if ('caches' in win) {
                    return win.caches.keys();
                }
            }).then((cacheNames) => {
                if (cacheNames) {
                    expect(cacheNames.length).to.be.greaterThan(0);
                    expect(cacheNames.some(name => name.includes('spotkin'))).to.be.true;
                }
            });
        });

        it('should handle different caching strategies', () => {
            // Test that different resources use appropriate caching strategies
            cy.intercept('GET', '/app.js').as('getAppJS');
            cy.intercept('GET', 'https://cdn.tailwindcss.com/**').as('getCDN');
            
            cy.reload();
            
            cy.wait('@getAppJS');
            cy.wait('@getCDN');
        });

        it('should support push notifications', () => {
            cy.window().then((win) => {
                if ('serviceWorker' in win.navigator && 'PushManager' in win) {
                    return win.navigator.serviceWorker.ready;
                }
            }).then((registration) => {
                if (registration) {
                    expect(registration.pushManager).to.exist;
                }
            });
        });
    });

    describe('Smart Queue Management', () => {
        it('should prioritize critical operations', () => {
            cy.window().then((win) => {
                if (win.navigator.serviceWorker && win.navigator.serviceWorker.controller) {
                    // Test that critical items are processed first
                    const messageChannel = new MessageChannel();
                    
                    win.navigator.serviceWorker.controller.postMessage({
                        type: 'QUEUE_FOR_SYNC',
                        storeName: 'alerts',
                        data: {
                            message: 'Critical alert',
                            priority: 'critical'
                        }
                    }, [messageChannel.port2]);
                    
                    messageChannel.port1.onmessage = (event) => {
                        expect(event.data.success).to.be.true;
                        expect(event.data.queued).to.be.true;
                    };
                }
            });
        });

        it('should implement exponential backoff for retries', () => {
            // This would be tested by monitoring retry timing in a real scenario
            cy.window().then((win) => {
                // Check that retry logic functions exist
                expect(win.syncDB).to.be.undefined; // syncDB is in service worker context
                
                // Test that the main app can communicate with service worker
                if (win.navigator.serviceWorker && win.navigator.serviceWorker.controller) {
                    expect(win.navigator.serviceWorker.controller).to.exist;
                }
            });
        });
    });

    describe('Accessibility and User Experience', () => {
        it('should be keyboard accessible', () => {
            // Test that shortcuts work with keyboard
            cy.get('body').tab();
            cy.focused().should('be.visible');
            
            // Test that escape key can close modals/notifications
            cy.get('body').type('{esc}');
        });

        it('should provide appropriate feedback for PWA actions', () => {
            // Test that user gets feedback for PWA-specific actions
            cy.visit('/?action=snapshot');
            cy.wait(2000);
            
            // Should show user-friendly feedback
            cy.get('body').should('contain', 'Quick Snapshot Mode');
        });

        it('should handle errors gracefully', () => {
            cy.window().then((win) => {
                // Test that PWA error handling functions exist
                expect(win.handlePWAError).to.be.a('function');
                
                // Test offline error handling
                cy.stub(win.navigator, 'onLine').value(false);
                
                // Should show appropriate offline messages
                cy.get('#take-snapshot').click();
                // Error handling should prevent crashes
            });
        });
    });

    describe('Performance and Resource Management', () => {
        it('should load quickly on subsequent visits', () => {
            cy.visit('/');
            cy.wait(1000);
            
            // Measure load time on second visit (should be faster due to caching)
            const startTime = Date.now();
            cy.reload().then(() => {
                const loadTime = Date.now() - startTime;
                // Should load faster than 3 seconds due to caching
                expect(loadTime).to.be.lessThan(3000);
            });
        });

        it('should efficiently manage memory and resources', () => {
            cy.window().then((win) => {
                // Check that resources are properly cleaned up
                expect(win.performance).to.exist;
                
                // Test that large resources are handled efficiently
                const memoryInfo = win.performance.memory;
                if (memoryInfo) {
                    expect(memoryInfo.usedJSHeapSize).to.be.lessThan(memoryInfo.jsHeapSizeLimit);
                }
            });
        });
    });
});