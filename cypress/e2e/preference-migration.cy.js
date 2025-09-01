describe('Preference Migration System Tests', () => {
    beforeEach(() => {
        // Clear all localStorage before each test
        cy.window().then((win) => {
            win.localStorage.clear();
        });
        
        cy.visit('/');
        cy.wait(1000);
        cy.viewport(1280, 720);
    });

    describe('✅ Migration System Initialization', () => {
        it('should have migration system available in window', () => {
            cy.window().then((win) => {
                expect(win.PreferenceMigrationSystem).to.exist;
            });
        });

        it('should create migration instance successfully', () => {
            cy.window().then((win) => {
                const migration = new win.PreferenceMigrationSystem();
                expect(migration).to.exist;
                expect(migration.currentVersion).to.equal('4.0.0');
                expect(migration.migrationSchema).to.exist;
            });
        });

        it('should detect current user version correctly', () => {
            cy.window().then((win) => {
                const migration = new win.PreferenceMigrationSystem();
                
                // Test with no existing data (should default to 1.0.0)
                const versionEmpty = migration.getCurrentUserVersion();
                expect(versionEmpty).to.equal('1.0.0');
                
                // Test with explicit version
                win.localStorage.setItem('spotkin_app_version', '3.0.0');
                const versionExplicit = migration.getCurrentUserVersion();
                expect(versionExplicit).to.equal('3.0.0');
            });
        });

        it('should correctly identify when migration is needed', () => {
            cy.window().then((win) => {
                const migration = new win.PreferenceMigrationSystem();
                
                // Should need migration from older version
                expect(migration.isMigrationNeeded('1.0.0')).to.be.true;
                expect(migration.isMigrationNeeded('3.0.0')).to.be.true;
                
                // Should not need migration for current version
                expect(migration.isMigrationNeeded('4.0.0')).to.be.false;
            });
        });
    });

    describe('✅ Version Detection and Inference', () => {
        it('should infer v1.0.0 from legacy data', () => {
            cy.window().then((win) => {
                // Set up v1.0 data
                win.localStorage.setItem('spotkin_setup_completed', 'true');
                win.localStorage.setItem('spotkin_alert_settings', '{"enabled":true}');
                
                const migration = new win.PreferenceMigrationSystem();
                const version = migration.inferVersionFromData();
                expect(version).to.equal('1.0.0');
            });
        });

        it('should infer v2.0.0 from data structure', () => {
            cy.window().then((win) => {
                // Set up v2.0 data
                win.localStorage.setItem('spotkin_monitoring_settings', '{"enabled":true}');
                win.localStorage.setItem('spotkin_alert_preferences', '{"severity":5}');
                
                const migration = new win.PreferenceMigrationSystem();
                const version = migration.inferVersionFromData();
                expect(version).to.equal('2.0.0');
            });
        });

        it('should infer v3.0.0 from data structure', () => {
            cy.window().then((win) => {
                // Set up v3.0 data
                win.localStorage.setItem('spotkin_user_profile', '{"monitorType":"baby"}');
                win.localStorage.setItem('spotkin_ai_preferences', '{"sensitivity":7}');
                
                const migration = new win.PreferenceMigrationSystem();
                const version = migration.inferVersionFromData();
                expect(version).to.equal('3.0.0');
            });
        });

        it('should infer v4.0.0 from data structure', () => {
            cy.window().then((win) => {
                // Set up v4.0 data
                win.localStorage.setItem('spotkin_faq_interactions', '{"totalViews":0}');
                win.localStorage.setItem('spotkin_help_state', '{"enabled":false}');
                
                const migration = new win.PreferenceMigrationSystem();
                const version = migration.inferVersionFromData();
                expect(version).to.equal('4.0.0');
            });
        });
    });

    describe('✅ Migration Path Calculation', () => {
        it('should calculate correct migration path from v1.0 to v4.0', () => {
            cy.window().then((win) => {
                const migration = new win.PreferenceMigrationSystem();
                const path = migration.calculateMigrationPath('1.0.0');
                
                expect(path).to.have.length(3);
                expect(path[0].from).to.equal('1.0.0');
                expect(path[0].to).to.equal('2.0.0');
                expect(path[1].from).to.equal('2.0.0');
                expect(path[1].to).to.equal('3.0.0');
                expect(path[2].from).to.equal('3.0.0');
                expect(path[2].to).to.equal('3.5.0');
            });
        });

        it('should calculate partial migration path', () => {
            cy.window().then((win) => {
                const migration = new win.PreferenceMigrationSystem();
                const path = migration.calculateMigrationPath('3.0.0');
                
                expect(path).to.have.length(2);
                expect(path[0].from).to.equal('3.0.0');
                expect(path[0].to).to.equal('3.5.0');
                expect(path[1].from).to.equal('3.5.0');
                expect(path[1].to).to.equal('4.0.0');
            });
        });
    });

    describe('✅ Individual Migration Functions', () => {
        it('should migrate from v1.0 to v2.0 successfully', () => {
            cy.window().then(async (win) => {
                // Set up v1.0 data
                win.localStorage.setItem('spotkin_setup_completed', 'true');
                win.localStorage.setItem('spotkin_alert_settings', JSON.stringify({
                    enabled: true,
                    sensitivity: 7,
                    playSound: true,
                    vibrate: false
                }));
                
                const migration = new win.PreferenceMigrationSystem();
                const result = await migration.migrateFrom1To2();
                
                expect(result.success).to.be.true;
                expect(result.migratedKeys).to.include('spotkin_onboarding_completed');
                expect(result.migratedKeys).to.include('spotkin_alert_preferences');
                
                // Check migrated data
                const onboarding = win.localStorage.getItem('spotkin_onboarding_completed');
                expect(onboarding).to.equal('true');
                
                const alertPrefs = JSON.parse(win.localStorage.getItem('spotkin_alert_preferences'));
                expect(alertPrefs.enabled).to.be.true;
                expect(alertPrefs.severity).to.equal(7);
                expect(alertPrefs.soundEnabled).to.be.true;
                expect(alertPrefs.vibrationEnabled).to.be.false;
                
                // Old keys should be removed
                expect(win.localStorage.getItem('spotkin_setup_completed')).to.be.null;
                expect(win.localStorage.getItem('spotkin_alert_settings')).to.be.null;
            });
        });

        it('should create comprehensive preferences structure in v4.0 migration', () => {
            cy.window().then(async (win) => {
                const migration = new win.PreferenceMigrationSystem();
                const result = await migration.migrateFrom35To4();
                
                expect(result.success).to.be.true;
                expect(result.migratedKeys).to.include('spotkin_preferences');
                
                const preferences = JSON.parse(win.localStorage.getItem('spotkin_preferences'));
                expect(preferences.version).to.equal('4.0.0');
                expect(preferences.user).to.exist;
                expect(preferences.monitoring).to.exist;
                expect(preferences.alerts).to.exist;
                expect(preferences.ai).to.exist;
                expect(preferences.privacy).to.exist;
                expect(preferences.security).to.exist;
            });
        });
    });

    describe('✅ Full Migration Process', () => {
        it('should perform complete migration from v1.0 to v4.0', () => {
            cy.window().then(async (win) => {
                // Set up v1.0 environment
                win.localStorage.setItem('spotkin_setup_completed', 'true');
                win.localStorage.setItem('spotkin_alert_settings', JSON.stringify({
                    enabled: true,
                    sensitivity: 8
                }));
                
                const migration = new win.PreferenceMigrationSystem();
                const result = await migration.performMigration();
                
                expect(result.success).to.be.true;
                expect(result.migrated).to.be.true;
                expect(result.fromVersion).to.equal('1.0.0');
                expect(result.toVersion).to.equal('4.0.0');
                
                // Check final state
                const version = win.localStorage.getItem('spotkin_app_version');
                expect(version).to.equal('4.0.0');
                
                const preferences = win.localStorage.getItem('spotkin_preferences');
                expect(preferences).to.not.be.null;
            });
        });

        it('should skip migration when not needed', () => {
            cy.window().then(async (win) => {
                // Set up current version
                win.localStorage.setItem('spotkin_app_version', '4.0.0');
                
                const migration = new win.PreferenceMigrationSystem();
                const result = await migration.performMigration();
                
                expect(result.success).to.be.true;
                expect(result.migrated).to.be.false;
            });
        });
    });

    describe('✅ Backup and Rollback System', () => {
        it('should create backup before migration', () => {
            cy.window().then(async (win) => {
                // Set up some data
                win.localStorage.setItem('spotkin_setup_completed', 'true');
                win.localStorage.setItem('spotkin_alert_settings', '{"test": true}');
                
                const migration = new win.PreferenceMigrationSystem();
                await migration.createPreMigrationBackup();
                
                // Check backup was created
                const backupKeys = Object.keys(win.localStorage)
                    .filter(key => key.startsWith('spotkin_backup_'));
                
                expect(backupKeys.length).to.be.greaterThan(0);
                
                const backup = JSON.parse(win.localStorage.getItem(backupKeys[0]));
                expect(backup.timestamp).to.exist;
                expect(backup.version).to.exist;
                expect(backup.data['spotkin_setup_completed']).to.equal('true');
            });
        });

        it('should clean old backups', () => {
            cy.window().then((win) => {
                const migration = new win.PreferenceMigrationSystem();
                
                // Create multiple mock backups
                for (let i = 0; i < 7; i++) {
                    win.localStorage.setItem(`spotkin_backup_${Date.now() + i}`, JSON.stringify({
                        timestamp: new Date().toISOString(),
                        data: {}
                    }));
                }
                
                migration.cleanOldBackups();
                
                // Should keep only maxBackups (5)
                const backupKeys = Object.keys(win.localStorage)
                    .filter(key => key.startsWith('spotkin_backup_'));
                
                expect(backupKeys.length).to.equal(5);
            });
        });

        it('should rollback migration on failure', () => {
            cy.window().then(async (win) => {
                // Set up initial data
                win.localStorage.setItem('spotkin_test_key', 'original_value');
                
                const migration = new win.PreferenceMigrationSystem();
                
                // Create backup
                await migration.createPreMigrationBackup();
                
                // Modify data to simulate migration
                win.localStorage.setItem('spotkin_test_key', 'modified_value');
                
                // Perform rollback
                await migration.rollbackMigration();
                
                // Check data was restored
                const restoredValue = win.localStorage.getItem('spotkin_test_key');
                expect(restoredValue).to.equal('original_value');
            });
        });
    });

    describe('✅ Data Import/Export', () => {
        it('should export user data correctly', () => {
            cy.window().then((win) => {
                // Set up some test data
                win.localStorage.setItem('spotkin_preferences', JSON.stringify({ test: true }));
                win.localStorage.setItem('spotkin_user_profile', JSON.stringify({ name: 'test' }));
                
                const migration = new win.PreferenceMigrationSystem();
                const exportData = migration.exportUserData();
                
                expect(exportData.version).to.equal('4.0.0');
                expect(exportData.timestamp).to.exist;
                expect(exportData.preferences['spotkin_preferences']).to.exist;
                expect(exportData.preferences['spotkin_user_profile']).to.exist;
            });
        });

        it('should import user data and migrate if needed', () => {
            cy.window().then(async (win) => {
                const migration = new win.PreferenceMigrationSystem();
                
                const importData = {
                    version: '3.0.0',
                    preferences: {
                        'spotkin_user_profile': { monitorType: 'baby' },
                        'spotkin_ai_preferences': { sensitivity: 6 }
                    }
                };
                
                const result = await migration.importUserData(importData);
                
                expect(result.success).to.be.true;
                
                // Check data was imported and migrated
                const version = win.localStorage.getItem('spotkin_app_version');
                expect(version).to.equal('4.0.0');
                
                const preferences = win.localStorage.getItem('spotkin_preferences');
                expect(preferences).to.not.be.null;
            });
        });
    });

    describe('✅ Migration Status and Information', () => {
        it('should provide comprehensive migration status', () => {
            cy.window().then((win) => {
                win.localStorage.setItem('spotkin_app_version', '3.0.0');
                
                const migration = new win.PreferenceMigrationSystem();
                const status = migration.getMigrationStatus();
                
                expect(status.currentUserVersion).to.equal('3.0.0');
                expect(status.latestVersion).to.equal('4.0.0');
                expect(status.migrationNeeded).to.be.true;
                expect(status.migrationHistory).to.be.an('array');
            });
        });

        it('should track migration history', () => {
            cy.window().then((win) => {
                const migration = new win.PreferenceMigrationSystem();
                migration.recordMigrationSuccess('2.0.0', '3.0.0');
                
                const history = JSON.parse(win.localStorage.getItem('spotkin_migration_history'));
                expect(history).to.be.an('array');
                expect(history[0].from).to.equal('2.0.0');
                expect(history[0].to).to.equal('3.0.0');
                expect(history[0].success).to.be.true;
            });
        });
    });

    describe('✅ Integration with Main Application', () => {
        it('should initialize migration system on app load', () => {
            cy.window().then((win) => {
                // Migration system should be available
                expect(win.PreferenceMigrationSystem).to.exist;
                
                // Should be able to create instance
                const migration = new win.PreferenceMigrationSystem();
                expect(migration).to.exist;
            });
        });

        it('should not interfere with main application', () => {
            cy.window().then(async (win) => {
                const migration = new win.PreferenceMigrationSystem();
                await migration.performMigration();
                
                // Main app should still be functional
                cy.get('#take-snapshot').should('exist').and('not.be.disabled');
                cy.get('#preferences-btn').should('exist').and('not.be.disabled');
            });
        });
    });

    describe('✅ Error Handling and Resilience', () => {
        it('should handle corrupted data gracefully', () => {
            cy.window().then(async (win) => {
                // Set up corrupted JSON data
                win.localStorage.setItem('spotkin_alert_settings', 'invalid_json{');
                
                const migration = new win.PreferenceMigrationSystem();
                const result = await migration.migrateFrom1To2();
                
                // Should not crash and should continue with defaults
                expect(result.success).to.be.true;
            });
        });

        it('should handle missing localStorage gracefully', () => {
            cy.window().then(async (win) => {
                // Mock localStorage errors
                const originalGetItem = win.localStorage.getItem;
                cy.stub(win.localStorage, 'getItem').throws(new Error('Storage error'));
                
                const migration = new win.PreferenceMigrationSystem();
                
                // Should not crash
                expect(() => migration.getCurrentUserVersion()).to.not.throw();
                
                // Restore localStorage
                win.localStorage.getItem = originalGetItem;
            });
        });

        it('should continue operation if backup creation fails', () => {
            cy.window().then(async (win) => {
                const migration = new win.PreferenceMigrationSystem();
                
                // Mock localStorage.setItem to fail for backups
                const originalSetItem = win.localStorage.setItem;
                cy.stub(win.localStorage, 'setItem').callsFake((key, value) => {
                    if (key.startsWith('spotkin_backup_')) {
                        throw new Error('Storage quota exceeded');
                    }
                    originalSetItem.call(win.localStorage, key, value);
                });
                
                // Should not crash during backup creation
                await migration.createPreMigrationBackup();
                
                // Restore localStorage
                win.localStorage.setItem = originalSetItem;
            });
        });
    });
});