const { handler } = require('../../../functions/resolveCharacterConditions');

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
  BatchGetCommand: jest.fn()
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

const { DynamoDBDocumentClient, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");
const { toInt } = require('../../../utils/stringToNumber');
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('resolveCharacterConditions resolver', () => {
  const mockConditions = [
    {
      conditionId: 'cond1',
      name: 'Strength Boost',
      description: 'Increases strength',
      conditionType: 'BUFF',
      conditionTarget: 'STRENGTH'
    },
    {
      conditionId: 'cond2',
      name: 'Speed Debuff',
      description: 'Decreases speed',
      conditionType: 'DEBUFF',
      conditionTarget: 'SPEED'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONDITIONS_TABLE = 'test-conditions-table';
    
    mockSend.mockResolvedValue({
      Responses: {
        'test-conditions-table': mockConditions
      }
    });
  });

  afterEach(() => {
    delete process.env.CONDITIONS_TABLE;
  });

  test('should resolve character conditions successfully', async () => {
    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1', amount: 5 },
        { conditionId: 'cond2', amount: 3 }
      ]
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      ...mockConditions[0],
      amount: 5
    });
    expect(result[1]).toEqual({
      ...mockConditions[1],
      amount: 3
    });
  });

  test('should return empty array for no character conditions', async () => {
    const mockEvent = {
      characterConditions: []
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should return empty array for null character conditions', async () => {
    const mockEvent = {
      characterConditions: null
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should return empty array for undefined character conditions', async () => {
    const mockEvent = {};

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should handle missing conditions from database', async () => {
    mockSend.mockResolvedValue({
      Responses: {
        'test-conditions-table': [mockConditions[0]] // Only one condition returned
      }
    });

    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1', amount: 5 },
        { conditionId: 'missing-cond', amount: 3 }
      ]
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(1);
    expect(result[0].conditionId).toBe('cond1');
    expect(result[0].amount).toBe(5);
  });

  test('should handle string amounts correctly', async () => {
    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1', amount: '10' },
        { conditionId: 'cond2', amount: '5' }
      ]
    };

    await handler(mockEvent);

    expect(toInt).toHaveBeenCalledWith('10', 1);
    expect(toInt).toHaveBeenCalledWith('5', 1);
  });

  test('should handle missing amounts with default', async () => {
    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1' }, // No amount property
        { conditionId: 'cond2', amount: undefined }
      ]
    };

    await handler(mockEvent);

    expect(toInt).toHaveBeenCalledWith(undefined, 1);
    expect(toInt).toHaveBeenCalledWith(undefined, 1);
  });

  test('should maintain order of conditions', async () => {
    // Return conditions in different order than requested
    mockSend.mockResolvedValue({
      Responses: {
        'test-conditions-table': [mockConditions[1], mockConditions[0]]
      }
    });

    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1', amount: 5 },
        { conditionId: 'cond2', amount: 3 }
      ]
    };

    const result = await handler(mockEvent);

    // Should return in the order of the input, not the DB response order
    expect(result[0].conditionId).toBe('cond1');
    expect(result[1].conditionId).toBe('cond2');
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB connection failed'));

    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1', amount: 5 }
      ]
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to resolve character conditions: DynamoDB connection failed');
  });

  test('should handle missing table name environment variable', async () => {
    delete process.env.CONDITIONS_TABLE;

    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1', amount: 5 }
      ]
    };

    await handler(mockEvent);

    const batchCall = BatchGetCommand.mock.calls[0][0];
    expect(Object.keys(batchCall.RequestItems)).toContain('undefined');
  });

  test('should handle empty responses from DynamoDB', async () => {
    mockSend.mockResolvedValue({
      Responses: {}
    });

    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1', amount: 5 }
      ]
    };

    const result = await handler(mockEvent);

    expect(result).toEqual([]);
  });

  test('should handle missing Responses property', async () => {
    mockSend.mockResolvedValue({});

    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1', amount: 5 }
      ]
    };

    const result = await handler(mockEvent);

    expect(result).toEqual([]);
  });

  test('should handle single condition', async () => {
    mockSend.mockResolvedValue({
      Responses: {
        'test-conditions-table': [mockConditions[0]]
      }
    });

    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1', amount: 8 }
      ]
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      ...mockConditions[0],
      amount: 8
    });
  });

  test('should create correct BatchGetCommand parameters', async () => {
    const mockEvent = {
      characterConditions: [
        { conditionId: 'cond1', amount: 5 },
        { conditionId: 'cond2', amount: 3 }
      ]
    };

    await handler(mockEvent);

    const batchCall = BatchGetCommand.mock.calls[0][0];
    expect(batchCall.RequestItems['test-conditions-table'].Keys).toEqual([
      { conditionId: 'cond1' },
      { conditionId: 'cond2' }
    ]);
  });

  test('should handle large number of conditions', async () => {
    const manyConditions = Array.from({ length: 20 }, (_, i) => ({
      conditionId: `cond${i}`,
      name: `Condition ${i}`,
      description: `Description ${i}`,
      conditionType: 'BUFF',
      conditionTarget: 'STRENGTH'
    }));

    const manyCharacterConditions = manyConditions.map((c, i) => ({
      conditionId: c.conditionId,
      amount: i + 1
    }));

    mockSend.mockResolvedValue({
      Responses: {
        'test-conditions-table': manyConditions
      }
    });

    const mockEvent = {
      characterConditions: manyCharacterConditions
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(20);
    expect(result[0].amount).toBe(1);
    expect(result[19].amount).toBe(20);
  });
});