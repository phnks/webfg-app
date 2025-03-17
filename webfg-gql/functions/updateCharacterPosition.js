const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { encounterId, characterId, x, y } = event.arguments;
  const encountersTable = process.env.ENCOUNTERS_TABLE;
  
  try {
    // Get the encounter
    const getResult = await docClient.send(
      new GetCommand({
        TableName: encountersTable,
        Key: { encounterId }
      })
    );
    
    if (!getResult.Item) {
      throw new Error(`Encounter with ID ${encounterId} not found`);
    }
    
    const encounter = getResult.Item;
    const characterPositions = encounter.characterPositions || [];
    
    // Find the character position
    const posIndex = characterPositions.findIndex(p => p.characterId === characterId);
    
    if (posIndex === -1) {
      throw new Error(`Character with ID ${characterId} not found in encounter`);
    }
    
    // Update position
    characterPositions[posIndex] = {
      ...characterPositions[posIndex],
      x,
      y
    };
    
    // Add to history
    const history = encounter.history || [];
    history.push({
      time: encounter.currentTime || 0,
      type: 'CHARACTER_MOVED',
      characterId,
      description: `Character moved to position (${x}, ${y})`,
      x,
      y
    });
    
    // Update the encounter
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: encountersTable,
        Key: { encounterId },
        UpdateExpression: 'SET characterPositions = :positions, history = :history',
        ExpressionAttributeValues: {
          ':positions': characterPositions,
          ':history': history
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error updating character position:', error);
    throw error;
  }
}; 