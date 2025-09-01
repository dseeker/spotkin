# Gemini Project Context: SpotKin

## Project Overview

SpotKin is a production-ready intelligent monitoring application that transforms ordinary devices into AI-powered guardians for babies, pets, and home environments. It is a Progressive Web App (PWA) built with HTML5, CSS3, and JavaScript. The application uses Puter.js for AI-powered image analysis and features a multi-layered text-to-speech (TTS) voice alert system. The project is designed to be run locally with a simple HTTP server and has no server-side components.

The application is architected with a focus on privacy and security, with all AI processing happening on-device. It includes features like a setup wizard, custom monitoring zones, user preferences, and an in-app help system. The codebase is well-tested with over 65 automated tests using Cypress.

## Building and Running

This project is a static web application and does not require a build process.

### Running the Application

To run the application, you need to serve the files using a local web server. The recommended way is to use the `http-server` package, which is listed as a dependency.

```bash
# Install dependencies
npm install

# Start the application
npm run start-app
```

This will start a web server on port 3000. You can then access the application at `http://localhost:3000`.

### Running Tests

The project uses Cypress for end-to-end testing. The following scripts are available for running tests:

```bash
# Run all Cypress tests
npm test

# Run PWA-specific tests (Lighthouse audit and manifest validation)
npm run test:pwa

# Run Lighthouse PWA audit and generate a report
npm run lighthouse:pwa

# Validate the PWA manifest
npm run validate-manifest
```

## Development Conventions

The project follows standard web development conventions.

*   **Code Style:** The code is written in modern JavaScript (ES6+), using async/await patterns. The styling is done with utility-first CSS using Tailwind CSS.
*   **Testing:** The project has a strong emphasis on testing. Cypress is used for end-to-end testing, and there are specific tests for PWA functionality, security, and accessibility. The tests are located in the `cypress/e2e` directory.
*   **Documentation:** The `docs` directory contains detailed documentation about the project, including the technical architecture, roadmap, and UX guidelines.
*   **Modularity:** The application is organized into modules, which are located in the `modules` directory. This promotes a clean and maintainable code structure.
*   **PWA:** The application is a fully-featured Progressive Web App, with a service worker (`sw.js`), manifest (`manifest.json`), and offline capabilities.

## Application Entry Point

The application's entry point is the `index.html` file. This file loads the necessary CSS and JavaScript files, including the main application script, `app.js`. The `app.js` file is responsible for initializing the application, handling user interactions, and managing the application's state. The main application container is a `div` element with the ID `app`.

## Module System

The project uses a dynamic module loading system implemented in `modules/module-loader.js`. This system lazy-loads non-critical features using dynamic `import()` with a fallback to a custom script loader for older browsers. This approach improves performance by splitting the code into smaller chunks and loading them on demand.

The following modules are lazy-loaded:

*   `preference-migration.js`
*   `feedback-collection.js`
*   `faq-system.js`
*   `contextual-help.js`
*   `onboarding-system.js`
*   `daily-summary.js`
*   `advanced-ai.js`

## Progressive Web App (PWA) Features

The application is a full-featured Progressive Web App, with a sophisticated service worker (`sw.js`) that provides the following features:

*   **Caching:** The service worker uses a combination of caching strategies to provide a fast and reliable user experience:
    *   **Cache-first:** For static assets.
    *   **Network-first:** For API calls.
    *   **Stale-while-revalidate:** For dynamic content.
*   **Offline Functionality:** The application is available offline, serving content from the cache when the user is not connected to the internet.
*   **Background Sync:** The service worker uses the Background Sync API to queue failed requests and retry them when the user is back online. It uses IndexedDB to store the queued requests.
*   **Push Notifications:** The application can send push notifications to the user for important alerts.
*   **Share Target:** The application can be a share target for files and other content.

## Testing

The project uses Cypress for end-to-end testing. The Cypress configuration is located in `cypress.config.js`. The tests are located in the `cypress/e2e` directory and follow the `*.cy.js` naming convention. The configuration includes extended timeouts to accommodate for asynchronous operations like AI processing and retries for failed tests to handle flakiness.