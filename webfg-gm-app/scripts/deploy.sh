#!/bin/bash
set -e

# --- Configuration ---
ENVIRONMENT=$1 # 'qa' or 'prod'
DEPLOYMENT_ID=${2:-none} # Deployment ID (e.g., PR number) or 'none'

# --- Determine Names ---
ID_SUFFIX=""
if [ "$DEPLOYMENT_ID" != "none" ]; then
  ID_SUFFIX="$DEPLOYMENT_ID"
fi

if [ "$ENVIRONMENT" == "qa" ]; then
  STACK_NAME="webfg-gm-app-qa${ID_SUFFIX}"
  BUILD_SCRIPT="build" # Use standard build for QA
else # prod
  STACK_NAME="webfg-gm-app"
  BUILD_SCRIPT="build" # Use prod build for Prod
fi

echo "ENVIRONMENT: $ENVIRONMENT"
echo "DEPLOYMENT_ID: $DEPLOYMENT_ID"
echo "STACK_NAME: $STACK_NAME"

# --- Get GQL Outputs ---
GQL_ID_SUFFIX=""
if [ "$DEPLOYMENT_ID" != "none" ]; then
  GQL_ID_SUFFIX="$DEPLOYMENT_ID"
fi
GQL_STACK_NAME="webfg-gql-qa${GQL_ID_SUFFIX}"
if [ "$ENVIRONMENT" == "prod" ]; then
  GQL_STACK_NAME="webfg-gql" # Use prod GQL stack name for prod GM App deploy
fi

echo "Retrieving outputs from GQL stack: ${GQL_STACK_NAME}..."
GQL_API_URL=$(aws cloudformation describe-stacks --stack-name "${GQL_STACK_NAME}" --query 'Stacks[0].Outputs[?OutputKey==`GraphQLApiEndpoint`].OutputValue' --output text 2>/dev/null)
GQL_API_KEY=$(aws cloudformation describe-stacks --stack-name "${GQL_STACK_NAME}" --query 'Stacks[0].Outputs[?OutputKey==`GraphQLApiKey`].OutputValue' --output text 2>/dev/null  | awk -F'/' '{print $NF}')

if [ -z "${GQL_API_URL}" ] || [ -z "${GQL_API_KEY}" ]; then
  echo "Error: Failed to retrieve AppSync URL or API Key from stack ${GQL_STACK_NAME}"
  exit 1
fi
echo "GQL API URL: ${GQL_API_URL}"
echo "GQL API Key: ${GQL_API_KEY}" # Be cautious logging keys

# --- Build ---
echo "Building frontend ($BUILD_SCRIPT) with GQL endpoint..."
REACT_APP_APPSYNC_URL="${GQL_API_URL}" \
REACT_APP_APPSYNC_API_KEY="${GQL_API_KEY}" \
CI=false \
npm run "$BUILD_SCRIPT"

# --- Deploy Stack ---
echo "Deploying stack: ${STACK_NAME}..."
sam deploy \
  --no-confirm-changeset \
  --no-progressbar \
  --no-fail-on-empty-changeset \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides Environment="${ENVIRONMENT}" DeploymentId="${DEPLOYMENT_ID}" \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \

# --- Sync S3 ---
echo "Retrieving bucket name..."
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' --output text)
if [ -z "${BUCKET_NAME}" ]; then
  echo "Error: Failed to retrieve bucket name from stack ${STACK_NAME}"
  exit 1
fi
echo "Syncing build/ to s3://${BUCKET_NAME}..."
aws s3 sync build/ "s3://${BUCKET_NAME}" --delete

# --- Invalidate CloudFront ---
echo "Retrieving CloudFront Distribution ID..."
CF_DIST_ID=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text)
if [ -n "${CF_DIST_ID}" ]; then
  echo "Creating CloudFront invalidation for distribution ${CF_DIST_ID}..."
  AWS_PAGER="" aws cloudfront create-invalidation --distribution-id "${CF_DIST_ID}" --paths "/*"
else
  echo "Warning: Could not get CloudFront Distribution ID to create invalidation."
fi

echo "Deployment script finished successfully."
