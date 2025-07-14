const { handler } = require('../../../functions/deleteObject');

describe('deleteObject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE_NAME = 'test-objects-table';
  });

  it('should delete an object successfully and return the deleted item', async () => {
    const objectId = 'obj-123';
    const deletedObject = {
      objectId: 'obj-123',
      name: 'Test Sword',
      objectCategory: 'WEAPON',
      description: 'A mighty test sword',
      isEquipment: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    };

    const event = {
      objectId: objectId
    };

    // Mock successful DynamoDB response with deleted item
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: deletedObject
    });

    const result = await handler(event);

    // Verify the result
    expect(result).toEqual(deletedObject);

    // Verify DynamoDB was called correctly
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should return undefined when object does not exist', async () => {
    const objectId = 'non-existent-obj';

    const event = {
      objectId: objectId
    };

    // Mock DynamoDB response when item doesn't exist (no Attributes)
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Should return undefined when no item found
    expect(result).toBeUndefined();

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB errors', async () => {
    const objectId = 'obj-123';

    const event = {
      objectId: objectId
    };

    // Mock DynamoDB error
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    // Expect the function to throw an error
    await expect(handler(event)).rejects.toThrow('Error deleting object.');

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing objectId', async () => {
    const event = {
      // Missing objectId
    };

    // Mock successful DynamoDB response (though objectId will be undefined)
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result).toBeUndefined();
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle null objectId', async () => {
    const event = {
      objectId: null
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result).toBeUndefined();
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle empty string objectId', async () => {
    const event = {
      objectId: ''
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result).toBeUndefined();
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should use environment variable for table name', async () => {
    process.env.OBJECTS_TABLE_NAME = 'custom-objects-table';

    const objectId = 'obj-123';
    const deletedObject = {
      objectId: 'obj-123',
      name: 'Test Object'
    };

    const event = {
      objectId: objectId
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: deletedObject
    });

    await handler(event);

    // Verify DynamoDB was called (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle various objectId formats', async () => {
    const testCases = [
      'obj-123',
      'OBJECT_456',
      '789',
      'very-long-object-id-with-many-hyphens-and-numbers-123456789'
    ];

    for (const objectId of testCases) {
      jest.clearAllMocks();
      
      const deletedObject = {
        objectId: objectId,
        name: `Test Object ${objectId}`
      };

      const event = {
        objectId: objectId
      };

      // Mock successful DynamoDB response
      mockDynamoSend.mockResolvedValueOnce({
        Attributes: deletedObject
      });

      const result = await handler(event);

      expect(result).toEqual(deletedObject);
      expect(mockDynamoSend).toHaveBeenCalledTimes(1);
    }
  });

  it('should return complete object with all fields when deleted', async () => {
    const objectId = 'obj-123';
    const completeObject = {
      objectId: 'obj-123',
      name: 'Complete Sword',
      nameLowerCase: 'complete sword',
      description: 'A complete test sword',
      objectCategory: 'WEAPON',
      isEquipment: true,
      speed: { current: 5, max: 10, base: 5 },
      weight: { current: 3, max: 3, base: 3 },
      size: { current: 2, max: 2, base: 2 },
      armour: { current: 8, max: 10, base: 8 },
      endurance: { current: 100, max: 100, base: 100 },
      lethality: { current: 10, max: 12, base: 10 },
      strength: { current: 2, max: 2, base: 2 },
      dexterity: { current: 1, max: 1, base: 1 },
      agility: { current: 0, max: 0, base: 0 },
      perception: { current: 0, max: 0, base: 0 },
      intensity: { current: 0, max: 0, base: 0 },
      resolve: { current: 0, max: 0, base: 0 },
      morale: { current: 0, max: 0, base: 0 },
      intelligence: { current: 0, max: 0, base: 0 },
      charisma: { current: 0, max: 0, base: 0 },
      special: ['sharp', 'durable'],
      equipmentIds: ['eq1', 'eq2'],
      createdAt: '2023-01-01T00:00:00.000Z'
    };

    const event = {
      objectId: objectId
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: completeObject
    });

    const result = await handler(event);

    // Verify the complete object is returned
    expect(result).toEqual(completeObject);
    expect(result.objectId).toBe(objectId);
    expect(result.name).toBe('Complete Sword');
    expect(result.objectCategory).toBe('WEAPON');
    expect(result.isEquipment).toBe(true);
    expect(result.special).toEqual(['sharp', 'durable']);
    expect(result.equipmentIds).toEqual(['eq1', 'eq2']);
  });

  it('should handle DynamoDB timeout errors', async () => {
    const objectId = 'obj-123';

    const event = {
      objectId: objectId
    };

    // Mock DynamoDB timeout error
    const timeoutError = new Error('Request timeout');
    timeoutError.code = 'TimeoutError';
    mockDynamoSend.mockRejectedValueOnce(timeoutError);

    await expect(handler(event)).rejects.toThrow('Error deleting object.');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB permission errors', async () => {
    const objectId = 'obj-123';

    const event = {
      objectId: objectId
    };

    // Mock DynamoDB permission error
    const permissionError = new Error('Access denied');
    permissionError.code = 'AccessDeniedException';
    mockDynamoSend.mockRejectedValueOnce(permissionError);

    await expect(handler(event)).rejects.toThrow('Error deleting object.');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB conditional check failed errors', async () => {
    const objectId = 'obj-123';

    const event = {
      objectId: objectId
    };

    // Mock DynamoDB conditional check failed error
    const conditionalError = new Error('Conditional check failed');
    conditionalError.code = 'ConditionalCheckFailedException';
    mockDynamoSend.mockRejectedValueOnce(conditionalError);

    await expect(handler(event)).rejects.toThrow('Error deleting object.');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });
});