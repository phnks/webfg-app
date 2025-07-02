const { handler } = require('../../../functions/listObjectsEnhanced');

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

describe('listObjectsEnhanced Lambda function', () => {
  const mockObjects = [
    {
      objectId: 'obj1',
      name: 'Iron Sword',
      nameLowerCase: 'iron sword',
      objectCategory: 'WEAPON',
      isEquipment: true,
      weight: { baseValue: 3, currentValue: 3 }
    },
    {
      objectId: 'obj2',
      name: 'Leather Armor',
      nameLowerCase: 'leather armor',
      objectCategory: 'ARMOR',
      isEquipment: true,
      weight: { baseValue: 5, currentValue: 5 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE_NAME = 'test-objects-table';
    
    // Default successful response
    mockSend.mockResolvedValue({
      Items: mockObjects,
      Count: 2,
      ScannedCount: 2
    });
  });

  afterEach(() => {
    delete process.env.OBJECTS_TABLE_NAME;
  });

  test('should list objects with default pagination', async () => {
    const event = {};
    const result = await handler(event);

    expect(ScanCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pagination');
    expect(result.items).toEqual(mockObjects);
  });

  test('should handle custom pagination limit', async () => {
    const event = {
      filter: {
        pagination: {
          limit: 25
        }
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.Limit).toBe(25);
  });

  test('should enforce maximum limit', async () => {
    const event = {
      filter: {
        pagination: {
          limit: 200 // Exceeds max of 100
        }
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.Limit).toBe(100); // Should be capped at MAX_LIMIT
  });

  test('should handle pagination cursor', async () => {
    const cursor = Buffer.from(JSON.stringify({ objectId: 'obj1' })).toString('base64');
    const event = {
      filter: {
        pagination: {
          cursor: cursor
        }
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.ExclusiveStartKey).toEqual({ objectId: 'obj1' });
  });

  test('should handle search filter', async () => {
    const event = {
      filter: {
        search: 'Sword'
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('contains(#name, :search)');
    expect(scanCall.ExpressionAttributeValues[':search']).toBe('Sword');
    expect(scanCall.ExpressionAttributeValues[':searchLower']).toBe('sword');
  });

  test('should handle objectCategory filter', async () => {
    const event = {
      filter: {
        objectCategory: 'WEAPON'
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#objectCategory = :objectCategory');
    expect(scanCall.ExpressionAttributeValues[':objectCategory']).toBe('WEAPON');
  });

  test('should handle isEquipment filter (true)', async () => {
    const event = {
      filter: {
        isEquipment: true
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#isEquipment = :isEquipment');
    expect(scanCall.ExpressionAttributeValues[':isEquipment']).toBe(true);
  });

  test('should handle isEquipment filter (false)', async () => {
    const event = {
      filter: {
        isEquipment: false
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.ExpressionAttributeValues[':isEquipment']).toBe(false);
  });

  test('should handle weight range filter', async () => {
    const event = {
      filter: {
        weightMin: 2,
        weightMax: 10
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#weight.#baseValue BETWEEN :weightMin AND :weightMax');
    expect(scanCall.ExpressionAttributeValues[':weightMin']).toBe(2);
    expect(scanCall.ExpressionAttributeValues[':weightMax']).toBe(10);
  });

  test('should handle size range filter', async () => {
    const event = {
      filter: {
        sizeMin: 1,
        sizeMax: 5
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#size.#baseValue BETWEEN :sizeMin AND :sizeMax');
  });

  test('should handle multiple filters combined', async () => {
    const event = {
      filter: {
        search: 'Armor',
        objectCategory: 'ARMOR',
        isEquipment: true,
        weightMin: 1
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('contains(#name, :search)');
    expect(scanCall.FilterExpression).toContain('#objectCategory = :objectCategory');
    expect(scanCall.FilterExpression).toContain('#isEquipment = :isEquipment');
    expect(scanCall.FilterExpression).toContain('#weight.#baseValue >= :weightMin');
  });

  test('should handle sorting by name ascending', async () => {
    const event = {
      filter: {
        sort: {
          field: 'name',
          direction: 'ASC'
        }
      }
    };

    const result = await handler(event);
    expect(result.items).toBeDefined();
  });

  test('should handle sorting by weight descending', async () => {
    const event = {
      filter: {
        sort: {
          field: 'weight',
          direction: 'DESC'
        }
      }
    };

    const result = await handler(event);
    expect(result.items).toBeDefined();
  });

  test('should return next cursor when more items available', async () => {
    mockSend.mockResolvedValue({
      Items: mockObjects,
      Count: 2,
      ScannedCount: 2,
      LastEvaluatedKey: { objectId: 'obj2' }
    });

    const event = {};
    const result = await handler(event);

    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).toBeDefined();
  });

  test('should indicate no more items when at end', async () => {
    mockSend.mockResolvedValue({
      Items: mockObjects,
      Count: 2,
      ScannedCount: 2
      // No LastEvaluatedKey
    });

    const event = {};
    const result = await handler(event);

    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.nextCursor).toBeNull();
  });

  test('should handle empty results', async () => {
    mockSend.mockResolvedValue({
      Items: [],
      Count: 0,
      ScannedCount: 0
    });

    const event = {};
    const result = await handler(event);

    expect(result.items).toEqual([]);
    expect(result.pagination.hasMore).toBe(false);
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const event = {};

    await expect(handler(event)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table name environment variable', async () => {
    delete process.env.OBJECTS_TABLE_NAME;

    const event = {};

    await expect(handler(event)).rejects.toThrow();
  });

  test('should handle invalid cursor format', async () => {
    const event = {
      filter: {
        pagination: {
          cursor: 'invalid-cursor-format'
        }
      }
    };

    // Should handle gracefully
    await expect(handler(event)).resolves.toBeDefined();
  });

  test('should handle partial weight range (only min)', async () => {
    const event = {
      filter: {
        weightMin: 3
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#weight.#baseValue >= :weightMin');
    expect(scanCall.FilterExpression).not.toContain('BETWEEN');
  });

  test('should handle partial weight range (only max)', async () => {
    const event = {
      filter: {
        weightMax: 8
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#weight.#baseValue <= :weightMax');
    expect(scanCall.FilterExpression).not.toContain('BETWEEN');
  });

  test('should handle case-insensitive search', async () => {
    const event = {
      filter: {
        search: 'SWORD'
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.ExpressionAttributeValues[':searchLower']).toBe('sword');
  });

  test('should handle zero values in range filters', async () => {
    const event = {
      filter: {
        weightMin: 0,
        weightMax: 0
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.ExpressionAttributeValues[':weightMin']).toBe(0);
    expect(scanCall.ExpressionAttributeValues[':weightMax']).toBe(0);
  });

  test('should handle objects without weight field for range filters', async () => {
    const objectsWithoutWeight = [
      { objectId: 'obj1', name: 'Object 1' },
      { objectId: 'obj2', name: 'Object 2', weight: { baseValue: 5 } }
    ];

    mockSend.mockResolvedValue({
      Items: objectsWithoutWeight,
      Count: 2,
      ScannedCount: 2
    });

    const event = {
      filter: {
        weightMin: 3
      }
    };

    const result = await handler(event);
    expect(result.items).toBeDefined();
  });
});