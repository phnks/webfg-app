const { handler } = require('../../../functions/updateConditionAmount');

// Mock AWS SDK
jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({}))
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn()
    }))
  },
  UpdateCommand: jest.fn(),
  GetCommand: jest.fn()
}));

// Mock the utility function
jest.mock('../../../utils/stringToNumber', () => ({
  toInt: jest.fn((value, defaultValue) => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  })
}));

const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { toInt } = require('../../../utils/stringToNumber');
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('updateConditionAmount Lambda function', () => {
  const mockCharacter = {
    characterId: 'char123',
    name: 'Test Character',
    characterConditions: [
      { conditionId: 'cond1', amount: 5 },
      { conditionId: 'cond2', amount: 3 }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTER_TABLE_NAME = 'test-characters-table';
    
    // Mock GetCommand to return character
    mockSend.mockResolvedValueOnce({ Item: mockCharacter })
            .mockResolvedValueOnce({ Attributes: mockCharacter }); // UpdateCommand
  });

  afterEach(() => {
    delete process.env.CHARACTER_TABLE_NAME;
  });

  test('should update condition amount successfully', async () => {
    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 10
    };

    const result = await handler(mockEvent);

    expect(GetCommand).toHaveBeenCalled();
    expect(UpdateCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(result.characterId).toBe('char123');
  });

  test('should handle string amounts correctly', async () => {
    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: '15'
    };

    await handler(mockEvent);

    expect(toInt).toHaveBeenCalledWith('15', 1);
  });

  test('should handle missing characterId', async () => {
    const mockEvent = {
      conditionId: 'cond1',
      amount: 10
    };

    await expect(handler(mockEvent)).rejects.toThrow('characterId, conditionId, and amount are all required');
  });

  test('should handle missing conditionId', async () => {
    const mockEvent = {
      characterId: 'char123',
      amount: 10
    };

    await expect(handler(mockEvent)).rejects.toThrow('characterId, conditionId, and amount are all required');
  });

  test('should handle missing amount', async () => {
    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1'
    };

    await expect(handler(mockEvent)).rejects.toThrow('characterId, conditionId, and amount are all required');
  });

  test('should handle amount less than 1', async () => {
    // toInt mock will return 0 for invalid values with default 1
    toInt.mockReturnValueOnce(0);

    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 0
    };

    await expect(handler(mockEvent)).rejects.toThrow('Amount must be at least 1');
  });

  test('should handle character not found', async () => {
    mockSend.mockReset();
    mockSend.mockResolvedValueOnce({ Item: null }); // Character not found

    const mockEvent = {
      characterId: 'nonexistent',
      conditionId: 'cond1',
      amount: 5
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to update condition amount: Character not found: nonexistent');
  });

  test('should handle condition not found', async () => {
    mockSend.mockReset();
    mockSend.mockResolvedValueOnce({ Item: mockCharacter });

    const mockEvent = {
      characterId: 'char123',
      conditionId: 'nonexistent-condition',
      amount: 5
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to update condition amount: Condition nonexistent-condition not found for character char123');
  });

  test('should handle character with no conditions', async () => {
    const characterWithoutConditions = {
      characterId: 'char123',
      name: 'Test Character'
      // No characterConditions property
    };

    mockSend.mockReset();
    mockSend.mockResolvedValueOnce({ Item: characterWithoutConditions });

    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 5
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to update condition amount: Condition cond1 not found for character char123');
  });

  test('should handle character with empty conditions array', async () => {
    const characterWithEmptyConditions = {
      characterId: 'char123',
      name: 'Test Character',
      characterConditions: []
    };

    mockSend.mockReset();
    mockSend.mockResolvedValueOnce({ Item: characterWithEmptyConditions });

    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 5
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to update condition amount: Condition cond1 not found for character char123');
  });

  test('should update correct condition in array', async () => {
    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond2', // Second condition
      amount: 8
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    const updatedConditions = updateCall.ExpressionAttributeValues[':characterConditions'];
    
    expect(updatedConditions[0].amount).toBe(5); // First condition unchanged
    expect(updatedConditions[1].amount).toBe(8); // Second condition updated
  });

  test('should handle DynamoDB errors on get', async () => {
    mockSend.mockReset();
    mockSend.mockRejectedValueOnce(new Error('DynamoDB connection failed'));

    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 5
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to update condition amount: DynamoDB connection failed');
  });

  test('should handle DynamoDB errors on update', async () => {
    mockSend.mockReset();
    mockSend.mockResolvedValueOnce({ Item: mockCharacter })  // Get succeeds
            .mockRejectedValueOnce(new Error('Update failed')); // Update fails

    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 5
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to update condition amount: Update failed');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.CHARACTER_TABLE_NAME;

    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 5
    };

    await handler(mockEvent);

    const getCall = GetCommand.mock.calls[0][0];
    expect(getCall.TableName).toBeUndefined();
  });

  test('should use correct table name and keys', async () => {
    const mockEvent = {
      characterId: 'test-char-456',
      conditionId: 'cond1',
      amount: 7
    };

    await handler(mockEvent);

    const getCall = GetCommand.mock.calls[0][0];
    expect(getCall.TableName).toBe('test-characters-table');
    expect(getCall.Key).toEqual({ characterId: 'test-char-456' });

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.TableName).toBe('test-characters-table');
    expect(updateCall.Key).toEqual({ characterId: 'test-char-456' });
  });

  test('should return ALL_NEW values', async () => {
    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 5
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ReturnValues).toBe('ALL_NEW');
  });

  test('should handle large amounts', async () => {
    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 999
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    const updatedConditions = updateCall.ExpressionAttributeValues[':characterConditions'];
    expect(updatedConditions[0].amount).toBe(999);
  });

  test('should handle amount as float converted to int', async () => {
    toInt.mockReturnValueOnce(5); // Mock returns integer

    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 5.7
    };

    await handler(mockEvent);

    expect(toInt).toHaveBeenCalledWith(5.7, 1);
  });

  test('should preserve other condition properties', async () => {
    const characterWithExtraProps = {
      characterId: 'char123',
      name: 'Test Character',
      characterConditions: [
        { 
          conditionId: 'cond1', 
          amount: 5,
          extraProp: 'should be preserved',
          otherData: { nested: 'object' }
        }
      ]
    };

    mockSend.mockReset();
    mockSend.mockResolvedValueOnce({ Item: characterWithExtraProps })
            .mockResolvedValueOnce({ Attributes: characterWithExtraProps });

    const mockEvent = {
      characterId: 'char123',
      conditionId: 'cond1',
      amount: 10
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    const updatedConditions = updateCall.ExpressionAttributeValues[':characterConditions'];
    
    expect(updatedConditions[0].amount).toBe(10);
    expect(updatedConditions[0].extraProp).toBe('should be preserved');
    expect(updatedConditions[0].otherData).toEqual({ nested: 'object' });
  });
});