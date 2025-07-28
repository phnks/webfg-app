const { handler } = require('../../../functions/updateInventoryQuantity');

describe('updateInventoryQuantity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
  });

  it('should update quantity for existing inventory item', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';
    const quantity = 5;
    const location = 'STASH';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 2, inventoryLocation: 'STASH' },
        { objectId: 'obj-789', quantity: 1, inventoryLocation: 'EQUIPMENT' }
      ]
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 5, inventoryLocation: 'STASH' },
        { objectId: 'obj-789', quantity: 1, inventoryLocation: 'EQUIPMENT' }
      ]
    };

    const event = {
      arguments: {
        characterId,
        objectId,
        quantity,
        location
      }
    };

    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCharacter
    });

    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCharacter
    });

    const result = await handler(event);

    expect(result).toEqual(updatedCharacter);
    expect(result.inventoryItems[0].quantity).toBe(5);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should add new inventory item when not found', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-new';
    const quantity = 3;
    const location = 'EQUIPMENT';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 2, inventoryLocation: 'STASH' }
      ]
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 2, inventoryLocation: 'STASH' },
        { objectId: 'obj-new', quantity: 3, inventoryLocation: 'EQUIPMENT' }
      ]
    };

    const event = {
      arguments: {
        characterId,
        objectId,
        quantity,
        location
      }
    };

    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCharacter
    });

    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCharacter
    });

    const result = await handler(event);

    expect(result.inventoryItems).toHaveLength(2);
    expect(result.inventoryItems[1]).toEqual({
      objectId: 'obj-new',
      quantity: 3,
      inventoryLocation: 'EQUIPMENT'
    });
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle character with no existing inventory items', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';
    const quantity = 1;
    const location = 'READY';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character'
      // No inventoryItems
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 1, inventoryLocation: 'READY' }
      ]
    };

    const event = {
      arguments: {
        characterId,
        objectId,
        quantity,
        location
      }
    };

    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCharacter
    });

    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCharacter
    });

    const result = await handler(event);

    expect(result.inventoryItems).toHaveLength(1);
    expect(result.inventoryItems[0]).toEqual({
      objectId: 'obj-456',
      quantity: 1,
      inventoryLocation: 'READY'
    });
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should throw error when character not found', async () => {
    const event = {
      arguments: {
        characterId: 'non-existent-char',
        objectId: 'obj-456',
        quantity: 1,
        location: 'STASH'
      }
    };

    mockDynamoSend.mockResolvedValueOnce({});

    await expect(handler(event)).rejects.toThrow('Character with ID non-existent-char not found');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB get errors', async () => {
    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456',
        quantity: 1,
        location: 'STASH'
      }
    };

    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('DynamoDB connection error');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB update errors', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      inventoryItems: []
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456',
        quantity: 1,
        location: 'STASH'
      }
    };

    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });

    const dynamoError = new Error('DynamoDB update error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('DynamoDB update error');
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle missing arguments', async () => {
    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456'
        // Missing quantity and location
      }
    };

    const existingCharacter = {
      characterId: 'char-123',
      inventoryItems: []
    };

    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: existingCharacter });

    const result = await handler(event);

    // Should handle undefined gracefully
    expect(result).toBeDefined();
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should use environment variable for table name', async () => {
    process.env.CHARACTERS_TABLE = 'custom-characters-table';

    const existingCharacter = {
      characterId: 'char-123',
      inventoryItems: []
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456',
        quantity: 1,
        location: 'STASH'
      }
    };

    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: existingCharacter });

    await handler(event);

    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle different inventory locations', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';

    const existingCharacter = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 1, inventoryLocation: 'STASH' },
        { objectId: 'obj-456', quantity: 2, inventoryLocation: 'EQUIPMENT' }
      ]
    };

    // Update EQUIPMENT location quantity
    const event = {
      arguments: {
        characterId,
        objectId,
        quantity: 5,
        location: 'EQUIPMENT'
      }
    };

    const updatedCharacter = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 1, inventoryLocation: 'STASH' },
        { objectId: 'obj-456', quantity: 5, inventoryLocation: 'EQUIPMENT' }
      ]
    };

    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    // Should only update EQUIPMENT location, not STASH
    expect(result.inventoryItems[0].quantity).toBe(1); // STASH unchanged
    expect(result.inventoryItems[1].quantity).toBe(5); // EQUIPMENT updated
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });
});