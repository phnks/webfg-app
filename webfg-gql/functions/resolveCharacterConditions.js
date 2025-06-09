const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');
const { toInt } = require('../utils/stringToNumber');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.CONDITIONS_TABLE;

exports.handler = async (event) => {
  console.log('ResolveCharacterConditions input:', JSON.stringify(event, null, 2));
  
  const { characterConditions } = event;
  
  if (!characterConditions || characterConditions.length === 0) {
    console.log("[DEBUG-CONDITIONS] No character conditions provided, returning empty array");
    return [];
  }
  
  console.log("[DEBUG-CONDITIONS] Character conditions:", JSON.stringify(characterConditions, null, 2));
  
  const conditionIds = characterConditions.map(c => c.conditionId);
  console.log("[DEBUG-CONDITIONS] Extracted conditionIds:", conditionIds);
  
  // Create a map of conditionId to amount, ensuring amounts are numbers
  const conditionIdToAmountMap = new Map(
    characterConditions.map(c => [c.conditionId, toInt(c.amount, 1)])
  );
  console.log("[DEBUG-CONDITIONS] Created conditionIdToAmountMap:", 
    JSON.stringify(Array.from(conditionIdToAmountMap.entries()), null, 2));
  
  const keys = conditionIds.map(conditionId => ({ conditionId }));
  
  const params = {
    RequestItems: {
      [tableName]: {
        Keys: keys
      }
    }
  };
  
  try {
    const result = await ddbDocClient.send(new BatchGetCommand(params));
    const conditions = result.Responses[tableName] || [];
    console.log("[DEBUG-CONDITIONS] Raw conditions from DB:", JSON.stringify(conditions, null, 2));
    
    // Sort conditions to match the order of the input IDs and add amount from character
    const conditionMap = new Map(conditions.map(c => [c.conditionId, c]));
    console.log("[DEBUG-CONDITIONS] Created conditionMap with keys:", Array.from(conditionMap.keys()));
    
    const sortedConditionsWithAmount = conditionIds
      .map(id => {
        const condition = conditionMap.get(id);
        const amount = conditionIdToAmountMap.get(id);
        console.log(`[DEBUG-CONDITIONS] Processing id=${id}, found condition=${!!condition}, amount=${amount}`);
        
        if (condition) {
          // Ensure amount is a number - use our helper for guaranteed number
          const amountValue = toInt(amount, 1); // Default to 1 if amount is undefined or NaN
          
          const enhancedCondition = {
            ...condition,
            amount: amountValue // Store as a number
          };
          console.log(`[DEBUG-CONDITIONS] Enhanced condition: ${JSON.stringify(enhancedCondition, null, 2)}`);
          return enhancedCondition;
        }
        return undefined;
      })
      .filter(c => c !== undefined);
    
    console.log(`[DEBUG-CONDITIONS] Final resolved conditions: ${JSON.stringify(sortedConditionsWithAmount, null, 2)}`);
    console.log(`Resolved ${sortedConditionsWithAmount.length} conditions for character`);
    return sortedConditionsWithAmount;
  } catch (error) {
    console.error('Error resolving character conditions:', error);
    throw new Error(`Failed to resolve character conditions: ${error.message}`);
  }
};