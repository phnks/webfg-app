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
  const { encounterId, objectId } = event.arguments;

  console.log(`Attempting to remove object ${objectId} from encounter ${encounterId}`);

  if (!encounterId || !objectId) {
    throw new Error("Missing required arguments: encounterId, objectId");
  }

  try {
    // 1. Get the current encounter to find the index and get currentTime
    const getCommand = new GetCommand({
      TableName: encountersTable,
      Key: { encounterId },
      ProjectionExpression: "objectPositions, currentTime", // Fetch currentTime
    });
    const { Item: encounter } = await docClient.send(getCommand);

    if (!encounter) {
      // Encounter itself not found
      throw new Error(`Encounter ${encounterId} not found.`);
    }

    if (!encounter.objectPositions) {
      // Object list doesn't exist or is empty, nothing to remove
      console.warn(`Object positions list not found or empty for encounter ${encounterId}. Cannot remove ${objectId}.`);
      return encounter; // Return the fetched encounter data
    }

    const objectIndex = encounter.objectPositions.findIndex(pos => pos.objectId === objectId);

    if (objectIndex === -1) {
      // Object not found, maybe already removed. Log and return current state.
      console.warn(`Object ${objectId} not found in encounter ${encounterId}. Cannot remove.`);
      return encounter; // Return the fetched encounter data
    }

    // 2. Get Object details for name
    const getObjectCommand = new GetCommand({
      TableName: objectsTable,
      Key: { objectId },
      ProjectionExpression: "#nm",
      ExpressionAttributeNames: { "#nm": "name" }
    });
    const { Item: objectDetails } = await docClient.send(getObjectCommand);
    const objectName = objectDetails?.name || objectId; // Use ID as fallback

    // 3. Prepare the history event
    const historyEvent = {
      time: encounter.currentTime, // Use encounter's current time
      type: TimelineEventType.OBJECT_REMOVED,
      objectId: objectId,
      description: `${objectName} removed from VTT`, // Use object name
    };

    // 4. Remove the object from the list and add history
    const updateCommand = new UpdateCommand({
      TableName: encountersTable,
      Key: { encounterId },
      UpdateExpression: `REMOVE #op[${objectIndex}] SET #hist = list_append(if_not_exists(#hist, :empty_list), :new_hist)`,
      ExpressionAttributeNames: {
        "#op": "objectPositions",
        "#hist": "history",
      },
      ExpressionAttributeValues: {
        ":new_hist": [historyEvent],
        ":empty_list": [],
      },
      ReturnValues: "ALL_NEW",
    });

    const { Attributes: updatedEncounter } = await docClient.send(updateCommand);
    console.log(`Successfully removed object ${objectId} from encounter ${encounterId}`);
    return updatedEncounter;

  } catch (error) {
    console.error("Error removing object from VTT:", error);
    throw new Error(`Failed to remove object ${objectId} from encounter ${encounterId}: ${error.message}`);
  }
};
