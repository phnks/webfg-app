const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.CONDITIONS_TABLE;

exports.handler = async (event) => {
  console.log('ResolveCharacterConditions input:', JSON.stringify(event, null, 2));
  
  const { characterConditions } = event;
  
  if (!characterConditions || characterConditions.length === 0) {
    return [];
  }
  
  const conditionIds = characterConditions.map(c => c.conditionId);
  const conditionIdToAmountMap = new Map(characterConditions.map(c => [c.conditionId, c.amount]));
  
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
    
    // Sort conditions to match the order of the input IDs and add amount from character
    const conditionMap = new Map(conditions.map(c => [c.conditionId, c]));
    const sortedConditionsWithAmount = conditionIds
      .map(id => {
        const condition = conditionMap.get(id);
        if (condition) {
          return {
            ...condition,
            amount: conditionIdToAmountMap.get(id) || 1 // Use the amount from the character, default to 1
          };
        }
        return undefined;
      })
      .filter(c => c !== undefined);
    
    console.log(`Resolved ${sortedConditionsWithAmount.length} conditions for character`);
    return sortedConditionsWithAmount;
  } catch (error) {
    console.error('Error resolving character conditions:', error);
    throw new Error(`Failed to resolve character conditions: ${error.message}`);
  }
};