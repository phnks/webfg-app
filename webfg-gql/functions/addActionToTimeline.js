const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { TimelineEventType } = require('./constants'); // Assuming constants are defined

const client = new DynamoDBClient({});
// Configure DocumentClient to remove undefined values
const marshallOptions = {
  removeUndefinedValues: true,
};
const translateConfig = { marshallOptions };
const docClient = DynamoDBDocumentClient.from(client, translateConfig);

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
    const characterName = character.name || 'Unknown Character'; // Get character name
    const actionName = action.name || 'Unknown Action'; // Get action name
    
    // Extract action duration (default to 1 second if not specified)
    const actionDuration = action.timing?.duration || 1;
    
    // Calculate end time
    // Calculate end time based on frontend startTime and action duration
    const endTime = startTime + actionDuration;
    
    // Remove logic related to finding and updating characterTimelines array
    // const characterTimelines = encounter.characterTimelines || []; ...
    
    // Add history events
    const history = encounter.history || [];
    
    // ACTION_STARTED event - Use startTime from args for the timestamp
    history.push({
      time: startTime, // Use startTime from args as requested
      type: TimelineEventType.ACTION_STARTED, // Use constant
      characterId,
      actionId,
      actionName: actionName, // Use fetched action name
      description: `${characterName} started action "${actionName}"`, // Include character name
      stats: {
        hitPoints: character.stats?.hitPoints?.current || 0,
        fatigue: character.stats?.fatigue?.current || 0,
        surges: character.stats?.surges?.current || 0,
        exhaustion: character.stats?.exhaustion?.current || 0
      },
      conditions: character.conditions || []
    });
    
    // ACTION_COMPLETED event
    history.push({
      time: endTime, // Completion time is based on frontend start + duration
      type: TimelineEventType.ACTION_COMPLETED, // Use constant
      characterId,
      actionId,
      actionName: actionName, // Include action name for consistency if needed later
      description: `${characterName} completed action "${actionName}"` // Include character name
    });
    
    // Update the encounter - only update history
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: encountersTable,
        Key: { encounterId },
        UpdateExpression: 'SET history = :history', // Remove characterTimelines update
        ExpressionAttributeValues: {
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
