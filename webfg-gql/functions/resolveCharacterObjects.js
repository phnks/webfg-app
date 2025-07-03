const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE = process.env.OBJECTS_TABLE;

exports.handler = async (event) => {
  // console.log("resolveCharacterObjects Lambda invoked, event:", JSON.stringify(event, null, 2));

  if (!OBJECTS_TABLE) {
    console.error("OBJECTS_TABLE environment variable not set.");
    throw new Error("Internal server error: OBJECTS_TABLE not set.");
  }

  const character = event.source;
  if (!character) {
    // console.warn("No source character provided to resolveCharacterObjects.");
    return [];
  }

  // Determine which field we're resolving
  const fieldName = event.field || 'inventory';
  let idFieldName;
  
  switch (fieldName) {
    case 'stash':
      idFieldName = 'stashIds';
      break;
    case 'equipment':
      idFieldName = 'equipmentIds';
      break;
    case 'ready':
      idFieldName = 'readyIds';
      break;
    case 'inventory':
    default:
      idFieldName = 'inventoryIds';
      break;
  }
  
  // Get object IDs from the character
  const objectIds = character[idFieldName];
  if (!objectIds || objectIds.length === 0) {
    // console.log(`No ${idFieldName} found on character or ${idFieldName} array is empty.`);
    return [];
  }

  // console.log(`Fetching details for ${objectIds.length} ${idFieldName} from table ${OBJECTS_TABLE}`);

  // DynamoDB BatchGetItem has a limit of 100 items per request
  // We'll process in batches if needed
  const result = [];
  
  // Process in batches of 100
  for (let i = 0; i < objectIds.length; i += 100) {
    const batchIds = objectIds.slice(i, i + 100);
    const keys = batchIds.map(id => ({ objectId: id }));
    
    const params = {
      RequestItems: {
        [OBJECTS_TABLE]: {
          Keys: keys,
        },
      },
    };

    try {
      const data = await ddbDocClient.send(new BatchGetCommand(params));
      const resolvedObjects = data.Responses && data.Responses[OBJECTS_TABLE] 
        ? data.Responses[OBJECTS_TABLE] 
        : [];

      // console.log(`Successfully fetched ${resolvedObjects.length} objects from batch.`);
      result.push(...resolvedObjects);
    } catch (error) {
      console.error(`Error fetching ${fieldName} batch with BatchGetCommand:`, error);
      console.error("BatchGetCommand params:", JSON.stringify(params, null, 2));
      throw new Error(`Failed to resolve character ${fieldName} due to an internal error.`);
    }
  }

  // Ensure the returned objects are in the same order as in the ID list
  const orderedObjects = [];
  if (result.length > 0) {
    const objectMap = new Map(result.map(item => [item.objectId, item]));
    objectIds.forEach(id => {
      if (objectMap.has(id)) {
        orderedObjects.push(objectMap.get(id));
      } else {
        console.warn(`ObjectId ${id} was requested but not found in BatchGetResponse.`);
      }
    });
  }

  // console.log(`Returning ${orderedObjects.length} objects for character ${character.characterId}'s ${fieldName}`);
  return orderedObjects;
};