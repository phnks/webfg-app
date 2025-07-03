// Use AWS SDK v3 with explicit imports
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  // console.log("Received event:", JSON.stringify(event, null, 2));
  
  const actionIds = event.source?.actionIds || [];
  
  if (!actionIds.length) {
    // console.log("No action IDs found in the source");
    return [];
  }
  
  // console.log(`Processing ${actionIds.length} action IDs`);
  
  // Process in batches of 25 (DynamoDB batch limit)
  const batchSize = 25;
  const batches = [];
  
  for (let i = 0; i < actionIds.length; i += batchSize) {
    batches.push(actionIds.slice(i, i + batchSize));
  }
  
  let actions = [];
  const tableName = process.env.ACTIONS_TABLE;
  
  // console.log(`Using table: ${tableName}`);
  
  try {
    for (const batch of batches) {
      const keys = batch.map(id => ({ actionId: id }));
      
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
        // console.log(`Retrieved ${response.Responses[tableName].length} actions`);
        actions = actions.concat(response.Responses[tableName]);
      }
    }
    
    // console.log(`Returning ${actions.length} actions total`);
    return actions;
  } catch (error) {
    console.error('Error fetching actions:', error);
    throw error;
  }
}; 