const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { characterId, objectId } = event.arguments;
  const charactersTable = process.env.CHARACTERS_TABLE;
  
  try {
    // First, get the character to check if object already exists
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
    const stashIds = character.stashIds || [];
    const inventoryItems = character.inventoryItems || [];
    
    // Check if object is already in the character's stash
    if (stashIds.includes(objectId)) {
      // Object already exists, increment quantity in inventory system
      const itemIndex = inventoryItems.findIndex(item => 
        item.objectId === objectId && item.inventoryLocation === 'STASH'
      );
      
      let updatedInventoryItems;
      if (itemIndex !== -1) {
        // Increment existing quantity
        updatedInventoryItems = [...inventoryItems];
        updatedInventoryItems[itemIndex] = {
          ...updatedInventoryItems[itemIndex],
          quantity: updatedInventoryItems[itemIndex].quantity + 1
        };
      } else {
        // Add with quantity 2 (since it already exists in legacy array)
        updatedInventoryItems = [...inventoryItems, {
          objectId,
          quantity: 2,
          inventoryLocation: 'STASH'
        }];
      }
      
      const updateResult = await docClient.send(
        new UpdateCommand({
          TableName: charactersTable,
          Key: { characterId },
          UpdateExpression: 'SET inventoryItems = :inventoryItems',
          ExpressionAttributeValues: {
            ':inventoryItems': updatedInventoryItems
          },
          ReturnValues: 'ALL_NEW'
        })
      );
      
      return updateResult.Attributes;
    }
    
    // Add the object to the character's stash (new object)
    const updatedStashIds = [...stashIds, objectId];
    
    // Also add to inventory items with quantity 1
    const updatedInventoryItems = [...inventoryItems, {
      objectId,
      quantity: 1,
      inventoryLocation: 'STASH'
    }];
    
    // Update the character with the new stash item
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: charactersTable,
        Key: { characterId },
        UpdateExpression: 'SET stashIds = :stashIds, inventoryItems = :inventoryItems',
        ExpressionAttributeValues: {
          ':stashIds': updatedStashIds,
          ':inventoryItems': updatedInventoryItems
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    return updateResult.Attributes;
  } catch (error) {
    console.error('Error adding object to stash:', error);
    throw error;
  }
};