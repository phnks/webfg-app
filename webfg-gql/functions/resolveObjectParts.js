const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
  console.log("resolveObjectParts Lambda invoked, event:", JSON.stringify(event, null, 2));

  if (!OBJECTS_TABLE_NAME) {
    console.error("OBJECTS_TABLE environment variable not set.");
    throw new Error("Internal server error: OBJECTS_TABLE_NAME not set.");
  }

  const parentObject = event.source;
  if (!parentObject) {
    console.warn("No source object provided to resolveObjectParts.");
    return [];
  }

  const partIds = parentObject.partsIds;
  if (!partIds || partIds.length === 0) {
    console.log("No partIds found on parent object or partIds array is empty.");
    return [];
  }

  console.log(`Fetching details for partIds: ${partIds.join(", ")} from table ${OBJECTS_TABLE_NAME}`);

  const keys = partIds.map(id => ({ objectId: id }));

  if (keys.length > 100) {
      console.error(`Attempting to fetch ${keys.length} items, which exceeds BatchGetCommand limit of 100. This requires chunking.`);
      throw new Error(`Cannot fetch more than 100 parts at once due to BatchGetCommand limits. Received ${keys.length} partIds.`);
  }
  if (keys.length === 0) { // Should be caught by !partIds || partIds.length === 0, but as a safeguard
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
    const resolvedParts = data.Responses && data.Responses[OBJECTS_TABLE_NAME] ? data.Responses[OBJECTS_TABLE_NAME] : [];

    console.log(`Successfully fetched ${resolvedParts.length} parts.`);

    // Ensure the returned parts are in the same order as parentObject.partIds
    // This is important if the frontend relies on this order.
    // BatchGetItem does not guarantee order.
    const orderedParts = [];
    if (resolvedParts.length > 0) {
      const partsMap = new Map(resolvedParts.map(part => [part.objectId, part]));
      partIds.forEach(id => {
        if (partsMap.has(id)) {
          orderedParts.push(partsMap.get(id));
        } else {
          console.warn(`PartId ${id} was requested but not found in BatchGetResponse.`);
        }
      });
    }
    return orderedParts;

  } catch (error) {
    console.error("Error fetching parts with BatchGetCommand:", error);
    console.error("BatchGetCommand params:", JSON.stringify(params, null, 2));
    throw new Error("Failed to resolve object parts due to an internal error.");
  }
};
