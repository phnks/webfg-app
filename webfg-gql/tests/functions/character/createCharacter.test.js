const { handler } = require('../../../functions/createCharacter');

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
  v4: jest.fn(() => 'test-uuid-123')
}));

const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('createCharacter Lambda function', () => {
  const mockEvent = {
    input: {
      name: 'Test Character',
      characterCategory: 'HUMAN',
      will: 10,
      fatigue: 2,
      values: [{ name: 'Courage', value: 15 }],
      speed: { baseValue: 5, currentValue: 5 },
      weight: { baseValue: 70, currentValue: 70 },
      size: { baseValue: 6, currentValue: 6 },
      armour: { baseValue: 3, currentValue: 3 },
      endurance: { baseValue: 12, currentValue: 12 },
      lethality: { baseValue: 8, currentValue: 8 },
      strength: { baseValue: 14, currentValue: 14 },
      dexterity: { baseValue: 13, currentValue: 13 },
      agility: { baseValue: 11, currentValue: 11 },
      perception: { baseValue: 9, currentValue: 9 },
      intensity: { baseValue: 7, currentValue: 7 },
      resolve: { baseValue: 16, currentValue: 16 },
      morale: { baseValue: 10, currentValue: 10 },
      intelligence: { baseValue: 12, currentValue: 12 },
      charisma: { baseValue: 8, currentValue: 8 }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
    mockSend.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.CHARACTERS_TABLE;
  });

  test('should create a character successfully', async () => {
    const result = await handler(mockEvent);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));

    // Verify the PutCommand was called with correct parameters
    const putCommand = mockSend.mock.calls[0][0];
    expect(putCommand.input.TableName).toBe('test-characters-table');
    expect(putCommand.input.Item.characterId).toBe('test-uuid-123');
    expect(putCommand.input.Item.name).toBe('Test Character');
    expect(putCommand.input.Item.nameLowerCase).toBe('test character');
    expect(putCommand.input.Item.characterCategory).toBe('HUMAN');

    // Verify the response
    expect(result.characterId).toBe('test-uuid-123');
    expect(result.name).toBe('Test Character');
    expect(result.characterCategory).toBe('HUMAN');
  });

  test('should handle minimal input with defaults', async () => {
    const minimalEvent = {
      input: {
        name: 'Minimal Character',
        characterCategory: 'ELF'
      }
    };

    await handler(minimalEvent);

    const putCommand = mockSend.mock.calls[0][0];
    expect(putCommand.input.Item.will).toBe(0);
    expect(putCommand.input.Item.fatigue).toBe(0);
    expect(putCommand.input.Item.values).toEqual([]);
    expect(putCommand.input.Item.name).toBe('Minimal Character');
    expect(putCommand.input.Item.nameLowerCase).toBe('minimal character');
  });

  test('should throw error when CHARACTERS_TABLE environment variable is not set', async () => {
    delete process.env.CHARACTERS_TABLE;

    await expect(handler(mockEvent)).rejects.toThrow('Internal server error.');
  });

  test('should handle DynamoDB errors', async () => {
    const dynamoError = new Error('DynamoDB connection failed');
    mockSend.mockRejectedValue(dynamoError);

    await expect(handler(mockEvent)).rejects.toThrow('DynamoDB connection failed');
  });

  test('should handle empty input gracefully', async () => {
    const emptyEvent = {
      input: {}
    };

    await expect(handler(emptyEvent)).rejects.toThrow();
  });

  test('should set createdAt and updatedAt timestamps', async () => {
    const beforeTime = Date.now();
    await handler(mockEvent);
    const afterTime = Date.now();

    const putCommand = mockSend.mock.calls[0][0];
    const createdAt = putCommand.input.Item.createdAt;
    const updatedAt = putCommand.input.Item.updatedAt;

    expect(createdAt).toBeDefined();
    expect(updatedAt).toBeDefined();
    expect(createdAt).toBe(updatedAt);
    expect(createdAt).toBeGreaterThanOrEqual(beforeTime);
    expect(createdAt).toBeLessThanOrEqual(afterTime);
  });

  test('should handle character with equipment and conditions', async () => {
    const eventWithEquipment = {
      input: {
        ...mockEvent.input,
        equipment: [{ objectId: 'sword-1', quantity: 1 }],
        conditions: [{ conditionId: 'poisoned', amount: 3 }],
        actions: [{ actionId: 'attack-1' }]
      }
    };

    await handler(eventWithEquipment);

    const putCommand = mockSend.mock.calls[0][0];
    expect(putCommand.input.Item.equipment).toEqual([{ objectId: 'sword-1', quantity: 1 }]);
    expect(putCommand.input.Item.conditions).toEqual([{ conditionId: 'poisoned', amount: 3 }]);
    expect(putCommand.input.Item.actions).toEqual([{ actionId: 'attack-1' }]);
  });

  test('should handle special characters in name', async () => {
    const eventWithSpecialName = {
      input: {
        name: "Théoden O'Reilly-Smith",
        characterCategory: 'HUMAN'
      }
    };

    await handler(eventWithSpecialName);

    const putCommand = mockSend.mock.calls[0][0];
    expect(putCommand.input.Item.name).toBe("Théoden O'Reilly-Smith");
    expect(putCommand.input.Item.nameLowerCase).toBe("théoden o'reilly-smith");
  });

  test('should preserve attribute structure', async () => {
    await handler(mockEvent);

    const putCommand = mockSend.mock.calls[0][0];
    const item = putCommand.input.Item;

    // Check that complex attributes are preserved
    expect(item.speed).toEqual({ baseValue: 5, currentValue: 5 });
    expect(item.strength).toEqual({ baseValue: 14, currentValue: 14 });
    expect(item.values).toEqual([{ name: 'Courage', value: 15 }]);
  });
});