const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { characterId, objectId } = event.arguments;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  try {
    // First, get the character to check if object exists in equipment
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
    const equipmentIds = character.equipmentIds || [];
    
    // Check if object is not in the character's equipment
    if (!equipmentIds.includes(objectId)) {
      return character; // Object doesn't exist in equipment, return character unchanged
    }
    
    // Remove the object from the character's equipment
    const updatedEquipmentIds = equipmentIds.filter(id => id !== objectId);
    
    // Update the character with the equipment item removed
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: charactersTable,
        Key: { characterId },
        UpdateExpression: 'SET equipmentIds = :equipmentIds',
        ExpressionAttributeValues: {
          ':equipmentIds': updatedEquipmentIds
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error removing object from equipment:', error);
    throw error;
  }
};