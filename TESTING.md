# SpotKin Visual Testing Guide

## Overview
This document provides a comprehensive guide for visual and interactive testing of the SpotKin application using Puppeteer for automated testing and interaction verification.

## Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Chrome or Chromium browser
- Puppeteer library

## Setup for Puppeteer Testing

### Installation
```bash
# Create a new directory for testing
mkdir spotkin-testing
cd spotkin-testing

# Install Puppeteer
npm init -y
npm install puppeteer
```

## Automated Testing Strategy

### Testing Approach
The testing focuses on:
1. Visual Interaction Verification
2. Button and Navigation Testing
3. Console Output Capture
4. Error Detection
5. Performance Monitoring

### Test Scenarios

#### 1. Page Navigation and Initialization
- Navigate to https://dseeker.github.io/spotkin/
- Verify page loads correctly
- Check for any immediate console errors

#### 2. Interactive Elements Testing
Buttons to Test:
- `#toggle-camera`: Camera switching
- `#upload-image`: Image upload functionality
- `#take-snapshot`: Snapshot capture
- `#toggle-monitoring`: Monitoring mode toggle
- Navigation menu links

#### 3. Console and Error Monitoring
- Capture console logs
- Detect and log any JavaScript errors
- Monitor global error events

### Sample Puppeteer Test Script

```javascript
const puppeteer = require('puppeteer');

async function testSpotKinApp() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Comprehensive error and log capturing
    page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();
        
        if (type === 'error') {
            console.error(`Console Error: ${text}`);
        } else if (type === 'warn') {
            console.warn(`Console Warning: ${text}`);
        }
    });

    try {
        // Navigate to the site
        await page.goto('https://dseeker.github.io/spotkin/', {
            waitUntil: 'networkidle0'
        });

        // Take initial screenshot
        await page.screenshot({ path: 'initial-page.png' });

        // Button interaction tests
        const buttonsToTest = [
            '#toggle-camera', 
            '#take-snapshot', 
            '#toggle-monitoring',
            '#upload-image'
        ];

        for (const selector of buttonsToTest) {
            try {
                await page.click(selector);
                console.log(`Successfully clicked: ${selector}`);
                
                // Optional: Wait and take screenshot after interaction
                await page.waitForTimeout(500);
                await page.screenshot({ path: `after-${selector.replace('#', '')}.png` });
            } catch (clickError) {
                console.error(`Failed to click ${selector}:`, clickError);
            }
        }

        // Performance monitoring
        const metrics = await page.metrics();
        console.log('Page Performance Metrics:', metrics);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

testSpotKinApp();
```

## Advanced Testing Techniques

### 1. Performance Monitoring
- Track page load times
- Analyze JavaScript execution performance
- Capture browser metrics

### 2. Error Tracking
- Global error event listener
- Console message type categorization
- Screenshot on error occurrence

### 3. Interaction Verification
- Validate button states
- Check UI changes after interactions
- Verify expected page behaviors

## Troubleshooting

### Common Issues
1. **Puppeteer Connection Problems**
   - Ensure Chrome/Chromium is installed
   - Check network connectivity
   - Verify GitHub Pages is accessible

2. **Test Timeout**
   - Increase default timeout in Puppeteer
   - Add explicit waiting mechanisms

3. **Permission Denied Errors**
   - Run with elevated permissions if needed
   - Check browser and system settings

## Running the Tests
```bash
# Basic test execution
node spotkin-test.js

# With additional logging
NODE_DEBUG=puppeteer node spotkin-test.js
```

## Reporting
- Generate detailed test reports
- Capture screenshots on failure
- Log comprehensive interaction details

## Contributing
- Report any testing inconsistencies
- Suggest improvements to the testing framework
- Help maintain and update test scenarios

## License
This testing guide is part of the SpotKin project and follows the project's licensing terms.
