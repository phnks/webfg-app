# WEBFG GM App

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Environment Setup

Create a `.env` file in the root directory with the following variables:

## Local

- `npm start`

## Build

- `npm run build`

## Deploy

- `npm run deploy`

## Deploy Hosting

- `sam build`
- `sam deploy`

This will build the application and upload it to the S3 bucket configured in the deploy script.

## Project Structure

- `/src` - Source code
  - `/components` - React components
    - `/actions` - Action-related components
    - `/characters` - Character-related components
    - `/common` - Shared components
    - `/forms` - Form components
    - `/objects` - Object-related components
  - `/graphql` - GraphQL queries, mutations, and subscriptions
  - `/App.js` - Main application component
  - `/index.js` - Application entry point

## Technologies Used

- React
- Apollo Client for GraphQL
- AWS (S3, CloudFront) for hosting
