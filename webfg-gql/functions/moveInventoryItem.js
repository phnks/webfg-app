const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { characterId, objectId, quantity, fromLocation, toLocation } = event.arguments;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  console.log('moveInventoryItem called with:', { characterId, objectId, quantity, fromLocation, toLocation });
  
  try {
    // Get the current character
    console.log('Fetching character from DynamoDB...');
    const getResult = await docClient.send(
      new GetCommand({
        TableName: charactersTable,
        Key: { characterId }
      })
    );
    
    console.log('DynamoDB get result:', JSON.stringify(getResult, null, 2));
    
    if (!getResult.Item) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    
    const character = getResult.Item;
    const inventoryItems = character.inventoryItems || [];
    console.log('Current inventory items:', JSON.stringify(inventoryItems, null, 2));
    
    // Find the source item
    console.log('Looking for source item:', { objectId, fromLocation });
    console.log('Available items for search:', inventoryItems.map(item => ({ objectId: item.objectId, location: item.inventoryLocation, quantity: item.quantity })));
    
    const sourceIndex = inventoryItems.findIndex(item => 
      item.objectId === objectId && item.inventoryLocation === fromLocation
    );
    
    console.log('Source index found:', sourceIndex);
    
    if (sourceIndex === -1) {
      console.log('Source item not found, throwing error');
      throw new Error(`Object ${objectId} not found in ${fromLocation}`);
    }
    
    const sourceItem = inventoryItems[sourceIndex];
    console.log('Source item:', JSON.stringify(sourceItem, null, 2));
    
    if (sourceItem.quantity < quantity) {
      console.log('Insufficient quantity, throwing error');
      throw new Error(`Insufficient quantity. Available: ${sourceItem.quantity}, Requested: ${quantity}`);
    }
    
    // Find the destination item
    console.log('Looking for destination item:', { objectId, toLocation });
    const destIndex = inventoryItems.findIndex(item => 
      item.objectId === objectId && item.inventoryLocation === toLocation
    );
    
    console.log('Destination index found:', destIndex);
    
    let updatedInventoryItems = [...inventoryItems];
    console.log('Initial updated inventory items:', JSON.stringify(updatedInventoryItems, null, 2));
    
    // Update destination location first if it exists
    if (destIndex !== -1) {
      console.log('Updating existing destination item');
      console.log('destIndex:', destIndex);
      console.log('updatedInventoryItems length:', updatedInventoryItems.length);
      console.log('Item at destIndex:', JSON.stringify(updatedInventoryItems[destIndex], null, 2));
      
      // Safety check
      if (!updatedInventoryItems[destIndex]) {
        throw new Error(`Destination item at index ${destIndex} is undefined. Array length: ${updatedInventoryItems.length}`);
      }
      
      // Add to existing item at destination
      updatedInventoryItems[destIndex] = {
        ...updatedInventoryItems[destIndex],
        quantity: updatedInventoryItems[destIndex].quantity + quantity
      };
      console.log('Updated destination item:', JSON.stringify(updatedInventoryItems[destIndex], null, 2));
    } else {
      console.log('Creating new destination item');
      // Create new item at destination
      const newItem = {
        objectId,
        quantity,
        inventoryLocation: toLocation
      };
      updatedInventoryItems.push(newItem);
      console.log('New destination item:', JSON.stringify(newItem, null, 2));
    }
    
    // Update source location after destination to avoid index issues
    if (sourceItem.quantity === quantity) {
      console.log('Removing entire source item (moving all quantity)');
      // Remove the item from source if moving all
      updatedInventoryItems.splice(sourceIndex, 1);
      console.log('Source item removed');
    } else {
      console.log('Reducing source item quantity');
      // Reduce quantity at source
      updatedInventoryItems[sourceIndex] = {
        ...sourceItem,
        quantity: sourceItem.quantity - quantity
      };
      console.log('Updated source item:', JSON.stringify(updatedInventoryItems[sourceIndex], null, 2));
    }
    
    console.log('Final updated inventory items:', JSON.stringify(updatedInventoryItems, null, 2));
    
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
    
    console.log('Legacy updates:', JSON.stringify(legacyUpdates, null, 2));
    
    // Add legacy updates
    Object.keys(legacyUpdates).forEach(field => {
      updateExpression += `, ${field} = :${field}`;
      expressionAttributeValues[`:${field}`] = legacyUpdates[field];
    });
    
    console.log('Update expression:', updateExpression);
    console.log('Expression attribute values:', JSON.stringify(expressionAttributeValues, null, 2));
    
    // Update the character
    console.log('Sending DynamoDB update command...');
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: charactersTable,
        Key: { characterId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      })
    );
    
    console.log('DynamoDB update result:', JSON.stringify(updateResult, null, 2));
    console.log('Returning updated character:', JSON.stringify(updateResult.Attributes, null, 2));
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error moving inventory item:', error);
    throw error;
  }
};