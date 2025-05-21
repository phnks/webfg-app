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
  const { encounterId } = event.arguments;
  const encountersTable = process.env.ENCOUNTERS_TABLE;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
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
    
    // Check if initiative order exists
    if (!encounter.initiative || !Array.isArray(encounter.initiative.order)) {
      throw new Error('No initiative order has been set for this encounter');
    }
    
    const { initiative } = encounter;
    const { order, currentIndex = 0 } = initiative;
    
    // Calculate new initiative index
    const newIndex = (currentIndex + 1) % order.length;
    
    // Get current and next character in initiative
    const previousCharacterId = order[currentIndex].characterId;
    const nextCharacterId = order[newIndex].characterId;
    
    // Get character names for event description
    let previousCharacterName = 'Unknown Character';
    let nextCharacterName = 'Unknown Character';
    
    try {
      // Get previous character name
      const prevCharacterResult = await docClient.send(
        new GetCommand({
          TableName: charactersTable,
          Key: { characterId: previousCharacterId }
        })
      );
      previousCharacterName = prevCharacterResult.Item?.name || 'Unknown Character';
      
      // Get next character name
      const nextCharacterResult = await docClient.send(
        new GetCommand({
          TableName: charactersTable,
          Key: { characterId: nextCharacterId }
        })
      );
      nextCharacterName = nextCharacterResult.Item?.name || 'Unknown Character';
    } catch (error) {
      console.warn('Error fetching character names:', error);
      // Continue with default names if there's an error
    }
    
    // Add history event for initiative advancement
    const history = encounter.history || [];
    history.push({
      time: encounter.currentTime,
      type: 'INITIATIVE_ADVANCED',
      description: `Turn passed from ${previousCharacterName} to ${nextCharacterName}`,
      previousCharacterId,
      nextCharacterId
    });
    
    // Update encounter with new initiative index and history
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: encountersTable,
        Key: { encounterId },
        UpdateExpression: 'SET initiative.currentIndex = :newIndex, history = :history',
        ExpressionAttributeValues: {
          ':newIndex': newIndex,
          ':history': history
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error advancing initiative:', error);
    throw error;
  }
};