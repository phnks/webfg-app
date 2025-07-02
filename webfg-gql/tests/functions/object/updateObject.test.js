const { handler } = require('../../../functions/updateObject');

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

describe('updateObject Lambda function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE_NAME = 'test-objects-table';
    
    mockSend.mockResolvedValue({
      Attributes: {
        objectId: 'obj123',
        name: 'Updated Sword',
        description: 'An updated magical sword',
        updatedAt: '2024-01-01T12:00:00.000Z'
      }
    });
  });

  afterEach(() => {
    delete process.env.OBJECTS_TABLE_NAME;
  });

  test('should update object successfully', async () => {
    const mockEvent = {
      objectId: 'obj123',
      input: {
        name: 'Updated Sword',
        description: 'An updated magical sword'
      }
    };

    const result = await handler(mockEvent);

    expect(UpdateCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result.objectId).toBe('obj123');
    expect(result.name).toBe('Updated Sword');
    expect(result.description).toBe('An updated magical sword');
  });

  test('should update nameLowerCase when name is updated', async () => {
    const mockEvent = {
      objectId: 'obj123',
      input: {
        name: 'MAGIC SWORD'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':nameLowerCase']).toBe('magic sword');
    expect(updateCall.UpdateExpression).toContain('#nameLowerCase = :nameLowerCase');
  });

  test('should set updatedAt timestamp', async () => {
    const beforeTime = Date.now();
    
    const mockEvent = {
      objectId: 'obj123',
      input: {
        description: 'Updated description'
      }
    };

    await handler(mockEvent);
    const afterTime = Date.now();

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.UpdateExpression).toContain('#updatedAt = :updatedAt');
    
    const updatedAt = new Date(updateCall.ExpressionAttributeValues[':updatedAt']).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(beforeTime);
    expect(updatedAt).toBeLessThanOrEqual(afterTime);
  });

  test('should handle multiple field updates', async () => {
    const mockEvent = {
      objectId: 'obj123',
      input: {
        name: 'Multi Sword',
        description: 'A sword with multiple updates',
        weight: { baseValue: 5, currentValue: 5 },
        lethality: { baseValue: 15, currentValue: 15 }
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':name']).toBe('Multi Sword');
    expect(updateCall.ExpressionAttributeValues[':description']).toBe('A sword with multiple updates');
    expect(updateCall.ExpressionAttributeValues[':weight']).toEqual({ baseValue: 5, currentValue: 5 });
    expect(updateCall.ExpressionAttributeValues[':lethality']).toEqual({ baseValue: 15, currentValue: 15 });
  });

  test('should ignore objectId in input', async () => {
    const mockEvent = {
      objectId: 'obj123',
      input: {
        objectId: 'should-be-ignored',
        name: 'Test Object'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.Key.objectId).toBe('obj123');
    expect(updateCall.ExpressionAttributeValues[':objectId']).toBeUndefined();
    expect(updateCall.UpdateExpression).not.toContain('#objectId');
  });

  test('should handle empty input', async () => {
    const mockEvent = {
      objectId: 'obj123',
      input: {}
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    // Should only have updatedAt
    expect(updateCall.UpdateExpression).toBe('SET #updatedAt = :updatedAt');
    expect(updateCall.ExpressionAttributeValues[':updatedAt']).toBeDefined();
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const mockEvent = {
      objectId: 'obj123',
      input: {
        name: 'Error Object'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Error updating object.');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.OBJECTS_TABLE_NAME;

    const mockEvent = {
      objectId: 'obj123',
      input: {
        name: 'Test Object'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.TableName).toBeUndefined();
  });

  test('should handle null input values', async () => {
    const mockEvent = {
      objectId: 'obj123',
      input: {
        description: null,
        weight: null
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':description']).toBeNull();
    expect(updateCall.ExpressionAttributeValues[':weight']).toBeNull();
  });

  test('should use correct table name and key', async () => {
    const mockEvent = {
      objectId: 'test-obj-456',
      input: {
        name: 'Table Test'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.TableName).toBe('test-objects-table');
    expect(updateCall.Key).toEqual({ objectId: 'test-obj-456' });
  });

  test('should return ALL_NEW values', async () => {
    const mockEvent = {
      objectId: 'obj123',
      input: {
        name: 'Return Test'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ReturnValues).toBe('ALL_NEW');
  });

  test('should handle complex nested object updates', async () => {
    const complexInput = {
      attributes: {
        strength: { baseValue: 10, currentValue: 12 },
        dexterity: { baseValue: 8, currentValue: 8 }
      },
      metadata: {
        source: 'test',
        tags: ['weapon', 'magical']
      }
    };

    const mockEvent = {
      objectId: 'obj123',
      input: complexInput
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':attributes']).toEqual(complexInput.attributes);
    expect(updateCall.ExpressionAttributeValues[':metadata']).toEqual(complexInput.metadata);
  });

  test('should handle special characters in object name', async () => {
    const mockEvent = {
      objectId: 'obj123',
      input: {
        name: "Sir Arthur's +5 Sword of Demon Slaying (Legendary)"
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':nameLowerCase']).toBe("sir arthur's +5 sword of demon slaying (legendary)");
  });
});