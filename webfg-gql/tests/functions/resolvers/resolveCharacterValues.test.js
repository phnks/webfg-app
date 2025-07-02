const { handler } = require('../../../functions/resolveCharacterValues');

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

const { DynamoDBDocumentClient, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('resolveCharacterValues resolver', () => {
  const mockBaseValues = [
    {
      valueId: 'val1',
      valueName: 'Honor',
      description: 'Character honor and reputation'
    },
    {
      valueId: 'val2',
      valueName: 'Wealth',
      description: 'Character wealth and resources'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VALUES_TABLE = 'test-values-table';
    
    mockSend.mockResolvedValue({
      Responses: {
        'test-values-table': mockBaseValues
      }
    });
  });

  afterEach(() => {
    delete process.env.VALUES_TABLE;
  });

  test('should resolve character values successfully', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: [
          { valueId: 'val1' },
          { valueId: 'val2' }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    
    expect(result[0]).toEqual({
      valueId: 'val1',
      valueName: 'Honor',
      __typename: 'CharacterValue'
    });
    
    expect(result[1]).toEqual({
      valueId: 'val2',
      valueName: 'Wealth',
      __typename: 'CharacterValue'
    });
  });

  test('should return empty array for no value data', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: []
      }
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should return empty array for null value data', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: null
      }
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should return empty array for undefined value data', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123'
        // No valueData property
      }
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should return empty array for no source data', async () => {
    const mockEvent = {
      source: null
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should return empty array for missing source', async () => {
    const mockEvent = {};

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should handle missing base values gracefully', async () => {
    mockSend.mockResolvedValue({
      Responses: {
        'test-values-table': [mockBaseValues[0]] // Only one value returned
      }
    });

    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: [
          { valueId: 'val1' },
          { valueId: 'missing-val' }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(2);
    
    expect(result[0]).toEqual({
      valueId: 'val1',
      valueName: 'Honor',
      __typename: 'CharacterValue'
    });
    
    expect(result[1]).toEqual({
      valueId: 'missing-val',
      valueName: 'UNKNOWN'
    });
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB connection failed'));

    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: [
          { valueId: 'val1' }
        ]
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to resolve character values: DynamoDB connection failed');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.VALUES_TABLE;

    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: [
          { valueId: 'val1' }
        ]
      }
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
      source: {
        characterId: 'char123',
        valueData: [
          { valueId: 'val1' }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      valueId: 'val1',
      valueName: 'UNKNOWN'
    });
  });

  test('should handle missing Responses property', async () => {
    mockSend.mockResolvedValue({});

    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: [
          { valueId: 'val1' }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      valueId: 'val1',
      valueName: 'UNKNOWN'
    });
  });

  test('should create correct BatchGetCommand parameters', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: [
          { valueId: 'val1' },
          { valueId: 'val2' }
        ]
      }
    };

    await handler(mockEvent);

    const batchCall = BatchGetCommand.mock.calls[0][0];
    expect(batchCall.RequestItems['test-values-table'].Keys).toEqual([
      { valueId: 'val1' },
      { valueId: 'val2' }
    ]);
  });

  test('should maintain order of values', async () => {
    // Return values in different order than requested
    mockSend.mockResolvedValue({
      Responses: {
        'test-values-table': [mockBaseValues[1], mockBaseValues[0]]
      }
    });

    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: [
          { valueId: 'val1' },
          { valueId: 'val2' }
        ]
      }
    };

    const result = await handler(mockEvent);

    // Should return in the order of the input, not the DB response order
    expect(result[0].valueId).toBe('val1');
    expect(result[1].valueId).toBe('val2');
  });

  test('should handle single value', async () => {
    mockSend.mockResolvedValue({
      Responses: {
        'test-values-table': [mockBaseValues[0]]
      }
    });

    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: [
          { valueId: 'val1' }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      valueId: 'val1',
      valueName: 'Honor',
      __typename: 'CharacterValue'
    });
  });

  test('should handle large number of values', async () => {
    const manyValues = Array.from({ length: 10 }, (_, i) => ({
      valueId: `val${i}`,
      valueName: `Value ${i}`,
      description: `Description ${i}`
    }));

    const manyValueData = manyValues.map(v => ({
      valueId: v.valueId
    }));

    mockSend.mockResolvedValue({
      Responses: {
        'test-values-table': manyValues
      }
    });

    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: manyValueData
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(10);
    expect(result[0].valueName).toBe('Value 0');
    expect(result[9].valueName).toBe('Value 9');
  });

  test('should handle values with invalid valueId in base data', async () => {
    const valueWithoutId = {
      valueName: 'Invalid Value',
      description: 'Missing ID'
      // No valueId property
    };

    mockSend.mockResolvedValue({
      Responses: {
        'test-values-table': [valueWithoutId, mockBaseValues[0]]
      }
    });

    const mockEvent = {
      source: {
        characterId: 'char123',
        valueData: [
          { valueId: 'val1' }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      valueId: 'val1',
      valueName: 'Honor',
      __typename: 'CharacterValue'
    });
  });
});