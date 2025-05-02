# Cypress Testing Documentation

This directory contains the end-to-end Cypress tests for the webfg-gm-app frontend.

## Running Tests Locally

To run the Cypress tests, you must first ensure the webfg-gm-app application is running locally.

1.  **Start the application:**
    Navigate to the `webfg-gm-app` directory and run the development server:
    ```bash
    cd webfg-gm-app
    npm start
    ```
    *(Note: You may need a `.env.dev` file configured for the app to start. See the main `webfg-gm-app/README.md` for details.)*

2.  **Run Cypress:**

    *   **Interactive Mode (Cypress App):**
        To open the Cypress test runner GUI, run:
        ```bash
        cd webfg-gm-app
        npx cypress open
        ```
        This will launch the Cypress application, where you can select and watch tests run in a browser. *(Note: This requires a graphical environment and may not work in all terminal setups.)*

    *   **Headless Mode (CLI):**
        To run tests directly from the command line in a headless browser (useful for CI/CD or simple execution), run:
        ```bash
        cd webfg-gm-app
        npx cypress run
        ```
        This will execute all tests in the `cypress/e2e` directory and output the results to the terminal.

## Recommended NPM Scripts

For easier execution, use the NPM scripts added to `webfg-gm-app/package.json`:

-   `npm run cypress:open` - Opens the Cypress test runner.
-   `npm run cypress:run` - Runs tests headlessly via the CLI.

These scripts handle navigating to the correct directory and executing the `npx cypress` commands.

Ensure the application is running () before running any Cypress commands.

# Dummy change to trigger workflow
