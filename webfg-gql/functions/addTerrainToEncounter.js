const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid'); // For generating unique terrain IDs
const { TimelineEventType } = require('./constants');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.ENCOUNTERS_TABLE;

exports.handler = async (event) => {
  const { encounterId, input } = event.arguments;
  const { type, startX, startY, length, color } = input;

  console.log(`Attempting to add terrain type ${type} to encounter ${encounterId}`);

  if (!encounterId || !input || !type || startX === undefined || startY === undefined || length === undefined) {
    throw new Error("Missing required arguments: encounterId, input.{type, startX, startY, length}");
  }
  if (length <= 0) {
      throw new Error("Terrain length must be positive.");
  }

  try {
     // Ensure encounter exists (optional, Update handles it, but good practice)
     const getCommand = new GetCommand({ TableName: tableName, Key: { encounterId }, ProjectionExpression: "encounterId" });
     const { Item: encounterExists } = await docClient.send(getCommand);
     if (!encounterExists) {
         throw new Error(`Encounter not found: ${encounterId}`);
     }

    // 1. Generate a unique ID for the terrain element
    const terrainId = uuidv4();

    // 2. Prepare the new terrain element
    const newTerrainElement = {
      terrainId,
      type,
      startX,
      startY,
      length,
      color: color || '#8B4513', // Default color if not provided
    };

    // 3. Update the encounter item
    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: { encounterId },
      UpdateExpression: "SET #te = list_append(if_not_exists(#te, :empty_list), :new_terrain)",
      ExpressionAttributeNames: {
        "#te": "terrainElements"
      },
      ExpressionAttributeValues: {
        ":new_terrain": [newTerrainElement],
        ":empty_list": []
      },
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedEncounter } = await docClient.send(updateCommand);
    console.log(`Successfully added terrain ${terrainId} to encounter ${encounterId}`);
    return updatedEncounter;

  } catch (error) {
    console.error("Error adding terrain to encounter:", error);
    throw new Error(`Failed to add terrain to encounter ${encounterId}: ${error.message}`);
  }
}; 