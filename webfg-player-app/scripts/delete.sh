#!/bin/bash
set -e

# --- Configuration ---
ENVIRONMENT=$1 # 'qa' or 'prod'
DEPLOYMENT_ID=${2:?DEPLOYMENT_ID is required for delete} # Require Deployment ID for QA delete

# --- Determine Names ---
ID_SUFFIX=""
if [ "$DEPLOYMENT_ID" != "none" ]; then
  ID_SUFFIX="$DEPLOYMENT_ID"
fi

if [ "$ENVIRONMENT" == "qa" ]; then
  STACK_NAME="webfg-player-app-qa${ID_SUFFIX}"
else # prod
  STACK_NAME="webfg-player-app"
fi

echo "ENVIRONMENT: $ENVIRONMENT"
echo "DEPLOYMENT_ID: $DEPLOYMENT_ID"
echo "STACK_NAME: $STACK_NAME"

# --- Empty S3 Bucket ---
echo "Retrieving bucket name..."
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' --output text 2>/dev/null)

if [ -n "${BUCKET_NAME}" ]; then
  echo "Emptying S3 Bucket: ${BUCKET_NAME}..."
  aws s3 rm "s3://${BUCKET_NAME}" --recursive || echo "Warning: Failed to empty bucket ${BUCKET_NAME} (may be empty or already deleted)."
else
  echo "Warning: Could not retrieve bucket name for stack ${STACK_NAME} to empty it."
fi

# --- Delete Stack ---
echo "Deleting Stack: ${STACK_NAME}..."
aws cloudformation delete-stack --stack-name "${STACK_NAME}" || echo "Stack ${STACK_NAME} not found or already deleting."

echo "Deletion script finished."
