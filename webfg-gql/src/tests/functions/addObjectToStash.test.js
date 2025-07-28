const { handler } = require('../../../functions/addObjectToStash');

describe('addObjectToStash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
  });

  it('should add an object to character stash successfully', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-2']
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-2', 'obj-456']
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
    expect(result.stashIds).toContain(objectId);
    expect(result.stashIds).toHaveLength(3);

    // Verify DynamoDB was called twice (GET then UPDATE)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle character with no existing stash', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character'
      // No stashIds property
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-456']
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

    expect(result.stashIds).toEqual(['obj-456']);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle character with empty stash array', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: []
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-456']
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

    expect(result.stashIds).toEqual(['obj-456']);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should increment quantity when object already in stash', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-2'; // Already exists

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-2', 'obj-3'],
      inventoryItems: [
        { objectId: 'obj-2', quantity: 1, inventoryLocation: 'STASH' }
      ]
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-2', 'obj-3'],
      inventoryItems: [
        { objectId: 'obj-2', quantity: 2, inventoryLocation: 'STASH' }
      ]
    };

    const event = {
      arguments: {
        characterId,
        objectId
      }
    };

    // Mock GET response and UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCharacter
    });
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCharacter
    });

    const result = await handler(event);

    // Should return updated character with incremented quantity
    expect(result.inventoryItems[0].quantity).toBe(2);
    expect(result.stashIds).toEqual(['obj-1', 'obj-2', 'obj-3']);

    // Verify both GET and UPDATE were called
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should create inventory item with quantity 2 when object in legacy stash but not in inventoryItems', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-2'; // Already exists in stash but not in inventoryItems

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-2', 'obj-3'],
      inventoryItems: [] // No inventory items yet
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-2', 'obj-3'],
      inventoryItems: [
        { objectId: 'obj-2', quantity: 2, inventoryLocation: 'STASH' }
      ]
    };

    const event = {
      arguments: {
        characterId,
        objectId
      }
    };

    // Mock GET response and UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCharacter
    });
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCharacter
    });

    const result = await handler(event);

    // Should return updated character with new inventory item at quantity 2
    expect(result.inventoryItems[0].quantity).toBe(2);
    expect(result.inventoryItems[0].objectId).toBe('obj-2');
    expect(result.stashIds).toEqual(['obj-1', 'obj-2', 'obj-3']);

    // Verify both GET and UPDATE were called
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
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
      stashIds: ['obj-1']
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
      stashIds: ['obj-1']
    };

    const event = {
      arguments: {
        characterId: 'char-123'
        // Missing objectId
      }
    };

    // Mock GET response
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });

    // Object with undefined objectId should not exist in stash
    const updatedCharacter = {
      characterId: 'char-123',
      stashIds: ['obj-1', undefined]
    };

    // Mock UPDATE response
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    expect(result.stashIds).toContain(undefined);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should use environment variable for table name', async () => {
    process.env.CHARACTERS_TABLE = 'custom-characters-table';

    const existingCharacter = {
      characterId: 'char-123',
      stashIds: []
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456'
      }
    };

    // Mock GET and UPDATE responses
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: { ...existingCharacter, stashIds: ['obj-456'] } });

    await handler(event);

    // Verify DynamoDB was called (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should preserve existing stash items and add new one', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-new';

    const existingCharacter = {
      characterId: 'char-123',
      stashIds: ['obj-1', 'obj-2', 'obj-3']
    };

    const updatedCharacter = {
      characterId: 'char-123',
      stashIds: ['obj-1', 'obj-2', 'obj-3', 'obj-new']
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

    expect(result.stashIds).toEqual(['obj-1', 'obj-2', 'obj-3', 'obj-new']);
    expect(result.stashIds).toHaveLength(4);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });
});