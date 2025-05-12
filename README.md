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

## Running Locally

This is a static web application that can be served from any web server. You can run it locally by:

1. Cloning this repository
2. Opening the index.html file in your browser

When running locally without access to the Puter AI API, a mock AI will be activated automatically that provides random test responses to demonstrate the functionality.

## GitHub Pages

This project is deployed on GitHub Pages and can be accessed at [https://dseeker.github.io/spotkin/](https://dseeker.github.io/spotkin/)

## Technologies Used

- HTML5, CSS3, JavaScript
- Tailwind CSS for styling
- Font Awesome for icons
- Local Storage API for persisting monitoring history
- Web Audio API for sound alerts

## Recent Updates

- Added continuous monitoring with configurable refresh rates (5s, 10s, 15s, 30s, 60s)
- Implemented a timeline display for viewing past events
- Added focused display for pet and baby detection
- Improved the interface to handle cases when no pets or babies are detected
- Added local storage to persist monitoring history across sessions
- Implemented a mock AI for local testing without the Puter API

## License

MIT
