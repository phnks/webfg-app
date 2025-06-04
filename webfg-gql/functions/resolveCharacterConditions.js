const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.CONDITIONS_TABLE;

exports.handler = async (event) => {
  console.log('ResolveCharacterConditions input:', JSON.stringify(event, null, 2));
  
  const { conditionIds } = event;
  
  if (!conditionIds || conditionIds.length === 0) {
    return [];
  }
  
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
    
    // Sort conditions to match the order of the input IDs
    const conditionMap = new Map(conditions.map(c => [c.conditionId, c]));
    const sortedConditions = conditionIds
      .map(id => conditionMap.get(id))
      .filter(c => c !== undefined);
    
    console.log(`Resolved ${sortedConditions.length} conditions for character`);
    return sortedConditions;
  } catch (error) {
    console.error('Error resolving character conditions:', error);
    throw new Error(`Failed to resolve character conditions: ${error.message}`);
  }
};