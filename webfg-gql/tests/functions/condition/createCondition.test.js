const { handler } = require('../../../functions/createCondition');

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
  v4: jest.fn(() => 'test-condition-uuid-123')
}));

const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('createCondition Lambda function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONDITIONS_TABLE = 'test-conditions-table';
    mockSend.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.CONDITIONS_TABLE;
  });

  const mockConditionEvent = {
    input: {
      name: 'Strength Boost',
      conditionType: 'BUFF',
      conditionTarget: 'STRENGTH',
      amount: 5,
      description: 'Increases strength temporarily'
    }
  };

  test('should create condition successfully', async () => {
    const result = await handler(mockConditionEvent);

    expect(PutCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result.conditionId).toBe('test-condition-uuid-123');
    expect(result.name).toBe('Strength Boost');
    expect(result.conditionType).toBe('BUFF');
    expect(result.conditionTarget).toBe('STRENGTH');
    expect(result.amount).toBe(5);
  });

  test('should handle minimal input with defaults', async () => {
    const minimalEvent = {
      input: {
        name: 'Simple Condition',
        conditionType: 'DEBUFF',
        conditionTarget: 'DEXTERITY',
        amount: -2
      }
    };

    const result = await handler(minimalEvent);

    expect(result.name).toBe('Simple Condition');
    expect(result.conditionType).toBe('DEBUFF');
    expect(result.conditionTarget).toBe('DEXTERITY');
    expect(result.amount).toBe(-2);
  });

  test('should handle missing required fields', async () => {
    const invalidEvent = {
      input: {
        description: 'Missing required fields'
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

    await expect(handler(mockConditionEvent)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.CONDITIONS_TABLE;

    await expect(handler(mockConditionEvent)).rejects.toThrow();
  });

  test('should set timestamps', async () => {
    const beforeTime = Date.now();
    await handler(mockConditionEvent);
    const afterTime = Date.now();

    const putCall = PutCommand.mock.calls[0][0];
    const item = putCall.Item;
    
    expect(item.createdAt).toBeDefined();
    expect(item.updatedAt).toBeDefined();
    expect(new Date(item.createdAt).getTime()).toBeGreaterThanOrEqual(beforeTime);
    expect(new Date(item.createdAt).getTime()).toBeLessThanOrEqual(afterTime);
  });

  test('should handle different condition types', async () => {
    const statusEvent = {
      input: {
        name: 'Poisoned',
        conditionType: 'STATUS',
        conditionTarget: 'ENDURANCE',
        amount: -1,
        description: 'Character is poisoned'
      }
    };

    const result = await handler(statusEvent);

    expect(result.conditionType).toBe('STATUS');
    expect(result.amount).toBe(-1);
  });

  test('should handle zero amount conditions', async () => {
    const neutralEvent = {
      input: {
        name: 'Neutral Effect',
        conditionType: 'BUFF',
        conditionTarget: 'STRENGTH',
        amount: 0
      }
    };

    const result = await handler(neutralEvent);

    expect(result.amount).toBe(0);
  });

  test('should handle conditions with different targets', async () => {
    const targets = ['STRENGTH', 'DEXTERITY', 'ARMOUR', 'ENDURANCE', 'LETHALITY'];
    
    for (const target of targets) {
      const event = {
        input: {
          name: `${target} Condition`,
          conditionType: 'BUFF',
          conditionTarget: target,
          amount: 3
        }
      };

      const result = await handler(event);
      expect(result.conditionTarget).toBe(target);
    }
  });

  test('should handle missing input object', async () => {
    const noInputEvent = {};

    await expect(handler(noInputEvent)).rejects.toThrow();
  });

  test('should handle string amount conversion', async () => {
    const stringAmountEvent = {
      input: {
        name: 'String Amount Condition',
        conditionType: 'BUFF',
        conditionTarget: 'STRENGTH',
        amount: '7' // String instead of number
      }
    };

    const result = await handler(stringAmountEvent);

    expect(typeof result.amount).toBe('number');
    expect(result.amount).toBe(7);
  });

  test('should handle condition with long description', async () => {
    const longDescEvent = {
      input: {
        name: 'Complex Condition',
        conditionType: 'BUFF',
        conditionTarget: 'INTELLIGENCE',
        amount: 4,
        description: 'This is a very long description that explains in great detail what this condition does and how it affects the character in various situations and circumstances.'
      }
    };

    const result = await handler(longDescEvent);

    expect(result.description).toContain('very long description');
    expect(result.description.length).toBeGreaterThan(100);
  });

  test('should handle special characters in name', async () => {
    const specialCharEvent = {
      input: {
        name: 'Mage\'s Blessing (+Magic)',
        conditionType: 'BUFF',
        conditionTarget: 'INTELLIGENCE',
        amount: 3
      }
    };

    const result = await handler(specialCharEvent);

    expect(result.name).toBe('Mage\'s Blessing (+Magic)');
  });

  test('should handle negative amounts for debuffs', async () => {
    const debuffEvent = {
      input: {
        name: 'Weakness',
        conditionType: 'DEBUFF',
        conditionTarget: 'STRENGTH',
        amount: -5
      }
    };

    const result = await handler(debuffEvent);

    expect(result.amount).toBe(-5);
    expect(result.conditionType).toBe('DEBUFF');
  });

  test('should handle large positive amounts', async () => {
    const buffEvent = {
      input: {
        name: 'Divine Strength',
        conditionType: 'BUFF',
        conditionTarget: 'STRENGTH',
        amount: 50
      }
    };

    const result = await handler(buffEvent);

    expect(result.amount).toBe(50);
  });
});