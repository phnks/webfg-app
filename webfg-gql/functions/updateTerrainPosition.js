const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { TimelineEventType } = require('./constants');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.ENCOUNTERS_TABLE;

exports.handler = async (event) => {
  const { encounterId, input } = event.arguments;
  const { terrainId, startX, startY } = input;
  const currentTime = Date.now() / 1000;

  console.log(`Attempting to update terrain ${terrainId} in encounter ${encounterId} to start at (${startX}, ${startY})`);

  if (!encounterId || !input || !terrainId || startX === undefined || startY === undefined) {
    throw new Error("Missing required arguments: encounterId, input.{terrainId, startX, startY}");
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
      throw new Error(`Encounter ${encounterId} or its terrainElements not found.`);
    }

    const terrainIndex = encounter.terrainElements.findIndex(t => t.terrainId === terrainId);

    if (terrainIndex === -1) {
      throw new Error(`Terrain element ${terrainId} not found in encounter ${encounterId}`);
    }

    // 2. Prepare the history event
    const historyEvent = {
      time: currentTime,
      type: TimelineEventType.TERRAIN_MOVED,
      description: `Terrain ${terrainId} moved to start at (${startX}, ${startY})`,
      // Store terrain details in history? Optional.
    };

    // 3. Update the specific terrain's position and add history
    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: { encounterId },
      UpdateExpression: `SET #te[${terrainIndex}].startX = :sx, #te[${terrainIndex}].startY = :sy, #hist = list_append(if_not_exists(#hist, :empty_list), :new_hist)`,
      ExpressionAttributeNames: {
        "#te": "terrainElements",
        "#hist": "history",
      },
      ExpressionAttributeValues: {
        ":sx": startX,
        ":sy": startY,
        ":new_hist": [historyEvent],
        ":empty_list": [],
      },
      ReturnValues: "ALL_NEW",
    });

    const { Attributes: updatedEncounter } = await docClient.send(updateCommand);
    console.log(`Successfully updated terrain ${terrainId} position in encounter ${encounterId}`);
    return updatedEncounter;

  } catch (error) {
    console.error("Error updating terrain position:", error);
    throw new Error(`Failed to update terrain ${terrainId} position in encounter ${encounterId}: ${error.message}`);
  }
}; 