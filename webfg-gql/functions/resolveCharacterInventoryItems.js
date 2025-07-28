const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const character = event.source;
  const inventoryLocation = event.arguments?.location;
  const objectsTable = process.env.OBJECTS_TABLE;
  
  try {
    // Get inventory items, filtering by location if specified
    let inventoryItems = character.inventoryItems || [];
    
    if (inventoryLocation) {
      inventoryItems = inventoryItems.filter(item => item.inventoryLocation === inventoryLocation);
    }
    
    if (!inventoryItems.length) {
      return [];
    }
    
    // Get unique object IDs
    const uniqueObjectIds = [...new Set(inventoryItems.map(item => item.objectId))];
    
    // Batch get all objects
    const batchGetParams = {
      RequestItems: {
        [objectsTable]: {
          Keys: uniqueObjectIds.map(objectId => ({ objectId }))
        }
      }
    };
    
    const batchResult = await docClient.send(new BatchGetCommand(batchGetParams));
    const objects = batchResult.Responses[objectsTable] || [];
    
    // Create a map for quick lookup
    const objectMap = {};
    objects.forEach(obj => {
      objectMap[obj.objectId] = obj;
    });
    
    // Build the result with objects and their quantities
    const result = inventoryItems
      .map(item => {
        const object = objectMap[item.objectId];
        if (object) {
          return {
            ...object,
            quantity: item.quantity,
            inventoryLocation: item.inventoryLocation
          };
        }
        return null;
      })
      .filter(item => item !== null);
    
    return result;
  } catch (error) {
    console.error('Error resolving inventory items:', error);
    throw error;
  }
};