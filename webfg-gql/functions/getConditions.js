const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  // console.log('GetConditions input:', JSON.stringify(event, null, 2));
  
  const tableName = process.env.CONDITION_TABLE_NAME;
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
    const conditions = result.Responses && result.Responses[tableName] || [];
    
    // Sort conditions to match the order of the input IDs
    const conditionMap = new Map(conditions.map(c => [c.conditionId, c]));
    const sortedConditions = conditionIds
      .map(id => conditionMap.get(id))
      .filter(c => c !== undefined);
    
    // console.log(`Retrieved ${sortedConditions.length} conditions`);
    return sortedConditions;
  } catch (error) {
    console.error('Error getting conditions:', error);
    throw new Error(`Failed to get conditions: ${error.message}`);
  }
};