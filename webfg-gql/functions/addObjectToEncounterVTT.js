const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
// Assuming constants are exported using module.exports in constants.js
const { TimelineEventType } = require('./constants');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.ENCOUNTERS_TABLE;

// Change export syntax
exports.handler = async (event) => {
  const { encounterId, objectId, x, y } = event.arguments;
  const currentTime = Date.now() / 1000; // Or use encounter's currentTime if needed

  console.log(`Attempting to add object ${objectId} to encounter ${encounterId} at (${x}, ${y})`);

  if (!encounterId || !objectId || x === undefined || y === undefined) {
    throw new Error("Missing required arguments: encounterId, objectId, x, y");
  }

  try {
    // 1. Get the current encounter to check if object already exists (optional, Update can handle)
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { encounterId },
    });
    const { Item: encounter } = await docClient.send(getCommand);

    if (!encounter) {
      throw new Error(`Encounter not found: ${encounterId}`);
    }

    // Optional: Check if object already exists in objectPositions
    const objectExists = encounter.objectPositions?.some(pos => pos.objectId === objectId);
    if (objectExists) {
      console.warn(`Object ${objectId} already exists in encounter ${encounterId}. Updating position instead.`);
      // If it exists, you might want to call the update resolver logic instead
      // or just update its position here. For simplicity, we'll proceed with update.
      // Fall through to UpdateCommand which will overwrite or add.
    }

    // 2. Prepare the new object position and history event
    const newObjectPosition = { objectId, x, y };
    const historyEvent = {
      time: currentTime, // Use a consistent time source
      type: TimelineEventType.OBJECT_ADDED, // Define this constant
      objectId: objectId,
      description: `Object ${objectId} added to VTT at (${x}, ${y})`, // Fetch object name if desired
      x: x,
      y: y,
    };

    // 3. Update the encounter item
    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: { encounterId },
      UpdateExpression: "SET #op = list_append(if_not_exists(#op, :empty_list), :new_pos), #hist = list_append(if_not_exists(#hist, :empty_list), :new_hist)",
      // Use ConditionExpression if you strictly want to prevent adding duplicates
      // ConditionExpression: "attribute_not_exists(#op) OR not contains(#op, :check_obj_id)",
      ExpressionAttributeNames: {
        "#op": "objectPositions",
        "#hist": "history",
      },
      ExpressionAttributeValues: {
        ":new_pos": [newObjectPosition],
        ":new_hist": [historyEvent],
        ":empty_list": [],
        // ":check_obj_id": { objectId } // For ConditionExpression
      },
      ReturnValues: "ALL_NEW", // Return the updated item
    });

    const { Attributes: updatedEncounter } = await docClient.send(updateCommand);
    console.log(`Successfully added/updated object ${objectId} in encounter ${encounterId}`);
    return updatedEncounter;

  } catch (error) {
    console.error("Error adding object to encounter VTT:", error);
    // Consider more specific error handling/types
    throw new Error(`Failed to add object ${objectId} to encounter ${encounterId}: ${error.message}`);
  }
};

// Define constants (e.g., in './constants.js')
/*
export const TimelineEventType = {
  CHARACTER_JOINED: "CHARACTER_JOINED",
  ACTION_STARTED: "ACTION_STARTED",
  ACTION_COMPLETED: "ACTION_COMPLETED",
  CHARACTER_MOVED: "CHARACTER_MOVED",
  OBJECT_ADDED: "OBJECT_ADDED", // New
  OBJECT_MOVED: "OBJECT_MOVED", // New
  OBJECT_REMOVED: "OBJECT_REMOVED", // New
  TERRAIN_ADDED: "TERRAIN_ADDED", // New
  TERRAIN_MOVED: "TERRAIN_MOVED", // New
  TERRAIN_REMOVED: "TERRAIN_REMOVED", // New
  GM_NOTE: "GM_NOTE",
};
*/ 