const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { TimelineEventType } = require('./constants');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.ENCOUNTERS_TABLE;

exports.handler = async (event) => {
  const { encounterId, characterId } = event.arguments;

  // console.log(`Attempting to remove character ${characterId} from encounter ${encounterId}`);

  if (!encounterId || !characterId) {
    throw new Error("Missing required arguments: encounterId, characterId");
  }

  try {
    // 1. Get the current encounter to find the character position
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { encounterId },
      ProjectionExpression: "characterPositions",
    });
    const { Item: encounter } = await docClient.send(getCommand);

    if (!encounter || !encounter.characterPositions) {
      console.warn(`Character positions list not found or empty for encounter ${encounterId}. Cannot remove ${characterId}.`);
      const fullEncounter = await docClient.send(new GetCommand({ TableName: tableName, Key: { encounterId } }));
      return fullEncounter.Item;
    }

    const characterIndex = encounter.characterPositions.findIndex(c => c.characterId === characterId);

    if (characterIndex === -1) {
      console.warn(`Character ${characterId} not found in encounter ${encounterId}. Cannot remove.`);
      const fullEncounter = await docClient.send(new GetCommand({ TableName: tableName, Key: { encounterId } }));
      return fullEncounter.Item;
    }

    // 2. Remove the character from the list
    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: { encounterId },
      UpdateExpression: `REMOVE #cp[${characterIndex}]`,
      ExpressionAttributeNames: {
        "#cp": "characterPositions",
      },
      ReturnValues: "ALL_NEW",
    });

    const { Attributes: updatedEncounter } = await docClient.send(updateCommand);
    // console.log(`Successfully removed character ${characterId} from encounter ${encounterId}`);
    return updatedEncounter;

  } catch (error) {
    console.error("Error removing character from encounter:", error);
    throw new Error(`Failed to remove character ${characterId} from encounter ${encounterId}: ${error.message}`);
  }
};