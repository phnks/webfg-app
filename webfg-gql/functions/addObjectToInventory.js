const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { characterId, objectId } = event.arguments;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  try {
    // First, get the character to check if object already exists
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
    const inventoryIds = character.inventoryIds || [];
    
    // Check if object is already in the character's inventory
    if (inventoryIds.includes(objectId)) {
      return character; // Object already exists, return character unchanged
    }
    
    // Add the object to the character's inventory
    const updatedInventoryIds = [...inventoryIds, objectId];
    
    // Update the character with the new inventory item
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: charactersTable,
        Key: { characterId },
        UpdateExpression: 'SET inventoryIds = :inventoryIds',
        ExpressionAttributeValues: {
          ':inventoryIds': updatedInventoryIds
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error adding object to inventory:', error);
    throw error;
  }
}; 