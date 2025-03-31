const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { TimelineEventType } = require('./constants');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.ENCOUNTERS_TABLE;

exports.handler = async (event) => {
  const { encounterId, objectId } = event.arguments;
  const currentTime = Date.now() / 1000;

  console.log(`Attempting to remove object ${objectId} from encounter ${encounterId}`);

  if (!encounterId || !objectId) {
    throw new Error("Missing required arguments: encounterId, objectId");
  }

  try {
    // 1. Get the current encounter to find the index of the object
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { encounterId },
      ProjectionExpression: "objectPositions",
    });
    const { Item: encounter } = await docClient.send(getCommand);

    if (!encounter || !encounter.objectPositions) {
      // Object list doesn't exist or is empty, nothing to remove
      console.warn(`Object positions list not found or empty for encounter ${encounterId}. Cannot remove ${objectId}.`);
      // Return the encounter as is, or fetch the full encounter if needed by the schema
       const fullEncounter = await docClient.send(new GetCommand({ TableName: tableName, Key: { encounterId } }));
       return fullEncounter.Item;
    }

    const objectIndex = encounter.objectPositions.findIndex(pos => pos.objectId === objectId);

    if (objectIndex === -1) {
      // Object not found, maybe already removed. Log and return current state.
      console.warn(`Object ${objectId} not found in encounter ${encounterId}. Cannot remove.`);
      const fullEncounter = await docClient.send(new GetCommand({ TableName: tableName, Key: { encounterId } }));
      return fullEncounter.Item;
    }

    // 2. Prepare the history event
    const historyEvent = {
      time: currentTime,
      type: TimelineEventType.OBJECT_REMOVED,
      objectId: objectId,
      description: `Object ${objectId} removed from VTT`,
    };

    // 3. Remove the object from the list and add history
    const updateCommand = new UpdateCommand({
      TableName: tableName,
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