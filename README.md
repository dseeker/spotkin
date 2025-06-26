# SpotKin

SpotKin is an intelligent monitoring application that transforms your ordinary devices into AI-powered guardians for babies, pets, and home environments. Unlike traditional monitors that simply relay raw video or sound, SpotKin understands what it sees, providing meaningful insights and alerts only when something truly matters.

## Vision & Mission

Our vision is to give every parent and caregiver true peace of mind through smart, caring eyes. We believe an ordinary smartphone can become an intelligent guardian, silently watching over babies, pets, and homes with the sensitivity and understanding of a trusted sitter.

Our mission is to transform off-the-shelf devices into AI-powered "nannies" that see and understand the scene, delivering only meaningful alerts and replacing frantic checking with calm confidence.

## Key Features

- **Semantic Scene Analysis**: Understands what's happening, not just motion or sound
- **Contextual Alerts**: Only notify when something meaningful happens
- **Privacy-First Design**: On-device processing with minimal data sharing
- **No New Hardware Required**: Use your existing smartphone or tablet
- **Continuous Monitoring**: Set up automatic monitoring with configurable refresh rates
- **History Timeline**: View a timeline of past events and monitoring results
- **Multi-Frame Intelligence**: Analyze patterns across time for better understanding
- **Safety Detection**: Identify potential hazards in the monitoring environment

## Installation & Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- A modern web browser (Chrome recommended)

### Option 1: Running with a Local Web Server (Recommended)

The application uses Puter.js for AI image analysis, which requires the application to be served from a web server due to security restrictions with the `file://` protocol.

1. Clone this repository:
   ```bash
   git clone https://github.com/dseeker/spotkin.git
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

## Development Documentation

Detailed documentation for developers can be found in the `docs` directory:

- [Development Roadmap](docs/ROADMAP.md) - Strategic objectives and planned features
- [Implementation Tasks](docs/TASKS.md) - Specific coding tasks and priorities
- [Market Analysis](docs/MARKET-ANALYSIS.md) - Competitive landscape and positioning
- [UX Guidelines](docs/UX-GUIDELINES.md) - User experience principles and design standards
- [Technical Architecture](docs/TECHNICAL-ARCHITECTURE.md) - System design and code organization

## Troubleshooting

### Common Issues

1. **Puter.js Error: Unsupported Protocol**
   - **Symptom**: Error message stating "Puter.js Error: Unsupported Protocol"
   - **Cause**: Opening the application directly via the file:/// protocol
   - **Solution**: Serve the application through a web server using http-server as described above

2. **Camera Permission Issues**
   - **Symptom**: Camera fails to initialize or shows a black screen
   - **Cause**: Browser permissions not granted or blocked
   - **Solution**: Check browser settings and ensure camera permissions are allowed for the site

3. **AI Analysis Errors**
   - **Symptom**: AI analysis fails with error messages
   - **Cause**: Connection issues with Puter AI service or malformed requests
   - **Solution**: Ensure you're connected to the internet and try refreshing the page

4. **Puppeteer Chrome Installation Issues**
   - **Symptom**: Error about "Could not find Chrome" when using Puppeteer
   - **Solution**: Install the specific Chrome version that Puppeteer requires:
     ```bash
     npx puppeteer browsers install chrome@131.0.6778.204
     ```

## Mock AI Mode

When running locally without access to the Puter AI API, the application automatically activates a mock AI module that provides random test responses to demonstrate the functionality. This allows you to test the UI and features without requiring an active internet connection or API access.

## Contributing

We welcome contributions to SpotKin! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for more information on how to get involved.

## Technologies Used

- HTML5, CSS3, JavaScript
- Tailwind CSS for styling
- Font Awesome for icons
- Puter.js for AI image analysis
- Local Storage API for persisting monitoring history
- Web Audio API for sound alerts
- Puppeteer for automated testing

## Roadmap

See our [Development Roadmap](docs/ROADMAP.md) for information about planned features and enhancements.

## License

MIT

## Acknowledgments

- Inspired by the PetSpot vision document
- Special thanks to the Puter.js team for their AI vision capabilities
