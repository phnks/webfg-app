const { handler } = require('../../../functions/resolveCharacterInventoryItems');

describe('resolveCharacterInventoryItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE = 'test-objects-table';
  });

  it('should resolve inventory items with objects data', async () => {
    const character = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-1', quantity: 2, inventoryLocation: 'STASH' },
        { objectId: 'obj-2', quantity: 1, inventoryLocation: 'EQUIPMENT' }
      ]
    };

    const event = {
      source: character
    };

    const mockObjects = [
      { objectId: 'obj-1', name: 'Sword', objectCategory: 'WEAPON' },
      { objectId: 'obj-2', name: 'Shield', objectCategory: 'ARMOR' }
    ];

    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-objects-table': mockObjects
      }
    });

    const result = await handler(event);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      objectId: 'obj-1',
      name: 'Sword',
      objectCategory: 'WEAPON',
      quantity: 2,
      inventoryLocation: 'STASH'
    });
    expect(result[1]).toEqual({
      objectId: 'obj-2',
      name: 'Shield',
      objectCategory: 'ARMOR',
      quantity: 1,
      inventoryLocation: 'EQUIPMENT'
    });
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should filter by location when specified', async () => {
    const character = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-1', quantity: 2, inventoryLocation: 'STASH' },
        { objectId: 'obj-2', quantity: 1, inventoryLocation: 'EQUIPMENT' },
        { objectId: 'obj-3', quantity: 3, inventoryLocation: 'STASH' }
      ]
    };

    const event = {
      source: character,
      arguments: {
        location: 'STASH'
      }
    };

    const mockObjects = [
      { objectId: 'obj-1', name: 'Sword', objectCategory: 'WEAPON' },
      { objectId: 'obj-3', name: 'Potion', objectCategory: 'CONSUMABLE' }
    ];

    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-objects-table': mockObjects
      }
    });

    const result = await handler(event);

    expect(result).toHaveLength(2);
    expect(result[0].inventoryLocation).toBe('STASH');
    expect(result[1].inventoryLocation).toBe('STASH');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle character with no inventory items', async () => {
    const character = {
      characterId: 'char-123'
      // No inventoryItems
    };

    const event = {
      source: character
    };

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).not.toHaveBeenCalled();
  });

  it('should handle character with empty inventory items', async () => {
    const character = {
      characterId: 'char-123',
      inventoryItems: []
    };

    const event = {
      source: character
    };

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).not.toHaveBeenCalled();
  });

  it('should handle missing objects in DynamoDB response', async () => {
    const character = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-1', quantity: 2, inventoryLocation: 'STASH' },
        { objectId: 'obj-missing', quantity: 1, inventoryLocation: 'EQUIPMENT' }
      ]
    };

    const event = {
      source: character
    };

    const mockObjects = [
      { objectId: 'obj-1', name: 'Sword', objectCategory: 'WEAPON' }
      // obj-missing is not returned
    ];

    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-objects-table': mockObjects
      }
    });

    const result = await handler(event);

    expect(result).toHaveLength(1);
    expect(result[0].objectId).toBe('obj-1');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB errors', async () => {
    const character = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-1', quantity: 2, inventoryLocation: 'STASH' }
      ]
    };

    const event = {
      source: character
    };

    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('DynamoDB connection error');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle duplicate object IDs correctly', async () => {
    const character = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-1', quantity: 2, inventoryLocation: 'STASH' },
        { objectId: 'obj-1', quantity: 1, inventoryLocation: 'EQUIPMENT' }
      ]
    };

    const event = {
      source: character
    };

    const mockObjects = [
      { objectId: 'obj-1', name: 'Sword', objectCategory: 'WEAPON' }
    ];

    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-objects-table': mockObjects
      }
    });

    const result = await handler(event);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      objectId: 'obj-1',
      name: 'Sword',
      objectCategory: 'WEAPON',
      quantity: 2,
      inventoryLocation: 'STASH'
    });
    expect(result[1]).toEqual({
      objectId: 'obj-1',
      name: 'Sword',
      objectCategory: 'WEAPON',
      quantity: 1,
      inventoryLocation: 'EQUIPMENT'
    });
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should use environment variable for table name', async () => {
    process.env.OBJECTS_TABLE = 'custom-objects-table';

    const character = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-1', quantity: 1, inventoryLocation: 'STASH' }
      ]
    };

    const event = {
      source: character
    };

    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'custom-objects-table': []
      }
    });

    await handler(event);

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle all inventory locations', async () => {
    const character = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-1', quantity: 1, inventoryLocation: 'STASH' },
        { objectId: 'obj-2', quantity: 2, inventoryLocation: 'EQUIPMENT' },
        { objectId: 'obj-3', quantity: 3, inventoryLocation: 'READY' }
      ]
    };

    const event = {
      source: character
    };

    const mockObjects = [
      { objectId: 'obj-1', name: 'Item 1', objectCategory: 'WEAPON' },
      { objectId: 'obj-2', name: 'Item 2', objectCategory: 'ARMOR' },
      { objectId: 'obj-3', name: 'Item 3', objectCategory: 'CONSUMABLE' }
    ];

    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-objects-table': mockObjects
      }
    });

    const result = await handler(event);

    expect(result).toHaveLength(3);
    const locations = result.map(item => item.inventoryLocation);
    expect(locations).toContain('STASH');
    expect(locations).toContain('EQUIPMENT');
    expect(locations).toContain('READY');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing Responses in DynamoDB result', async () => {
    const character = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-1', quantity: 1, inventoryLocation: 'STASH' }
      ]
    };

    const event = {
      source: character
    };

    mockDynamoSend.mockResolvedValueOnce({
      // Missing Responses property
    });

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing table in Responses', async () => {
    const character = {
      characterId: 'char-123',
      inventoryItems: [
        { objectId: 'obj-1', quantity: 1, inventoryLocation: 'STASH' }
      ]
    };

    const event = {
      source: character
    };

    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        // Missing test-objects-table
      }
    });

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });
});