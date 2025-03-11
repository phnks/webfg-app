const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { characterId, actionId } = event.arguments;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  try {
    // First, get the character to check if action already exists
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
    
    // Check if action is already in the character's actions
    if (actionIds.includes(actionId)) {
      return character; // Action already exists, return character unchanged
    }
    
    // Add the action to the character's actions
    const updatedActionIds = [...actionIds, actionId];
    
    // Update the character with the new action
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
    console.error('Error adding action to character:', error);
    throw error;
  }
}; 