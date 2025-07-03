const { handler } = require('../../../functions/deleteCondition');

describe('deleteCondition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONDITION_TABLE_NAME = 'test-conditions-table';
  });

  it('should delete a condition successfully and return the deleted item', async () => {
    const conditionId = 'condition-123';
    const existingCondition = {
      conditionId: 'condition-123',
      name: 'Test Condition',
      description: 'A test condition',
      conditionCategory: 'PHYSICAL',
      conditionType: 'BUFF'
    };

    const event = {
      conditionId: conditionId
    };

    // Mock successful GET response
    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCondition
    });

    // Mock successful DELETE response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify the result
    expect(result).toEqual(existingCondition);

    // Verify DynamoDB was called twice (GET then DELETE)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should throw error when condition does not exist', async () => {
    const conditionId = 'non-existent-condition';

    const event = {
      conditionId: conditionId
    };

    // Mock GET response when item doesn't exist
    mockDynamoSend.mockResolvedValueOnce({
      // No Item property means not found
    });

    await expect(handler(event)).rejects.toThrow('Failed to delete condition: Condition not found: non-existent-condition');

    // Verify only GET was called, not DELETE
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle GET DynamoDB errors', async () => {
    const conditionId = 'condition-123';

    const event = {
      conditionId: conditionId
    };

    // Mock DynamoDB error on GET
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('Failed to delete condition: DynamoDB connection error');

    // Verify only GET was attempted
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DELETE DynamoDB errors', async () => {
    const conditionId = 'condition-123';
    const existingCondition = {
      conditionId: 'condition-123',
      name: 'Test Condition'
    };

    const event = {
      conditionId: conditionId
    };

    // Mock successful GET response
    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCondition
    });

    // Mock DynamoDB error on DELETE
    const dynamoError = new Error('DynamoDB delete error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('Failed to delete condition: DynamoDB delete error');

    // Verify both GET and DELETE were attempted
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle missing conditionId', async () => {
    const event = {
      // Missing conditionId
    };

    // Mock GET response that will receive undefined conditionId
    mockDynamoSend.mockResolvedValueOnce({});

    await expect(handler(event)).rejects.toThrow('Failed to delete condition: Condition not found: undefined');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle null conditionId', async () => {
    const event = {
      conditionId: null
    };

    // Mock GET response for null conditionId
    mockDynamoSend.mockResolvedValueOnce({});

    await expect(handler(event)).rejects.toThrow('Failed to delete condition: Condition not found: null');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle empty string conditionId', async () => {
    const event = {
      conditionId: ''
    };

    // Mock GET response for empty conditionId
    mockDynamoSend.mockResolvedValueOnce({});

    await expect(handler(event)).rejects.toThrow('Failed to delete condition: Condition not found: ');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should use environment variable for table name', async () => {
    process.env.CONDITION_TABLE_NAME = 'custom-conditions-table';

    const conditionId = 'condition-123';
    const existingCondition = {
      conditionId: 'condition-123',
      name: 'Test Condition'
    };

    const event = {
      conditionId: conditionId
    };

    // Mock successful GET and DELETE responses
    mockDynamoSend.mockResolvedValueOnce({
      Item: existingCondition
    });
    mockDynamoSend.mockResolvedValueOnce({});

    await handler(event);

    // Verify DynamoDB was called twice (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('should handle various conditionId formats', async () => {
    const testCases = [
      'condition-123',
      'CONDITION_456',
      '789',
      'very-long-condition-id-with-many-hyphens-and-numbers-123456789'
    ];

    for (const conditionId of testCases) {
      jest.clearAllMocks();
      
      const existingCondition = {
        conditionId: conditionId,
        name: `Test Condition ${conditionId}`
      };

      const event = {
        conditionId: conditionId
      };

      // Mock successful GET and DELETE responses
      mockDynamoSend.mockResolvedValueOnce({
        Item: existingCondition
      });
      mockDynamoSend.mockResolvedValueOnce({});

      const result = await handler(event);

      expect(result).toEqual(existingCondition);
      expect(mockDynamoSend).toHaveBeenCalledTimes(2);
    }
  });

  it('should return complete condition object with all fields', async () => {
    const conditionId = 'condition-123';
    const completeCondition = {
      conditionId: 'condition-123',
      name: 'Complete Condition',
      nameLowerCase: 'complete condition',
      description: 'A complete test condition',
      descriptionLowerCase: 'a complete test condition',
      conditionCategory: 'PHYSICAL',
      conditionType: 'BUFF',
      conditionTarget: 'strength',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    };

    const event = {
      conditionId: conditionId
    };

    // Mock successful GET and DELETE responses
    mockDynamoSend.mockResolvedValueOnce({
      Item: completeCondition
    });
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify the complete condition is returned
    expect(result).toEqual(completeCondition);
    expect(result.conditionId).toBe(conditionId);
    expect(result.name).toBe('Complete Condition');
    expect(result.nameLowerCase).toBe('complete condition');
    expect(result.description).toBe('A complete test condition');
    expect(result.descriptionLowerCase).toBe('a complete test condition');
    expect(result.conditionCategory).toBe('PHYSICAL');
    expect(result.conditionType).toBe('BUFF');
    expect(result.conditionTarget).toBe('strength');
  });
});