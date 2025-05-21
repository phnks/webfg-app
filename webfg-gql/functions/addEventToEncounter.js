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
  const { encounterId, eventType, description, time, characterId, x, y, stats, conditions } = event.arguments;
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
    const history = encounter.history || [];
    
    // Use encounter current time if not provided
    const eventTime = time ?? encounter.currentTime;
    
    // Create the new event
    const newEvent = {
      time: eventTime,
      type: eventType,
      description,
      ...(characterId && { characterId }),
      ...(x !== undefined && y !== undefined && { x, y }),
      ...(stats && { stats }),
      ...(conditions && { conditions })
    };
    
    // Add event to history
    history.push(newEvent);
    
    // Update encounter with the new event in history
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: encountersTable,
        Key: { encounterId },
        UpdateExpression: 'SET history = :history',
        ExpressionAttributeValues: {
          ':history': history
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error adding event to encounter:', error);
    throw error;
  }
};