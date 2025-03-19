const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const actionIds = event.arguments.actionIds;
  const tableName = process.env.ACTIONS_TABLE;
  
  if (!actionIds.length) {
    return [];
  }

  const keys = actionIds.map(id => ({ actionId: id }));
  
  try {
    const command = new BatchGetCommand({
      RequestItems: {
        [tableName]: {
          Keys: keys
        }
      }
    });
    
    const response = await docClient.send(command);
    
    if (response.Responses && response.Responses[tableName]) {
      return response.Responses[tableName];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching actions:', error);
    throw error;
  }
}; 