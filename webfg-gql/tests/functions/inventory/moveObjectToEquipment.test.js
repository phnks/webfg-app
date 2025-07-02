const { handler } = require('../../../functions/moveObjectToEquipment');

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
  UpdateCommand: jest.fn()
}));

const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('moveObjectToEquipment Lambda function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE = 'test-objects-table';
    
    mockSend.mockResolvedValue({
      Attributes: {
        objectId: 'obj123',
        name: 'Iron Sword',
        characterId: 'char123',
        isEquipped: true,
        isReady: false,
        isStashed: false
      }
    });
  });

  afterEach(() => {
    delete process.env.OBJECTS_TABLE;
  });

  const mockEvent = {
    objectId: 'obj123',
    characterId: 'char123'
  };

  test('should move object to equipment successfully', async () => {
    const result = await handler(mockEvent);

    expect(UpdateCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result.objectId).toBe('obj123');
    expect(result.characterId).toBe('char123');
    expect(result.isEquipped).toBe(true);
    expect(result.isReady).toBe(false);
    expect(result.isStashed).toBe(false);
  });

  test('should handle missing objectId', async () => {
    const invalidEvent = {
      characterId: 'char123'
    };

    await expect(handler(invalidEvent)).rejects.toThrow();
  });

  test('should handle missing characterId', async () => {
    const invalidEvent = {
      objectId: 'obj123'
    };

    await expect(handler(invalidEvent)).rejects.toThrow();
  });

  test('should handle empty event', async () => {
    const emptyEvent = {};

    await expect(handler(emptyEvent)).rejects.toThrow();
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    await expect(handler(mockEvent)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.OBJECTS_TABLE;

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should set correct update parameters', async () => {
    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.TableName).toBe('test-objects-table');
    expect(updateCall.Key).toEqual({
      objectId: 'obj123'
    });
    expect(updateCall.UpdateExpression).toContain('SET');
    expect(updateCall.UpdateExpression).toContain('#characterId = :characterId');
    expect(updateCall.UpdateExpression).toContain('#isEquipped = :isEquipped');
    expect(updateCall.UpdateExpression).toContain('#isReady = :isReady');
    expect(updateCall.UpdateExpression).toContain('#isStashed = :isStashed');
    
    expect(updateCall.ExpressionAttributeValues[':characterId']).toBe('char123');
    expect(updateCall.ExpressionAttributeValues[':isEquipped']).toBe(true);
    expect(updateCall.ExpressionAttributeValues[':isReady']).toBe(false);
    expect(updateCall.ExpressionAttributeValues[':isStashed']).toBe(false);
  });

  test('should handle null objectId', async () => {
    const nullEvent = {
      objectId: null,
      characterId: 'char123'
    };

    await expect(handler(nullEvent)).rejects.toThrow();
  });

  test('should handle null characterId', async () => {
    const nullEvent = {
      objectId: 'obj123',
      characterId: null
    };

    await expect(handler(nullEvent)).rejects.toThrow();
  });

  test('should handle empty string objectId', async () => {
    const emptyEvent = {
      objectId: '',
      characterId: 'char123'
    };

    await expect(handler(emptyEvent)).rejects.toThrow();
  });

  test('should handle empty string characterId', async () => {
    const emptyEvent = {
      objectId: 'obj123',
      characterId: ''
    };

    await expect(handler(emptyEvent)).rejects.toThrow();
  });

  test('should return updated object attributes', async () => {
    const complexResult = {
      objectId: 'complex123',
      name: 'Enchanted Sword',
      description: 'A magical blade',
      characterId: 'char456',
      isEquipped: true,
      isReady: false,
      isStashed: false,
      weight: { baseValue: 3, currentValue: 3 },
      lethality: { baseValue: 12, currentValue: 12 },
      updatedAt: '2024-01-01T12:00:00.000Z'
    };

    mockSend.mockResolvedValue({
      Attributes: complexResult
    });

    const complexEvent = {
      objectId: 'complex123',
      characterId: 'char456'
    };

    const result = await handler(complexEvent);

    expect(result).toEqual(complexResult);
    expect(result.weight).toEqual({ baseValue: 3, currentValue: 3 });
    expect(result.lethality).toEqual({ baseValue: 12, currentValue: 12 });
  });

  test('should handle object not found', async () => {
    mockSend.mockResolvedValue({
      Attributes: undefined
    });

    const result = await handler(mockEvent);

    expect(result).toBeUndefined();
  });

  test('should use return values ALL_NEW', async () => {
    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ReturnValues).toBe('ALL_NEW');
  });

  test('should handle special characters in IDs', async () => {
    const specialEvent = {
      objectId: 'obj-123_special',
      characterId: 'char-456_test'
    };

    await handler(specialEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.Key.objectId).toBe('obj-123_special');
    expect(updateCall.ExpressionAttributeValues[':characterId']).toBe('char-456_test');
  });

  test('should set updated timestamp', async () => {
    const beforeTime = Date.now();
    await handler(mockEvent);
    const afterTime = Date.now();

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.UpdateExpression).toContain('#updatedAt = :updatedAt');
    
    const updatedAt = new Date(updateCall.ExpressionAttributeValues[':updatedAt']).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(beforeTime);
    expect(updatedAt).toBeLessThanOrEqual(afterTime);
  });
});