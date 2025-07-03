module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Optimized timeouts - reduced since we're removing hardcoded waits
    defaultCommandTimeout: process.env.CI ? 8000 : 3000,
    requestTimeout: process.env.CI ? 8000 : 4000,
    responseTimeout: process.env.CI ? 15000 : 8000,
    pageLoadTimeout: process.env.CI ? 30000 : 15000,
    
    // Enable test isolation and optimize for speed
    testIsolation: true,
    
    // Video settings for faster execution
    video: false,
    screenshotOnRunFailure: true,
  },
};
