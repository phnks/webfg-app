# GEMINI.md

This file provides guidance to Gemini CLI when working with code in this repository.

## Project Overview

The WEBFG (Web Fantasy Game) project is a web application consisting of two main components:

1. **webfg-gm-app**: A React frontend application (game master app) for managing characters, objects, actions, and encounters.
2. **webfg-gql**: A GraphQL API backend that provides data to the frontend.

Both components are deployed to AWS using SAM.

## Command Reference

### GM App (webfg-gm-app)

```bash
# Development server (local)
cd webfg-gm-app
npm start

# Background dev server
npm run start:bg     # Start in background
npm run stop:bg      # Stop background server
npm run restart:bg   # Restart background server

# Build for production
npm run build

# Testing
npm test                              # Run all tests
npm run cypress:open                  # Open Cypress test runner UI
npm run cypress:run                   # Run Cypress tests in headless mode
npm run cypress:run ${DEPLOYMENT_ID}  # Run against QA environment (needs deployment ID)

# Deployment
npm run deploy:qa ${DEPLOYMENT_ID}   # Deploy to QA (requires DEPLOYMENT_ID)
npm run deploy:prod                  # Deploy to production
npm run check-deploy:qa ${DEPLOYMENT_ID}  # Check QA deployment status
npm run delete:qa ${DEPLOYMENT_ID}   # Delete QA deployment
npm run delete:prod                  # Delete production deployment
```

### GraphQL API (webfg-gql)

```bash
# Build schema
cd webfg-gql
npm run build:schema:qa    # Build schema for QA
npm run build:schema:prod  # Build schema for production

# Deployment
npm run deploy:qa ${DEPLOYMENT_ID}   # Deploy to QA (requires DEPLOYMENT_ID)
npm run deploy:prod                  # Deploy to production
npm run check-deploy:qa ${DEPLOYMENT_ID}  # Check QA deployment status
npm run delete:qa ${DEPLOYMENT_ID}   # Delete QA deployment
npm run delete:prod                  # Delete production deployment

# SAM deployment commands
sam build                  # Build SAM template
sam deploy                 # Deploy SAM template
```

### AWS Authentication

When running AWS commands (including deployment scripts), you might encounter authentication issues depending on your environment:

1. First try with default profile (no AWS_PROFILE specified)
2. If authentication fails, use the `personal` profile:

```bash
# Example using personal profile
AWS_PROFILE=personal npm run deploy:qa ${DEPLOYMENT_ID}
AWS_PROFILE=personal npm run check-deploy:qa ${DEPLOYMENT_ID}
AWS_PROFILE=personal aws s3 ls

# Direct AWS CLI commands
AWS_PROFILE=personal aws cloudformation describe-stacks --stack-name webfg-gql-qa${DEPLOYMENT_ID}
```

Different development machines may require different authentication methods, so be prepared to try both approaches.

## Architecture

### Frontend Architecture (webfg-gm-app)

- **React Application**: Single-page application with React Router for navigation
- **Apollo Client**: For GraphQL data fetching, caching, and state management
- **Component Organization**:
  - `/components/characters/`: Character management UI
  - `/components/objects/`: Object management UI
  - `/components/actions/`: Action management UI
  - `/components/encounters/`: Encounter and VTT (Virtual Table Top) UI
  - `/components/forms/`: Reusable form components
  - `/components/common/`: Shared UI components
  - `/components/nav/`: Navigation components
- **Context API**: Used for shared state (e.g., SelectedCharacterContext)
- **GraphQL Operations**: Centralized in `src/graphql/operations.js`
- **Testing**: Cypress for end-to-end testing

### Backend Architecture (webfg-gql)

- **GraphQL API**: Built with AWS AppSync
- **Data Storage**: AWS DynamoDB
- **Schema**: Modular GraphQL schema files in `/schema` directory
- **Lambda Resolvers**: Functions in `/functions` directory that implement GraphQL resolvers
- **Deployment**: AWS SAM for infrastructure as code

### Data Model

The application revolves around these primary entities:

1. **Characters**: Playable entities with attributes, skills, stats, body structure, etc.
2. **Objects**: Physical items, weapons, armor, body parts, etc.
3. **Actions**: Activities characters can perform
4. **Encounters**: Game sessions with timeline and virtual table top functionality

## Development Workflow

1. When you are given a task for this project, the first thing you must ensure is that you have a feature branch for your task. Never work directly on master.
2. Once you have your feature branch, you must ensure that you have a pull request (PR) for that branch. There can only ever be 1 PR for each branch. You can use the `gh` cli tool to check for PRs to see if one already exists for your feature branch. 
3. If a PR does not exist for your feature branch create one using the same `gh` cli command.
4. Once you have a PR for your feature branch, ensure you remember the PR number. The PR number serves as your DEPLOYMENT_ID when testing any of your code changes.
5. This project has CICD using github actions which you can find under the .github folder. Each time you push a change to a remote branch that has a PR (and all feature branches should always have 1 PR), the github action will trigger and automatically deploy all your changes to a new environment tagged with your DEPLOYMENT_ID which is the same as your PR number. For example if your PR number is 69 it will automatically deploy webfg-gm-app-qa69 and webfg-gql-qa69.
6. You should ALWAYS still deploy manually using the commands in the package.json. For example: `npm run deploy:qa 69`. You should ALWAYS do this manual deployment since if your code changes cause it to fail you'll want to know the failure reason. The github action will not tell you if it failed.
7. You can use the `check-deploy:qa` comcommand as well to check the root cause of any deployment failure. For example: `npm run check-deploy:qa 69` would tell you the status of the deployment for DEPLOYMENT_ID 69 which is for PR number 69. For example, if you run `npm run deploy:qa 69` and are told that it failed, often the error will be from AWS CloudFormation and look something like ROLLBACK_COMPLETE or ROLLBACK_UPDATE_COMPLETE which means it failed and was rolled back by AWS.
8. webfg-gm-app is only for the react web frontend, and webfg-gql is only for the graphql backend. 
9. If your changes only affect the frontend you only need to deploy webfg-gm-app to test your changes
10. If your changes only affect the backend graphql or databases then you only need to deploy webfg-gql to test your changes.
11. Only deploy both webfg-gm-app and webfg-gql if your changes include both backend and frontend changes
12. It can take over 15 mins to depoy webfg-gql and over 5 mins to deploy webfg-gm-app so please make sure you only deploy when you have made changes in the respective apps to save time
13. **CRITICAL: Schema Version Management** - If you make ANY schema changes in webfg-gql, you MUST increment the schema version in the package.json for BOTH qa and prod. This is absolutely essential because:
    - AWS CloudFormation will not detect schema changes without version increments
    - QA schema version: `package.json config.qa_schema` 
    - Production schema version: `package.json config.prod_schema`
    - **ALWAYS update both versions when making schema changes**
    - **REMINDER: When completing a task with schema changes, increment prod_schema to match qa_schema before merging PR**
14. If you ever has questions during your task, you can message the user on discord via the discord MCP. The user's channel id is: 538552940303220750. The user will see your message then com
e back to answer your question. You may have to wait a while depending on how busy the user is with other tasks

## Context7 quick-start

Context7 pipes the latest, version-exact docs for 9 000+ libraries straight to you.
Use Context7 anytime you are working with a library to get up to date knowledge about that library.

1. **Invoke it** – just append `use context7` to any prompt:  
   > “Add Prisma pagination to this query. **use context7**”
2. **Reference specific docs** (optional):  
   * `@context7:docs://npm/next@latest` – Next.js docs  
   * `@context7:docs://crate/serde`     – Rust Serde docs

## Testing Strategy

**⚠️ CRITICAL: ALL TESTS MUST PASS BEFORE MERGING ⚠️**

This project has comprehensive test coverage across two levels:

### 1. Unit Tests (Jest)
- **webfg-gm-app**: React component unit tests
- **webfg-gql**: Lambda function unit tests

### 2. End-to-End Tests (Cypress)
- **webfg-gm-app**: Full user flow testing across all features

## Running Tests

### Unit Tests

```bash
# Frontend unit tests
cd webfg-gm-app
npm test                    # Run all unit tests in watch mode
npm run test:ci            # Run tests once (used in CI)

# Backend unit tests
cd webfg-gql
npm test                    # Run all Lambda function tests
```

### E2E Tests (Cypress)

```bash
cd webfg-gm-app
# Local development
npm run cypress:open        # Open Cypress test runner UI
npm run cypress:run         # Run all tests headless

# Against QA environment
npm run cypress:run ${DEPLOYMENT_ID}  # e.g., npm run cypress:run 69
```

## CI/CD Test Requirements

**ALL TESTS RUN AUTOMATICALLY ON EVERY PR AND MUST PASS:**

1. **GitHub Actions Pipeline** (`.github/workflows/deploy-qa.yml`):
   - ✅ GQL Unit Tests must pass
   - ✅ GM App Unit Tests must pass
   - ✅ Cypress E2E Tests must pass (100% success rate)
   - ❌ If ANY test fails, the PR cannot be merged

2. **Test Execution Order**:
   - Unit tests run first (fast feedback)
   - Deployment happens only if unit tests pass
   - E2E tests run against deployed QA environment
   - All must succeed for green build

## 🚨 CRITICAL TESTING RULES 🚨

### Rule 1: Run Tests After Every Code Change
```bash
# After making ANY code changes:
npm test                    # Run unit tests
npm run cypress:run         # Run E2E tests locally
```

### Rule 2: Tests Are Your Safety Net
- Tests catch regression bugs
- Tests prevent breaking existing features
- Tests ensure code quality
- **If tests fail after your changes, YOU BROKE SOMETHING**

### Rule 3: Fix Your Code, NOT the Tests
**This is the MOST IMPORTANT rule:**

❌ **WRONG APPROACH:**
- Tests fail after your changes
- You update tests to make them pass
- This defeats the entire purpose of testing!

✅ **CORRECT APPROACH:**
1. Tests fail after your changes
2. **Read the test failure carefully** - it tells you what broke
3. **Fix YOUR CODE** to make tests pass
4. Only modify tests if you added a NEW FEATURE that tests don't cover

### Rule 4: When to Update Tests

**Only update tests when:**
1. You added a **new feature** that doesn't have test coverage
2. You're fixing a **bug in the test itself** (rare)
3. The UI legitimately changed (e.g., button text changed from "Create" to "Add")

**Example of legitimate test update:**
```javascript
// Old UI had "Create Character" button
cy.contains('button', 'Create Character').click();

// New UI changed to "Add Character" button
cy.contains('button', 'Add Character').click();
```

### Rule 5: Tests Document Expected Behavior
- Tests show how the app SHOULD work
- If your code makes tests fail, your code is wrong
- Tests are the source of truth for application behavior

## Test Structure

### Cypress E2E Tests (`webfg-gm-app/cypress/e2e/`)
```
action_crud.cy.js           - Full CRUD for actions
action_crud_simple.cy.js    - Basic action operations
character_crud.cy.js        - Full CRUD for characters
character_associations.cy.js - Character relationships
condition_crud.cy.js        - Condition management
inventory_management.cy.js  - Inventory system tests
object_crud.cy.js          - Object management
... (18 test files total, 106+ individual tests)
```

### What E2E Tests Cover:
- ✅ Navigation between all pages
- ✅ Creating new entities (characters, objects, actions, conditions)
- ✅ Viewing entity lists and details
- ✅ Updating/editing entities
- ✅ Deleting entities
- ✅ Form validation
- ✅ Character associations (objects, actions, conditions)
- ✅ Inventory management (stash, equipped, ready items)
- ✅ Error handling
- ✅ UI interactions and workflows

### Unit Tests
```
webfg-gm-app/src/__tests__/  - React component tests
webfg-gql/functions/__tests__/ - Lambda function tests
```

### What Unit Tests Cover:
- ✅ Component rendering
- ✅ Props validation
- ✅ State management
- ✅ GraphQL mocking
- ✅ Lambda function logic
- ✅ DynamoDB operations
- ✅ Error scenarios

## Common Test Failure Scenarios

### Scenario 1: Selector Changed
**Symptom**: `cy.get('.old-class')` fails
**Fix**: Update selector in YOUR CODE to match what tests expect, or if UI legitimately changed, update test

### Scenario 2: GraphQL Query Changed
**Symptom**: Tests timeout waiting for data
**Fix**: Ensure your GraphQL changes are backwards compatible

### Scenario 3: Navigation Changed
**Symptom**: Tests can't find expected pages
**Fix**: Ensure routes and navigation still work as expected

### Scenario 4: Form Validation Changed
**Symptom**: Form tests fail on submission
**Fix**: Ensure you didn't break required field validation

## Test Maintenance Workflow

1. **Before starting work**: Run all tests to ensure clean baseline
2. **During development**: Run tests frequently
3. **Before committing**: Run ALL tests
4. **After pushing**: Monitor GitHub Actions for test results
5. **If tests fail in CI**: Fix immediately before proceeding

## Example: Proper Test-Driven Bug Fix

```bash
# 1. Tests are passing on master
npm test  # ✅ All pass

# 2. You make changes for a new feature
# ... edit code ...

# 3. Run tests
npm test  # ❌ 3 tests fail!

# 4. Read the failure
# "Expected button with text 'Save' but found 'undefined'"

# 5. Realize your code broke the Save button
# 6. Fix YOUR CODE to restore the Save button
# 7. Run tests again
npm test  # ✅ All pass

# 8. Only NOW commit your changes
```

**Remember**: The tests are there to protect you and the codebase. Respect them, and they'll save you from countless bugs and angry users!

## 🚨 CRITICAL: 90% Test Coverage Requirement 🚨

**MANDATORY FOR ALL DEVELOPERS AND CLAUDE CODE AGENTS:**

### Coverage Requirements
- **Total project coverage MUST be 90% minimum**
- This applies to:
  - Functions: 90%
  - Lines: 90% 
  - Statements: 90%
  - Branches: 90%

### Non-Negotiable Rules

1. **NEVER lower coverage thresholds** - Coverage must always remain at 90%
2. **If tests don't meet 90%, ADD MORE TESTS** - Do not adjust the coverage requirement
3. **Tests must be REAL, not hardcoded successes** - Jest coverage enforcement prevents faking it
4. **Coverage enforcement is configured in package.json and jest.config.js** for both projects

### What This Means

#### ❌ WRONG APPROACH:
```javascript
// BAD: Lowering thresholds when coverage is insufficient
"coverageThreshold": {
  "global": {
    "branches": 5,    // ❌ This defeats the purpose!
    "functions": 5,   // ❌ Never do this!
    "lines": 5,       // ❌ Absolutely forbidden!
    "statements": 5   // ❌ Fix your code coverage instead!
  }
}
```

#### ✅ CORRECT APPROACH:
```javascript
// GOOD: Always maintain 90% coverage
"coverageThreshold": {
  "global": {
    "branches": 90,   // ✅ Required: Always 90%
    "functions": 90,  // ✅ Required: Always 90%
    "lines": 90,      // ✅ Required: Always 90%
    "statements": 90  // ✅ Required: Always 90%
  }
}
```

### When Coverage Falls Below 90%

1. **Run coverage report**: `npm test -- --coverage`
2. **Identify uncovered code**: Look at the coverage report
3. **Write comprehensive tests**: Add unit tests for uncovered functions/lines
4. **Test edge cases**: Cover error scenarios, null inputs, boundary conditions
5. **Verify coverage**: Re-run tests until 90% is achieved

### Examples of Required Test Coverage

- **Lambda Functions**: Test success cases, error handling, validation, DynamoDB failures
- **Utility Functions**: Test all exported functions, edge cases, null/undefined inputs
- **React Components**: Test rendering, props, user interactions, error states
- **Resolvers**: Test GraphQL resolvers with various inputs and error scenarios

### Enforcement

- **Local Development**: Tests fail if coverage < 90%
- **CI/CD Pipeline**: GitHub Actions will fail the build if coverage < 90%
- **No Exceptions**: This rule applies to ALL code changes, no matter how small

**This requirement ensures code quality, prevents regression bugs, and maintains the reliability of the WEBFG system.**

## Frontend Testing with Puppeteer

**WHEN TO TEST**: Always test frontend changes after deploying to QA environment. This ensures your changes work correctly in the deployed environment.

### Basic Puppeteer Testing Flow

1. **Navigate to QA Environment**: 
```javascript
mcp__puppeteer__puppeteer_navigate("https://webfg-gm-app-qa{DEPLOYMENT_ID}.com")
```

2. **Take Initial Screenshot**:
```javascript
mcp__puppeteer__puppeteer_screenshot({name: "homepage", width: 1200, height: 800})
```

3. **Test Navigation** (click nav links):
```javascript
mcp__puppeteer__puppeteer_click("a[href='/characters']")  // Characters page
mcp__puppeteer__puppeteer_click("a[href='/objects']")     // Objects page  
mcp__puppeteer__puppeteer_click("a[href='/actions']")     // Actions page
mcp__puppeteer__puppeteer_click("a[href='/encounters']")  // Encounters page
```

4. **Test Forms** (character creation example):
```javascript
mcp__puppeteer__puppeteer_click("button:contains('Create Character')")
mcp__puppeteer__puppeteer_fill("input[name='name']", "Test Character")
mcp__puppeteer__puppeteer_fill("textarea[name='description']", "Test description")
mcp__puppeteer__puppeteer_click("button[type='submit']")
```

5. **Verify Changes** (take screenshots after interactions):
```javascript
mcp__puppeteer__puppeteer_screenshot({name: "after_form_submit"})
```

6. **Check for Errors** (look for error messages):
```javascript
mcp__puppeteer__puppeteer_evaluate("document.querySelector('.error-message')?.textContent || 'No errors'")
```

### Key Testing Areas

- **Character Management**: Create, edit, view characters
- **Object Management**: Create, edit, view objects  
- **Action System**: Test action creation and execution
- **Encounter/VTT**: Virtual table top functionality
- **Form Validation**: Test required fields and error handling
- **Responsive Design**: Test different screen sizes

Replace `{DEPLOYMENT_ID}` with your PR number (e.g., `https://webfg-gm-app-qa69.com` for PR #69).

## CRITICAL: Database Schema Backwards Compatibility

**⚠️ PRODUCTION INCIDENT PREVENTION ⚠️**

All database-level schema changes MUST be backwards compatible to prevent production incidents. A production incident occurred when new required fields (speed, weight, size, intensity) were added without considering existing data that had null values for these fields.

### Backwards Compatibility Requirements

1. **New Fields Must Be Optional**
   - Any new field added to the GraphQL schema MUST be optional (no `!` suffix)
   - Even if the field will eventually be required, it must start as optional
   - This allows existing data with null values to continue working

2. **Default Values**
   - New fields should have sensible default values in resolvers when null
   - Handle null gracefully in the application logic
   - Consider providing migration scripts to populate existing records

3. **Roll-Forward Approach**
   - Never make breaking changes that require immediate data migration
   - Use a phased approach:
     - Phase 1: Add new optional fields, deploy
     - Phase 2: Migrate existing data to populate new fields
     - Phase 3: Only after all data is migrated, consider making fields required

4. **Removing Fields**
   - Required fields CANNOT be removed directly
   - Instead, mark them as deprecated and add new optional replacement fields
   - Only remove deprecated fields after confirming no production data depends on them

5. **Testing Requirements**
   - Always test schema changes against production-like data
   - Verify that queries work with both old (null) and new data
   - Test list queries that may return mixed data states

### Example: Safe Field Addition

```graphql
# BAD - Will break production if existing data has null values
type Character {
  id: ID!
  name: String!
  speed: CharacterAttribute!  # ❌ Required field breaks existing data
}

# GOOD - Backwards compatible
type Character {
  id: ID!
  name: String!
  speed: CharacterAttribute   # ✅ Optional field handles null gracefully
}
```

### Schema Change Checklist

Before deploying any schema changes:
- [ ] Are all new fields optional?
- [ ] Do resolvers handle null values for new fields?
- [ ] Have you tested with existing production-like data?
- [ ] Have you incremented both qa_schema and prod_schema versions?
- [ ] Is there a migration plan for populating new fields?

**Remember: Production data integrity is paramount. When in doubt, make it optional!**

## Completing a Task

1. **RUN ALL TESTS FIRST**: Before anything else, ensure all tests pass:
   ```bash
   # Frontend tests
   cd webfg-gm-app
   npm test          # Unit tests
   npm run cypress:run  # E2E tests
   
   # Backend tests (if you changed backend)
   cd webfg-gql
   npm test
   ```
   **If ANY test fails, STOP and fix your code!**

2. Deploy your changes to QA environment:
   - Run the deploy:qa commands as stated above
   - Confirm deployment succeeded using check-deploy:qa commands
   
3. Test your changes manually:
   - Use Puppeteer to test frontend changes in deployed environment
   - Simulate real user interactions
   - Verify your feature works as expected

4. When you have confirmed everything works AND all tests pass:
    1. Update the PR for your feature branch to include any additional code changes you made for this task, use the `gh` cli for this
    2. On the PR make sure to include a detailed description of all the changes you made and in which files, why you made those changes, and then also describe any uncertainties or issues you encountered. If the PR description already exists make sure to update it and not overwrite what is already there
    3. Add all files you have made changes to using the `git add` command
    4. Then commit the files you added by using the `git commit` command, providing a descriptive commit message of what the changes include
    5. Push your commit using `git push`, confirm that it was pushed successfully
    6. Then message the user via the discord MCP to inform them that the task is complete, and that you added, committed, and pushed the changes successfully. Please provide a link to your PR so that the user can review your code changes
