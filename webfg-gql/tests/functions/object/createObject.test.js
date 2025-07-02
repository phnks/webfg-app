const { handler } = require('../../../functions/createObject');

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
  v4: jest.fn(() => 'test-object-uuid-123')
}));

const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

describe('createObject Lambda function', () => {
  const mockSend = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE = 'test-objects-table';
    DynamoDBDocumentClient.from.mockReturnValue({
      send: mockSend
    });
    mockSend.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.OBJECTS_TABLE;
  });

  const mockObjectEvent = {
    input: {
      name: 'Test Sword',
      objectCategory: 'WEAPON',
      description: 'A sharp blade',
      isEquipment: true,
      weight: { baseValue: 3, currentValue: 3 },
      size: { baseValue: 2, currentValue: 2 },
      lethality: { baseValue: 10, currentValue: 10 }
    }
  };

  test('should create object successfully', async () => {
    const result = await handler(mockObjectEvent);

    expect(PutCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result.objectId).toBe('test-object-uuid-123');
    expect(result.name).toBe('Test Sword');
    expect(result.objectCategory).toBe('WEAPON');
    expect(result.nameLowerCase).toBe('test sword');
  });

  test('should handle minimal input with defaults', async () => {
    const minimalEvent = {
      input: {
        name: 'Simple Object',
        objectCategory: 'ITEM'
      }
    };

    const result = await handler(minimalEvent);

    expect(result.name).toBe('Simple Object');
    expect(result.objectCategory).toBe('ITEM');
    expect(result.isEquipment).toBe(false);
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

    await expect(handler(mockObjectEvent)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.OBJECTS_TABLE;

    await expect(handler(mockObjectEvent)).rejects.toThrow();
  });

  test('should set timestamps', async () => {
    const beforeTime = Date.now();
    await handler(mockObjectEvent);
    const afterTime = Date.now();

    const putCall = PutCommand.mock.calls[0][0];
    const item = putCall.Item;
    
    expect(item.createdAt).toBeDefined();
    expect(item.updatedAt).toBeDefined();
    expect(new Date(item.createdAt).getTime()).toBeGreaterThanOrEqual(beforeTime);
    expect(new Date(item.createdAt).getTime()).toBeLessThanOrEqual(afterTime);
  });

  test('should handle complex object with all attributes', async () => {
    const complexEvent = {
      input: {
        name: 'Magic Armor',
        objectCategory: 'ARMOR',
        description: 'Enchanted plate mail',
        isEquipment: true,
        weight: { baseValue: 50, currentValue: 50 },
        size: { baseValue: 10, currentValue: 10 },
        armour: { baseValue: 15, currentValue: 15 },
        strength: { baseValue: 2, currentValue: 2 },
        dexterity: { baseValue: -1, currentValue: -1 }
      }
    };

    const result = await handler(complexEvent);

    expect(result.name).toBe('Magic Armor');
    expect(result.armour).toEqual({ baseValue: 15, currentValue: 15 });
    expect(result.strength).toEqual({ baseValue: 2, currentValue: 2 });
  });
});