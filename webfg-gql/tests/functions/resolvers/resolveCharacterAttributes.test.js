const { handler } = require('../../../functions/resolveCharacterAttributes');

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

describe('resolveCharacterAttributes resolver', () => {
  const mockBaseAttributes = [
    {
      attributeId: 'attr1',
      attributeName: 'Strength',
      description: 'Physical power and ability'
    },
    {
      attributeId: 'attr2',
      attributeName: 'Intelligence',
      description: 'Mental acuity and reasoning'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ATTRIBUTES_TABLE = 'test-attributes-table';
    
    mockSend.mockResolvedValue({
      Responses: {
        'test-attributes-table': mockBaseAttributes
      }
    });
  });

  afterEach(() => {
    delete process.env.ATTRIBUTES_TABLE;
  });

  test('should resolve character attributes successfully', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: [
          { attributeId: 'attr1', attributeValue: 15 },
          { attributeId: 'attr2', attributeValue: 12 }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    
    expect(result[0]).toEqual({
      attributeId: 'attr1',
      attributeValue: 15,
      attributeName: 'Strength',
      __typename: 'CharacterAttribute'
    });
    
    expect(result[1]).toEqual({
      attributeId: 'attr2',
      attributeValue: 12,
      attributeName: 'Intelligence',
      __typename: 'CharacterAttribute'
    });
  });

  test('should return empty array for no attribute data', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: []
      }
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should return empty array for null attribute data', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: null
      }
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should return empty array for undefined attribute data', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123'
        // No attributeData property
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

  test('should handle missing base attributes gracefully', async () => {
    mockSend.mockResolvedValue({
      Responses: {
        'test-attributes-table': [mockBaseAttributes[0]] // Only one attribute returned
      }
    });

    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: [
          { attributeId: 'attr1', attributeValue: 15 },
          { attributeId: 'missing-attr', attributeValue: 8 }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(2);
    
    expect(result[0]).toEqual({
      attributeId: 'attr1',
      attributeValue: 15,
      attributeName: 'Strength',
      __typename: 'CharacterAttribute'
    });
    
    expect(result[1]).toEqual({
      attributeId: 'missing-attr',
      attributeValue: 8,
      attributeName: 'UNKNOWN'
    });
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB connection failed'));

    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: [
          { attributeId: 'attr1', attributeValue: 15 }
        ]
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to resolve character attributes: DynamoDB connection failed');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.ATTRIBUTES_TABLE;

    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: [
          { attributeId: 'attr1', attributeValue: 15 }
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
        attributeData: [
          { attributeId: 'attr1', attributeValue: 15 }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      attributeId: 'attr1',
      attributeValue: 15,
      attributeName: 'UNKNOWN'
    });
  });

  test('should handle missing Responses property', async () => {
    mockSend.mockResolvedValue({});

    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: [
          { attributeId: 'attr1', attributeValue: 15 }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      attributeId: 'attr1',
      attributeValue: 15,
      attributeName: 'UNKNOWN'
    });
  });

  test('should create correct BatchGetCommand parameters', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: [
          { attributeId: 'attr1', attributeValue: 15 },
          { attributeId: 'attr2', attributeValue: 12 }
        ]
      }
    };

    await handler(mockEvent);

    const batchCall = BatchGetCommand.mock.calls[0][0];
    expect(batchCall.RequestItems['test-attributes-table'].Keys).toEqual([
      { attributeId: 'attr1' },
      { attributeId: 'attr2' }
    ]);
  });

  test('should maintain order of attributes', async () => {
    // Return attributes in different order than requested
    mockSend.mockResolvedValue({
      Responses: {
        'test-attributes-table': [mockBaseAttributes[1], mockBaseAttributes[0]]
      }
    });

    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: [
          { attributeId: 'attr1', attributeValue: 15 },
          { attributeId: 'attr2', attributeValue: 12 }
        ]
      }
    };

    const result = await handler(mockEvent);

    // Should return in the order of the input, not the DB response order
    expect(result[0].attributeId).toBe('attr1');
    expect(result[1].attributeId).toBe('attr2');
  });

  test('should handle single attribute', async () => {
    mockSend.mockResolvedValue({
      Responses: {
        'test-attributes-table': [mockBaseAttributes[0]]
      }
    });

    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: [
          { attributeId: 'attr1', attributeValue: 20 }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      attributeId: 'attr1',
      attributeValue: 20,
      attributeName: 'Strength',
      __typename: 'CharacterAttribute'
    });
  });

  test('should handle large number of attributes', async () => {
    const manyAttributes = Array.from({ length: 15 }, (_, i) => ({
      attributeId: `attr${i}`,
      attributeName: `Attribute ${i}`,
      description: `Description ${i}`
    }));

    const manyAttributeData = manyAttributes.map((a, i) => ({
      attributeId: a.attributeId,
      attributeValue: (i + 1) * 5
    }));

    mockSend.mockResolvedValue({
      Responses: {
        'test-attributes-table': manyAttributes
      }
    });

    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: manyAttributeData
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(15);
    expect(result[0].attributeValue).toBe(5);
    expect(result[14].attributeValue).toBe(75);
  });

  test('should handle attributes with invalid attributeId in base data', async () => {
    const attributeWithoutId = {
      attributeName: 'Invalid Attribute',
      description: 'Missing ID'
      // No attributeId property
    };

    mockSend.mockResolvedValue({
      Responses: {
        'test-attributes-table': [attributeWithoutId, mockBaseAttributes[0]]
      }
    });

    const mockEvent = {
      source: {
        characterId: 'char123',
        attributeData: [
          { attributeId: 'attr1', attributeValue: 15 }
        ]
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      attributeId: 'attr1',
      attributeValue: 15,
      attributeName: 'Strength',
      __typename: 'CharacterAttribute'
    });
  });
});