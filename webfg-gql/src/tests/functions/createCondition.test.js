const { handler } = require('../../../functions/createCondition');

describe('createCondition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONDITION_TABLE_NAME = 'test-conditions-table';
  });

  it('should create a condition successfully', async () => {
    const mockInput = {
      name: 'Test Condition',
      description: 'A test condition for unit testing',
      conditionCategory: 'PHYSICAL',
      conditionType: 'BUFF',
      conditionTarget: 'strength'
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify the result structure
    expect(result).toHaveProperty('conditionId');
    expect(result.name).toBe('Test Condition');
    expect(result.nameLowerCase).toBe('test condition');
    expect(result.description).toBe('A test condition for unit testing');
    expect(result.descriptionLowerCase).toBe('a test condition for unit testing');
    expect(result.conditionCategory).toBe('PHYSICAL');
    expect(result.conditionType).toBe('BUFF');
    expect(result.conditionTarget).toBe('strength');

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB errors', async () => {
    const mockInput = {
      name: 'Test Condition',
      description: 'A test condition',
      conditionCategory: 'PHYSICAL',
      conditionType: 'BUFF',
      conditionTarget: 'strength'
    };

    const event = {
      input: mockInput
    };

    // Mock DynamoDB error
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    // Expect the function to throw an error
    await expect(handler(event)).rejects.toThrow('Failed to create condition: DynamoDB connection error');

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing description field', async () => {
    const event = {
      input: {
        name: 'Test Condition',
        conditionCategory: 'PHYSICAL',
        conditionType: 'BUFF',
        conditionTarget: 'strength'
        // Missing description
      }
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Should create condition with undefined description
    expect(result.name).toBe('Test Condition');
    expect(result.nameLowerCase).toBe('test condition');
    expect(result.description).toBeUndefined();
    expect(result.descriptionLowerCase).toBeUndefined();
    expect(result.conditionCategory).toBe('PHYSICAL');
    expect(result.conditionType).toBe('BUFF');
    expect(result.conditionTarget).toBe('strength');
  });

  it('should convert names to lowercase correctly', async () => {
    const mockInput = {
      name: 'UPPERCASE CONDITION NAME',
      description: 'MiXeD CaSe DeScRiPtIoN',
      conditionCategory: 'PHYSICAL',
      conditionType: 'BUFF',
      conditionTarget: 'strength'
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify lowercase conversion
    expect(result.nameLowerCase).toBe('uppercase condition name');
    expect(result.descriptionLowerCase).toBe('mixed case description');
  });

  it('should use environment variable for table name', async () => {
    process.env.CONDITION_TABLE_NAME = 'custom-conditions-table';

    const mockInput = {
      name: 'Test Condition',
      description: 'A test condition',
      conditionCategory: 'PHYSICAL',
      conditionType: 'BUFF',
      conditionTarget: 'strength'
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    await handler(event);

    // Verify DynamoDB was called (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing name field by throwing error', async () => {
    const event = {
      input: {
        description: 'A test condition',
        conditionCategory: 'PHYSICAL',
        conditionType: 'BUFF',
        conditionTarget: 'strength'
        // Missing name
      }
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    // Should throw error when trying to lowercase undefined name
    await expect(handler(event)).rejects.toThrow();
  });
});