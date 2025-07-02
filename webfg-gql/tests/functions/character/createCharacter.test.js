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
  v4: jest.fn(() => 'test-character-uuid-123')
}));

const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('createCharacter Lambda function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
    mockSend.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.CHARACTERS_TABLE;
  });

  const mockCharacterEvent = {
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
      intelligence: { baseValue: 12, currentValue: 12 }
    }
  };

  test('should create character successfully', async () => {
    const result = await handler(mockCharacterEvent);

    expect(PutCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result.characterId).toBe('test-character-uuid-123');
    expect(result.name).toBe('Test Character');
    expect(result.characterCategory).toBe('HUMAN');
    expect(result.nameLowerCase).toBe('test character');
  });

  test('should handle minimal input with defaults', async () => {
    const minimalEvent = {
      input: {
        name: 'Simple Character',
        characterCategory: 'ELF'
      }
    };

    const result = await handler(minimalEvent);

    expect(result.name).toBe('Simple Character');
    expect(result.characterCategory).toBe('ELF');
    expect(result.will).toBe(0); // Default value
    expect(result.fatigue).toBe(0); // Default value
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

    await expect(handler(mockCharacterEvent)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.CHARACTERS_TABLE;

    await expect(handler(mockCharacterEvent)).rejects.toThrow();
  });

  test('should set timestamps', async () => {
    const beforeTime = Date.now();
    await handler(mockCharacterEvent);
    const afterTime = Date.now();

    const putCall = PutCommand.mock.calls[0][0];
    const item = putCall.Item;
    
    expect(item.createdAt).toBeDefined();
    expect(item.updatedAt).toBeDefined();
    expect(new Date(item.createdAt).getTime()).toBeGreaterThanOrEqual(beforeTime);
    expect(new Date(item.createdAt).getTime()).toBeLessThanOrEqual(afterTime);
  });

  test('should handle character with values array', async () => {
    const characterWithValues = {
      input: {
        name: 'Valued Character',
        characterCategory: 'HUMAN',
        values: [
          { name: 'Honor', value: 18 },
          { name: 'Loyalty', value: 15 },
          { name: 'Courage', value: 20 }
        ]
      }
    };

    const result = await handler(characterWithValues);

    expect(result.values).toEqual([
      { name: 'Honor', value: 18 },
      { name: 'Loyalty', value: 15 },
      { name: 'Courage', value: 20 }
    ]);
  });

  test('should handle character with all attributes', async () => {
    const result = await handler(mockCharacterEvent);

    expect(result.strength).toEqual({ baseValue: 14, currentValue: 14 });
    expect(result.dexterity).toEqual({ baseValue: 13, currentValue: 13 });
    expect(result.speed).toEqual({ baseValue: 5, currentValue: 5 });
    expect(result.armour).toEqual({ baseValue: 3, currentValue: 3 });
  });

  test('should convert name to lowercase for nameLowerCase field', async () => {
    const upperCaseEvent = {
      input: {
        name: 'ARAGORN THE RANGER',
        characterCategory: 'HUMAN'
      }
    };

    const result = await handler(upperCaseEvent);

    expect(result.nameLowerCase).toBe('aragorn the ranger');
  });

  test('should handle special characters in name', async () => {
    const specialCharEvent = {
      input: {
        name: 'Elf\'en D\'artagnan',
        characterCategory: 'ELF'
      }
    };

    const result = await handler(specialCharEvent);

    expect(result.name).toBe('Elf\'en D\'artagnan');
    expect(result.nameLowerCase).toBe('elf\'en d\'artagnan');
  });

  test('should handle missing input object', async () => {
    const noInputEvent = {};

    await expect(handler(noInputEvent)).rejects.toThrow();
  });

  test('should handle null values in attributes', async () => {
    const eventWithNulls = {
      input: {
        name: 'Test Character',
        characterCategory: 'HUMAN',
        strength: null,
        dexterity: { baseValue: 10, currentValue: null }
      }
    };

    const result = await handler(eventWithNulls);

    expect(result.name).toBe('Test Character');
    // Should handle nulls gracefully
  });

  test('should handle zero values in attributes', async () => {
    const eventWithZeros = {
      input: {
        name: 'Weak Character',
        characterCategory: 'HUMAN',
        will: 0,
        fatigue: 0,
        strength: { baseValue: 0, currentValue: 0 }
      }
    };

    const result = await handler(eventWithZeros);

    expect(result.will).toBe(0);
    expect(result.fatigue).toBe(0);
    expect(result.strength).toEqual({ baseValue: 0, currentValue: 0 });
  });

  test('should handle empty values array', async () => {
    const eventWithEmptyValues = {
      input: {
        name: 'Valueless Character',
        characterCategory: 'HUMAN',
        values: []
      }
    };

    const result = await handler(eventWithEmptyValues);

    expect(result.values).toEqual([]);
  });
});