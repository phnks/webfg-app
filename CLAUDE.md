# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Completing a Task

1. In this project, whenever you finish a task, please run the necessary commands in terminal to test your code changes by running the deploy:qa commands as already stated, then confirming they worked using the check-deploy:qa commands as also previously stated.
2. Then you must take the role of the user and test your code changes, simulating a real user of the application. Use the Puppeteer testing instructions above to thoroughly test your frontend changes.
3. When you have confirmed that your changes are working then do the following
    1. Update the PR for your feature branch to include any additional code changes you made for this task, use the `gh` cli for this
    2. On the PR make sure to include a detailed description of all the changes you made and in which files, why you made those changes, and then also describe any uncertainties or issues you encountered. If the PR description already exists make sure to update it and not overwrite what is already there
    3. Add all files you have made changes to using the `git add` command
    4. Then commit the files you added by using the `git commit` command, providing a descriptive commit message of what the changes include
    5. Push your commit using `git push`, confirm that it was pushed successfully
    6. Then message the user via the discord MCP to inform them that the task is complete, and that you added, committed, and pushed the changes successfully. Please provide a link to your PR so that the user can review your code changes
