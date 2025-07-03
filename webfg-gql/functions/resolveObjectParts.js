const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
  // console.log("resolveObjectParts Lambda invoked, event:", JSON.stringify(event, null, 2));

  if (!OBJECTS_TABLE_NAME) {
    console.error("OBJECTS_TABLE environment variable not set.");
    throw new Error("Internal server error: OBJECTS_TABLE_NAME not set.");
  }

  const parentObject = event.source;
  if (!parentObject) {
    console.warn("No source object provided to resolveObjectParts.");
    return [];
  }

  // Changed from partsIds to equipmentIds
  const equipmentIds = parentObject.equipmentIds;
  if (!equipmentIds || equipmentIds.length === 0) {
    // console.log("No equipmentIds found on parent object or equipmentIds array is empty.");
    return [];
  }

  // console.log(`Fetching details for equipmentIds: ${equipmentIds.join(", ")} from table ${OBJECTS_TABLE_NAME}`);

  const keys = equipmentIds.map(id => ({ objectId: id }));

  if (keys.length > 100) {
      console.error(`Attempting to fetch ${keys.length} items, which exceeds BatchGetCommand limit of 100. This requires chunking.`);
      throw new Error(`Cannot fetch more than 100 equipment items at once due to BatchGetCommand limits. Received ${keys.length} equipmentIds.`);
  }
  if (keys.length === 0) {
    return [];
  }

  const params = {
    RequestItems: {
      [OBJECTS_TABLE_NAME]: {
        Keys: keys,
      },
    },
  };

  try {
    const data = await ddbDocClient.send(new BatchGetCommand(params));
    const resolvedEquipment = data.Responses && data.Responses[OBJECTS_TABLE_NAME] ? data.Responses[OBJECTS_TABLE_NAME] : [];

    // console.log(`Successfully fetched ${resolvedEquipment.length} equipment items.`);

    // Ensure the returned equipment items are in the same order as parentObject.equipmentIds
    const orderedEquipment = [];
    if (resolvedEquipment.length > 0) {
      const equipmentMap = new Map(resolvedEquipment.map(item => [item.objectId, item]));
      equipmentIds.forEach(id => {
        if (equipmentMap.has(id)) {
          orderedEquipment.push(equipmentMap.get(id));
        } else {
          console.warn(`EquipmentId ${id} was requested but not found in BatchGetResponse.`);
        }
      });
    }
    return orderedEquipment;

  } catch (error) {
    console.error("Error fetching equipment with BatchGetCommand:", error);
    console.error("BatchGetCommand params:", JSON.stringify(params, null, 2));
    throw new Error("Failed to resolve object equipment due to an internal error.");
  }
};