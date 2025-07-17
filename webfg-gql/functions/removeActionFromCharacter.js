const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { characterId, actionId } = event.arguments;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  try {
    // First, get the character to check if action exists
    const getResult = await docClient.send(
      new GetCommand({
        TableName: charactersTable,
        Key: { characterId }
      })
    );
    
    if (!getResult.Item) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    
    const character = getResult.Item;
    const actionIds = character.actionIds || [];
    
    // Check if action exists in the character's actions
    if (!actionIds.includes(actionId)) {
      return character; // Action doesn't exist, return character unchanged
    }
    
    // Remove the action from the character's actions
    const updatedActionIds = actionIds.filter(id => id !== actionId);
    
    // Update the character with the new action list
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: charactersTable,
        Key: { characterId },
        UpdateExpression: 'SET actionIds = :actionIds',
        ExpressionAttributeValues: {
          ':actionIds': updatedActionIds
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error removing action from character:', error);
    throw error;
  }
}; 