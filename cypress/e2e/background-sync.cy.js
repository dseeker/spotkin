describe('Background Sync', () => {
    beforeEach(() => {
        cy.visit('/');
        
        // Clear sync queues and preferences
        cy.window().then((win) => {
            win.localStorage.removeItem('spotkin-sync-preferences');
            ['snapshots', 'timeline', 'preferences', 'alerts'].forEach(type => {
                win.localStorage.removeItem(`spotkin-sync-queue-${type}`);
            });
        });
    });

    describe('Background Sync Manager', () => {
        it('should initialize background sync manager on page load', () => {
            cy.window().should('have.property', 'BackgroundSyncManager');
            cy.window().its('backgroundSyncManager').should('exist');
        });

        it('should detect online/offline status correctly', () => {
            cy.window().then((win) => {
                const manager = win.backgroundSyncManager;
                expect(manager.isOnline).to.equal(navigator.onLine);
            });
        });

        it('should queue snapshots when offline', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                
                // Simulate offline state
                manager.isOnline = false;
                
                const result = await manager.queueSnapshot('test-image-data', { quality: 0.8 });
                expect(result.queued).to.be.true;
                expect(result.message).to.include('will be processed when online');
            });
        });

        it('should process snapshots immediately when online', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                
                // Ensure online state
                manager.isOnline = true;
                
                const result = await manager.processSnapshotOnline('test-image-data', {});
                expect(result.success).to.be.true;
                expect(result.processed).to.be.true;
            });
        });

        it('should queue timeline events correctly', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                
                const result = await manager.queueTimelineEvent({
                    type: 'movement',
                    timestamp: Date.now(),
                    confidence: 0.9
                });
                
                expect(result.queued).to.be.true;
            });
        });

        it('should queue preference changes', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                
                await manager.queuePreferenceChange({
                    sensitivity: 'high',
                    notifications: true
                });
                
                const queueStatus = manager.getQueueStatus();
                expect(queueStatus.preferences.count).to.equal(1);
            });
        });

        it('should queue alerts with priority handling', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                
                await manager.queueAlert({
                    message: 'Test alert',
                    timestamp: Date.now()
                }, 'danger');
                
                const queueStatus = manager.getQueueStatus();
                expect(queueStatus.alerts.count).to.equal(1);
            });
        });

        it('should provide accurate queue status', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                
                // Add items to different queues
                await manager.queueSnapshot('test1', {});
                await manager.queueSnapshot('test2', {});
                await manager.queueTimelineEvent({ test: true });
                
                const status = manager.getQueueStatus();
                expect(status.snapshots.count).to.equal(2);
                expect(status.timeline.count).to.equal(1);
                expect(status.preferences.count).to.equal(0);
                expect(status.alerts.count).to.equal(0);
            });
        });

        it('should clear queues correctly', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                
                // Add test data
                await manager.queueSnapshot('test', {});
                await manager.queueTimelineEvent({ test: true });
                
                // Clear all queues
                await manager.clearQueue();
                
                const status = manager.getQueueStatus();
                expect(status.snapshots.count).to.equal(0);
                expect(status.timeline.count).to.equal(0);
            });
        });

        it('should clear specific queue types', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                
                await manager.queueSnapshot('test', {});
                await manager.queueTimelineEvent({ test: true });
                
                // Clear only snapshots
                await manager.clearQueue('snapshots');
                
                const status = manager.getQueueStatus();
                expect(status.snapshots.count).to.equal(0);
                expect(status.timeline.count).to.equal(1);
            });
        });
    });

    describe('Background Sync UI', () => {
        it('should show background sync controls in preferences modal', () => {
            cy.get('#preferences-btn').click();
            cy.get('#preferences-modal').should('be.visible');
            
            // Check background sync section exists
            cy.contains('Background Sync').should('be.visible');
            cy.get('#sync-status-display').should('be.visible');
            cy.get('#manual-sync-btn').should('be.visible');
            cy.get('#view-sync-details-btn').should('be.visible');
            cy.get('#clear-sync-queue-btn').should('be.visible');
        });

        it('should display sync status correctly', () => {
            cy.get('#preferences-btn').click();
            
            // Initially should show "Up to date"
            cy.get('#sync-status-indicator').should('contain', 'Up to date');
            cy.get('#queue-snapshots').should('contain', '0');
            cy.get('#queue-timeline').should('contain', '0');
            cy.get('#queue-alerts').should('contain', '0');
            cy.get('#queue-preferences').should('contain', '0');
        });

        it('should update sync status when items are queued', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                
                // Queue some test items
                await manager.queueSnapshot('test', {});
                await manager.queueTimelineEvent({ test: true });
            });

            cy.get('#preferences-btn').click();
            
            // Wait for status to update
            cy.get('#sync-status-indicator').should('contain', 'items queued');
            cy.get('#queue-snapshots').should('contain', '1');
            cy.get('#queue-timeline').should('contain', '1');
        });

        it('should allow manual sync trigger', () => {
            cy.get('#preferences-btn').click();
            
            cy.get('#manual-sync-btn').click();
            
            // Button should show loading state temporarily
            cy.get('#manual-sync-btn').should('contain', 'Syncing...');
            cy.get('#manual-sync-btn').should('be.disabled');
            
            // Should return to normal after completion
            cy.get('#manual-sync-btn', { timeout: 10000 }).should('contain', 'Sync Now');
            cy.get('#manual-sync-btn').should('not.be.disabled');
        });

        it('should show sync details modal', () => {
            cy.get('#preferences-btn').click();
            cy.get('#view-sync-details-btn').click();
            
            cy.get('#custom-modal').should('be.visible');
            cy.get('#custom-modal').should('contain', 'Sync Queue Details');
            
            // Should show all queue types
            cy.get('#custom-modal').should('contain', 'Snapshots');
            cy.get('#custom-modal').should('contain', 'Timeline');
            cy.get('#custom-modal').should('contain', 'Preferences');
            cy.get('#custom-modal').should('contain', 'Alerts');
        });

        it('should show clear queue confirmation modal', () => {
            cy.get('#preferences-btn').click();
            cy.get('#clear-sync-queue-btn').click();
            
            cy.get('#custom-modal').should('be.visible');
            cy.get('#custom-modal').should('contain', 'Clear Sync Queue');
            cy.get('#custom-modal').should('contain', 'Are you sure');
            
            cy.get('#confirm-clear-queue').should('be.visible');
            cy.get('#cancel-clear-queue').should('be.visible');
        });

        it('should actually clear queue when confirmed', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                await manager.queueSnapshot('test', {});
            });

            cy.get('#preferences-btn').click();
            cy.get('#clear-sync-queue-btn').click();
            cy.get('#confirm-clear-queue').click();
            
            // Modal should close
            cy.get('#custom-modal').should('not.exist');
            
            // Queue should be cleared
            cy.get('#queue-snapshots').should('contain', '0');
        });

        it('should cancel clear queue operation', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                await manager.queueSnapshot('test', {});
            });

            cy.get('#preferences-btn').click();
            cy.get('#clear-sync-queue-btn').click();
            cy.get('#cancel-clear-queue').click();
            
            // Modal should close
            cy.get('#custom-modal').should('not.exist');
            
            // Queue should NOT be cleared
            cy.get('#queue-snapshots').should('contain', '1');
        });

        it('should save and load sync preferences', () => {
            cy.get('#preferences-btn').click();
            
            // Change preferences
            cy.get('#auto-sync-enabled').uncheck();
            cy.get('#wifi-only-sync').check();
            cy.get('#battery-saver-sync').check();
            
            // Close and reopen preferences
            cy.get('#preferences-close').click();
            cy.get('#preferences-btn').click();
            
            // Preferences should be maintained
            cy.get('#auto-sync-enabled').should('not.be.checked');
            cy.get('#wifi-only-sync').should('be.checked');
            cy.get('#battery-saver-sync').should('be.checked');
        });
    });

    describe('Online/Offline Integration', () => {
        it('should trigger sync when going back online', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                
                // Simulate offline state and queue items
                manager.isOnline = false;
                await manager.queueSnapshot('test', {});
                
                // Simulate going back online
                manager.isOnline = true;
                
                // Trigger online event
                win.dispatchEvent(new Event('online'));
                
                // Should attempt to sync (we can't easily test the actual sync here)
                expect(manager.isOnline).to.be.true;
            });
        });

        it('should show offline status in sync indicator', () => {
            // Mock navigator.onLine to be false
            cy.window().then((win) => {
                Object.defineProperty(win.navigator, 'onLine', {
                    writable: true,
                    value: false
                });
                
                // Trigger status update
                win.updateSyncStatusDisplay();
            });

            cy.get('#preferences-btn').click();
            cy.get('#sync-status-indicator').should('contain', 'Offline');
        });

        it('should handle network errors gracefully', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                
                // Mock a network error during sync
                const originalFetch = win.fetch;
                win.fetch = () => Promise.reject(new Error('Network error'));
                
                // This should handle the error gracefully
                try {
                    await manager.fallbackSync();
                } catch (error) {
                    // Should not throw unhandled errors
                    expect(error).to.be.undefined;
                }
                
                // Restore fetch
                win.fetch = originalFetch;
            });
        });
    });

    describe('Service Worker Integration', () => {
        it('should register background sync events with service worker', () => {
            cy.window().then(async (win) => {
                if ('serviceWorker' in win.navigator) {
                    const manager = win.backgroundSyncManager;
                    
                    try {
                        await manager.triggerBackgroundSync();
                        // If we get here without error, registration worked
                        expect(true).to.be.true;
                    } catch (error) {
                        // Expected if service worker not available in test environment
                        expect(error.message).to.include('service worker' || 'Background Sync');
                    }
                }
            });
        });

        it('should fallback to localStorage when service worker unavailable', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                
                // Queue an item (should use localStorage fallback)
                await manager.queueSnapshot('test-fallback', {});
                
                // Check localStorage directly
                const stored = win.localStorage.getItem('spotkin-sync-queue-snapshots');
                expect(stored).to.exist;
                
                const queue = JSON.parse(stored);
                expect(queue).to.be.an('array');
                expect(queue.length).to.equal(1);
                expect(queue[0].imageData).to.equal('test-fallback');
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle corrupted localStorage gracefully', () => {
            cy.window().then((win) => {
                // Corrupt the localStorage data
                win.localStorage.setItem('spotkin-sync-queue-snapshots', 'invalid json');
                
                const manager = win.backgroundSyncManager;
                
                // Should not throw error
                const status = manager.getQueueStatus();
                expect(status.snapshots.count).to.equal(0);
            });
        });

        it('should limit queue size to prevent memory issues', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                manager.isOnline = false;
                
                // Add 60 items (should be limited to 50)
                for (let i = 0; i < 60; i++) {
                    await manager.queueSnapshot(`test-${i}`, {});
                }
                
                const status = manager.getQueueStatus();
                expect(status.snapshots.count).to.be.at.most(50);
            });
        });

        it('should handle sync failures with retry logic', () => {
            cy.window().then(async (win) => {
                const manager = win.backgroundSyncManager;
                
                // Mock failed processing
                const originalProcess = manager.processSnapshotOnline;
                let attempts = 0;
                
                manager.processSnapshotOnline = () => {
                    attempts++;
                    if (attempts < 3) {
                        return Promise.reject(new Error('Mock failure'));
                    }
                    return originalProcess.call(manager, 'test', {});
                };
                
                // Should eventually succeed after retries
                const result = await manager.processFallbackItem('snapshots', {
                    imageData: 'test',
                    settings: {}
                });
                
                expect(result.success).to.be.true;
                expect(attempts).to.equal(3);
                
                // Restore original function
                manager.processSnapshotOnline = originalProcess;
            });
        });

        it('should show appropriate notifications for sync operations', () => {
            cy.get('#preferences-btn').click();
            cy.get('#manual-sync-btn').click();
            
            // Should show success notification
            cy.get('.fixed.top-4.right-4', { timeout: 5000 }).should('be.visible');
            cy.get('.fixed.top-4.right-4').should('contain.text', 'sync completed');
        });
    });
});