const { handler } = require('../../../functions/getActions');

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

describe('getActions Lambda function', () => {
  const mockActions = [
    {
      actionId: 'action1',
      name: 'Strike',
      actionCategory: 'ATTACK',
      difficulty: { baseValue: 12, currentValue: 12 }
    },
    {
      actionId: 'action2',
      name: 'Dodge',
      actionCategory: 'DEFENSE',
      difficulty: { baseValue: 10, currentValue: 10 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACTIONS_TABLE = 'test-actions-table';
    
    mockSend.mockResolvedValue({
      Responses: {
        'test-actions-table': mockActions
      }
    });
  });

  afterEach(() => {
    delete process.env.ACTIONS_TABLE;
  });

  test('should get actions by IDs successfully', async () => {
    const mockEvent = {
      arguments: {
        actionIds: ['action1', 'action2']
      }
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result).toEqual(mockActions);

    const batchCall = BatchGetCommand.mock.calls[0][0];
    expect(batchCall.RequestItems['test-actions-table'].Keys).toEqual([
      { actionId: 'action1' },
      { actionId: 'action2' }
    ]);
  });

  test('should return empty array for empty actionIds', async () => {
    const mockEvent = {
      arguments: {
        actionIds: []
      }
    };

    const result = await handler(mockEvent);

    expect(BatchGetCommand).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('should handle single action ID', async () => {
    const singleAction = [mockActions[0]];
    mockSend.mockResolvedValue({
      Responses: {
        'test-actions-table': singleAction
      }
    });

    const mockEvent = {
      arguments: {
        actionIds: ['action1']
      }
    };

    const result = await handler(mockEvent);

    expect(result).toEqual(singleAction);
  });

  test('should handle missing responses', async () => {
    mockSend.mockResolvedValue({
      Responses: {}
    });

    const mockEvent = {
      arguments: {
        actionIds: ['action1']
      }
    };

    const result = await handler(mockEvent);

    expect(result).toEqual([]);
  });

  test('should handle no responses property', async () => {
    mockSend.mockResolvedValue({});

    const mockEvent = {
      arguments: {
        actionIds: ['action1']
      }
    };

    const result = await handler(mockEvent);

    expect(result).toEqual([]);
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const mockEvent = {
      arguments: {
        actionIds: ['action1']
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.ACTIONS_TABLE;

    const mockEvent = {
      arguments: {
        actionIds: ['action1']
      }
    };

    // The function will use undefined as table name which should cause an error
    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle large number of action IDs', async () => {
    const manyIds = Array.from({ length: 50 }, (_, i) => `action${i}`);
    const manyActions = manyIds.map(id => ({
      actionId: id,
      name: `Action ${id}`,
      actionCategory: 'MISC'
    }));

    mockSend.mockResolvedValue({
      Responses: {
        'test-actions-table': manyActions
      }
    });

    const mockEvent = {
      arguments: {
        actionIds: manyIds
      }
    };

    const result = await handler(mockEvent);

    expect(result).toEqual(manyActions);
    expect(BatchGetCommand.mock.calls[0][0].RequestItems['test-actions-table'].Keys).toHaveLength(50);
  });

  test('should handle partial results', async () => {
    // Only return one action even though two were requested
    mockSend.mockResolvedValue({
      Responses: {
        'test-actions-table': [mockActions[0]]
      }
    });

    const mockEvent = {
      arguments: {
        actionIds: ['action1', 'action2']
      }
    };

    const result = await handler(mockEvent);

    expect(result).toEqual([mockActions[0]]);
  });

  test('should handle null or undefined actionIds', async () => {
    const mockEvent = {
      arguments: {
        actionIds: null
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle missing arguments', async () => {
    const mockEvent = {};

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should use correct table name in request', async () => {
    const mockEvent = {
      arguments: {
        actionIds: ['action1']
      }
    };

    await handler(mockEvent);

    const batchCall = BatchGetCommand.mock.calls[0][0];
    expect(Object.keys(batchCall.RequestItems)).toContain('test-actions-table');
  });
});