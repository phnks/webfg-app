const { handler } = require('../../../functions/getConditions');

describe('getConditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONDITION_TABLE_NAME = 'test-conditions-table';
  });

  it('should get multiple conditions successfully', async () => {
    const conditionIds = ['condition-1', 'condition-2', 'condition-3'];
    const mockConditions = [
      {
        conditionId: 'condition-1',
        name: 'Buff Condition',
        conditionType: 'BUFF'
      },
      {
        conditionId: 'condition-2',
        name: 'Debuff Condition',
        conditionType: 'DEBUFF'
      },
      {
        conditionId: 'condition-3',
        name: 'Neutral Condition',
        conditionType: 'NEUTRAL'
      }
    ];

    const event = {
      conditionIds
    };

    // Mock successful DynamoDB BATCH GET response
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-conditions-table': mockConditions
      }
    });

    const result = await handler(event);

    // Verify the result
    expect(result).toEqual(mockConditions);
    expect(result).toHaveLength(3);

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should return conditions in the same order as requested IDs', async () => {
    const conditionIds = ['condition-3', 'condition-1', 'condition-2'];
    const mockConditions = [
      {
        conditionId: 'condition-1',
        name: 'Condition 1'
      },
      {
        conditionId: 'condition-2',
        name: 'Condition 2'
      },
      {
        conditionId: 'condition-3',
        name: 'Condition 3'
      }
    ];

    const event = {
      conditionIds
    };

    // Mock DynamoDB response (returns in different order than requested)
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-conditions-table': mockConditions
      }
    });

    const result = await handler(event);

    // Verify conditions are returned in requested order
    expect(result[0].conditionId).toBe('condition-3');
    expect(result[1].conditionId).toBe('condition-1');
    expect(result[2].conditionId).toBe('condition-2');
    expect(result).toHaveLength(3);
  });

  it('should handle partial results when some conditions not found', async () => {
    const conditionIds = ['condition-1', 'condition-2', 'condition-missing'];
    const mockConditions = [
      {
        conditionId: 'condition-1',
        name: 'Condition 1'
      },
      {
        conditionId: 'condition-2',
        name: 'Condition 2'
      }
      // condition-missing is not in the response
    ];

    const event = {
      conditionIds
    };

    // Mock DynamoDB response with only 2 of 3 requested conditions
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-conditions-table': mockConditions
      }
    });

    const result = await handler(event);

    // Should only return found conditions
    expect(result).toHaveLength(2);
    expect(result[0].conditionId).toBe('condition-1');
    expect(result[1].conditionId).toBe('condition-2');
  });

  it('should return empty array when no conditionIds provided', async () => {
    const event = {
      conditionIds: []
    };

    const result = await handler(event);

    expect(result).toEqual([]);
    // DynamoDB should not be called
    expect(mockDynamoSend).not.toHaveBeenCalled();
  });

  it('should return empty array when conditionIds is null', async () => {
    const event = {
      conditionIds: null
    };

    const result = await handler(event);

    expect(result).toEqual([]);
    // DynamoDB should not be called
    expect(mockDynamoSend).not.toHaveBeenCalled();
  });

  it('should return empty array when conditionIds is undefined', async () => {
    const event = {
      // Missing conditionIds
    };

    const result = await handler(event);

    expect(result).toEqual([]);
    // DynamoDB should not be called
    expect(mockDynamoSend).not.toHaveBeenCalled();
  });

  it('should handle empty response from DynamoDB', async () => {
    const conditionIds = ['condition-1', 'condition-2'];

    const event = {
      conditionIds
    };

    // Mock DynamoDB response with no items
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-conditions-table': []
      }
    });

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing Responses property', async () => {
    const conditionIds = ['condition-1'];

    const event = {
      conditionIds
    };

    // Mock DynamoDB response with no Responses property
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing table in Responses', async () => {
    const conditionIds = ['condition-1'];

    const event = {
      conditionIds
    };

    // Mock DynamoDB response with Responses but no table
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {}
    });

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB errors', async () => {
    const conditionIds = ['condition-1', 'condition-2'];

    const event = {
      conditionIds
    };

    // Mock DynamoDB error
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('Failed to get conditions: DynamoDB connection error');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle single condition request', async () => {
    const conditionIds = ['condition-single'];
    const mockCondition = {
      conditionId: 'condition-single',
      name: 'Single Condition',
      conditionType: 'BUFF'
    };

    const event = {
      conditionIds
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-conditions-table': [mockCondition]
      }
    });

    const result = await handler(event);

    expect(result).toEqual([mockCondition]);
    expect(result).toHaveLength(1);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should use environment variable for table name', async () => {
    process.env.CONDITION_TABLE_NAME = 'custom-conditions-table';

    const conditionIds = ['condition-1'];
    const mockCondition = {
      conditionId: 'condition-1',
      name: 'Test Condition'
    };

    const event = {
      conditionIds
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'custom-conditions-table': [mockCondition]
      }
    });

    const result = await handler(event);

    expect(result).toEqual([mockCondition]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle duplicate conditionIds in request', async () => {
    const conditionIds = ['condition-1', 'condition-2', 'condition-1']; // condition-1 appears twice
    const mockConditions = [
      {
        conditionId: 'condition-1',
        name: 'Condition 1'
      },
      {
        conditionId: 'condition-2',
        name: 'Condition 2'
      }
    ];

    const event = {
      conditionIds
    };

    // Mock DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-conditions-table': mockConditions
      }
    });

    const result = await handler(event);

    // Should return conditions preserving the order with duplicates
    expect(result).toHaveLength(3);
    expect(result[0].conditionId).toBe('condition-1');
    expect(result[1].conditionId).toBe('condition-2');
    expect(result[2].conditionId).toBe('condition-1');
  });

  it('should handle large batch of conditionIds', async () => {
    // Create 25 condition IDs (DynamoDB BatchGet has a limit of 100)
    const conditionIds = Array.from({ length: 25 }, (_, i) => `condition-${i}`);
    const mockConditions = conditionIds.map(id => ({
      conditionId: id,
      name: `Condition ${id}`
    }));

    const event = {
      conditionIds
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-conditions-table': mockConditions
      }
    });

    const result = await handler(event);

    expect(result).toHaveLength(25);
    expect(result[0].conditionId).toBe('condition-0');
    expect(result[24].conditionId).toBe('condition-24');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });
});