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
npm test                   # Run all tests
npm run cypress:open       # Open Cypress test runner UI
npm run cypress:run        # Run Cypress tests in headless mode
npm run cypress:run dev    # Run against local dev environment 
npm run cypress:run qa ID  # Run against QA environment (needs deployment ID)
npm run cypress:run prod   # Run against production environment

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

1. Create a feature branch from `master`
2. Implement and test changes locally
3. Deploy to QA environment with a deployment ID (usually PR number)
4. Run tests against QA deployment
5. After approval, merge to master and deploy to production

## Environment Setup

Create a `.env.dev` file in the webfg-gm-app directory with:

```
REACT_APP_APPSYNC_URL="https://webfg-gql-qa[DEPLOYMENT_ID].phnks.com/graphql"
REACT_APP_APPSYNC_API_KEY=YOUR_TOKEN_HERE
```

## Recent Features

### Character Body Integration

- Adds BODY to ObjectCategory enum
- Implements tree view component for visualizing character body structure
- Body objects can have a hierarchical structure of parts

## Versioning

The GraphQL schema is versioned:
- QA schema version is stored in package.json config.qa_schema
- Production schema version is stored in package.json config.prod_schema