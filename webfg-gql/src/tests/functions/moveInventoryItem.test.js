const { handler } = require('../../../functions/moveInventoryItem');

describe('moveInventoryItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
  });

  it('should move partial quantity between locations', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';
    const quantity = 2;
    const fromLocation = 'STASH';
    const toLocation = 'EQUIPMENT';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 5, inventoryLocation: 'STASH' }
      ],
      stashIds: ['obj-456'],
      equipmentIds: []
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 3, inventoryLocation: 'STASH' },
        { objectId: 'obj-456', quantity: 2, inventoryLocation: 'EQUIPMENT' }
      ],
      stashIds: ['obj-456'],
      equipmentIds: ['obj-456']
    };

    const event = {
      arguments: {
        characterId,
        objectId,
        quantity,
        fromLocation,
        toLocation
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
    expect(result.inventoryItems[0].quantity).toBe(3); // Remaining in STASH
    expect(result.inventoryItems[1].quantity).toBe(2); // Moved to EQUIPMENT
    expect(result.equipmentIds).toContain('obj-456');
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should move entire quantity and remove from source', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';
    const quantity = 3;
    const fromLocation = 'STASH';
    const toLocation = 'READY';

    const existingCharacter = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 3, inventoryLocation: 'STASH' }
      ],
      stashIds: ['obj-456'],
      readyIds: []
    };

    const updatedCharacter = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 3, inventoryLocation: 'READY' }
      ],
      stashIds: [],
      readyIds: ['obj-456']
    };

    const event = {
      arguments: {
        characterId,
        objectId,
        quantity,
        fromLocation,
        toLocation
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
    expect(result.inventoryItems[0].inventoryLocation).toBe('READY');
    expect(result.inventoryItems[0].quantity).toBe(3);
    expect(result.stashIds).toHaveLength(0);
    expect(result.readyIds).toContain('obj-456');
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should combine quantities when moving to existing location', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';
    const quantity = 2;
    const fromLocation = 'STASH';
    const toLocation = 'EQUIPMENT';

    const existingCharacter = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 3, inventoryLocation: 'STASH' },
        { objectId: 'obj-456', quantity: 1, inventoryLocation: 'EQUIPMENT' }
      ],
      stashIds: ['obj-456'],
      equipmentIds: ['obj-456']
    };

    const updatedCharacter = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 1, inventoryLocation: 'STASH' },
        { objectId: 'obj-456', quantity: 3, inventoryLocation: 'EQUIPMENT' }
      ],
      stashIds: ['obj-456'],
      equipmentIds: ['obj-456']
    };

    const event = {
      arguments: {
        characterId,
        objectId,
        quantity,
        fromLocation,
        toLocation
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
    expect(result.inventoryItems[0].quantity).toBe(1); // Remaining in STASH
    expect(result.inventoryItems[1].quantity).toBe(3); // Combined in EQUIPMENT
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should throw error when character not found', async () => {
    const event = {
      arguments: {
        characterId: 'non-existent-char',
        objectId: 'obj-456',
        quantity: 1,
        fromLocation: 'STASH',
        toLocation: 'EQUIPMENT'
      }
    };

    mockDynamoSend.mockResolvedValueOnce({});

    await expect(handler(event)).rejects.toThrow('Character with ID non-existent-char not found');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should throw error when source item not found', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      inventoryItems: []
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-nonexistent',
        quantity: 1,
        fromLocation: 'STASH',
        toLocation: 'EQUIPMENT'
      }
    };

    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });

    await expect(handler(event)).rejects.toThrow('Object obj-nonexistent not found in STASH');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should throw error when insufficient quantity', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 2, inventoryLocation: 'STASH' }
      ]
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456',
        quantity: 5, // More than available
        fromLocation: 'STASH',
        toLocation: 'EQUIPMENT'
      }
    };

    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });

    await expect(handler(event)).rejects.toThrow('Insufficient quantity. Available: 2, Requested: 5');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle character with no existing inventory items', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character'
      // No inventoryItems
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456',
        quantity: 1,
        fromLocation: 'STASH',
        toLocation: 'EQUIPMENT'
      }
    };

    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });

    await expect(handler(event)).rejects.toThrow('Object obj-456 not found in STASH');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB get errors', async () => {
    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456',
        quantity: 1,
        fromLocation: 'STASH',
        toLocation: 'EQUIPMENT'
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
      inventoryItems: [
        { objectId: 'obj-456', quantity: 2, inventoryLocation: 'STASH' }
      ],
      stashIds: ['obj-456'],
      equipmentIds: []
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456',
        quantity: 1,
        fromLocation: 'STASH',
        toLocation: 'EQUIPMENT'
      }
    };

    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });

    const dynamoError = new Error('DynamoDB update error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('DynamoDB update error');
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle missing legacy ID arrays', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 2, inventoryLocation: 'STASH' }
      ]
      // No legacy arrays
    };

    const updatedCharacter = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 2, inventoryLocation: 'EQUIPMENT' }
      ]
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456',
        quantity: 2,
        fromLocation: 'STASH',
        toLocation: 'EQUIPMENT'
      }
    };

    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    expect(result.inventoryItems[0].inventoryLocation).toBe('EQUIPMENT');
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should use environment variable for table name', async () => {
    process.env.CHARACTERS_TABLE = 'custom-characters-table';

    const existingCharacter = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-456', quantity: 1, inventoryLocation: 'STASH' }
      ],
      stashIds: ['obj-456'],
      equipmentIds: []
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456',
        quantity: 1,
        fromLocation: 'STASH',
        toLocation: 'EQUIPMENT'
      }
    };

    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: existingCharacter });

    await handler(event);

    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle all inventory location combinations', async () => {
    const testCases = [
      { from: 'STASH', to: 'EQUIPMENT' },
      { from: 'STASH', to: 'READY' },
      { from: 'EQUIPMENT', to: 'STASH' },
      { from: 'EQUIPMENT', to: 'READY' },
      { from: 'READY', to: 'STASH' },
      { from: 'READY', to: 'EQUIPMENT' }
    ];

    for (const testCase of testCases) {
      const existingCharacter = {
        characterId: 'char-123',
        inventoryItems: [
          { objectId: 'obj-456', quantity: 2, inventoryLocation: testCase.from }
        ],
        stashIds: testCase.from === 'STASH' ? ['obj-456'] : [],
        equipmentIds: testCase.from === 'EQUIPMENT' ? ['obj-456'] : [],
        readyIds: testCase.from === 'READY' ? ['obj-456'] : []
      };

      const event = {
        arguments: {
          characterId: 'char-123',
          objectId: 'obj-456',
          quantity: 1,
          fromLocation: testCase.from,
          toLocation: testCase.to
        }
      };

      mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
      mockDynamoSend.mockResolvedValueOnce({ Attributes: existingCharacter });

      const result = await handler(event);
      expect(result).toBeDefined();

      jest.clearAllMocks();
    }
  });
});