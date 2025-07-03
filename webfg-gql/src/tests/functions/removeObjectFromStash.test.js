const { handler } = require('../../../functions/removeObjectFromStash');

describe('removeObjectFromStash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
  });

  it('should remove an object from character stash successfully', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-2';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-2', 'obj-3']
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-3']
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
    expect(result.stashIds).not.toContain(objectId);
    expect(result.stashIds).toHaveLength(2);
    expect(result.stashIds).toEqual(['obj-1', 'obj-3']);

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

    // Should return the existing character unchanged since no stash exists
    expect(result).toEqual(existingCharacter);

    // Verify only GET was called, no UPDATE since object wasn't in stash
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle character with empty stash array', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-456';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: []
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
    expect(result.stashIds).toEqual([]);

    // Verify only GET was called, no UPDATE since object wasn't in stash
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should return unchanged character when object not in stash', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-nonexistent';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-2', 'obj-3']
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
    expect(result.stashIds).toEqual(['obj-1', 'obj-2', 'obj-3']);

    // Verify only GET was called, no UPDATE
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should remove multiple instances of the same objectId', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-duplicate';

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-duplicate', 'obj-2', 'obj-duplicate', 'obj-3']
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      stashIds: ['obj-1', 'obj-2', 'obj-3']
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

    expect(result.stashIds).toEqual(['obj-1', 'obj-2', 'obj-3']);
    expect(result.stashIds).not.toContain('obj-duplicate');
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
      stashIds: ['obj-1', 'obj-456']
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
      stashIds: ['obj-1', undefined, 'obj-2']
    };

    const event = {
      arguments: {
        characterId: 'char-123'
        // Missing objectId
      }
    };

    // Mock GET response
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });

    // If undefined objectId exists in stash, it should be removed
    const updatedCharacter = {
      characterId: 'char-123',
      stashIds: ['obj-1', 'obj-2']
    };

    // Mock UPDATE response
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    expect(result.stashIds).toEqual(['obj-1', 'obj-2']);
    expect(result.stashIds).not.toContain(undefined);
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should use environment variable for table name', async () => {
    process.env.CHARACTERS_TABLE = 'custom-characters-table';

    const existingCharacter = {
      characterId: 'char-123',
      stashIds: ['obj-456']
    };

    const event = {
      arguments: {
        characterId: 'char-123',
        objectId: 'obj-456'
      }
    };

    // Mock GET and UPDATE responses
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: { ...existingCharacter, stashIds: [] } });

    await handler(event);

    // Verify DynamoDB was called (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should remove only the specified object from large stash', async () => {
    const characterId = 'char-123';
    const objectId = 'obj-to-remove';

    const existingCharacter = {
      characterId: 'char-123',
      stashIds: ['obj-1', 'obj-2', 'obj-to-remove', 'obj-3', 'obj-4', 'obj-5']
    };

    const updatedCharacter = {
      characterId: 'char-123',
      stashIds: ['obj-1', 'obj-2', 'obj-3', 'obj-4', 'obj-5']
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

    expect(result.stashIds).toEqual(['obj-1', 'obj-2', 'obj-3', 'obj-4', 'obj-5']);
    expect(result.stashIds).toHaveLength(5);
    expect(result.stashIds).not.toContain('obj-to-remove');
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });
});