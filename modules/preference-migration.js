// User Preference Migration System
// Handles version upgrades, schema changes, and data format migrations

class PreferenceMigrationSystem {
    constructor() {
        this.currentVersion = '4.0.0';
        this.migrationHistory = this.loadMigrationHistory();
        this.backupPrefix = 'spotkin_backup_';
        this.maxBackups = 5;
        
        // Define all possible preference keys across versions
        this.knownPreferenceKeys = [
            // Core preferences
            'spotkin_preferences',
            'spotkin_user_profile',
            'spotkin_monitoring_settings',
            'spotkin_alert_preferences',
            
            // Storage and history
            'spotkin_monitoring_history',
            'spotkin_analysis_results',
            'spotkin_daily_summaries',
            
            // UI and onboarding
            'spotkin_onboarding_completed',
            'spotkin_first_use',
            'spotkin_help_state',
            'spotkin_faq_interactions',
            
            // Security and privacy
            'spotkin_security_settings',
            'spotkin_privacy_accepted',
            'spotkin_data_consent',
            
            // Legacy keys from older versions
            'spotkin_setup_completed', // v1.0 - v2.0
            'spotkin_alert_settings', // v1.0 - v3.0
            'spotkin_camera_settings', // v2.0 - v3.0
            'spotkin_ai_preferences' // v3.0 - v3.5
        ];
        
        this.migrationSchema = this.initializeMigrationSchema();
        console.log('🔄 Preference Migration System initialized');
    }

    // Initialize migration schema for different versions
    initializeMigrationSchema() {
        return {
            '1.0.0': {
                from: null,
                to: '1.0.0',
                changes: ['Initial version - no migrations needed']
            },
            '2.0.0': {
                from: '1.0.0',
                to: '2.0.0',
                changes: [
                    'Migrate setup_completed to onboarding_completed',
                    'Convert alert_settings to alert_preferences structure',
                    'Add monitoring_settings with default values'
                ],
                migrate: this.migrateFrom1To2.bind(this)
            },
            '3.0.0': {
                from: '2.0.0',
                to: '3.0.0',
                changes: [
                    'Consolidate camera_settings into monitoring_settings',
                    'Add AI preferences with sensitivity controls',
                    'Introduce user profile with monitoring type selection'
                ],
                migrate: this.migrateFrom2To3.bind(this)
            },
            '3.5.0': {
                from: '3.0.0',
                to: '3.5.0',
                changes: [
                    'Add security settings with encryption preferences',
                    'Migrate ai_preferences to integrated user_profile',
                    'Add privacy consent tracking'
                ],
                migrate: this.migrateFrom3To35.bind(this)
            },
            '4.0.0': {
                from: '3.5.0',
                to: '4.0.0',
                changes: [
                    'Implement comprehensive preference structure',
                    'Add FAQ interaction tracking',
                    'Enhanced security with encrypted storage migration',
                    'Add contextual help state management'
                ],
                migrate: this.migrateFrom35To4.bind(this)
            }
        };
    }

    // Main migration entry point
    async performMigration() {
        try {
            console.log('🔄 Starting preference migration process...');
            
            // Check if migration is needed
            const currentUserVersion = this.getCurrentUserVersion();
            const migrationNeeded = this.isMigrationNeeded(currentUserVersion);
            
            if (!migrationNeeded) {
                console.log('✅ No migration needed - user is on current version:', currentUserVersion);
                return { success: true, migrated: false, version: currentUserVersion };
            }
            
            console.log(`🔄 Migration needed from ${currentUserVersion} to ${this.currentVersion}`);
            
            // Create backup before migration
            await this.createPreMigrationBackup();
            
            // Perform step-by-step migrations
            const migrationResult = await this.executeSequentialMigrations(currentUserVersion);
            
            if (migrationResult.success) {
                // Update version and record migration
                this.setUserVersion(this.currentVersion);
                this.recordMigrationSuccess(currentUserVersion, this.currentVersion);
                
                console.log('✅ Migration completed successfully');
                return {
                    success: true,
                    migrated: true,
                    fromVersion: currentUserVersion,
                    toVersion: this.currentVersion,
                    migratedKeys: migrationResult.migratedKeys
                };
            } else {
                throw new Error('Migration failed: ' + migrationResult.error);
            }
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            await this.rollbackMigration();
            return { success: false, error: error.message };
        }
    }

    // Execute sequential migrations from old version to current
    async executeSequentialMigrations(fromVersion) {
        const migrationPath = this.calculateMigrationPath(fromVersion);
        const migratedKeys = new Set();
        
        console.log('🔄 Migration path:', migrationPath.map(m => `${m.from} → ${m.to}`));
        
        for (const migration of migrationPath) {
            try {
                console.log(`🔄 Executing migration: ${migration.from} → ${migration.to}`);
                
                if (migration.migrate) {
                    const result = await migration.migrate();
                    if (result.migratedKeys) {
                        result.migratedKeys.forEach(key => migratedKeys.add(key));
                    }
                }
                
                console.log(`✅ Migration completed: ${migration.from} → ${migration.to}`);
            } catch (error) {
                console.error(`❌ Migration failed: ${migration.from} → ${migration.to}`, error);
                throw error;
            }
        }
        
        return { success: true, migratedKeys: Array.from(migratedKeys) };
    }

    // Calculate the path of migrations needed
    calculateMigrationPath(fromVersion) {
        const path = [];
        const versions = ['1.0.0', '2.0.0', '3.0.0', '3.5.0', '4.0.0'];
        
        const fromIndex = versions.indexOf(fromVersion);
        const toIndex = versions.indexOf(this.currentVersion);
        
        if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
            return [];
        }
        
        for (let i = fromIndex + 1; i <= toIndex; i++) {
            const targetVersion = versions[i];
            if (this.migrationSchema[targetVersion]) {
                path.push(this.migrationSchema[targetVersion]);
            }
        }
        
        return path;
    }

    // Migration from v1.0 to v2.0
    async migrateFrom1To2() {
        console.log('🔄 Migrating from v1.0 to v2.0...');
        const migratedKeys = [];
        
        // Migrate setup_completed to onboarding_completed
        const setupCompleted = localStorage.getItem('spotkin_setup_completed');
        if (setupCompleted) {
            localStorage.setItem('spotkin_onboarding_completed', setupCompleted);
            localStorage.removeItem('spotkin_setup_completed');
            migratedKeys.push('spotkin_onboarding_completed');
        }
        
        // Convert alert_settings to new structure
        const oldAlertSettings = localStorage.getItem('spotkin_alert_settings');
        if (oldAlertSettings) {
            try {
                const parsed = JSON.parse(oldAlertSettings);
                const newAlertPreferences = {
                    enabled: parsed.enabled !== false,
                    severity: parsed.sensitivity || 5,
                    soundEnabled: parsed.playSound !== false,
                    vibrationEnabled: parsed.vibrate !== false,
                    version: '2.0.0',
                    migrated: true
                };
                
                localStorage.setItem('spotkin_alert_preferences', JSON.stringify(newAlertPreferences));
                localStorage.removeItem('spotkin_alert_settings');
                migratedKeys.push('spotkin_alert_preferences');
            } catch (error) {
                console.warn('Failed to migrate alert settings, using defaults');
            }
        }
        
        // Add default monitoring settings
        const monitoringSettings = {
            enabled: true,
            frequency: 5000,
            zoneEnabled: false,
            sensitivity: 5,
            version: '2.0.0'
        };
        
        localStorage.setItem('spotkin_monitoring_settings', JSON.stringify(monitoringSettings));
        migratedKeys.push('spotkin_monitoring_settings');
        
        return { success: true, migratedKeys };
    }

    // Migration from v2.0 to v3.0
    async migrateFrom2To3() {
        console.log('🔄 Migrating from v2.0 to v3.0...');
        const migratedKeys = [];
        
        // Consolidate camera settings into monitoring settings
        const cameraSettings = localStorage.getItem('spotkin_camera_settings');
        const monitoringSettings = JSON.parse(localStorage.getItem('spotkin_monitoring_settings') || '{}');
        
        if (cameraSettings) {
            try {
                const parsed = JSON.parse(cameraSettings);
                Object.assign(monitoringSettings, {
                    cameraDeviceId: parsed.deviceId,
                    resolution: parsed.resolution || 'auto',
                    facingMode: parsed.facingMode || 'user'
                });
                
                localStorage.setItem('spotkin_monitoring_settings', JSON.stringify(monitoringSettings));
                localStorage.removeItem('spotkin_camera_settings');
                migratedKeys.push('spotkin_monitoring_settings');
            } catch (error) {
                console.warn('Failed to migrate camera settings');
            }
        }
        
        // Create user profile with AI preferences
        const aiPreferences = localStorage.getItem('spotkin_ai_preferences');
        const userProfile = {
            monitorType: 'general',
            experience: 'beginner',
            aiSensitivity: 5,
            version: '3.0.0'
        };
        
        if (aiPreferences) {
            try {
                const parsed = JSON.parse(aiPreferences);
                Object.assign(userProfile, {
                    aiSensitivity: parsed.sensitivity || 5,
                    advancedMode: parsed.advanced || false
                });
            } catch (error) {
                console.warn('Failed to migrate AI preferences');
            }
        }
        
        localStorage.setItem('spotkin_user_profile', JSON.stringify(userProfile));
        migratedKeys.push('spotkin_user_profile');
        
        return { success: true, migratedKeys };
    }

    // Migration from v3.0 to v3.5
    async migrateFrom3To35() {
        console.log('🔄 Migrating from v3.0 to v3.5...');
        const migratedKeys = [];
        
        // Add security settings
        const securitySettings = {
            encryptionEnabled: true,
            dataRetention: 30, // days
            autoDelete: true,
            version: '3.5.0'
        };
        
        localStorage.setItem('spotkin_security_settings', JSON.stringify(securitySettings));
        migratedKeys.push('spotkin_security_settings');
        
        // Migrate AI preferences into user profile
        const userProfile = JSON.parse(localStorage.getItem('spotkin_user_profile') || '{}');
        const aiPreferences = localStorage.getItem('spotkin_ai_preferences');
        
        if (aiPreferences) {
            try {
                const parsed = JSON.parse(aiPreferences);
                userProfile.aiSettings = {
                    sensitivity: parsed.sensitivity || 5,
                    advancedMode: parsed.advanced || false,
                    contextAware: parsed.contextual !== false
                };
                
                localStorage.setItem('spotkin_user_profile', JSON.stringify(userProfile));
                localStorage.removeItem('spotkin_ai_preferences');
                migratedKeys.push('spotkin_user_profile');
            } catch (error) {
                console.warn('Failed to migrate AI preferences into user profile');
            }
        }
        
        // Add privacy consent tracking
        const privacyConsent = {
            dataProcessing: false,
            analytics: false,
            improvements: false,
            version: '3.5.0',
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('spotkin_privacy_accepted', JSON.stringify(privacyConsent));
        migratedKeys.push('spotkin_privacy_accepted');
        
        return { success: true, migratedKeys };
    }

    // Migration from v3.5 to v4.0
    async migrateFrom35To4() {
        console.log('🔄 Migrating from v3.5 to v4.0...');
        const migratedKeys = [];
        
        // Migrate to comprehensive preference structure
        const preferences = this.createComprehensivePreferences();
        
        // Merge existing settings
        const existingSettings = [
            'spotkin_user_profile',
            'spotkin_monitoring_settings',
            'spotkin_alert_preferences',
            'spotkin_security_settings'
        ];
        
        existingSettings.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    this.mergeIntoPreferences(preferences, key, parsed);
                } catch (error) {
                    console.warn(`Failed to migrate ${key}`);
                }
            }
        });
        
        // Save comprehensive preferences
        localStorage.setItem('spotkin_preferences', JSON.stringify(preferences));
        migratedKeys.push('spotkin_preferences');
        
        // Initialize help and FAQ state
        const helpState = {
            enabled: false,
            completedTips: [],
            version: '4.0.0'
        };
        
        localStorage.setItem('spotkin_help_state', JSON.stringify(helpState));
        migratedKeys.push('spotkin_help_state');
        
        // Initialize FAQ interactions
        const faqInteractions = {
            totalViews: 0,
            helpfulRatings: {},
            searchHistory: [],
            version: '4.0.0'
        };
        
        localStorage.setItem('spotkin_faq_interactions', JSON.stringify(faqInteractions));
        migratedKeys.push('spotkin_faq_interactions');
        
        // Migrate to encrypted storage if possible
        if (window.secureStorage) {
            await this.migrateToEncryptedStorage(preferences);
        }
        
        return { success: true, migratedKeys };
    }

    // Create comprehensive preference structure for v4.0
    createComprehensivePreferences() {
        return {
            version: '4.0.0',
            user: {
                profile: {
                    monitorType: 'general',
                    experience: 'beginner',
                    setupCompleted: false
                },
                preferences: {
                    theme: 'system',
                    language: 'en',
                    notifications: true
                }
            },
            monitoring: {
                enabled: true,
                frequency: 5000,
                zones: [],
                sensitivity: 5,
                camera: {
                    deviceId: 'default',
                    resolution: 'auto',
                    facingMode: 'user'
                }
            },
            alerts: {
                enabled: true,
                severity: 5,
                sound: true,
                vibration: true,
                visual: true
            },
            ai: {
                sensitivity: 5,
                contextAware: true,
                advancedMode: false,
                temporalAnalysis: true
            },
            privacy: {
                dataRetention: 30,
                analytics: false,
                improvements: false,
                consentGiven: false
            },
            security: {
                encryption: true,
                autoDelete: true,
                backupEnabled: true
            }
        };
    }

    // Merge existing settings into comprehensive preferences
    mergeIntoPreferences(preferences, key, data) {
        switch (key) {
            case 'spotkin_user_profile':
                preferences.user.profile = { ...preferences.user.profile, ...data };
                break;
            case 'spotkin_monitoring_settings':
                preferences.monitoring = { ...preferences.monitoring, ...data };
                break;
            case 'spotkin_alert_preferences':
                preferences.alerts = { ...preferences.alerts, ...data };
                break;
            case 'spotkin_security_settings':
                preferences.security = { ...preferences.security, ...data };
                break;
        }
    }

    // Migrate data to encrypted storage
    async migrateToEncryptedStorage(preferences) {
        try {
            console.log('🔐 Migrating to encrypted storage...');
            
            // Migrate preferences
            await window.secureStorage.setItem('preferences', preferences);
            
            // Migrate sensitive data
            const sensitiveKeys = [
                'spotkin_monitoring_history',
                'spotkin_analysis_results',
                'spotkin_daily_summaries'
            ];
            
            for (const key of sensitiveKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        await window.secureStorage.setItem(key.replace('spotkin_', ''), parsed);
                        localStorage.removeItem(key); // Remove from plaintext storage
                    } catch (error) {
                        console.warn(`Failed to migrate ${key} to encrypted storage`);
                    }
                }
            }
            
            console.log('✅ Migration to encrypted storage completed');
        } catch (error) {
            console.warn('⚠️ Could not migrate to encrypted storage:', error);
        }
    }

    // Create backup before migration
    async createPreMigrationBackup() {
        try {
            console.log('📦 Creating pre-migration backup...');
            
            const backup = {
                timestamp: new Date().toISOString(),
                version: this.getCurrentUserVersion(),
                data: {}
            };
            
            // Backup all known preference keys
            this.knownPreferenceKeys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    backup.data[key] = value;
                }
            });
            
            // Save backup with timestamp
            const backupKey = `${this.backupPrefix}${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(backup));
            
            // Clean old backups
            this.cleanOldBackups();
            
            console.log('✅ Pre-migration backup created:', backupKey);
        } catch (error) {
            console.warn('⚠️ Could not create backup:', error);
        }
    }

    // Clean old backups, keep only recent ones
    cleanOldBackups() {
        try {
            const backupKeys = Object.keys(localStorage)
                .filter(key => key.startsWith(this.backupPrefix))
                .sort()
                .reverse(); // Most recent first
            
            // Remove excess backups
            if (backupKeys.length > this.maxBackups) {
                const keysToRemove = backupKeys.slice(this.maxBackups);
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
                console.log(`🧹 Cleaned ${keysToRemove.length} old backups`);
            }
        } catch (error) {
            console.warn('Could not clean old backups:', error);
        }
    }

    // Rollback migration using most recent backup
    async rollbackMigration() {
        try {
            console.log('🔄 Rolling back migration...');
            
            const backupKeys = Object.keys(localStorage)
                .filter(key => key.startsWith(this.backupPrefix))
                .sort()
                .reverse();
            
            if (backupKeys.length === 0) {
                throw new Error('No backup found for rollback');
            }
            
            const latestBackupKey = backupKeys[0];
            const backup = JSON.parse(localStorage.getItem(latestBackupKey));
            
            // Restore all data from backup
            Object.entries(backup.data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
            
            console.log('✅ Migration rolled back to backup:', backup.timestamp);
        } catch (error) {
            console.error('❌ Rollback failed:', error);
        }
    }

    // Get current user version
    getCurrentUserVersion() {
        // Check for version in various places
        const versionSources = [
            () => localStorage.getItem('spotkin_app_version'),
            () => {
                const prefs = localStorage.getItem('spotkin_preferences');
                return prefs ? JSON.parse(prefs).version : null;
            },
            () => {
                const profile = localStorage.getItem('spotkin_user_profile');
                return profile ? JSON.parse(profile).version : null;
            },
            () => this.inferVersionFromData()
        ];
        
        for (const source of versionSources) {
            try {
                const version = source();
                if (version) return version;
            } catch (error) {
                continue;
            }
        }
        
        return '1.0.0'; // Default to earliest version
    }

    // Infer version from existing data structure
    inferVersionFromData() {
        // Check for v4.0 indicators
        if (localStorage.getItem('spotkin_faq_interactions') || 
            localStorage.getItem('spotkin_help_state')) {
            return '4.0.0';
        }
        
        // Check for v3.5 indicators
        if (localStorage.getItem('spotkin_security_settings') || 
            localStorage.getItem('spotkin_privacy_accepted')) {
            return '3.5.0';
        }
        
        // Check for v3.0 indicators
        if (localStorage.getItem('spotkin_user_profile') || 
            localStorage.getItem('spotkin_ai_preferences')) {
            return '3.0.0';
        }
        
        // Check for v2.0 indicators
        if (localStorage.getItem('spotkin_monitoring_settings') || 
            localStorage.getItem('spotkin_alert_preferences')) {
            return '2.0.0';
        }
        
        // Check for v1.0 indicators
        if (localStorage.getItem('spotkin_setup_completed') || 
            localStorage.getItem('spotkin_alert_settings')) {
            return '1.0.0';
        }
        
        return null;
    }

    // Check if migration is needed
    isMigrationNeeded(currentVersion) {
        return currentVersion !== this.currentVersion;
    }

    // Set user version
    setUserVersion(version) {
        localStorage.setItem('spotkin_app_version', version);
    }

    // Load migration history
    loadMigrationHistory() {
        try {
            const history = localStorage.getItem('spotkin_migration_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            return [];
        }
    }

    // Record successful migration
    recordMigrationSuccess(fromVersion, toVersion) {
        const record = {
            from: fromVersion,
            to: toVersion,
            timestamp: new Date().toISOString(),
            success: true
        };
        
        this.migrationHistory.push(record);
        
        // Keep only recent history
        if (this.migrationHistory.length > 10) {
            this.migrationHistory = this.migrationHistory.slice(-10);
        }
        
        localStorage.setItem('spotkin_migration_history', JSON.stringify(this.migrationHistory));
    }

    // Export all user data for backup/transfer
    exportUserData() {
        const exportData = {
            version: this.currentVersion,
            timestamp: new Date().toISOString(),
            preferences: {},
            history: this.migrationHistory
        };
        
        // Export all preference data
        this.knownPreferenceKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    exportData.preferences[key] = JSON.parse(value);
                } catch (error) {
                    exportData.preferences[key] = value;
                }
            }
        });
        
        return exportData;
    }

    // Import user data from export
    async importUserData(exportData) {
        try {
            console.log('📥 Importing user data...');
            
            // Create backup before import
            await this.createPreMigrationBackup();
            
            // Import preferences
            Object.entries(exportData.preferences).forEach(([key, value]) => {
                const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                localStorage.setItem(key, serialized);
            });
            
            // Update version and history
            this.setUserVersion(exportData.version || this.currentVersion);
            if (exportData.history) {
                localStorage.setItem('spotkin_migration_history', JSON.stringify(exportData.history));
            }
            
            // Run migration if needed
            if (exportData.version !== this.currentVersion) {
                await this.performMigration();
            }
            
            console.log('✅ User data imported successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to import user data:', error);
            await this.rollbackMigration();
            return { success: false, error: error.message };
        }
    }

    // Get migration status and information
    getMigrationStatus() {
        const currentUserVersion = this.getCurrentUserVersion();
        const migrationNeeded = this.isMigrationNeeded(currentUserVersion);
        
        return {
            currentUserVersion,
            latestVersion: this.currentVersion,
            migrationNeeded,
            migrationHistory: this.migrationHistory,
            availableBackups: Object.keys(localStorage)
                .filter(key => key.startsWith(this.backupPrefix))
                .length
        };
    }
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreferenceMigrationSystem;
} else if (typeof window !== 'undefined') {
    window.PreferenceMigrationSystem = PreferenceMigrationSystem;
}