#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
ENVIRONMENT=$1 # 'qa' or 'prod'
DEPLOYMENT_ID=${2:-none} # Deployment ID (e.g., PR number) or 'none'
STACK_NAME_CONFIG=$(node -p "require('../package.json').config.stack_name")
QA_SCHEMA_VERSION=$(node -p "require('../package.json').config.qa_schema")
PROD_SCHEMA_VERSION=$(node -p "require('../package.json').config.prod_schema")
SAM_DEPLOY_BUCKET="aws-sam-cli-managed-default-samclisourcebucket-ywih2vzoolbl" # Explicitly define

# --- Determine Names ---
ID_SUFFIX=""
if [ "$DEPLOYMENT_ID" != "none" ]; then
  ID_SUFFIX="$DEPLOYMENT_ID"
fi

if [ "$ENVIRONMENT" == "qa" ]; then
  BUCKET_STACK_NAME="${STACK_NAME_CONFIG}-schema-qa${ID_SUFFIX}"
  MAIN_STACK_NAME="${STACK_NAME_CONFIG}-qa${ID_SUFFIX}"
  SCHEMA_VERSION=$QA_SCHEMA_VERSION
else # prod
  BUCKET_STACK_NAME="${STACK_NAME_CONFIG}-schema"
  MAIN_STACK_NAME="${STACK_NAME_CONFIG}"
  SCHEMA_VERSION=$PROD_SCHEMA_VERSION
fi

SCHEMA_S3_KEY="schemas/schema_${SCHEMA_VERSION}.graphql"

echo "ENVIRONMENT: $ENVIRONMENT"
echo "DEPLOYMENT_ID: $DEPLOYMENT_ID"
echo "BUCKET_STACK_NAME: $BUCKET_STACK_NAME"
echo "MAIN_STACK_NAME: $MAIN_STACK_NAME"
echo "SCHEMA_S3_KEY: $SCHEMA_S3_KEY"
echo "SAM_DEPLOY_BUCKET: $SAM_DEPLOY_BUCKET"

# --- Step 1: Deploy S3 Bucket Stack ---
echo "Deploying S3 Bucket Stack: ${BUCKET_STACK_NAME}..."
sam deploy \
  --template-file s3-bucket.yaml \
  --stack-name "${BUCKET_STACK_NAME}" \
  --s3-bucket "${SAM_DEPLOY_BUCKET}" \
  --parameter-overrides Environment="${ENVIRONMENT}" ServiceName="${STACK_NAME_CONFIG}" DeploymentId="${DEPLOYMENT_ID}" \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset

# --- Step 2: Get Bucket Name ---
echo "Retrieving Bucket Name from stack ${BUCKET_STACK_NAME}..."
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "${BUCKET_STACK_NAME}" --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' --output text)
if [ -z "${BUCKET_NAME}" ]; then
  echo "Error: Failed to retrieve bucket name from stack ${BUCKET_STACK_NAME}"
  exit 1
fi
echo "Bucket Name: ${BUCKET_NAME}"

# --- Step 3: Build and Upload Schema ---
echo "Building and uploading schema..."
SCHEMA_S3_BUCKET="${BUCKET_NAME}" \
ENVIRONMENT="${ENVIRONMENT}" \
DEPLOYMENT_ID="${DEPLOYMENT_ID}" \
STACK_NAME="${MAIN_STACK_NAME}" \
SCHEMA_S3_KEY="${SCHEMA_S3_KEY}" \
node schema/buildSchema.js || echo "Schema build/upload failed (might be expected on first deploy)."

# --- Step 4: Build Main Stack ---
echo "Building Main Stack: ${MAIN_STACK_NAME}..."
sam build --cached --parallel

# --- Step 5: Deploy Main Stack ---
echo "Deploying Main Stack: ${MAIN_STACK_NAME}..."
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name "${MAIN_STACK_NAME}" \
  --s3-bucket "${SAM_DEPLOY_BUCKET}" \
  --parameter-overrides Environment="${ENVIRONMENT}" DeploymentId="${DEPLOYMENT_ID}" SchemaS3Key="${SCHEMA_S3_KEY}" SchemaS3BucketName="${BUCKET_NAME}" \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND

# --- Step 6: Populate Defaults ---
echo "Populating defaults for ${ENVIRONMENT} ${DEPLOYMENT_ID}..."
node scripts/populateDefaults.js "${ENVIRONMENT}" "${DEPLOYMENT_ID}"

echo "Deployment script finished successfully."
