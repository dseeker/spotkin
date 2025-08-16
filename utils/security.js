/**
 * SpotKin Security Module
 * Handles encryption, data validation, and security protocols
 */

class SpotKinSecurity {
    constructor() {
        this.encryptionKey = null;
        this.initializeEncryption();
    }

    /**
     * Initialize encryption key from secure storage or generate new one
     */
    async initializeEncryption() {
        try {
            // Try to get existing key from secure storage
            let keyData = localStorage.getItem('spotkin-security-key');
            
            if (!keyData) {
                // Generate new encryption key
                this.encryptionKey = await this.generateEncryptionKey();
                // Store securely (in production, use more secure storage)
                localStorage.setItem('spotkin-security-key', JSON.stringify({
                    created: Date.now(),
                    keyId: this.generateKeyId()
                }));
            } else {
                // Reconstruct key from stored data
                const keyInfo = JSON.parse(keyData);
                this.encryptionKey = await this.generateEncryptionKey(keyInfo.keyId);
            }
            
            console.log('🔐 Security module initialized');
        } catch (error) {
            console.error('❌ Failed to initialize encryption:', error);
        }
    }

    /**
     * Generate AES-256 encryption key
     */
    async generateEncryptionKey(seed = null) {
        try {
            if (!window.crypto || !window.crypto.subtle) {
                console.warn('⚠️ Web Crypto API not available, using fallback');
                return this.generateFallbackKey();
            }

            const keyMaterial = seed ? 
                new TextEncoder().encode(seed) : 
                window.crypto.getRandomValues(new Uint8Array(32));
            
            const key = await window.crypto.subtle.importKey(
                'raw',
                keyMaterial,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
            
            return key;
        } catch (error) {
            console.warn('⚠️ Failed to generate crypto key, using fallback:', error);
            return this.generateFallbackKey();
        }
    }

    /**
     * Generate fallback encryption key for unsupported browsers
     */
    generateFallbackKey() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return {
            type: 'fallback',
            key: Array.from(array)
        };
    }

    /**
     * Generate unique key identifier
     */
    generateKeyId() {
        return 'sk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Encrypt sensitive data
     */
    async encryptData(data) {
        try {
            if (!this.encryptionKey) {
                await this.initializeEncryption();
            }

            const plaintext = JSON.stringify(data);
            
            if (this.encryptionKey.type === 'fallback') {
                return this.fallbackEncrypt(plaintext);
            }

            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(plaintext);
            
            // Generate random IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                dataBuffer
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedBuffer), iv.length);
            
            return {
                encrypted: true,
                data: Array.from(combined),
                version: '1.0'
            };
        } catch (error) {
            console.error('❌ Encryption failed:', error);
            return { encrypted: false, data: data };
        }
    }

    /**
     * Decrypt sensitive data
     */
    async decryptData(encryptedData) {
        try {
            if (!encryptedData.encrypted) {
                return encryptedData.data;
            }

            if (!this.encryptionKey) {
                await this.initializeEncryption();
            }

            if (this.encryptionKey.type === 'fallback') {
                return this.fallbackDecrypt(encryptedData);
            }

            const combined = new Uint8Array(encryptedData.data);
            const iv = combined.slice(0, 12);
            const encryptedBuffer = combined.slice(12);

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encryptedBuffer
            );

            const decoder = new TextDecoder();
            const plaintext = decoder.decode(decryptedBuffer);
            
            return JSON.parse(plaintext);
        } catch (error) {
            console.error('❌ Decryption failed:', error);
            return null;
        }
    }

    /**
     * Fallback encryption for unsupported browsers
     */
    fallbackEncrypt(data) {
        try {
            const key = this.encryptionKey.key;
            let encrypted = '';
            
            for (let i = 0; i < data.length; i++) {
                const charCode = data.charCodeAt(i);
                const keyCode = key[i % key.length];
                encrypted += String.fromCharCode(charCode ^ keyCode);
            }
            
            return {
                encrypted: true,
                data: btoa(encrypted),
                version: '1.0',
                fallback: true
            };
        } catch (error) {
            console.error('❌ Fallback encryption failed:', error);
            return { encrypted: false, data: data };
        }
    }

    /**
     * Fallback decryption for unsupported browsers
     */
    fallbackDecrypt(encryptedData) {
        try {
            if (!encryptedData.fallback) {
                return null;
            }

            const key = this.encryptionKey.key;
            const encrypted = atob(encryptedData.data);
            let decrypted = '';
            
            for (let i = 0; i < encrypted.length; i++) {
                const charCode = encrypted.charCodeAt(i);
                const keyCode = key[i % key.length];
                decrypted += String.fromCharCode(charCode ^ keyCode);
            }
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('❌ Fallback decryption failed:', error);
            return null;
        }
    }

    /**
     * Sanitize user input to prevent XSS
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validate input data
     */
    validateInput(input, type = 'string', options = {}) {
        switch (type) {
            case 'string':
                return this.validateString(input, options);
            case 'number':
                return this.validateNumber(input, options);
            case 'email':
                return this.validateEmail(input);
            case 'url':
                return this.validateURL(input);
            default:
                return { valid: false, error: 'Unknown validation type' };
        }
    }

    /**
     * Validate string input
     */
    validateString(input, options = {}) {
        const { minLength = 0, maxLength = 1000, pattern = null } = options;
        
        if (typeof input !== 'string') {
            return { valid: false, error: 'Input must be a string' };
        }
        
        if (input.length < minLength) {
            return { valid: false, error: `Minimum length is ${minLength}` };
        }
        
        if (input.length > maxLength) {
            return { valid: false, error: `Maximum length is ${maxLength}` };
        }
        
        if (pattern && !new RegExp(pattern).test(input)) {
            return { valid: false, error: 'Input format is invalid' };
        }
        
        return { valid: true, sanitized: this.sanitizeInput(input) };
    }

    /**
     * Validate number input
     */
    validateNumber(input, options = {}) {
        const { min = -Infinity, max = Infinity, integer = false } = options;
        
        const num = Number(input);
        
        if (isNaN(num)) {
            return { valid: false, error: 'Input must be a number' };
        }
        
        if (num < min) {
            return { valid: false, error: `Minimum value is ${min}` };
        }
        
        if (num > max) {
            return { valid: false, error: `Maximum value is ${max}` };
        }
        
        if (integer && !Number.isInteger(num)) {
            return { valid: false, error: 'Input must be an integer' };
        }
        
        return { valid: true, value: num };
    }

    /**
     * Validate email address
     */
    validateEmail(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(input)) {
            return { valid: false, error: 'Invalid email format' };
        }
        
        return { valid: true, sanitized: this.sanitizeInput(input.toLowerCase()) };
    }

    /**
     * Validate URL
     */
    validateURL(input) {
        try {
            const url = new URL(input);
            
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(url.protocol)) {
                return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
            }
            
            return { valid: true, sanitized: url.toString() };
        } catch (error) {
            return { valid: false, error: 'Invalid URL format' };
        }
    }

    /**
     * Generate secure session token
     */
    generateSessionToken() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Hash sensitive data (for comparisons)
     */
    async hashData(data) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = new Uint8Array(hashBuffer);
            return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('❌ Hashing failed:', error);
            return null;
        }
    }

    /**
     * Check if running in secure context
     */
    isSecureContext() {
        return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    }

    /**
     * Get security headers for Content Security Policy
     */
    getSecurityHeaders() {
        return {
            'Content-Security-Policy': [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://js.puter.com",
                "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
                "img-src 'self' data: blob:",
                "connect-src 'self' https://api.puter.com https://puter.com",
                "font-src 'self' https://cdnjs.cloudflare.com",
                "media-src 'self' blob:",
                "worker-src 'self'",
                "frame-ancestors 'none'",
                "form-action 'self'",
                "base-uri 'self'"
            ].join('; '),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=self, microphone=self, geolocation=(), payment=(), usb=()'
        };
    }
}

// Initialize global security instance
window.spotkinSecurity = new SpotKinSecurity();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpotKinSecurity;
}

console.log('🔐 SpotKin Security Module loaded successfully');