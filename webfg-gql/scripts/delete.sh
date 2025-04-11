#!/bin/bash
set -e

# --- Configuration ---
ENVIRONMENT=$1 # 'qa' or 'prod'
DEPLOYMENT_ID=${2:?DEPLOYMENT_ID is required for delete} # Require Deployment ID for QA delete
STACK_NAME_CONFIG=$(node -p "require('./package.json').config.stack_name") # Corrected path

# --- Determine Names ---
ID_SUFFIX=""
if [ "$DEPLOYMENT_ID" != "none" ]; then
  ID_SUFFIX="$DEPLOYMENT_ID"
fi

if [ "$ENVIRONMENT" == "qa" ]; then
  BUCKET_STACK_NAME="${STACK_NAME_CONFIG}-schema-qa${ID_SUFFIX}"
  MAIN_STACK_NAME="${STACK_NAME_CONFIG}-qa${ID_SUFFIX}"
else # prod
  BUCKET_STACK_NAME="${STACK_NAME_CONFIG}-schema"
  MAIN_STACK_NAME="${STACK_NAME_CONFIG}"
fi

echo "ENVIRONMENT: $ENVIRONMENT"
echo "DEPLOYMENT_ID: $DEPLOYMENT_ID"
echo "BUCKET_STACK_NAME: $BUCKET_STACK_NAME"
echo "MAIN_STACK_NAME: $MAIN_STACK_NAME"

# --- Delete Main Stack ---
echo "Deleting Main Stack: ${MAIN_STACK_NAME}..."
aws cloudformation delete-stack --stack-name "${MAIN_STACK_NAME}" || echo "Main stack ${MAIN_STACK_NAME} not found or already deleting."

echo "Waiting for main stack deletion..."
aws cloudformation wait stack-delete-complete --stack-name "${MAIN_STACK_NAME}" || echo "Main stack wait failed (may already be deleted or failed deletion)."

# --- Empty and Delete Bucket Stack ---
echo "Retrieving Bucket Name from stack ${BUCKET_STACK_NAME}..."
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "${BUCKET_STACK_NAME}" --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' --output text 2>/dev/null)

if [ -n "${BUCKET_NAME}" ]; then
  echo "Emptying S3 Bucket: ${BUCKET_NAME}..."
  aws s3 rm "s3://${BUCKET_NAME}" --recursive || echo "Warning: Failed to empty bucket ${BUCKET_NAME} (may be empty or already deleted)."
else
  echo "Warning: Could not retrieve bucket name for stack ${BUCKET_STACK_NAME} to empty it."
fi

echo "Deleting S3 Bucket Stack: ${BUCKET_STACK_NAME}..."
aws cloudformation delete-stack --stack-name "${BUCKET_STACK_NAME}" || echo "Bucket stack ${BUCKET_STACK_NAME} not found or already deleting."

echo "Deletion script finished."
