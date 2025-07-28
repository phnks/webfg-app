const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { characterId, objectId, quantity, fromLocation, toLocation } = event.arguments;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  try {
    // Get the current character
    const getResult = await docClient.send(
      new GetCommand({
        TableName: charactersTable,
        Key: { characterId }
      })
    );
    
    if (!getResult.Item) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    
    const character = getResult.Item;
    const inventoryItems = character.inventoryItems || [];
    
    // Find the source item
    const sourceIndex = inventoryItems.findIndex(item => 
      item.objectId === objectId && item.inventoryLocation === fromLocation
    );
    
    if (sourceIndex === -1) {
      throw new Error(`Object ${objectId} not found in ${fromLocation}`);
    }
    
    const sourceItem = inventoryItems[sourceIndex];
    
    if (sourceItem.quantity < quantity) {
      throw new Error(`Insufficient quantity. Available: ${sourceItem.quantity}, Requested: ${quantity}`);
    }
    
    // Find the destination item
    const destIndex = inventoryItems.findIndex(item => 
      item.objectId === objectId && item.inventoryLocation === toLocation
    );
    
    let updatedInventoryItems = [...inventoryItems];
    
    // Update source location
    if (sourceItem.quantity === quantity) {
      // Remove the item from source if moving all
      updatedInventoryItems.splice(sourceIndex, 1);
    } else {
      // Reduce quantity at source
      updatedInventoryItems[sourceIndex] = {
        ...sourceItem,
        quantity: sourceItem.quantity - quantity
      };
    }
    
    // Update destination location
    if (destIndex !== -1 && destIndex !== sourceIndex) {
      // Add to existing item at destination
      updatedInventoryItems[destIndex] = {
        ...updatedInventoryItems[destIndex],
        quantity: updatedInventoryItems[destIndex].quantity + quantity
      };
    } else {
      // Create new item at destination
      updatedInventoryItems.push({
        objectId,
        quantity,
        inventoryLocation: toLocation
      });
    }
    
    // Also update the legacy ID arrays for backward compatibility
    const legacyUpdates = {};
    const fromFieldMap = {
      'STASH': 'stashIds',
      'EQUIPMENT': 'equipmentIds',
      'READY': 'readyIds'
    };
    const toFieldMap = {
      'STASH': 'stashIds',
      'EQUIPMENT': 'equipmentIds',
      'READY': 'readyIds'
    };
    
    // Remove from source array if moving all quantity
    const sourceField = fromFieldMap[fromLocation];
    const destField = toFieldMap[toLocation];
    
    if (sourceField && character[sourceField]) {
      const sourceIds = [...character[sourceField]];
      const itemInSource = updatedInventoryItems.find(item => 
        item.objectId === objectId && item.inventoryLocation === fromLocation
      );
      
      if (!itemInSource) {
        // Remove from legacy array if no longer in that location
        const index = sourceIds.indexOf(objectId);
        if (index !== -1) {
          sourceIds.splice(index, 1);
          legacyUpdates[sourceField] = sourceIds;
        }
      }
    }
    
    // Add to destination array if not already there
    if (destField && character[destField]) {
      const destIds = [...character[destField]];
      if (!destIds.includes(objectId)) {
        destIds.push(objectId);
        legacyUpdates[destField] = destIds;
      }
    }
    
    // Build update expression
    let updateExpression = 'SET inventoryItems = :inventoryItems';
    const expressionAttributeValues = {
      ':inventoryItems': updatedInventoryItems
    };
    
    // Add legacy updates
    Object.keys(legacyUpdates).forEach(field => {
      updateExpression += `, ${field} = :${field}`;
      expressionAttributeValues[`:${field}`] = legacyUpdates[field];
    });
    
    // Update the character
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: charactersTable,
        Key: { characterId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error moving inventory item:', error);
    throw error;
  }
};