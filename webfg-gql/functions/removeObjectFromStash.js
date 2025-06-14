const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { characterId, objectId } = event.arguments;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  try {
    // First, get the character to check if object exists
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
    const stashIds = character.stashIds || [];
    
    // Check if object is in the character's stash
    if (!stashIds.includes(objectId)) {
      return character; // Object not in stash, return character unchanged
    }
    
    // Remove the object from the character's stash
    const updatedStashIds = stashIds.filter(id => id !== objectId);
    
    // Update the character with the removed stash item
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: charactersTable,
        Key: { characterId },
        UpdateExpression: 'SET stashIds = :stashIds',
        ExpressionAttributeValues: {
          ':stashIds': updatedStashIds
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error removing object from stash:', error);
    throw error;
  }
};