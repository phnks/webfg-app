// Use AWS SDK v3 with explicit imports
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  
  const inventoryIds = event.source?.inventoryIds || [];
  
  if (!inventoryIds.length) {
    console.log("No inventory IDs found in the source");
    return [];
  }
  
  console.log(`Processing ${inventoryIds.length} inventory IDs`);
  
  // Process in batches of 25 (DynamoDB batch limit)
  const batchSize = 25;
  const batches = [];
  
  for (let i = 0; i < inventoryIds.length; i += batchSize) {
    batches.push(inventoryIds.slice(i, i + batchSize));
  }
  
  let inventory = [];
  const tableName = process.env.OBJECTS_TABLE;
  
  console.log(`Using table: ${tableName}`);
  
  try {
    for (const batch of batches) {
      const keys = batch.map(id => ({ objectId: id }));
      
      console.log(`Fetching batch of ${keys.length} items`);
      
      const command = new BatchGetCommand({
        RequestItems: {
          [tableName]: {
            Keys: keys
          }
        }
      });
      
      const response = await docClient.send(command);
      
      if (response.Responses && response.Responses[tableName]) {
        console.log(`Retrieved ${response.Responses[tableName].length} inventory items`);
        inventory = inventory.concat(response.Responses[tableName]);
      }
    }
    
    console.log(`Returning ${inventory.length} inventory items total`);
    return inventory;
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
}; 