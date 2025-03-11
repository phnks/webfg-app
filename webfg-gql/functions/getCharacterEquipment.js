// Use AWS SDK v3 with explicit imports
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  
  const equipmentIds = event.source?.equipmentIds || [];
  
  if (!equipmentIds.length) {
    console.log("No equipment IDs found in the source");
    return [];
  }
  
  console.log(`Processing ${equipmentIds.length} equipment IDs`);
  
  // Process in batches of 25 (DynamoDB batch limit)
  const batchSize = 25;
  const batches = [];
  
  for (let i = 0; i < equipmentIds.length; i += batchSize) {
    batches.push(equipmentIds.slice(i, i + batchSize));
  }
  
  let equipment = [];
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
        console.log(`Retrieved ${response.Responses[tableName].length} equipment items`);
        equipment = equipment.concat(response.Responses[tableName]);
      }
    }
    
    console.log(`Returning ${equipment.length} equipment items total`);
    return equipment;
  } catch (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }
}; 