const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { characterId, objectId } = event.arguments;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  try {
    // First, get the character
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
    const stashIds = character.stashIds || [];
    
    // Check if object is in equipment
    if (!equipmentIds.includes(objectId)) {
      throw new Error(`Object ${objectId} is not in character's equipment`);
    }
    
    // Check if object is already in stash
    if (stashIds.includes(objectId)) {
      return character; // Object already in stash, return character unchanged
    }
    
    // Move object from equipment to stash
    const updatedEquipmentIds = equipmentIds.filter(id => id !== objectId);
    const updatedStashIds = [...stashIds, objectId];
    
    // Update the character
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: charactersTable,
        Key: { characterId },
        UpdateExpression: 'SET equipmentIds = :equipmentIds, stashIds = :stashIds',
        ExpressionAttributeValues: {
          ':equipmentIds': updatedEquipmentIds,
          ':stashIds': updatedStashIds
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error moving object from equipment to stash:', error);
    throw error;
  }
};