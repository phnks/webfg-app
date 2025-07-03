// Use AWS SDK v3 with explicit imports
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  // console.log("Received event for resolveCharacterBody:", JSON.stringify(event, null, 2));

  // Source contains the parent Character object
  // The new schema uses bodyId instead of inventoryIds/equipmentIds
  const bodyIds = event.source?.bodyId || [];

  if (!bodyIds.length) {
    // console.log("No body IDs found in the source");
    return [];
  }

  // console.log(`Processing ${bodyIds.length} body IDs`);

  // Process in batches of 25 (DynamoDB batch limit)
  const batchSize = 25;
  const batches = [];

  for (let i = 0; i < bodyIds.length; i += batchSize) {
    batches.push(bodyIds.slice(i, i + batchSize));
  }

  let bodyItems = [];
  const tableName = process.env.OBJECTS_TABLE; // Assuming ObjectsTable contains body parts/items

  // console.log(`Using table: ${tableName}`);

  try {
    for (const batch of batches) {
      const keys = batch.map(id => ({ objectId: id }));

      // console.log(`Fetching batch of ${keys.length} items`);

      const command = new BatchGetCommand({
        RequestItems: {
          [tableName]: {
            Keys: keys
          }
        }
      });

      const response = await docClient.send(command);

      if (response.Responses && response.Responses[tableName]) {
        // console.log(`Retrieved ${response.Responses[tableName].length} body items`);
        bodyItems = bodyItems.concat(response.Responses[tableName]);
      }
    }

    // console.log(`Returning ${bodyItems.length} body items total`);
    return bodyItems;
  } catch (error) {
    console.error('Error fetching body items:', error);
    throw error;
  }
};
