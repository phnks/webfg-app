const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
// Assuming constants are exported using module.exports in constants.js
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

// Change export syntax
exports.handler = async (event) => {
  const { encounterId, objectId, x, y } = event.arguments;

  console.log(`Attempting to add object ${objectId} to encounter ${encounterId} at (${x}, ${y})`);

  if (!encounterId || !objectId || x === undefined || y === undefined) {
    throw new Error("Missing required arguments: encounterId, objectId, x, y");
  }

  try {
    // 1. Get the current encounter
    const getEncounterCommand = new GetCommand({
      TableName: encountersTable,
      Key: { encounterId },
    });
    const { Item: encounter } = await docClient.send(getEncounterCommand);

    if (!encounter) {
      throw new Error(`Encounter not found: ${encounterId}`);
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

    // Optional: Check if object already exists in objectPositions
    const objectExists = encounter.objectPositions?.some(pos => pos.objectId === objectId);
    if (objectExists) {
      console.warn(`Object ${objectId} already exists in encounter ${encounterId}. No action taken.`);
      // Return current state or throw error if adding duplicates is not allowed
      return encounter; // Or throw new Error(`Object ${objectId} already exists.`);
    }

    // 3. Prepare the new object position and history event
    const newObjectPosition = { objectId, x, y };
    const scaledX = x * 5; // Scale coordinates for description
    const scaledY = y * 5;
    const historyEvent = {
      time: encounter.currentTime, // Always use encounter's current time
      type: TimelineEventType.OBJECT_ADDED,
      objectId: objectId,
      description: `${objectName} added to VTT at (${scaledX}ft, ${scaledY}ft)`, // Enriched description with scaled coords
      x: x, // Store raw grid coordinates
      y: y,
    };

    // 4. Update the encounter item
    const updateCommand = new UpdateCommand({
      TableName: encountersTable,
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
