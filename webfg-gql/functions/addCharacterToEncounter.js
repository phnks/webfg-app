const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { encounterId, characterId, startTime, x, y } = event.arguments;
  const encountersTable = process.env.ENCOUNTERS_TABLE;
  
  try {
    // First, get the encounter to check if character already exists
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
    
    // Check if character is already in the encounter
    const characterPositions = encounter.characterPositions || [];
    const characterTimelines = encounter.characterTimelines || [];
    
    const existingPositionIndex = characterPositions.findIndex(
      position => position.characterId === characterId
    );
    
    const existingTimelineIndex = characterTimelines.findIndex(
      timeline => timeline.characterId === characterId
    );
    
    // Create new position if it doesn't exist
    if (existingPositionIndex === -1) {
      characterPositions.push({
        characterId,
        x: x || 0,
        y: y || 0
      });
    } else {
      // Update existing position
      characterPositions[existingPositionIndex] = {
        ...characterPositions[existingPositionIndex],
        x: x || characterPositions[existingPositionIndex].x,
        y: y || characterPositions[existingPositionIndex].y
      };
    }
    
    // Create new timeline if it doesn't exist
    if (existingTimelineIndex === -1) {
      characterTimelines.push({
        characterId,
        startTime: startTime || 0,
        actions: []
      });
    }
    
    // Add a history event
    const history = encounter.history || [];
    history.push({
      time: encounter.currentTime || 0,
      type: 'CHARACTER_JOINED',
      characterId,
      description: `Character joined the encounter`,
      x: x || 0,
      y: y || 0
    });
    
    // Update encounter with the new character
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: encountersTable,
        Key: { encounterId },
        UpdateExpression: 'SET characterPositions = :positions, characterTimelines = :timelines, history = :history',
        ExpressionAttributeValues: {
          ':positions': characterPositions,
          ':timelines': characterTimelines,
          ':history': history
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error adding character to encounter:', error);
    throw error;
  }
}; 