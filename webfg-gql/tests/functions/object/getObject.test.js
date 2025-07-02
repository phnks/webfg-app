const { handler } = require('../../../functions/getObject');

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
  GetCommand: jest.fn()
}));

const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('getObject Lambda function', () => {
  const mockObject = {
    objectId: 'obj123',
    name: 'Iron Sword',
    objectCategory: 'WEAPON',
    description: 'A sturdy iron blade',
    weight: { baseValue: 3, currentValue: 3 },
    lethality: { baseValue: 8, currentValue: 8 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE = 'test-objects-table';
    
    // Default successful response
    mockSend.mockResolvedValue({
      Item: mockObject
    });
  });

  afterEach(() => {
    delete process.env.OBJECTS_TABLE;
  });

  test('should get object successfully', async () => {
    const event = {
      objectId: 'obj123'
    };

    const result = await handler(event);

    expect(GetCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result).toEqual(mockObject);

    const getCall = GetCommand.mock.calls[0][0];
    expect(getCall.Key).toEqual({ objectId: 'obj123' });
  });

  test('should handle object not found', async () => {
    mockSend.mockResolvedValue({
      Item: undefined
    });

    const event = {
      objectId: 'nonexistent'
    };

    const result = await handler(event);

    expect(result).toBeNull();
  });

  test('should handle missing objectId', async () => {
    const event = {};

    await expect(handler(event)).rejects.toThrow();
  });

  test('should handle null objectId', async () => {
    const event = {
      objectId: null
    };

    await expect(handler(event)).rejects.toThrow();
  });

  test('should handle empty objectId', async () => {
    const event = {
      objectId: ''
    };

    await expect(handler(event)).rejects.toThrow();
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const event = {
      objectId: 'obj123'
    };

    await expect(handler(event)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.OBJECTS_TABLE;

    const event = {
      objectId: 'obj123'
    };

    await expect(handler(event)).rejects.toThrow();
  });

  test('should use correct table name', async () => {
    const event = {
      objectId: 'obj123'
    };

    await handler(event);

    const getCall = GetCommand.mock.calls[0][0];
    expect(getCall.TableName).toBe('test-objects-table');
  });

  test('should handle complex object data', async () => {
    const complexObject = {
      objectId: 'complex123',
      name: 'Enchanted Armor',
      objectCategory: 'ARMOR',
      description: 'Magical plate mail with runes',
      isEquipment: true,
      weight: { baseValue: 50, currentValue: 45 },
      size: { baseValue: 10, currentValue: 10 },
      armour: { baseValue: 15, currentValue: 18 },
      strength: { baseValue: 2, currentValue: 2 },
      parts: [
        { objectId: 'rune1', name: 'Strength Rune' }
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    };

    mockSend.mockResolvedValue({
      Item: complexObject
    });

    const event = {
      objectId: 'complex123'
    };

    const result = await handler(event);

    expect(result).toEqual(complexObject);
    expect(result.parts).toBeDefined();
    expect(result.armour).toEqual({ baseValue: 15, currentValue: 18 });
  });

  test('should preserve all object fields', async () => {
    const objectWithAllFields = {
      objectId: 'full123',
      name: 'Complete Object',
      nameLowerCase: 'complete object',
      objectCategory: 'ITEM',
      description: 'An object with all possible fields',
      isEquipment: false,
      characterId: 'char123',
      encounterId: 'enc123',
      speed: { baseValue: 1, currentValue: 1 },
      weight: { baseValue: 5, currentValue: 5 },
      size: { baseValue: 3, currentValue: 3 },
      armour: { baseValue: 0, currentValue: 0 },
      endurance: { baseValue: 10, currentValue: 8 },
      lethality: { baseValue: 0, currentValue: 0 },
      strength: { baseValue: 0, currentValue: 0 },
      dexterity: { baseValue: 0, currentValue: 0 },
      agility: { baseValue: 0, currentValue: 0 },
      perception: { baseValue: 0, currentValue: 0 },
      intensity: { baseValue: 0, currentValue: 0 },
      resolve: { baseValue: 0, currentValue: 0 },
      morale: { baseValue: 0, currentValue: 0 },
      intelligence: { baseValue: 0, currentValue: 0 },
      charisma: { baseValue: 0, currentValue: 0 }
    };

    mockSend.mockResolvedValue({
      Item: objectWithAllFields
    });

    const event = {
      objectId: 'full123'
    };

    const result = await handler(event);

    expect(result).toEqual(objectWithAllFields);
    expect(result.characterId).toBe('char123');
    expect(result.encounterId).toBe('enc123');
  });
});