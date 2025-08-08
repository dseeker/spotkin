const fs = require('fs');
const path = require('path');
const http = require('http');

/**
 * PWA Validation Script
 * Validates PWA implementation including manifest, service worker, and basic PWA requirements
 */

class PWAValidator {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.errors = [];
        this.warnings = [];
        this.passed = [];
    }

    async validateAll() {
        console.log('🔍 Starting PWA validation...\n');
        
        try {
            await this.validateManifest();
            await this.validateServiceWorker();
            await this.validateIcons();
            await this.validateHTMLMeta();
            await this.validateHTTPS();
            await this.generateReport();
        } catch (error) {
            console.error('❌ PWA Validation failed:', error.message);
            process.exit(1);
        }
    }

    async validateManifest() {
        console.log('📋 Validating Web App Manifest...');
        
        const manifestPath = path.join(__dirname, '..', 'manifest.json');
        
        if (!fs.existsSync(manifestPath)) {
            this.errors.push('Manifest file not found');
            return;
        }

        const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
        let manifest;
        
        try {
            manifest = JSON.parse(manifestContent);
        } catch (error) {
            this.errors.push('Manifest is not valid JSON');
            return;
        }

        // Required fields
        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
        const missingFields = requiredFields.filter(field => !manifest[field]);
        
        if (missingFields.length > 0) {
            this.errors.push(`Manifest missing required fields: ${missingFields.join(', ')}`);
        } else {
            this.passed.push('Manifest contains all required fields');
        }

        // Validate display modes
        const validDisplayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
        if (!validDisplayModes.includes(manifest.display)) {
            this.errors.push(`Invalid display mode: ${manifest.display}`);
        } else {
            this.passed.push(`Valid display mode: ${manifest.display}`);
        }

        // Validate icons
        if (manifest.icons && Array.isArray(manifest.icons)) {
            const hasRequiredSizes = manifest.icons.some(icon => 
                icon.sizes && (icon.sizes.includes('192x192') || icon.sizes.includes('512x512'))
            );
            
            if (hasRequiredSizes) {
                this.passed.push('Manifest contains required icon sizes');
            } else {
                this.warnings.push('Manifest should include 192x192 and 512x512 icon sizes');
            }
        }

        // Validate start_url
        if (manifest.start_url && !manifest.start_url.startsWith('./') && !manifest.start_url.startsWith('/')) {
            this.warnings.push('start_url should be relative to manifest location');
        }

        // Validate theme_color and background_color
        if (!manifest.theme_color) {
            this.warnings.push('theme_color not specified in manifest');
        }
        if (!manifest.background_color) {
            this.warnings.push('background_color not specified in manifest');
        }

        console.log('✅ Manifest validation complete\n');
    }

    async validateServiceWorker() {
        console.log('⚙️ Validating Service Worker...');
        
        const swPath = path.join(__dirname, '..', 'sw.js');
        
        if (!fs.existsSync(swPath)) {
            this.errors.push('Service worker file (sw.js) not found');
            return;
        }

        const swContent = fs.readFileSync(swPath, 'utf-8');
        
        // Check for essential service worker features
        const requiredFeatures = [
            { pattern: /addEventListener\(['"]install['"]/, message: 'Install event listener' },
            { pattern: /addEventListener\(['"]activate['"]/, message: 'Activate event listener' },
            { pattern: /addEventListener\(['"]fetch['"]/, message: 'Fetch event listener' },
            { pattern: /caches\.open/, message: 'Cache API usage' },
            { pattern: /cache\.addAll|cache\.add/, message: 'Cache population' }
        ];

        requiredFeatures.forEach(({ pattern, message }) => {
            if (pattern.test(swContent)) {
                this.passed.push(`Service worker implements ${message}`);
            } else {
                this.warnings.push(`Service worker missing ${message}`);
            }
        });

        // Check for notification support
        if (/addEventListener\(['"]push['"]/.test(swContent)) {
            this.passed.push('Service worker supports push notifications');
        } else {
            this.warnings.push('Service worker does not implement push notifications');
        }

        // Check for background sync
        if (/addEventListener\(['"]sync['"]/.test(swContent)) {
            this.passed.push('Service worker supports background sync');
        } else {
            this.warnings.push('Service worker does not implement background sync');
        }

        console.log('✅ Service worker validation complete\n');
    }

    async validateIcons() {
        console.log('🎨 Validating PWA Icons...');
        
        const imagesDir = path.join(__dirname, '..', 'images');
        
        if (!fs.existsSync(imagesDir)) {
            this.errors.push('Images directory not found');
            return;
        }

        const requiredIcons = [
            'favicon.png',
            'favicon.svg'
        ];

        const optionalIcons = [
            'icon-192.png',
            'icon-512.png',
            'icon-180.png', // Apple touch icon
        ];

        requiredIcons.forEach(icon => {
            const iconPath = path.join(imagesDir, icon);
            if (fs.existsSync(iconPath)) {
                this.passed.push(`Required icon found: ${icon}`);
            } else {
                this.errors.push(`Missing required icon: ${icon}`);
            }
        });

        optionalIcons.forEach(icon => {
            const iconPath = path.join(imagesDir, icon);
            if (fs.existsSync(iconPath)) {
                this.passed.push(`Optional icon found: ${icon}`);
            } else {
                this.warnings.push(`Missing optional icon: ${icon} (recommended for better PWA experience)`);
            }
        });

        console.log('✅ Icons validation complete\n');
    }

    async validateHTMLMeta() {
        console.log('📄 Validating HTML Meta Tags...');
        
        const indexPath = path.join(__dirname, '..', 'index.html');
        
        if (!fs.existsSync(indexPath)) {
            this.errors.push('index.html not found');
            return;
        }

        const htmlContent = fs.readFileSync(indexPath, 'utf-8');
        
        const requiredMeta = [
            { pattern: /<link[^>]*rel=['"]manifest['"]/, message: 'Manifest link tag' },
            { pattern: /<meta[^>]*name=['"]viewport['"]/, message: 'Viewport meta tag' },
            { pattern: /<meta[^>]*name=['"]theme-color['"]/, message: 'Theme color meta tag' }
        ];

        const pwaMeta = [
            { pattern: /<meta[^>]*name=['"]apple-mobile-web-app-capable['"]/, message: 'Apple mobile web app capable' },
            { pattern: /<meta[^>]*name=['"]apple-mobile-web-app-status-bar-style['"]/, message: 'Apple status bar style' },
            { pattern: /<link[^>]*rel=['"]apple-touch-icon['"]/, message: 'Apple touch icon' }
        ];

        requiredMeta.forEach(({ pattern, message }) => {
            if (pattern.test(htmlContent)) {
                this.passed.push(`HTML contains ${message}`);
            } else {
                this.errors.push(`HTML missing ${message}`);
            }
        });

        pwaMeta.forEach(({ pattern, message }) => {
            if (pattern.test(htmlContent)) {
                this.passed.push(`HTML contains ${message}`);
            } else {
                this.warnings.push(`HTML missing ${message} (recommended for iOS compatibility)`);
            }
        });

        // Check for service worker registration
        if (/navigator\.serviceWorker\.register/.test(htmlContent)) {
            this.passed.push('Service worker registration found in HTML');
        } else {
            this.errors.push('Service worker registration not found');
        }

        console.log('✅ HTML meta tags validation complete\n');
    }

    async validateHTTPS() {
        console.log('🔒 Validating HTTPS/Security...');
        
        // For localhost, we skip HTTPS validation but warn about production
        if (this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1')) {
            this.warnings.push('PWAs require HTTPS in production (localhost is exempt for testing)');
            this.passed.push('Local development environment detected');
        } else if (!this.baseUrl.startsWith('https://')) {
            this.errors.push('PWAs require HTTPS in production');
        } else {
            this.passed.push('HTTPS detected');
        }

        console.log('✅ HTTPS validation complete\n');
    }

    async testServiceWorkerRegistration() {
        console.log('🧪 Testing Service Worker Registration...');
        
        return new Promise((resolve) => {
            const testUrl = `${this.baseUrl}/sw.js`;
            
            http.get(testUrl, (res) => {
                if (res.statusCode === 200) {
                    this.passed.push('Service worker accessible via HTTP');
                } else {
                    this.errors.push(`Service worker returned status ${res.statusCode}`);
                }
                resolve();
            }).on('error', (error) => {
                this.errors.push(`Service worker not accessible: ${error.message}`);
                resolve();
            });
        });
    }

    generateReport() {
        console.log('📊 PWA Validation Report');
        console.log('=' .repeat(50));
        
        if (this.passed.length > 0) {
            console.log('\n✅ PASSED:');
            this.passed.forEach(item => console.log(`  • ${item}`));
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.warnings.forEach(item => console.log(`  • ${item}`));
        }
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach(item => console.log(`  • ${item}`));
        }

        const total = this.passed.length + this.warnings.length + this.errors.length;
        const score = Math.round((this.passed.length / total) * 100);
        
        console.log(`\n📈 PWA Score: ${score}% (${this.passed.length}/${total} checks passed)`);
        
        // Save report to file
        const report = {
            timestamp: new Date().toISOString(),
            score: score,
            passed: this.passed,
            warnings: this.warnings,
            errors: this.errors
        };

        const reportPath = path.join(__dirname, '..', 'reports', 'pwa-validation.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ PWA validation failed due to errors');
            process.exit(1);
        } else {
            console.log('\n✅ PWA validation completed successfully');
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new PWAValidator();
    validator.validateAll().catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = PWAValidator;