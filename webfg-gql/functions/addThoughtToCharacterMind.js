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

    // Check if thought is already in mind
    const existingThought = currentMind.find(mindThought => mindThought.thoughtId === thoughtId);
    if (existingThought) {
      throw new Error(`Thought ${thoughtId} is already in character's mind`);
    }

    // Add new thought to memory with default affinity and knowledge
    const newMindThought = {
      thoughtId,
      affinity: 0,
      knowledge: 0,
      location: 'MEMORY'
    };

    const updatedMind = [...currentMind, newMindThought];

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
    console.error('Error adding thought to character mind:', error);
    throw error;
  }
};