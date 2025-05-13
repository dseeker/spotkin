# SpotKin

SpotKin is a smart visual AI tool for pet and baby monitoring based on the PetSpot requirements. It utilizes computer vision and AI to monitor and provide meaningful alerts for pets and babies.

## Features

- Semantic Scene Analysis: Understands what's happening, not just motion or sound
- Smart Alerts: Only notify when something meaningful happens
- Privacy-First Design: On-device processing with minimal data sharing
- No Hardware Required: Use your existing smartphone or tablet
- Continuous Monitoring: Set up automatic monitoring with configurable refresh rates
- History Timeline: View a timeline of past events and monitoring results
- Local Storage: Data persists across browser sessions
- Focused Object Detection: Clean display that focuses on pets and babies when present
- Audio Alerts: Get sound notifications for important warnings

## Installation & Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- A modern web browser (Chrome recommended)

### Option 1: Running with a Local Web Server (Recommended)

The application uses Puter.js for AI image analysis, which requires the application to be served from a web server due to security restrictions with the `file://` protocol.

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/spotkin.git
   cd spotkin
   ```

2. Install http-server globally (if not already installed):
   ```bash
   npm install -g http-server
   ```

3. Start the local web server:
   ```bash
   http-server -p 8080
   ```

4. Open a browser and navigate to:
   ```
   http://localhost:8080
   ```

### Option 2: Opening the HTML File Directly

While opening the index.html file directly in a browser is possible, the Puter.js AI functionality will not work due to security restrictions on the `file://` protocol. However, you can still see the UI and test the mock AI functionality:

1. Clone this repository
2. Open `index.html` in your browser
3. The application will detect that Puter.js is unavailable and activate the mock AI module

## Testing with Puppeteer

To automate testing of the SpotKin application using Puppeteer, follow these steps:

1. Install Puppeteer and required dependencies:
   ```bash
   npm install puppeteer-core
   ```

2. Install the required Chrome version for Puppeteer:
   ```bash
   npx puppeteer browsers install chrome@131.0.6778.204
   ```

3. Run the test script:
   ```bash
   node test-spotkin.js
   ```

This will launch Chrome, navigate to the SpotKin application, and check for any JavaScript errors.

## Troubleshooting

### Common Issues

1. **Puter.js Error: Unsupported Protocol**
   - **Symptom**: Error message stating "Puter.js Error: Unsupported Protocol"
   - **Cause**: Opening the application directly via the file:/// protocol
   - **Solution**: Serve the application through a web server using http-server as described above

2. **JavaScript Syntax Error**
   - **Symptom**: Error about "missing ) after argument list" in app.js
   - **Solution**: The application has been fixed to resolve this issue. If you encounter it, try clearing your browser cache or using a different browser.

3. **Camera Access Issues**
   - **Symptom**: Camera not initializing or "Camera error" message
   - **Solution**: Ensure your browser has permission to access the camera and that no other applications are using it

4. **Puppeteer Chrome Installation Issues**
   - **Symptom**: Error about "Could not find Chrome" when using Puppeteer
   - **Solution**: Install the specific Chrome version that Puppeteer requires:
     ```bash
     npx puppeteer browsers install chrome@131.0.6778.204
     ```

## Mock AI Mode

When running locally without access to the Puter AI API, the application automatically activates a mock AI module that provides random test responses to demonstrate the functionality. This allows you to test the UI and features without requiring an active internet connection or API access.

## GitHub Pages

This project is deployed on GitHub Pages and can be accessed at [https://dseeker.github.io/spotkin/](https://dseeker.github.io/spotkin/)

## Technologies Used

- HTML5, CSS3, JavaScript
- Tailwind CSS for styling
- Font Awesome for icons
- Puter.js for AI image analysis
- Local Storage API for persisting monitoring history
- Web Audio API for sound alerts
- Puppeteer for automated testing

## Recent Updates

- Added continuous monitoring with configurable refresh rates (5s, 10s, 15s, 30s, 60s)
- Implemented a timeline display for viewing past events
- Added focused display for pet and baby detection
- Improved the interface to handle cases when no pets or babies are detected
- Added local storage to persist monitoring history across sessions
- Implemented a mock AI for local testing without the Puter API
- Fixed JavaScript syntax issues in app.js
- Added automated testing with Puppeteer
- Added support for running with a local web server
- Enhanced documentation with setup and troubleshooting guides

## Development Notes

### Code Structure

- `index.html`: Main application entry point
- `app.js`: Core application logic
- `styles.css`: Custom styles beyond Tailwind CSS
- `test-spotkin.js`: Puppeteer test script for automated testing

### Running Tests

The included Puppeteer test script can be run to check for JavaScript errors and ensure the application loads correctly. This is particularly useful for regression testing after making changes.

## License

MIT
