const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
      on("file:preprocessor", createBundler());
      return config;
    },
    supportFile: "cypress/support/commands.js",
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    
    // Enhanced screenshot and video settings
    screenshotOnRunFailure: true,
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
    videoCompression: 32,
    
    // Viewport settings for consistent testing
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Extended timeouts for AI processing
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    
    // Retry configuration for flaky tests
    retries: {
      runMode: 2,
      openMode: 0
    }
  },
});