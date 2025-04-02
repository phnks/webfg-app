const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { TimelineEventType } = require('./constants');

const client = new DynamoDBClient({});
// Configure DocumentClient to remove undefined values
const marshallOptions = {
  removeUndefinedValues: true,
};
const translateConfig = { marshallOptions };
const docClient = DynamoDBDocumentClient.from(client, translateConfig);
const encountersTable = process.env.ENCOUNTERS_TABLE;
const objectsTable = process.env.OBJECTS_TABLE; // Assuming OBJECTS_TABLE env var is set

exports.handler = async (event) => {
  const { encounterId, objectId, x, y } = event.arguments;

  console.log(`Attempting to update object ${objectId} in encounter ${encounterId} to (${x}, ${y})`);

  if (!encounterId || !objectId || x === undefined || y === undefined) {
    throw new Error("Missing required arguments: encounterId, objectId, x, y");
  }

  try {
    // 1. Get the current encounter to find the index and get current time
    const getEncounterCommand = new GetCommand({
      TableName: encountersTable,
      Key: { encounterId },
      ProjectionExpression: "objectPositions, currentTime", // Need objectPositions and currentTime
    });
    const { Item: encounter } = await docClient.send(getEncounterCommand);

    if (!encounter || !encounter.objectPositions) {
      throw new Error(`Encounter ${encounterId} or its objectPositions not found.`);
    }

    const objectIndex = encounter.objectPositions.findIndex(pos => pos.objectId === objectId);

    if (objectIndex === -1) {
      throw new Error(`Object ${objectId} not found in encounter ${encounterId}`);
    }

    // 2. Get Object details for name
    const getObjectCommand = new GetCommand({
      TableName: objectsTable,
      Key: { objectId },
      ProjectionExpression: "#nm", // Only fetch the name attribute
      ExpressionAttributeNames: { "#nm": "name" }
    });
    const { Item: objectDetails } = await docClient.send(getObjectCommand);
    const objectName = objectDetails?.name || objectId; // Use ID as fallback

    // 3. Prepare the history event
    const scaledX = x * 5; // Scale coordinates for description
    const scaledY = y * 5;
    const historyEvent = {
      time: encounter.currentTime, // Always use encounter's current time
      type: TimelineEventType.OBJECT_MOVED,
      objectId: objectId,
      description: `${objectName} moved to (${scaledX}ft, ${scaledY}ft)`, // Enriched description with scaled coords
      x: x, // Store raw grid coordinates
      y: y,
    };

    // 4. Update the specific object's position and add history
    const updateCommand = new UpdateCommand({
      TableName: encountersTable,
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
