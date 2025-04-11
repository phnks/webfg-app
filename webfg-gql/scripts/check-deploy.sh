#!/bin/bash
set -e

# --- Configuration ---
ENVIRONMENT=$1 # 'qa' or 'prod'
DEPLOYMENT_ID=${2:-none} # Deployment ID (e.g., PR number) or 'none'
STACK_NAME_CONFIG=$(node -p "require('./package.json').config.stack_name")

# --- Determine Names ---
ID_SUFFIX=""
if [ "$DEPLOYMENT_ID" != "none" ]; then
  ID_SUFFIX="$DEPLOYMENT_ID"
fi

if [ "$ENVIRONMENT" == "qa" ]; then
  MAIN_STACK_NAME="${STACK_NAME_CONFIG}-qa${ID_SUFFIX}"
else # prod
  MAIN_STACK_NAME="${STACK_NAME_CONFIG}"
fi

echo "Checking status for stack: $MAIN_STACK_NAME"

# --- Check Stack Status ---
STATUS=$(aws cloudformation describe-stack-events --stack-name "$MAIN_STACK_NAME" --query "StackEvents[?ResourceType=='AWS::CloudFormation::Stack' && LogicalResourceId=='$MAIN_STACK_NAME']|[0].ResourceStatus" --output text)

echo "Stack Status: $STATUS"

if [[ "$STATUS" == "UPDATE_COMPLETE" || "$STATUS" == "CREATE_COMPLETE" ]]; then
  echo "✅ Deployment Succeeded"
elif [[ "$STATUS" == *"ROLLBACK"* || "$STATUS" == *"FAILED"* ]]; then
  echo "❌ Deployment Failed. Root causes:"
  aws cloudformation describe-stack-events --stack-name "$MAIN_STACK_NAME" --max-items 25 --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`].[LogicalResourceId, ResourceStatusReason]' --output text
  exit 1
else
  echo "ℹ️ Stack status is inconclusive or still in progress: $STATUS"
  # Optionally exit with non-zero status for inconclusive states in CI
  # exit 1
fi
