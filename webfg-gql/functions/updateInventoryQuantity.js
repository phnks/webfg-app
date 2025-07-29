const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { characterId, objectId, quantity, location } = event.arguments;
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
    
    // Find the inventory item
    const itemIndex = inventoryItems.findIndex(item => 
      item.objectId === objectId && item.inventoryLocation === location
    );
    
    let updatedInventoryItems;
    
    if (itemIndex !== -1) {
      // Update existing item quantity
      updatedInventoryItems = [...inventoryItems];
      updatedInventoryItems[itemIndex] = {
        ...updatedInventoryItems[itemIndex],
        quantity: quantity
      };
    } else {
      // Add new item with quantity
      updatedInventoryItems = [...inventoryItems, {
        objectId,
        quantity,
        inventoryLocation: location
      }];
    }
    
    // Update the character
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
  } catch (error) {
    console.error('Error updating inventory quantity:', error);
    throw error;
  }
};