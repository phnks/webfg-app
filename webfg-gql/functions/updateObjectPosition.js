const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { TimelineEventType } = require('./constants');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.ENCOUNTERS_TABLE;

exports.handler = async (event) => {
  const { encounterId, objectId, x, y } = event.arguments;
  const currentTime = Date.now() / 1000;

  console.log(`Attempting to update object ${objectId} in encounter ${encounterId} to (${x}, ${y})`);

  if (!encounterId || !objectId || x === undefined || y === undefined) {
    throw new Error("Missing required arguments: encounterId, objectId, x, y");
  }

  try {
    // 1. Get the current encounter to find the index of the object
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { encounterId },
      ProjectionExpression: "objectPositions", // Only need objectPositions
    });
    const { Item: encounter } = await docClient.send(getCommand);

    if (!encounter || !encounter.objectPositions) {
      throw new Error(`Encounter ${encounterId} or its objectPositions not found.`);
    }

    const objectIndex = encounter.objectPositions.findIndex(pos => pos.objectId === objectId);

    if (objectIndex === -1) {
      throw new Error(`Object ${objectId} not found in encounter ${encounterId}`);
    }

    // 2. Prepare the history event
    const historyEvent = {
      time: currentTime,
      type: TimelineEventType.OBJECT_MOVED,
      objectId: objectId,
      description: `Object ${objectId} moved to (${x}, ${y})`,
      x: x,
      y: y,
    };

    // 3. Update the specific object's position and add history
    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: { encounterId },
      // Update the specific element in the list
      UpdateExpression: `SET #op[${objectIndex}].#x = :x, #op[${objectIndex}].#y = :y, #hist = list_append(if_not_exists(#hist, :empty_list), :new_hist)`,
      ExpressionAttributeNames: {
        "#op": "objectPositions",
        "#x": "x",
        "#y": "y",
        "#hist": "history",
      },
      ExpressionAttributeValues: {
        ":x": x,
        ":y": y,
        ":new_hist": [historyEvent],
        ":empty_list": [],
      },
      ReturnValues: "ALL_NEW",
    });

    const { Attributes: updatedEncounter } = await docClient.send(updateCommand);
    console.log(`Successfully updated object ${objectId} position in encounter ${encounterId}`);
    return updatedEncounter;

  } catch (error) {
    console.error("Error updating object position:", error);
    throw new Error(`Failed to update object ${objectId} position in encounter ${encounterId}: ${error.message}`);
  }
}; 