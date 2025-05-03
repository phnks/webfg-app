#!/bin/bash

ENV=$1
DEPLOYMENT_ID=$2

if [ -z "$ENV" ]; then
  echo "Usage: $0 <env> [deployment_id]"
  echo "Environments: dev, qa, prod"
  exit 1
fi

if [ "$ENV" == "dev" ]; then
  BASE_URL="http://localhost:3000"
elif [ "$ENV" == "qa" ]; then
  if [ -z "$DEPLOYMENT_ID" ]; then
    echo "Error: DEPLOYMENT_ID is required for 'qa' environment."
    echo "Usage: $0 qa <deployment_id>"
    exit 1
  fi
  BASE_URL="https://webfg-gm-ap-qa${DEPLOYMENT_ID}.phnks.com"
elif [ "$ENV" == "prod" ]; then
  BASE_URL="https://webfg-gm-app.phnks.com"
else
  echo "Error: Invalid environment '$ENV'."
  echo "Environments: dev, qa, prod"
  exit 1
fi

echo "Running Cypress tests against $ENV environment: $BASE_URL"

# Set the CYPRESS_BASE_URL environment variable and run Cypress
cd . && CYPRESS_BASE_URL="$BASE_URL" npx cypress run
