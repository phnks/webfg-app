const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const { characterId, thoughtId } = event.arguments;

    // First, get the current character
    const getParams = {
      TableName: process.env.CHARACTERS_TABLE,
      Key: { characterId }
    };

    const getResult = await docClient.send(new GetCommand(getParams));
    const character = getResult.Item;

    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    // Initialize mind array if it doesn't exist
    const currentMind = character.mind || [];

    // Find the thought in mind
    const thoughtIndex = currentMind.findIndex(mindThought => mindThought.thoughtId === thoughtId);
    if (thoughtIndex === -1) {
      throw new Error(`Thought ${thoughtId} is not in character's mind`);
    }

    // Update the thought's location to MEMORY
    const updatedMind = [...currentMind];
    updatedMind[thoughtIndex] = {
      ...updatedMind[thoughtIndex],
      location: 'MEMORY'
    };

    // Update the character
    const updateParams = {
      TableName: process.env.CHARACTERS_TABLE,
      Key: { characterId },
      UpdateExpression: 'SET mind = :mind',
      ExpressionAttributeValues: {
        ':mind': updatedMind
      },
      ReturnValues: 'ALL_NEW'
    };

    const updateResult = await docClient.send(new UpdateCommand(updateParams));
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error moving thought to memory:', error);
    throw error;
  }
};