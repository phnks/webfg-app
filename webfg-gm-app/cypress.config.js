module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Longer timeouts for CI environment
    defaultCommandTimeout: process.env.CI ? 10000 : 4000,
    requestTimeout: process.env.CI ? 10000 : 5000,
    responseTimeout: process.env.CI ? 30000 : 10000,
    pageLoadTimeout: process.env.CI ? 60000 : 30000,
  },
};
