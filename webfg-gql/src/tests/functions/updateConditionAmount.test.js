const { handler } = require('../../../functions/updateConditionAmount');

describe('updateConditionAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTER_TABLE_NAME = 'test-character-table';
  });

  it('should update condition amount successfully', async () => {
    const characterId = 'char-123';
    const conditionId = 'condition-456';
    const amount = 5;

    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      characterConditions: [
        { conditionId: 'condition-456', amount: 2 },
        { conditionId: 'condition-789', amount: 3 }
      ]
    };

    const updatedCharacter = {
      characterId: 'char-123',
      name: 'Test Character',
      characterConditions: [
        { conditionId: 'condition-456', amount: 5 },
        { conditionId: 'condition-789', amount: 3 }
      ]
    };

    const event = {
      characterId,
      conditionId,
      amount
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
    expect(result.characterConditions[0].amount).toBe(5);

    // Verify DynamoDB was called twice (GET then UPDATE)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle string amount and convert to integer', async () => {
    const characterId = 'char-123';
    const conditionId = 'condition-456';
    const amount = '10'; // String amount

    const existingCharacter = {
      characterId: 'char-123',
      characterConditions: [
        { conditionId: 'condition-456', amount: 2 }
      ]
    };

    const updatedCharacter = {
      characterId: 'char-123',
      characterConditions: [
        { conditionId: 'condition-456', amount: 10 }
      ]
    };

    const event = {
      characterId,
      conditionId,
      amount
    };

    // Mock GET and UPDATE responses
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    expect(result.characterConditions[0].amount).toBe(10);
    expect(typeof result.characterConditions[0].amount).toBe('number');
  });

  it('should throw error when character not found', async () => {
    const event = {
      characterId: 'non-existent-char',
      conditionId: 'condition-456',
      amount: 5
    };

    // Mock GET response when character doesn't exist
    mockDynamoSend.mockResolvedValueOnce({});

    await expect(handler(event)).rejects.toThrow('Failed to update condition amount: Character not found: non-existent-char');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should throw error when condition not found on character', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      characterConditions: [
        { conditionId: 'other-condition', amount: 2 }
      ]
    };

    const event = {
      characterId: 'char-123',
      conditionId: 'non-existent-condition',
      amount: 5
    };

    // Mock GET response
    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCharacter
    });

    await expect(handler(event)).rejects.toThrow('Failed to update condition amount: Condition non-existent-condition not found for character char-123');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle character with no conditions', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      name: 'Test Character'
      // No characterConditions property
    };

    const event = {
      characterId: 'char-123',
      conditionId: 'condition-456',
      amount: 5
    };

    // Mock GET response
    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCharacter
    });

    await expect(handler(event)).rejects.toThrow('Failed to update condition amount: Condition condition-456 not found for character char-123');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle character with empty conditions array', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      characterConditions: []
    };

    const event = {
      characterId: 'char-123',
      conditionId: 'condition-456',
      amount: 5
    };

    // Mock GET response
    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCharacter
    });

    await expect(handler(event)).rejects.toThrow('Failed to update condition amount: Condition condition-456 not found for character char-123');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should throw error when characterId is missing', async () => {
    const event = {
      conditionId: 'condition-456',
      amount: 5
    };

    await expect(handler(event)).rejects.toThrow('characterId, conditionId, and amount are all required');
  });

  it('should throw error when conditionId is missing', async () => {
    const event = {
      characterId: 'char-123',
      amount: 5
    };

    await expect(handler(event)).rejects.toThrow('characterId, conditionId, and amount are all required');
  });

  it('should throw error when amount is missing', async () => {
    const event = {
      characterId: 'char-123',
      conditionId: 'condition-456'
    };

    await expect(handler(event)).rejects.toThrow('characterId, conditionId, and amount are all required');
  });

  it('should throw error when amount is less than 1', async () => {
    const event = {
      characterId: 'char-123',
      conditionId: 'condition-456',
      amount: 0
    };

    await expect(handler(event)).rejects.toThrow('Amount must be at least 1');
  });

  it('should throw error when amount is negative', async () => {
    const event = {
      characterId: 'char-123',
      conditionId: 'condition-456',
      amount: -5
    };

    await expect(handler(event)).rejects.toThrow('Amount must be at least 1');
  });

  it('should handle invalid amount strings by defaulting to 1', async () => {
    const characterId = 'char-123';
    const conditionId = 'condition-456';

    const existingCharacter = {
      characterId: 'char-123',
      characterConditions: [
        { conditionId: 'condition-456', amount: 2 }
      ]
    };

    const updatedCharacter = {
      characterId: 'char-123',
      characterConditions: [
        { conditionId: 'condition-456', amount: 1 }
      ]
    };

    const event = {
      characterId,
      conditionId,
      amount: 'invalid-string' // Will default to 1
    };

    // Mock GET and UPDATE responses
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    expect(result.characterConditions[0].amount).toBe(1);
  });

  it('should handle GET DynamoDB errors', async () => {
    const event = {
      characterId: 'char-123',
      conditionId: 'condition-456',
      amount: 5
    };

    // Mock DynamoDB error on GET
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('Failed to update condition amount: DynamoDB connection error');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle UPDATE DynamoDB errors', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      characterConditions: [
        { conditionId: 'condition-456', amount: 2 }
      ]
    };

    const event = {
      characterId: 'char-123',
      conditionId: 'condition-456',
      amount: 5
    };

    // Mock successful GET response
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });

    // Mock DynamoDB error on UPDATE
    const dynamoError = new Error('DynamoDB update error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('Failed to update condition amount: DynamoDB update error');

    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should preserve other conditions when updating one', async () => {
    const existingCharacter = {
      characterId: 'char-123',
      characterConditions: [
        { conditionId: 'condition-1', amount: 1 },
        { conditionId: 'condition-2', amount: 2 },
        { conditionId: 'condition-3', amount: 3 }
      ]
    };

    const updatedCharacter = {
      characterId: 'char-123',
      characterConditions: [
        { conditionId: 'condition-1', amount: 1 },
        { conditionId: 'condition-2', amount: 10 }, // Updated
        { conditionId: 'condition-3', amount: 3 }
      ]
    };

    const event = {
      characterId: 'char-123',
      conditionId: 'condition-2',
      amount: 10
    };

    // Mock GET and UPDATE responses
    mockDynamoSend.mockResolvedValueOnce({ Item: existingCharacter });
    mockDynamoSend.mockResolvedValueOnce({ Attributes: updatedCharacter });

    const result = await handler(event);

    expect(result.characterConditions).toHaveLength(3);
    expect(result.characterConditions[0].amount).toBe(1); // Unchanged
    expect(result.characterConditions[1].amount).toBe(10); // Updated
    expect(result.characterConditions[2].amount).toBe(3); // Unchanged
  });
});