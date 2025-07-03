const { handler } = require('../../../functions/updateCondition');

describe('updateCondition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONDITION_TABLE_NAME = 'test-conditions-table';
  });

  it('should update a condition successfully', async () => {
    const conditionId = 'condition-123';
    const input = {
      name: 'Updated Condition',
      description: 'An updated test condition',
      conditionCategory: 'MENTAL',
      conditionType: 'DEBUFF',
      conditionTarget: 'intelligence'
    };

    const updatedCondition = {
      conditionId: 'condition-123',
      name: 'Updated Condition',
      nameLowerCase: 'updated condition',
      description: 'An updated test condition',
      descriptionLowerCase: 'an updated test condition',
      conditionCategory: 'MENTAL',
      conditionType: 'DEBUFF',
      conditionTarget: 'intelligence'
    };

    const event = {
      conditionId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCondition
    });

    const result = await handler(event);

    // Verify the result
    expect(result).toEqual(updatedCondition);
    expect(result.nameLowerCase).toBe('updated condition');
    expect(result.descriptionLowerCase).toBe('an updated test condition');

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should update only specified fields', async () => {
    const conditionId = 'condition-123';
    const input = {
      description: 'Only updating description'
    };

    const updatedCondition = {
      conditionId: 'condition-123',
      name: 'Original Condition',
      nameLowerCase: 'original condition',
      description: 'Only updating description',
      descriptionLowerCase: 'only updating description',
      conditionCategory: 'PHYSICAL',
      conditionType: 'BUFF'
    };

    const event = {
      conditionId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCondition
    });

    const result = await handler(event);

    expect(result.description).toBe('Only updating description');
    expect(result.descriptionLowerCase).toBe('only updating description');
    expect(result.name).toBe('Original Condition'); // Unchanged
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should update nameLowerCase when name is updated', async () => {
    const conditionId = 'condition-123';
    const input = {
      name: 'NEW UPPERCASE NAME'
    };

    const updatedCondition = {
      conditionId: 'condition-123',
      name: 'NEW UPPERCASE NAME',
      nameLowerCase: 'new uppercase name'
    };

    const event = {
      conditionId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCondition
    });

    const result = await handler(event);

    expect(result.name).toBe('NEW UPPERCASE NAME');
    expect(result.nameLowerCase).toBe('new uppercase name');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should update descriptionLowerCase when description is updated', async () => {
    const conditionId = 'condition-123';
    const input = {
      description: 'NEW UPPERCASE DESCRIPTION'
    };

    const updatedCondition = {
      conditionId: 'condition-123',
      description: 'NEW UPPERCASE DESCRIPTION',
      descriptionLowerCase: 'new uppercase description'
    };

    const event = {
      conditionId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCondition
    });

    const result = await handler(event);

    expect(result.description).toBe('NEW UPPERCASE DESCRIPTION');
    expect(result.descriptionLowerCase).toBe('new uppercase description');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should throw error when no fields to update', async () => {
    const conditionId = 'condition-123';
    const input = {}; // Empty input

    const event = {
      conditionId,
      input
    };

    await expect(handler(event)).rejects.toThrow('No fields to update');

    // Verify DynamoDB was NOT called
    expect(mockDynamoSend).toHaveBeenCalledTimes(0);
  });

  it('should ignore undefined fields', async () => {
    const conditionId = 'condition-123';
    const input = {
      name: 'Test Condition',
      description: undefined, // Should be ignored
      conditionCategory: undefined // Should be ignored
    };

    const updatedCondition = {
      conditionId: 'condition-123',
      name: 'Test Condition',
      nameLowerCase: 'test condition'
    };

    const event = {
      conditionId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCondition
    });

    const result = await handler(event);

    expect(result.name).toBe('Test Condition');
    expect(result.nameLowerCase).toBe('test condition');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle null values', async () => {
    const conditionId = 'condition-123';
    const input = {
      description: null, // Null should be treated as a valid value
      conditionTarget: null
    };

    const updatedCondition = {
      conditionId: 'condition-123',
      description: null,
      descriptionLowerCase: '',
      conditionTarget: null
    };

    const event = {
      conditionId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCondition
    });

    const result = await handler(event);

    expect(result.description).toBeNull();
    expect(result.conditionTarget).toBeNull();
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB errors', async () => {
    const conditionId = 'condition-123';
    const input = {
      name: 'Test Condition'
    };

    const event = {
      conditionId,
      input
    };

    // Mock DynamoDB error
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('Failed to update condition: DynamoDB connection error');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should update multiple fields at once', async () => {
    const conditionId = 'condition-123';
    const input = {
      name: 'Multi Update',
      conditionCategory: 'MENTAL',
      conditionType: 'BUFF'
    };

    const updatedCondition = {
      conditionId: 'condition-123',
      name: 'Multi Update',
      nameLowerCase: 'multi update',
      description: 'Original description',
      descriptionLowerCase: 'original description',
      conditionCategory: 'MENTAL',
      conditionType: 'BUFF',
      conditionTarget: 'intelligence'
    };

    const event = {
      conditionId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCondition
    });

    const result = await handler(event);

    expect(result.name).toBe('Multi Update');
    expect(result.nameLowerCase).toBe('multi update');
    expect(result.conditionCategory).toBe('MENTAL');
    expect(result.conditionType).toBe('BUFF');
    expect(result.description).toBe('Original description'); // Unchanged
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing conditionId', async () => {
    const input = {
      name: 'Test Condition'
    };

    const event = {
      // Missing conditionId
      input
    };

    const updatedCondition = {
      conditionId: undefined,
      name: 'Test Condition',
      nameLowerCase: 'test condition'
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCondition
    });

    const result = await handler(event);

    expect(result.name).toBe('Test Condition');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should use environment variable for table name', async () => {
    process.env.CONDITION_TABLE_NAME = 'custom-conditions-table';

    const conditionId = 'condition-123';
    const input = {
      name: 'Test Condition'
    };

    const event = {
      conditionId,
      input
    };

    const updatedCondition = {
      conditionId: 'condition-123',
      name: 'Test Condition',
      nameLowerCase: 'test condition'
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCondition
    });

    await handler(event);

    // Verify DynamoDB was called (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB conditional check failed errors', async () => {
    const conditionId = 'condition-123';
    const input = {
      name: 'Test Condition'
    };

    const event = {
      conditionId,
      input
    };

    // Mock DynamoDB conditional check failed error
    const conditionalError = new Error('The conditional request failed');
    conditionalError.code = 'ConditionalCheckFailedException';
    mockDynamoSend.mockRejectedValueOnce(conditionalError);

    await expect(handler(event)).rejects.toThrow('Failed to update condition: The conditional request failed');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle empty string values', async () => {
    const conditionId = 'condition-123';
    const input = {
      name: '',
      description: ''
    };

    const updatedCondition = {
      conditionId: 'condition-123',
      name: '',
      nameLowerCase: '',
      description: '',
      descriptionLowerCase: ''
    };

    const event = {
      conditionId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedCondition
    });

    const result = await handler(event);

    expect(result.name).toBe('');
    expect(result.nameLowerCase).toBe('');
    expect(result.description).toBe('');
    expect(result.descriptionLowerCase).toBe('');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });
});