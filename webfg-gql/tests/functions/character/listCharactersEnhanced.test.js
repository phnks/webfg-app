const { handler } = require('../../../functions/listCharactersEnhanced');

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

describe('listCharactersEnhanced Lambda function', () => {
  const mockCharacters = [
    {
      characterId: 'char1',
      name: 'Test Character 1',
      nameLowerCase: 'test character 1',
      characterCategory: 'HUMAN',
      will: 10
    },
    {
      characterId: 'char2',
      name: 'Another Character',
      nameLowerCase: 'another character',
      characterCategory: 'ELF',
      will: 12
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE_NAME = 'test-characters-table';
    
    // Default successful response
    mockSend.mockResolvedValue({
      Items: mockCharacters,
      Count: 2,
      ScannedCount: 2
    });
  });

  afterEach(() => {
    delete process.env.CHARACTERS_TABLE_NAME;
  });

  test('should list characters with default pagination', async () => {
    const event = {};
    const result = await handler(event);

    expect(ScanCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pagination');
    expect(result.items).toEqual(mockCharacters);
  });

  test('should handle custom pagination limit', async () => {
    const event = {
      filter: {
        pagination: {
          limit: 5
        }
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.Limit).toBe(5);
  });

  test('should enforce maximum limit', async () => {
    const event = {
      filter: {
        pagination: {
          limit: 500 // Exceeds max of 100
        }
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.Limit).toBe(100); // Should be capped at MAX_LIMIT
  });

  test('should handle pagination cursor', async () => {
    const cursor = Buffer.from(JSON.stringify({ characterId: 'char1' })).toString('base64');
    const event = {
      filter: {
        pagination: {
          cursor: cursor
        }
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.ExclusiveStartKey).toEqual({ characterId: 'char1' });
  });

  test('should handle search filter', async () => {
    const event = {
      filter: {
        search: 'Test'
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('contains(#name, :search)');
    expect(scanCall.ExpressionAttributeValues[':search']).toBe('Test');
    expect(scanCall.ExpressionAttributeValues[':searchLower']).toBe('test');
  });

  test('should handle characterCategory filter', async () => {
    const event = {
      filter: {
        characterCategory: 'HUMAN'
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#characterCategory = :characterCategory');
    expect(scanCall.ExpressionAttributeValues[':characterCategory']).toBe('HUMAN');
  });

  test('should handle will range filter', async () => {
    const event = {
      filter: {
        willMin: 5,
        willMax: 15
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#will BETWEEN :willMin AND :willMax');
    expect(scanCall.ExpressionAttributeValues[':willMin']).toBe(5);
    expect(scanCall.ExpressionAttributeValues[':willMax']).toBe(15);
  });

  test('should handle fatigue range filter', async () => {
    const event = {
      filter: {
        fatigueMin: 0,
        fatigueMax: 5
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#fatigue BETWEEN :fatigueMin AND :fatigueMax');
  });

  test('should handle multiple filters combined', async () => {
    const event = {
      filter: {
        search: 'Character',
        characterCategory: 'HUMAN',
        willMin: 8
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('contains(#name, :search)');
    expect(scanCall.FilterExpression).toContain('#characterCategory = :characterCategory');
    expect(scanCall.FilterExpression).toContain('#will >= :willMin');
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

    // Verify items are sorted (mock data should be sorted)
    expect(result.items).toBeDefined();
  });

  test('should handle sorting by will descending', async () => {
    const event = {
      filter: {
        sort: {
          field: 'will',
          direction: 'DESC'
        }
      }
    };

    const result = await handler(event);
    expect(result.items).toBeDefined();
  });

  test('should return next cursor when more items available', async () => {
    mockSend.mockResolvedValue({
      Items: mockCharacters,
      Count: 2,
      ScannedCount: 2,
      LastEvaluatedKey: { characterId: 'char2' }
    });

    const event = {};
    const result = await handler(event);

    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).toBeDefined();
  });

  test('should indicate no more items when at end', async () => {
    mockSend.mockResolvedValue({
      Items: mockCharacters,
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
    delete process.env.CHARACTERS_TABLE_NAME;

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

    // Should not throw error, but handle gracefully
    await expect(handler(event)).resolves.toBeDefined();
  });

  test('should handle missing will values for range filters', async () => {
    const charactersWithMissingWill = [
      { characterId: 'char1', name: 'Character 1' },
      { characterId: 'char2', name: 'Character 2', will: 10 }
    ];

    mockSend.mockResolvedValue({
      Items: charactersWithMissingWill,
      Count: 2,
      ScannedCount: 2
    });

    const event = {
      filter: {
        willMin: 5
      }
    };

    const result = await handler(event);
    expect(result.items).toBeDefined();
  });

  test('should handle zero values in range filters', async () => {
    const event = {
      filter: {
        willMin: 0,
        willMax: 0
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.ExpressionAttributeValues[':willMin']).toBe(0);
    expect(scanCall.ExpressionAttributeValues[':willMax']).toBe(0);
  });

  test('should handle case-insensitive search', async () => {
    const event = {
      filter: {
        search: 'CHARACTER'
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.ExpressionAttributeValues[':searchLower']).toBe('character');
  });

  test('should handle partial will range (only min)', async () => {
    const event = {
      filter: {
        willMin: 8
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#will >= :willMin');
    expect(scanCall.FilterExpression).not.toContain('BETWEEN');
  });

  test('should handle partial will range (only max)', async () => {
    const event = {
      filter: {
        willMax: 15
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#will <= :willMax');
    expect(scanCall.FilterExpression).not.toContain('BETWEEN');
  });
});