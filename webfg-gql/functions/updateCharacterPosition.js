const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { TimelineEventType } = require('./constants');

const client = new DynamoDBClient({});
// Configure DocumentClient to remove undefined values
const marshallOptions = {
  removeUndefinedValues: true,
};
const translateConfig = { marshallOptions };
const docClient = DynamoDBDocumentClient.from(client, translateConfig);

exports.handler = async (event) => {
  const { encounterId, characterId, x, y } = event.arguments;
  const encountersTable = process.env.ENCOUNTERS_TABLE;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  try {
    // Get the encounter
    const getCommand = new GetCommand({
      TableName: encountersTable,
      Key: { encounterId },
      ProjectionExpression: "characterPositions, currentTime"
    });
    
    const { Item: encounter } = await docClient.send(getCommand);
    
    if (!encounter || !encounter.characterPositions) {
      throw new Error(`Encounter ${encounterId} or its characterPositions not found`);
    }
    
    const posIndex = encounter.characterPositions.findIndex(p => p.characterId === characterId);
    
    if (posIndex === -1) {
      throw new Error(`Character ${characterId} not found in encounter ${encounterId}`);
    }
    
    // Get character data for stats
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
    const characterName = character.name || 'Unknown Character'; // Get character name
    const currentX = x || 0;
    const currentY = y || 0;
    const scaledX = currentX * 5; // Scale coordinates for description
    const scaledY = currentY * 5;
    // Prepare history event
    const historyEvent = {
      time: encounter.currentTime, // Always use encounter's current time
      type: TimelineEventType.CHARACTER_MOVED,
      characterId,
      description: `${characterName} moved to position (${scaledX}ft, ${scaledY}ft)`, // Use name in description
      x,
      y,
      stats: {
        hitPoints: character.stats?.hitPoints?.current || 0,
        fatigue: character.stats?.fatigue?.current || 0,
        surges: character.stats?.surges?.current || 0,
        exhaustion: character.stats?.exhaustion?.current || 0
      },
      conditions: character.conditions || []
    };

    // Update character position and history in one operation
    const updateCommand = new UpdateCommand({
      TableName: encountersTable,
      Key: { encounterId },
      UpdateExpression: `SET #cp[${posIndex}].#x = :x, #cp[${posIndex}].#y = :y, #hist = list_append(if_not_exists(#hist, :empty_list), :new_hist)`,
      ExpressionAttributeNames: {
        "#cp": "characterPositions",
        "#x": "x",
        "#y": "y",
        "#hist": "history"
      },
      ExpressionAttributeValues: {
        ":x": x,
        ":y": y,
        ":new_hist": [historyEvent],
        ":empty_list": []
      },
      ReturnValues: "UPDATED_NEW" // Can change this as we fetch separately now
    });

    await docClient.send(updateCommand); // Perform the update

    // Explicitly re-fetch the entire encounter after the update
    const getAfterUpdateCommand = new GetCommand({
      TableName: encountersTable,
      Key: { encounterId }
    });
    const { Item: finalEncounterState } = await docClient.send(getAfterUpdateCommand);

    if (!finalEncounterState) {
      // This shouldn't happen if the update succeeded, but handle defensively
      throw new Error(`Failed to re-fetch encounter ${encounterId} after update.`);
    }

    // Construct the specific payload needed for the mutation response / subscription
    const returnPayload = {
      encounterId: finalEncounterState.encounterId, // Essential ID
      characterPositions: finalEncounterState.characterPositions,
      objectPositions: finalEncounterState.objectPositions, // Include even if null from fetch
      terrainElements: finalEncounterState.terrainElements, // Include even if null from fetch
      gridElements: finalEncounterState.gridElements,       // Include even if null from fetch
      history: finalEncounterState.history,                 // The crucial field
      // Include other top-level Encounter fields if needed by the mutation response directly
      // currentTime: finalEncounterState.currentTime,
      // name: finalEncounterState.name,
      // etc.
      // __typename: "Encounter" // Let's try omitting this from the explicit shape
    };

    // console.log("Returning explicitly shaped payload (no __typename):", JSON.stringify(returnPayload));
    return returnPayload; // Return the shaped data

  } catch (error) {
    console.error('Error updating character position:', error.message, error.stack);
    throw error;
  }
};
