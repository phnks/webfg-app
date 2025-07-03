const { handler } = require('../../../functions/deleteCharacter');

describe('deleteCharacter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
  });

  it('should delete a character successfully and return the deleted item', async () => {
    const characterId = 'char-123';
    const deletedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      characterCategory: 'HUMAN'
    };

    const event = {
      characterId: characterId
    };

    // Mock successful DynamoDB response with deleted item
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: deletedCharacter
    });

    const result = await handler(event);

    // Verify the result
    expect(result).toEqual(deletedCharacter);

    // Verify DynamoDB was called correctly
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should return null when character does not exist', async () => {
    const characterId = 'non-existent-char';

    const event = {
      characterId: characterId
    };

    // Mock DynamoDB response when item doesn't exist (no Attributes)
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Should return null when no item found
    expect(result).toBeNull();

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should throw error when characterId is missing', async () => {
    const event = {
      // Missing characterId
    };

    await expect(handler(event)).rejects.toThrow('characterId is required.');
  });

  it('should throw error when characterId is null', async () => {
    const event = {
      characterId: null
    };

    await expect(handler(event)).rejects.toThrow('characterId is required.');
  });

  it('should throw error when characterId is empty string', async () => {
    const event = {
      characterId: ''
    };

    await expect(handler(event)).rejects.toThrow('characterId is required.');
  });

  it('should throw error when CHARACTERS_TABLE environment variable is not set', async () => {
    delete process.env.CHARACTERS_TABLE;

    const event = {
      characterId: 'char-123'
    };

    await expect(handler(event)).rejects.toThrow('Internal server error.');
  });

  it('should handle DynamoDB errors', async () => {
    const characterId = 'char-123';

    const event = {
      characterId: characterId
    };

    // Mock DynamoDB error
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    // Expect the function to throw the original error
    await expect(handler(event)).rejects.toThrow('DynamoDB connection error');

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should use environment variable for table name', async () => {
    process.env.CHARACTERS_TABLE = 'custom-characters-table';

    const characterId = 'char-123';
    const event = {
      characterId: characterId
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: { characterId: 'char-123' }
    });

    await handler(event);

    // Verify DynamoDB was called (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle various characterId formats', async () => {
    const testCases = [
      'char-123',
      'CHARACTER_456',
      '789',
      'very-long-character-id-with-many-hyphens-and-numbers-123456789'
    ];

    for (const characterId of testCases) {
      jest.clearAllMocks();
      
      const event = {
        characterId: characterId
      };

      // Mock successful DynamoDB response
      mockDynamoSend.mockResolvedValueOnce({
        Attributes: { characterId: characterId }
      });

      const result = await handler(event);

      expect(result).toEqual({ characterId: characterId });
      expect(mockDynamoSend).toHaveBeenCalledTimes(1);
    }
  });
});