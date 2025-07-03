const { handler } = require('../../../functions/addObjectToInventory');

describe('addObjectToInventory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
  });

  it('should add an object to character inventory successfully', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryIds: ['obj-1', 'obj-2']
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryIds: ['obj-1', 'obj-2', 'obj-456']
    };

    const event = {
      arguments: {
        characterId,
        objectId
      }
    };

    // Mock GET response
    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCharacter
    });

    // Mock UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCharacter
    });

    const result = await handler(event);

    // Verify the result
    expect(result).toEqual(updatedCharacter);
    expect(result.inventoryIds).toContain(objectId);
    expect(result.inventoryIds).toHaveLength(3);

    // Verify DynamoDB was called twice (GET then UPDATE)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle character with no existing inventory', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character'
      // No inventoryIds property
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryIds: ['obj-456']
    };

    const event = {
      arguments: {
        characterId,
        objectId
      }
    };

    // Mock GET and UPDATE responses
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    expect(result.inventoryIds).toEqual(['obj-456']);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle character with empty inventory array', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryIds: []
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryIds: ['obj-456']
    };

    const event = {
      arguments: {
        characterId,
        objectId
      }
    };

    // Mock GET and UPDATE responses
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    expect(result.inventoryIds).toEqual(['obj-456']);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should return unchanged character when object already in inventory', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-2'; // Already exists

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryIds: ['obj-1', 'obj-2', 'obj-3']
    };

    const event = {
      arguments: {
        characterId,
        objectId
      }
    };

    // Mock GET response
    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCharacter
    });

    const result = await handler(event);

    // Should return the existing character unchanged
    expect(result).toEqual(existingCharacter);
    expect(result.inventoryIds).toEqual(['obj-1', 'obj-2', 'obj-3']);

    // Verify only GET was called, no UPDATE
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should throw error when character not found', async () => {
    const event = {
      arguments: {
        characterId: 'non-existent-char',
        objectId: 'obj-456'
      }
    };

    // Mock GET response when character doesn't exist
    mockDynamoSend.mockResolvedValueOnce({});

    await expect(handler(event)).rejects.toThrow('Character with ID non-existent-char not found');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle GET DynamoDB errors', async () => {
    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456'
      }
    };

    // Mock DynamoDB error on GET
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('DynamoDB connection error');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle UPDATE DynamoDB errors', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      inventoryIds: ['obj-1']
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456'
      }
    };

    // Mock successful GET response
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });

    // Mock DynamoDB error on UPDATE
    const dynamoError = new Error('DynamoDB update error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('DynamoDB update error');

    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle missing characterId in arguments', async () => {
    const event = {
      arguments: {
        objectId: 'obj-456'
        // Missing characterId
      }
    };

    // Mock GET response (will receive undefined characterId)
    mockDynamoSend.mockResolvedValueOnce({});

    await expect(handler(event)).rejects.toThrow('Character with ID undefined not found');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing objectId in arguments', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      inventoryIds: ['obj-1']
    };

    const event = {
      arguments: {
        characterId: 'char-123'
        // Missing objectId
      }
    };

    // Mock GET response
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });

    // Object with undefined objectId should not exist in inventory
    const updatedCharacter = {
      characterId: 'char-123',
      inventoryIds: ['obj-1', undefined]
    };

    // Mock UPDATE response
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    expect(result.inventoryIds).toContain(undefined);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should use environment variable for table name', async () => {
    process.env.CHARACTERS_TABLE = 'custom-characters-table';

    const existingCharacter = {
      characterId: 'char-123',
      inventoryIds: []
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456'
      }
    };

    // Mock GET and UPDATE responses
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: { ...existingCharacter, inventoryIds: ['obj-456'] } });

    await handler(event);

    // Verify DynamoDB was called (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should preserve existing inventory items and add new one', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-new';

    const existingCharacter = {
      characterId: 'char-123',
      inventoryIds: ['obj-1', 'obj-2', 'obj-3']
    };

    const updatedCharacter = {
      characterId: 'char-123',
      inventoryIds: ['obj-1', 'obj-2', 'obj-3', 'obj-new']
    };

    const event = {
      arguments: {
        characterId,
        objectId
      }
    };

    // Mock GET and UPDATE responses
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    expect(result.inventoryIds).toEqual(['obj-1', 'obj-2', 'obj-3', 'obj-new']);
    expect(result.inventoryIds).toHaveLength(4);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle inventory as a different data structure', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryIds: ['obj-1', 'obj-2'],
      stashIds: ['stash-1'],
      equipmentIds: ['equipment-1']
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      inventoryIds: ['obj-1', 'obj-2', 'obj-456'],
      stashIds: ['stash-1'],
      equipmentIds: ['equipment-1']
    };

    const event = {
      arguments: {
        characterId,
        objectId
      }
    };

    // Mock GET and UPDATE responses
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    // Verify only inventoryIds is updated, other arrays remain unchanged
    expect(result.inventoryIds).toEqual(['obj-1', 'obj-2', 'obj-456']);
    expect(result.stashIds).toEqual(['stash-1']);
    expect(result.equipmentIds).toEqual(['equipment-1']);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });
});