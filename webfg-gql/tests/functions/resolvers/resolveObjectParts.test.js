const { handler } = require('../../../functions/resolveObjectParts');

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
  ScanCommand: jest.fn()
}));

const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('resolveObjectParts resolver', () => {
  const mockParts = [
    {
      objectId: 'part1',
      name: 'Steel Blade',
      parentObjectId: 'sword123',
      strength: { attributeValue: 3 }
    },
    {
      objectId: 'part2', 
      name: 'Leather Grip',
      parentObjectId: 'sword123',
      dexterity: { attributeValue: 1 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE = 'test-objects-table';
    
    mockSend.mockResolvedValue({
      Items: mockParts
    });
  });

  afterEach(() => {
    delete process.env.OBJECTS_TABLE;
  });

  test('should resolve parts for object', async () => {
    const mockEvent = {
      parent: {
        objectId: 'sword123'
      }
    };

    const result = await handler(mockEvent);

    expect(ScanCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result).toEqual(mockParts);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#parentObjectId = :parentObjectId');
    expect(scanCall.ExpressionAttributeValues[':parentObjectId']).toBe('sword123');
  });

  test('should handle object with no parts', async () => {
    mockSend.mockResolvedValue({
      Items: []
    });

    const mockEvent = {
      parent: {
        objectId: 'simple123'
      }
    };

    const result = await handler(mockEvent);

    expect(result).toEqual([]);
  });

  test('should handle missing object ID', async () => {
    const mockEvent = {
      parent: {}
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle missing parent', async () => {
    const mockEvent = {};

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const mockEvent = {
      parent: {
        objectId: 'sword123'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.OBJECTS_TABLE;

    const mockEvent = {
      parent: {
        objectId: 'sword123'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle null parent', async () => {
    const mockEvent = {
      parent: null
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should filter parts by parent object ID correctly', async () => {
    const mockEvent = {
      parent: {
        objectId: 'different-object'
      }
    };

    await handler(mockEvent);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.ExpressionAttributeValues[':parentObjectId']).toBe('different-object');
  });

  test('should handle complex parts with all attributes', async () => {
    const complexParts = [
      {
        objectId: 'complex-part1',
        name: 'Enchanted Gemstone',
        parentObjectId: 'staff123',
        description: 'A magical gem that enhances spell power',
        weight: { attributeValue: 1 },
        size: { attributeValue: 1 },
        intelligence: { attributeValue: 5 },
        intensity: { attributeValue: 3 },
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ];

    mockSend.mockResolvedValue({
      Items: complexParts
    });

    const mockEvent = {
      parent: {
        objectId: 'staff123'
      }
    };

    const result = await handler(mockEvent);

    expect(result).toEqual(complexParts);
    expect(result[0].intelligence).toEqual({ attributeValue: 5 });
    expect(result[0].intensity).toEqual({ attributeValue: 3 });
  });

  test('should handle many parts for one object', async () => {
    const manyParts = Array.from({ length: 20 }, (_, i) => ({
      objectId: `part${i}`,
      name: `Part ${i}`,
      parentObjectId: 'complex-object',
      strength: { attributeValue: i % 5 }
    }));

    mockSend.mockResolvedValue({
      Items: manyParts
    });

    const mockEvent = {
      parent: {
        objectId: 'complex-object'
      }
    };

    const result = await handler(mockEvent);

    expect(result).toHaveLength(20);
    expect(result.every(part => part.parentObjectId === 'complex-object')).toBe(true);
  });

  test('should handle parts with null or zero values', async () => {
    const partsWithNulls = [
      {
        objectId: 'null-part',
        name: 'Partial Part',
        parentObjectId: 'object123',
        strength: null,
        weight: { attributeValue: 0 },
        description: undefined
      }
    ];

    mockSend.mockResolvedValue({
      Items: partsWithNulls
    });

    const mockEvent = {
      parent: {
        objectId: 'object123'
      }
    };

    const result = await handler(mockEvent);

    expect(result[0].strength).toBeNull();
    expect(result[0].weight.attributeValue).toBe(0);
    expect(result[0].description).toBeUndefined();
  });

  test('should use correct table name and structure', async () => {
    const mockEvent = {
      parent: {
        objectId: 'test123'
      }
    };

    await handler(mockEvent);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.TableName).toBe('test-objects-table');
    expect(scanCall.ExpressionAttributeNames['#parentObjectId']).toBe('parentObjectId');
  });
});