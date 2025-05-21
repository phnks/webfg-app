const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
// Configure DocumentClient to remove undefined values
const marshallOptions = {
  removeUndefinedValues: true,
};
const translateConfig = { marshallOptions };
const docClient = DynamoDBDocumentClient.from(client, translateConfig);

exports.handler = async (event) => {
  const { encounterId, upToTime } = event.arguments;
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
    const archivedEvents = encounter.archivedEvents || [];
    
    // Determine the cutoff time - either specified or current encounter time
    const cutoffTime = upToTime ?? encounter.currentTime;
    
    // Separate events into active and archived based on time
    const activeEvents = history.filter(event => event.time > cutoffTime);
    const newlyArchived = history.filter(event => event.time <= cutoffTime);
    
    // Add newly archived events to the archive
    const updatedArchive = [...archivedEvents, ...newlyArchived];
    
    // Update encounter with separated events
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: encountersTable,
        Key: { encounterId },
        UpdateExpression: 'SET history = :activeEvents, archivedEvents = :archivedEvents',
        ExpressionAttributeValues: {
          ':activeEvents': activeEvents,
          ':archivedEvents': updatedArchive
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error archiving current events:', error);
    throw error;
  }
};