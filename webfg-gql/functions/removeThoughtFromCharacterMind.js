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

    // Check if thought exists in mind
    const thoughtExists = currentMind.some(mindThought => mindThought.thoughtId === thoughtId);
    if (!thoughtExists) {
      throw new Error(`Thought ${thoughtId} is not in character's mind`);
    }

    // Remove the thought from mind
    const updatedMind = currentMind.filter(mindThought => mindThought.thoughtId !== thoughtId);

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
    console.error('Error removing thought from character mind:', error);
    throw error;
  }
};