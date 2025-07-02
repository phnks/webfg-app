const { handler } = require('../../../functions/listActionsEnhanced');

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

describe('listActionsEnhanced Lambda function', () => {
  const mockActions = [
    {
      actionId: 'action1',
      name: 'Strike',
      nameLowerCase: 'strike',
      actionCategory: 'ATTACK',
      difficulty: { baseValue: 12, currentValue: 12 }
    },
    {
      actionId: 'action2',
      name: 'Dodge',
      nameLowerCase: 'dodge',
      actionCategory: 'DEFENSE',
      difficulty: { baseValue: 10, currentValue: 10 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACTIONS_TABLE_NAME = 'test-actions-table';
    
    mockSend.mockResolvedValue({
      Items: mockActions,
      Count: 2,
      ScannedCount: 2
    });
  });

  afterEach(() => {
    delete process.env.ACTIONS_TABLE_NAME;
  });

  test('should list actions with default pagination', async () => {
    const event = {};
    const result = await handler(event);

    expect(ScanCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pagination');
    expect(result.items).toEqual(mockActions);
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

  test('should handle search filter', async () => {
    const event = {
      filter: {
        search: 'Strike'
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('contains(#name, :search)');
    expect(scanCall.ExpressionAttributeValues[':search']).toBe('Strike');
    expect(scanCall.ExpressionAttributeValues[':searchLower']).toBe('strike');
  });

  test('should handle actionCategory filter', async () => {
    const event = {
      filter: {
        actionCategory: 'ATTACK'
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#actionCategory = :actionCategory');
    expect(scanCall.ExpressionAttributeValues[':actionCategory']).toBe('ATTACK');
  });

  test('should handle difficulty range filter', async () => {
    const event = {
      filter: {
        difficultyMin: 8,
        difficultyMax: 15
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#difficulty.#baseValue BETWEEN :difficultyMin AND :difficultyMax');
    expect(scanCall.ExpressionAttributeValues[':difficultyMin']).toBe(8);
    expect(scanCall.ExpressionAttributeValues[':difficultyMax']).toBe(15);
  });

  test('should handle multiple filters combined', async () => {
    const event = {
      filter: {
        search: 'Attack',
        actionCategory: 'ATTACK',
        difficultyMin: 10
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('contains(#name, :search)');
    expect(scanCall.FilterExpression).toContain('#actionCategory = :actionCategory');
    expect(scanCall.FilterExpression).toContain('#difficulty.#baseValue >= :difficultyMin');
  });

  test('should return next cursor when more items available', async () => {
    mockSend.mockResolvedValue({
      Items: mockActions,
      Count: 2,
      ScannedCount: 2,
      LastEvaluatedKey: { actionId: 'action2' }
    });

    const event = {};
    const result = await handler(event);

    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).toBeDefined();
  });

  test('should indicate no more items when at end', async () => {
    mockSend.mockResolvedValue({
      Items: mockActions,
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
    delete process.env.ACTIONS_TABLE_NAME;

    const event = {};

    await expect(handler(event)).rejects.toThrow();
  });

  test('should handle case-insensitive search', async () => {
    const event = {
      filter: {
        search: 'STRIKE'
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.ExpressionAttributeValues[':searchLower']).toBe('strike');
  });

  test('should handle partial difficulty range (only min)', async () => {
    const event = {
      filter: {
        difficultyMin: 8
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#difficulty.#baseValue >= :difficultyMin');
    expect(scanCall.FilterExpression).not.toContain('BETWEEN');
  });

  test('should handle partial difficulty range (only max)', async () => {
    const event = {
      filter: {
        difficultyMax: 15
      }
    };

    await handler(event);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#difficulty.#baseValue <= :difficultyMax');
    expect(scanCall.FilterExpression).not.toContain('BETWEEN');
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

  test('should handle sorting by difficulty descending', async () => {
    const event = {
      filter: {
        sort: {
          field: 'difficulty',
          direction: 'DESC'
        }
      }
    };

    const result = await handler(event);
    expect(result.items).toBeDefined();
  });
});