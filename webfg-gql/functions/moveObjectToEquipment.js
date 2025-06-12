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
    const stashIds = character.stashIds || [];
    const equipmentIds = character.equipmentIds || [];
    
    // Check if object is in stash
    if (!stashIds.includes(objectId)) {
      throw new Error(`Object ${objectId} is not in character's stash`);
    }
    
    // Check if object is already in equipment
    if (equipmentIds.includes(objectId)) {
      return character; // Object already equipped, return character unchanged
    }
    
    // Move object from stash to equipment
    const updatedStashIds = stashIds.filter(id => id !== objectId);
    const updatedEquipmentIds = [...equipmentIds, objectId];
    
    // Update the character
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: charactersTable,
        Key: { characterId },
        UpdateExpression: 'SET stashIds = :stashIds, equipmentIds = :equipmentIds',
        ExpressionAttributeValues: {
          ':stashIds': updatedStashIds,
          ':equipmentIds': updatedEquipmentIds
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error moving object to equipment:', error);
    throw error;
  }
};