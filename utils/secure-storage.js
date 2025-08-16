/**
 * SpotKin Secure Storage Module
 * Handles encrypted storage of sensitive user data
 */

class SecureStorage {
    constructor() {
        this.security = window.spotkinSecurity;
        this.storagePrefix = 'spotkin_secure_';
        this.legacyPrefix = 'spotkin_';
        
        // Initialize migration if needed
        this.migrateLegacyData();
    }

    /**
     * Migrate legacy unencrypted data to encrypted storage
     */
    async migrateLegacyData() {
        try {
            const legacyKeys = [
                'spotkin_preferences',
                'monitoring-history',
                'spotkin-sync-preferences'
            ];

            for (const key of legacyKeys) {
                const legacyData = localStorage.getItem(key);
                if (legacyData && !localStorage.getItem(this.storagePrefix + key)) {
                    console.log(`🔄 Migrating legacy data: ${key}`);
                    
                    try {
                        const parsedData = JSON.parse(legacyData);
                        await this.setItem(key, parsedData);
                        
                        // Keep legacy data for rollback during beta
                        localStorage.setItem(key + '_backup', legacyData);
                        localStorage.removeItem(key);
                        
                        console.log(`✅ Successfully migrated: ${key}`);
                    } catch (parseError) {
                        console.warn(`⚠️ Failed to migrate ${key}:`, parseError);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Data migration failed:', error);
        }
    }

    /**
     * Securely store data with encryption
     */
    async setItem(key, value, options = {}) {
        try {
            const { encrypt = true, compress = false } = options;
            
            // Validate input
            const validation = this.security.validateInput(key, 'string', { maxLength: 100 });
            if (!validation.valid) {
                throw new Error(`Invalid key: ${validation.error}`);
            }

            let processedData = value;
            
            // Compress data if requested (for large datasets)
            if (compress && typeof value === 'object') {
                processedData = this.compressData(value);
            }

            // Encrypt sensitive data
            if (encrypt) {
                const encryptedData = await this.security.encryptData(processedData);
                processedData = encryptedData;
            }

            // Add metadata
            const storageData = {
                data: processedData,
                metadata: {
                    encrypted: encrypt,
                    compressed: compress,
                    timestamp: Date.now(),
                    version: '1.0'
                }
            };

            const storageKey = this.storagePrefix + validation.sanitized;
            localStorage.setItem(storageKey, JSON.stringify(storageData));
            
            console.log(`🔐 Securely stored: ${key}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to store ${key}:`, error);
            return false;
        }
    }

    /**
     * Securely retrieve data with decryption
     */
    async getItem(key, options = {}) {
        try {
            const { fallbackToLegacy = true } = options;
            
            // Validate input
            const validation = this.security.validateInput(key, 'string', { maxLength: 100 });
            if (!validation.valid) {
                throw new Error(`Invalid key: ${validation.error}`);
            }

            const storageKey = this.storagePrefix + validation.sanitized;
            let rawData = localStorage.getItem(storageKey);
            
            // Fallback to legacy storage if secure storage not found
            if (!rawData && fallbackToLegacy) {
                rawData = localStorage.getItem(key);
                if (rawData) {
                    console.log(`📦 Using legacy data for: ${key}`);
                    try {
                        return JSON.parse(rawData);
                    } catch (parseError) {
                        console.warn(`⚠️ Failed to parse legacy data for ${key}`);
                        return null;
                    }
                }
            }

            if (!rawData) {
                return null;
            }

            const storageData = JSON.parse(rawData);
            let processedData = storageData.data;

            // Decrypt if encrypted
            if (storageData.metadata?.encrypted) {
                processedData = await this.security.decryptData(processedData);
                if (processedData === null) {
                    console.warn(`⚠️ Failed to decrypt data for: ${key}`);
                    return null;
                }
            }

            // Decompress if compressed
            if (storageData.metadata?.compressed) {
                processedData = this.decompressData(processedData);
            }

            console.log(`🔓 Securely retrieved: ${key}`);
            return processedData;
        } catch (error) {
            console.error(`❌ Failed to retrieve ${key}:`, error);
            return null;
        }
    }

    /**
     * Remove item from secure storage
     */
    async removeItem(key) {
        try {
            const validation = this.security.validateInput(key, 'string', { maxLength: 100 });
            if (!validation.valid) {
                throw new Error(`Invalid key: ${validation.error}`);
            }

            const storageKey = this.storagePrefix + validation.sanitized;
            localStorage.removeItem(storageKey);
            
            // Also remove legacy version if exists
            localStorage.removeItem(key);
            
            console.log(`🗑️ Removed from storage: ${key}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to remove ${key}:`, error);
            return false;
        }
    }

    /**
     * Clear all secure storage
     */
    async clear() {
        try {
            const keys = Object.keys(localStorage);
            const secureKeys = keys.filter(key => key.startsWith(this.storagePrefix));
            
            for (const key of secureKeys) {
                localStorage.removeItem(key);
            }
            
            console.log(`🧹 Cleared ${secureKeys.length} items from secure storage`);
            return true;
        } catch (error) {
            console.error('❌ Failed to clear secure storage:', error);
            return false;
        }
    }

    /**
     * Get all secure storage keys
     */
    getAllKeys() {
        const keys = Object.keys(localStorage);
        return keys
            .filter(key => key.startsWith(this.storagePrefix))
            .map(key => key.replace(this.storagePrefix, ''));
    }

    /**
     * Get storage statistics
     */
    getStorageStats() {
        try {
            const keys = this.getAllKeys();
            let totalSize = 0;
            let encryptedCount = 0;
            
            keys.forEach(key => {
                const rawData = localStorage.getItem(this.storagePrefix + key);
                if (rawData) {
                    totalSize += rawData.length;
                    try {
                        const storageData = JSON.parse(rawData);
                        if (storageData.metadata?.encrypted) {
                            encryptedCount++;
                        }
                    } catch (e) {
                        // Ignore parsing errors for stats
                    }
                }
            });

            return {
                totalItems: keys.length,
                encryptedItems: encryptedCount,
                totalSizeBytes: totalSize,
                totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
                availableSpace: this.getAvailableSpace()
            };
        } catch (error) {
            console.error('❌ Failed to get storage stats:', error);
            return null;
        }
    }

    /**
     * Check available storage space
     */
    getAvailableSpace() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                navigator.storage.estimate().then(estimate => {
                    return {
                        quota: estimate.quota,
                        usage: estimate.usage,
                        available: estimate.quota - estimate.usage
                    };
                });
            }
            
            // Fallback estimation
            const testKey = '_storage_test_';
            const testData = 'x'.repeat(1024); // 1KB test
            let testSize = 0;
            
            try {
                while (testSize < 50 * 1024) { // Test up to 50MB
                    localStorage.setItem(testKey, testData.repeat(testSize));
                    testSize += 1024;
                }
            } catch (e) {
                // Storage full
            } finally {
                localStorage.removeItem(testKey);
            }
            
            return {
                estimated: true,
                available: testSize * 1024
            };
        } catch (error) {
            return { error: 'Unable to estimate storage space' };
        }
    }

    /**
     * Simple data compression (for large objects)
     */
    compressData(data) {
        try {
            const jsonString = JSON.stringify(data);
            // Simple compression by removing extra spaces and shortening keys
            const compressed = jsonString
                .replace(/\s+/g, ' ')
                .replace(/\"\s*:\s*\"/g, '":"')
                .replace(/\,\s*\"/g, ',"');
            
            return {
                compressed: true,
                data: compressed,
                originalSize: jsonString.length,
                compressedSize: compressed.length,
                ratio: Math.round((1 - compressed.length / jsonString.length) * 100)
            };
        } catch (error) {
            console.warn('⚠️ Compression failed:', error);
            return data;
        }
    }

    /**
     * Decompress data
     */
    decompressData(compressedData) {
        try {
            if (compressedData.compressed) {
                return JSON.parse(compressedData.data);
            }
            return compressedData;
        } catch (error) {
            console.warn('⚠️ Decompression failed:', error);
            return compressedData;
        }
    }

    /**
     * Export user data (GDPR compliance)
     */
    async exportUserData() {
        try {
            const keys = this.getAllKeys();
            const exportData = {};
            
            for (const key of keys) {
                const data = await this.getItem(key);
                if (data !== null) {
                    exportData[key] = data;
                }
            }
            
            const exportPackage = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                application: 'SpotKin',
                data: exportData
            };
            
            console.log('📦 User data exported successfully');
            return exportPackage;
        } catch (error) {
            console.error('❌ Failed to export user data:', error);
            return null;
        }
    }

    /**
     * Delete all user data (GDPR compliance)
     */
    async deleteAllUserData() {
        try {
            // Clear secure storage
            await this.clear();
            
            // Clear any remaining legacy data
            const allKeys = Object.keys(localStorage);
            const spotkinKeys = allKeys.filter(key => key.startsWith('spotkin'));
            
            for (const key of spotkinKeys) {
                localStorage.removeItem(key);
            }
            
            // Clear IndexedDB data if any
            if ('indexedDB' in window) {
                try {
                    const databases = await indexedDB.databases();
                    for (const db of databases) {
                        if (db.name.includes('spotkin')) {
                            indexedDB.deleteDatabase(db.name);
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Could not clear IndexedDB:', e);
                }
            }
            
            console.log('🗑️ All user data deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to delete all user data:', error);
            return false;
        }
    }
}

// Initialize global secure storage instance
window.secureStorage = new SecureStorage();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureStorage;
}

console.log('🔐 SpotKin Secure Storage Module loaded successfully');