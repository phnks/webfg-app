const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { TimelineEventType } = require('./constants'); // Assuming constants are defined

const client = new DynamoDBClient({});
// Configure DocumentClient to remove undefined values
const marshallOptions = {
  removeUndefinedValues: true, // Automatically remove undefined properties
};
const translateConfig = { marshallOptions };
const docClient = DynamoDBDocumentClient.from(client, translateConfig);


exports.handler = async (event) => {
  const { encounterId, characterId, startTime, x, y } = event.arguments;
  const encountersTable = process.env.ENCOUNTERS_TABLE;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
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
    const existingPositionIndex = characterPositions.findIndex(
      position => position.characterId === characterId
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
    
    // Get character data to include stats and name
    const characterResult = await docClient.send(
      new GetCommand({
        TableName: charactersTable,
        Key: { characterId }
      })
    );
    
    if (!characterResult.Item) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    const character = characterResult.Item;
    const characterName = character.name || 'Unknown Character';
    
    // Add a history event
    const history = encounter.history || [];
    history.push({
      time: encounter.currentTime || 0,
      type: TimelineEventType.CHARACTER_JOINED, // Use constant
      characterId,
      description: `${characterName} joined the encounter at (${x || 0}, ${y || 0})`, // Enriched description
      x: x || 0,
      y: y || 0,
      stats: {
        hitPoints: character.stats?.hitPoints?.current || 0,
        fatigue: character.stats?.fatigue?.current || 0,
        surges: character.stats?.surges?.current || 0,
        exhaustion: character.stats?.exhaustion?.current || 0
      },
      conditions: character.conditions || []
    });
    
    // Update encounter with the new character position and history (removed characterTimelines)
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
    console.error('Error adding character to encounter:', error);
    throw error;
  }
};
