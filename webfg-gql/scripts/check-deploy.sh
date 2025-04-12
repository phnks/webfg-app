#!/bin/bash
set -e

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is not installed. Please install jq (e.g., 'sudo apt-get install jq' or 'brew install jq')."
    exit 1
fi

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
  echo "❌ Deployment Failed. Searching for root cause..."
  echo "--------------------------------------------------"

  # --- Attempt 14 Recursive function ---
  get_root_failure() {
    local STACK=$1 # Stack Name or ARN
    local DEPTH=${2:-0}
    local INDENT=$(printf '%*s' $((DEPTH * 2)) '')

    echo "${INDENT}Checking failure events for stack: $STACK"

    # Get events
    local ALL_EVENTS
    ALL_EVENTS=$(aws cloudformation describe-stack-events --stack-name "$STACK" --output json)
    if [[ $? -ne 0 || -z "$ALL_EVENTS" ]]; then
        echo "${INDENT}❌ Error fetching events for stack: $STACK"
        local STACK_STATUS_REASON=$(aws cloudformation describe-stacks --stack-name "$STACK" --query "Stacks[0].StackStatusReason" --output text 2>/dev/null)
        [[ -n "$STACK_STATUS_REASON" ]] && echo "${INDENT}  Stack Status Reason: $STACK_STATUS_REASON"
        return 1 # Indicate error fetching events
    fi

    # 1. Find the first FAILED non-stack resource event with a meaningful reason
    local FAILED_NON_STACK_EVENT
    FAILED_NON_STACK_EVENT=$(echo "$ALL_EVENTS" | jq -c '
      .StackEvents | map(select(
        .ResourceType != "AWS::CloudFormation::Stack" and
        (.ResourceStatus | test("FAILED$")) and
        (.ResourceStatusReason | length > 0) and
        .ResourceStatusReason != "Resource creation cancelled" and
        .ResourceStatusReason != "Resource update cancelled" and
        .ResourceStatusReason != "None" and
        .ResourceStatusReason != "null"
      )) | .[0] // empty
    ')

    if [[ -n "$FAILED_NON_STACK_EVENT" ]]; then
        local EVENT_LOGICAL_ID=$(echo "$FAILED_NON_STACK_EVENT" | jq -r '.LogicalResourceId')
        local EVENT_RESOURCE_TYPE=$(echo "$FAILED_NON_STACK_EVENT" | jq -r '.ResourceType')
        local EVENT_REASON=$(echo "$FAILED_NON_STACK_EVENT" | jq -r '.ResourceStatusReason')
        echo "${INDENT}  Found failed non-stack resource event."
        echo ""
        echo "💥 Root failure identified in stack '$STACK':"
        echo "  Resource Type: $EVENT_RESOURCE_TYPE"
        echo "  Logical ID: $EVENT_LOGICAL_ID"
        echo "  Reason: $EVENT_REASON"
        return 1 # Failure found
    fi

    # 2. If no non-stack failure, find the first FAILED nested stack resource event
    #    Exclude the event for the stack itself (tricky, use Logical ID != main name for top level)
    local FAILED_STACK_RESOURCE_EVENT
    FAILED_STACK_RESOURCE_EVENT=$(echo "$ALL_EVENTS" | jq -c --arg mainStackName "$MAIN_STACK_NAME" --arg currentStackId "$STACK" '
      .StackEvents | map(select(
        .ResourceType == "AWS::CloudFormation::Stack" and
        # Heuristic: Logical ID is not the main stack name AND Physical ID is not the current stack ARN (if it exists)
        .LogicalResourceId != $mainStackName and
        (.PhysicalResourceId == null or .PhysicalResourceId != $currentStackId) and
        (.ResourceStatus | test("FAILED$")) and
        (.ResourceStatusReason | length > 0) and
        .ResourceStatusReason != "Resource creation cancelled" and
        .ResourceStatusReason != "Resource update cancelled" and
        .ResourceStatusReason != "None" and
        .ResourceStatusReason != "null"
      )) | .[0] // empty
    ')

    if [[ -n "$FAILED_STACK_RESOURCE_EVENT" ]]; then
        local NESTED_LOGICAL_ID=$(echo "$FAILED_STACK_RESOURCE_EVENT" | jq -r '.LogicalResourceId')
        local NESTED_REASON=$(echo "$FAILED_STACK_RESOURCE_EVENT" | jq -r '.ResourceStatusReason')
        local NESTED_PHYSICAL_ID=$(echo "$FAILED_STACK_RESOURCE_EVENT" | jq -r '.PhysicalResourceId') # May be null

        echo "${INDENT}  Found potential failed nested stack resource event:"
        echo "${INDENT}    Logical ID: $NESTED_LOGICAL_ID"
        echo "${INDENT}    Physical ID (from event): $NESTED_PHYSICAL_ID"
        echo "${INDENT}    Reason: $NESTED_REASON"

        # Attempt 1: Extract ARN from reason string
        local EXTRACTED_ARN=""
        local DESCEND_TARGET=""
        local DESCENT_METHOD=""

        if [[ "$NESTED_REASON" == *"Embedded stack arn:aws:cloudformation:"* ]]; then
            EXTRACTED_ARN=$(echo "$NESTED_REASON" | grep -o 'arn:aws:cloudformation:[^ ]*' | head -n 1)
            if [[ "$EXTRACTED_ARN" == arn:aws:cloudformation:*:*:stack/*/* && "$EXTRACTED_ARN" != "$STACK" ]]; then
                DESCEND_TARGET="$EXTRACTED_ARN"
                DESCENT_METHOD="ARN Extraction"
            else
                echo "${INDENT}  ⚠️ Extracted ARN invalid or matches current stack."
                EXTRACTED_ARN="" # Invalidate
            fi
        fi

        # Attempt 2: If ARN extraction failed, try resolving via Logical ID
        if [[ -z "$DESCEND_TARGET" ]]; then
            echo "${INDENT}  Attempting resolution via Logical ID '$NESTED_LOGICAL_ID'..."
            local RESOLVED_NESTED_ID
            RESOLVED_NESTED_ID=$(aws cloudformation describe-stack-resources --stack-name "$STACK" --logical-resource-id "$NESTED_LOGICAL_ID" --query 'StackResources[0].PhysicalResourceId' --output text 2>/dev/null)
            if [[ $? -eq 0 && -n "$RESOLVED_NESTED_ID" && "$RESOLVED_NESTED_ID" != "None" && "$RESOLVED_NESTED_ID" != "null" && "$RESOLVED_NESTED_ID" != "$STACK" ]]; then
                DESCEND_TARGET="$RESOLVED_NESTED_ID"
                DESCENT_METHOD="Logical ID Resolution"
            else
                echo "${INDENT}  ❌ Could not resolve a distinct Physical ID for '$NESTED_LOGICAL_ID' (Resolved: '$RESOLVED_NESTED_ID')."
            fi
        fi

        # If we have a valid target, try descending
        if [[ -n "$DESCEND_TARGET" ]]; then
            echo "${INDENT}  Descending into nested stack (via $DESCENT_METHOD): $DESCEND_TARGET"
            local RECURSION_STATUS=0
            get_root_failure "$DESCEND_TARGET" $((DEPTH + 1)) || RECURSION_STATUS=$?
            if [[ $RECURSION_STATUS -eq 1 ]]; then
                return 1 # Propagate success (failure found deeper)
            else
                echo "${INDENT}  ⚠️ Recursion did not find specific failure in '$DESCEND_TARGET'. Reporting failure event from parent '$STACK'."
                # Fall through to report the FAILED_STACK_RESOURCE_EVENT below
            fi
        else
             echo "${INDENT}  Could not determine valid nested stack ID to descend into."
             # Fall through to report the FAILED_STACK_RESOURCE_EVENT below
        fi

        # Report the FAILED_STACK_RESOURCE_EVENT found in this stack if descent failed or didn't find anything
        echo ""
        echo "💥 Root failure identified in stack '$STACK':"
        echo "  Resource Type: AWS::CloudFormation::Stack"
        echo "  Logical ID: $NESTED_LOGICAL_ID"
        echo "  Reason: $NESTED_REASON"
        return 1 # Failure found at this level
    fi

    # 3. If no specific resource failure found, report stack-level failure reason (fallback)
    local STACK_FINAL_EVENT
    STACK_FINAL_EVENT=$(echo "$ALL_EVENTS" | jq -c --arg stackId "$STACK" '
        .StackEvents | map(select(
            .ResourceType == "AWS::CloudFormation::Stack" and
            .PhysicalResourceId == $stackId and
            (.ResourceStatus | test("FAILED$") or test("ROLLBACK_COMPLETE$"))
        )) | sort_by(.Timestamp) | reverse | .[0] // empty
    ')
    if [[ -n "$STACK_FINAL_EVENT" ]]; then
        local STACK_REASON=$(echo "$STACK_FINAL_EVENT" | jq -r '.ResourceStatusReason // "No reason provided."')
        if [[ $DEPTH -eq 0 || "$STACK_REASON" != *"rollback requested"* ]]; then
            echo ""
            echo "💥 Root failure identified in stack '$STACK' (stack-level):"
            echo "  Reason: $STACK_REASON"
            return 1 # Failure found
        else
            echo "${INDENT}  Stack '$STACK' rolled back, but no specific resource failure found within it."
            return 0 # No specific failure found *at this level*
        fi
    else
        echo "${INDENT}  ⚠️ No specific failure reason found in stack: $STACK. Check AWS Console."
        return 1 # Treat as failure overall
    fi
  }

  # Start the recursive checking with the main stack
  FAILURE_FOUND=0
  get_root_failure "$MAIN_STACK_NAME" || FAILURE_FOUND=$? # Capture return status

  # The function returns 1 if failure is found, 0 on error/no failure found in branch.
  # We rely on the initial $STATUS check to know if there *was* a failure overall.
  # The exit 1 ensures CI fails.
  echo "--------------------------------------------------"
  exit 1 # Ensure exit code is 1 for failures because STATUS indicated failure
else
  echo "ℹ️  Stack status is inconclusive or still in progress: $STATUS"
  # Optionally exit with non-zero status for inconclusive states in CI
  # exit 1
fi
