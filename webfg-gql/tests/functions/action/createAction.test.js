const { handler } = require('../../../functions/createAction');

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
  PutCommand: jest.fn()
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => 'test-action-uuid-123')
}));

const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('createAction Lambda function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACTIONS_TABLE = 'test-actions-table';
    mockSend.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.ACTIONS_TABLE;
  });

  const mockActionEvent = {
    input: {
      name: 'Strike',
      actionCategory: 'ATTACK',
      description: 'A basic attack',
      difficulty: { baseValue: 15, currentValue: 15 },
      damage: { baseValue: 8, currentValue: 8 }
    }
  };

  test('should create action successfully', async () => {
    const result = await handler(mockActionEvent);

    expect(PutCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result.actionId).toBe('test-action-uuid-123');
    expect(result.name).toBe('Strike');
    expect(result.actionCategory).toBe('ATTACK');
    expect(result.nameLowerCase).toBe('strike');
  });

  test('should handle minimal input with defaults', async () => {
    const minimalEvent = {
      input: {
        name: 'Simple Action',
        actionCategory: 'SKILL'
      }
    };

    const result = await handler(minimalEvent);

    expect(result.name).toBe('Simple Action');
    expect(result.actionCategory).toBe('SKILL');
  });

  test('should handle missing required fields', async () => {
    const invalidEvent = {
      input: {
        description: 'Missing name and category'
      }
    };

    await expect(handler(invalidEvent)).rejects.toThrow();
  });

  test('should handle empty input', async () => {
    const emptyEvent = {
      input: {}
    };

    await expect(handler(emptyEvent)).rejects.toThrow();
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    await expect(handler(mockActionEvent)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.ACTIONS_TABLE;

    await expect(handler(mockActionEvent)).rejects.toThrow();
  });

  test('should set timestamps', async () => {
    const beforeTime = Date.now();
    await handler(mockActionEvent);
    const afterTime = Date.now();

    const putCall = PutCommand.mock.calls[0][0];
    const item = putCall.Item;
    
    expect(item.createdAt).toBeDefined();
    expect(item.updatedAt).toBeDefined();
    expect(new Date(item.createdAt).getTime()).toBeGreaterThanOrEqual(beforeTime);
    expect(new Date(item.createdAt).getTime()).toBeLessThanOrEqual(afterTime);
  });

  test('should handle complex action with all attributes', async () => {
    const complexEvent = {
      input: {
        name: 'Fireball',
        actionCategory: 'SPELL',
        description: 'A powerful fire spell',
        difficulty: { baseValue: 20, currentValue: 20 },
        damage: { baseValue: 15, currentValue: 15 },
        range: { baseValue: 30, currentValue: 30 },
        duration: { baseValue: 5, currentValue: 5 }
      }
    };

    const result = await handler(complexEvent);

    expect(result.name).toBe('Fireball');
    expect(result.difficulty).toEqual({ baseValue: 20, currentValue: 20 });
    expect(result.damage).toEqual({ baseValue: 15, currentValue: 15 });
    expect(result.range).toEqual({ baseValue: 30, currentValue: 30 });
  });

  test('should handle missing input object', async () => {
    const noInputEvent = {};

    await expect(handler(noInputEvent)).rejects.toThrow();
  });

  test('should convert name to lowercase for nameLowerCase field', async () => {
    const upperCaseEvent = {
      input: {
        name: 'POWER STRIKE',
        actionCategory: 'ATTACK'
      }
    };

    const result = await handler(upperCaseEvent);

    expect(result.nameLowerCase).toBe('power strike');
  });

  test('should handle special characters in name', async () => {
    const specialCharEvent = {
      input: {
        name: 'Spell: Lightning Bolt!',
        actionCategory: 'SPELL'
      }
    };

    const result = await handler(specialCharEvent);

    expect(result.name).toBe('Spell: Lightning Bolt!');
    expect(result.nameLowerCase).toBe('spell: lightning bolt!');
  });
});