const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { encounterId, characterId, actionId, startTime } = event.arguments;
  const encountersTable = process.env.ENCOUNTERS_TABLE;
  const actionsTable = process.env.ACTIONS_TABLE;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  try {
    // Get the encounter
    const encounterResult = await docClient.send(
      new GetCommand({
        TableName: encountersTable,
        Key: { encounterId }
      })
    );
    
    if (!encounterResult.Item) {
      throw new Error(`Encounter with ID ${encounterId} not found`);
    }
    
    // Get the action to determine its duration
    const actionResult = await docClient.send(
      new GetCommand({
        TableName: actionsTable,
        Key: { actionId }
      })
    );
    
    if (!actionResult.Item) {
      throw new Error(`Action with ID ${actionId} not found`);
    }
    
    // Get character data to include stats
    const characterResult = await docClient.send(
      new GetCommand({
        TableName: charactersTable,
        Key: { characterId }
      })
    );
    
    if (!characterResult.Item) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    
    const encounter = encounterResult.Item;
    const action = actionResult.Item;
    const character = characterResult.Item;
    
    // Extract action duration (default to 1 second if not specified)
    const actionDuration = action.timing?.duration || 1;
    
    // Calculate end time
    const endTime = startTime + actionDuration;
    
    // Find the character's timeline
    const characterTimelines = encounter.characterTimelines || [];
    const timelineIndex = characterTimelines.findIndex(t => t.characterId === characterId);
    
    if (timelineIndex === -1) {
      throw new Error(`Character with ID ${characterId} not found in encounter timeline`);
    }
    
    // Add the action to the character's timeline
    const timeline = characterTimelines[timelineIndex];
    timeline.actions = timeline.actions || [];
    
    timeline.actions.push({
      actionId,
      startTime,
      endTime
    });
    
    characterTimelines[timelineIndex] = timeline;
    
    // Add a history event
    const history = encounter.history || [];
    history.push({
      time: startTime,
      type: 'ACTION_STARTED',
      characterId,
      actionId,
      actionName: action.name,
      description: `Character started action "${action.name}"`,
      stats: {
        hitPoints: character.stats?.hitPoints?.current || 0,
        fatigue: character.stats?.fatigue?.current || 0,
        surges: character.stats?.surges?.current || 0,
        exhaustion: character.stats?.exhaustion?.current || 0
      },
      conditions: character.conditions || []
    });
    
    // Also add the completion event
    history.push({
      time: endTime,
      type: 'ACTION_COMPLETED',
      characterId,
      actionId,
      description: `Character completed action "${action.name}"`
    });
    
    // Update the encounter
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: encountersTable,
        Key: { encounterId },
        UpdateExpression: 'SET characterTimelines = :timelines, history = :history',
        ExpressionAttributeValues: {
          ':timelines': characterTimelines,
          ':history': history
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error adding action to timeline:', error);
    throw error;
  }
}; 