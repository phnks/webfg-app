const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { TimelineEventType } = require('./constants');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.ENCOUNTERS_TABLE;

exports.handler = async (event) => {
  const { encounterId, terrainId } = event.arguments;
  const currentTime = Date.now() / 1000;

  console.log(`Attempting to remove terrain ${terrainId} from encounter ${encounterId}`);

  if (!encounterId || !terrainId) {
    throw new Error("Missing required arguments: encounterId, terrainId");
  }

  try {
    // 1. Get the current encounter to find the index of the terrain element
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { encounterId },
      ProjectionExpression: "terrainElements",
    });
    const { Item: encounter } = await docClient.send(getCommand);

    if (!encounter || !encounter.terrainElements) {
      console.warn(`Terrain elements list not found or empty for encounter ${encounterId}. Cannot remove ${terrainId}.`);
      const fullEncounter = await docClient.send(new GetCommand({ TableName: tableName, Key: { encounterId } }));
      return fullEncounter.Item;
    }

    const terrainIndex = encounter.terrainElements.findIndex(t => t.terrainId === terrainId);

    if (terrainIndex === -1) {
      console.warn(`Terrain element ${terrainId} not found in encounter ${encounterId}. Cannot remove.`);
      const fullEncounter = await docClient.send(new GetCommand({ TableName: tableName, Key: { encounterId } }));
      return fullEncounter.Item;
    }

    // 2. Remove the terrain element from the list
    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: { encounterId },
      UpdateExpression: `REMOVE #te[${terrainIndex}]`,
      ExpressionAttributeNames: {
        "#te": "terrainElements",
      },
      ReturnValues: "ALL_NEW",
    });

    const { Attributes: updatedEncounter } = await docClient.send(updateCommand);
    console.log(`Successfully removed terrain ${terrainId} from encounter ${encounterId}`);
    return updatedEncounter;

  } catch (error) {
    console.error("Error removing terrain from encounter:", error);
    throw new Error(`Failed to remove terrain ${terrainId} from encounter ${encounterId}: ${error.message}`);
  }
}; 