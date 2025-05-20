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
  const { encounterId } = event.arguments;
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
    const currentRound = encounter.currentRound || 0;
    const newRound = currentRound + 1;
    const history = encounter.history || [];
    
    // Add round advancement event to history
    history.push({
      time: encounter.currentTime,
      type: TimelineEventType.ROUND_ADVANCED,
      description: `Round ${currentRound} ended, Round ${newRound} started`,
      previousRound: currentRound,
      newRound: newRound
    });
    
    // Reset initiative order if it exists (keep the same characters, reset current position)
    let initiativeUpdate = {};
    if (encounter.initiative) {
      initiativeUpdate = {
        initiative: {
          ...encounter.initiative,
          currentIndex: 0 // Reset to first character in initiative order
        }
      };
    }
    
    // Update encounter with new round number and history
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: encountersTable,
        Key: { encounterId },
        UpdateExpression: 'SET currentRound = :newRound, history = :history, initiative = :initiative',
        ExpressionAttributeValues: {
          ':newRound': newRound,
          ':history': history,
          ':initiative': initiativeUpdate.initiative || encounter.initiative
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error advancing round:', error);
    throw error;
  }
};