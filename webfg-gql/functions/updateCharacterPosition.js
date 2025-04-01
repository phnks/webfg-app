const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { TimelineEventType } = require('./constants');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { encounterId, characterId, x, y } = event.arguments;
  const encountersTable = process.env.ENCOUNTERS_TABLE;
  const charactersTable = process.env.CHARACTERS_TABLE;
  const currentTime = Date.now() / 1000;
  
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
    
    // Prepare history event
    const historyEvent = {
      time: encounter.currentTime || currentTime,
      type: TimelineEventType.CHARACTER_MOVED,
      characterId,
      description: `Character moved to position (${x}, ${y})`,
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
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedEncounter } = await docClient.send(updateCommand);
    return updatedEncounter;
  } catch (error) {
    console.error('Error updating character position:', error);
    throw error;
  }
}; 