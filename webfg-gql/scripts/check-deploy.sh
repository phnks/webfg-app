#!/bin/bash
set -e

# --- Configuration ---
ENVIRONMENT=$1           # 'qa' or 'prod'
DEPLOYMENT_ID=${2:-none}  # Deployment ID (e.g., PR number) or 'none'
STACK_NAME_CONFIG=$(node -p "require('./package.json').config.stack_name")

# --- Determine Names ---
ID_SUFFIX=""
if [ "$DEPLOYMENT_ID" != "none" ]; then
  ID_SUFFIX="$DEPLOYMENT_ID"
fi

if [ "$ENVIRONMENT" == "qa" ]; then
  MAIN_STACK_NAME="${STACK_NAME_CONFIG}-qa${ID_SUFFIX}"
else
  MAIN_STACK_NAME="${STACK_NAME_CONFIG}"
fi

echo "Checking status for stack: $MAIN_STACK_NAME"

# --- Check Main Stack Status ---
STATUS=$(aws cloudformation describe-stack-events --stack-name "$MAIN_STACK_NAME" \
  --query "StackEvents[?ResourceType=='AWS::CloudFormation::Stack' && LogicalResourceId=='$MAIN_STACK_NAME']|[0].ResourceStatus" \
  --output text)

echo "Stack Status: $STATUS"

if [[ "$STATUS" == "UPDATE_COMPLETE" || "$STATUS" == "CREATE_COMPLETE" ]]; then
  echo "✅ Deployment Succeeded"
elif [[ "$STATUS" == *"ROLLBACK"* || "$STATUS" == *"FAILED"* ]]; then
  echo "❌ Deployment Failed. Root causes:"

  # --- Recursive function to dig into nested stacks ---
  get_root_failure() {
    local STACK=$1
    echo "Checking failure events for stack: $STACK"

    # Use a query that picks events with a non-empty failure reason from a known set of failure statuses.
    local FAILURE_QUERY="reverse(StackEvents)[? (ResourceStatus=='CREATE_FAILED' || ResourceStatus=='UPDATE_FAILED' || ResourceStatus=='ROLLBACK_COMPLETE') && ResourceStatusReason!=null && ResourceStatusReason!='']"
    
    local REASON
    REASON=$(aws cloudformation describe-stack-events --stack-name "$STACK" \
      --query "${FAILURE_QUERY}[0].ResourceStatusReason" \
      --output text)
    local LOGICAL_ID
    LOGICAL_ID=$(aws cloudformation describe-stack-events --stack-name "$STACK" \
      --query "${FAILURE_QUERY}[0].LogicalResourceId" \
      --output text)

    if [[ -z "$REASON" || "$REASON" == "None" ]]; then
      echo "No failure events found in stack: $STACK"
      return 1
    fi

    echo "Event in $STACK => Resource: $LOGICAL_ID, Reason: $REASON"

    # If the failure reason indicates an embedded (nested) stack failure (the AWS message includes "Embedded stack"),
    # then we need to descend into that nested stack.
    if echo "$REASON" | grep -q "Embedded stack"; then
      echo "Detected nested stack failure in resource '$LOGICAL_ID' within stack '$STACK'."
      # Look up the nested stack PhysicalResourceId using the resource's Logical ID.
      local NESTED_STACK
      NESTED_STACK=$(aws cloudformation describe-stack-resources --stack-name "$STACK" \
         --logical-resource-id "$LOGICAL_ID" \
         --query 'StackResources[0].PhysicalResourceId' \
         --output text)
      if [[ -n "$NESTED_STACK" && "$NESTED_STACK" != "None" ]]; then
        echo "Descending into nested stack: $NESTED_STACK"
        get_root_failure "$NESTED_STACK"
      else
        echo "Could not resolve nested stack for resource '$LOGICAL_ID'. Failure reason: $REASON"
      fi
    else
      echo "Root failure identified in stack '$STACK':"
      echo "  Resource: $LOGICAL_ID"
      echo "  Reason: $REASON"
    fi
  }

  # Start the recursive checking with the main stack
  get_root_failure "$MAIN_STACK_NAME"
  exit 1
else
  echo "ℹ️  Stack status is inconclusive or still in progress: $STATUS"
  # Optionally exit with non-zero status for inconclusive states in CI
  # exit 1
fi

