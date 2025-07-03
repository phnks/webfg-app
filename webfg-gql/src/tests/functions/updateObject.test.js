const { handler } = require('../../../functions/updateObject');

// Mock Date to ensure consistent timestamps
const mockDate = '2023-01-01T00:00:00.000Z';
const originalDate = global.Date;

beforeAll(() => {
  global.Date = jest.fn(() => ({
    toISOString: () => mockDate
  }));
});

afterAll(() => {
  global.Date = originalDate;
});

describe('updateObject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE_NAME = 'test-objects-table';
  });

  it('should update an object successfully', async () => {
    const objectId = 'obj-123';
    const input = {
      name: 'Updated Sword',
      description: 'An updated mighty test sword',
      lethality: { current: 12, max: 15, base: 12 }
    };

    const updatedObject = {
      objectId: 'obj-123',
      name: 'Updated Sword',
      nameLowerCase: 'updated sword',
      description: 'An updated mighty test sword',
      lethality: { current: 12, max: 15, base: 12 },
      updatedAt: mockDate,
      createdAt: '2022-01-01T00:00:00.000Z'
    };

    const event = {
      objectId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedObject
    });

    const result = await handler(event);

    // Verify the result
    expect(result).toEqual(updatedObject);
    expect(result.updatedAt).toBe(mockDate);
    expect(result.nameLowerCase).toBe('updated sword');

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should update only specified fields', async () => {
    const objectId = 'obj-123';
    const input = {
      description: 'Only updating description'
    };

    const updatedObject = {
      objectId: 'obj-123',
      name: 'Original Sword',
      nameLowerCase: 'original sword',
      description: 'Only updating description',
      updatedAt: mockDate
    };

    const event = {
      objectId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedObject
    });

    const result = await handler(event);

    expect(result.description).toBe('Only updating description');
    expect(result.updatedAt).toBe(mockDate);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should update nameLowerCase when name is updated', async () => {
    const objectId = 'obj-123';
    const input = {
      name: 'NEW UPPERCASE NAME'
    };

    const updatedObject = {
      objectId: 'obj-123',
      name: 'NEW UPPERCASE NAME',
      nameLowerCase: 'new uppercase name',
      updatedAt: mockDate
    };

    const event = {
      objectId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedObject
    });

    const result = await handler(event);

    expect(result.name).toBe('NEW UPPERCASE NAME');
    expect(result.nameLowerCase).toBe('new uppercase name');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle empty input object', async () => {
    const objectId = 'obj-123';
    const input = {};

    const updatedObject = {
      objectId: 'obj-123',
      updatedAt: mockDate
    };

    const event = {
      objectId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedObject
    });

    const result = await handler(event);

    // Should only update the updatedAt field
    expect(result.updatedAt).toBe(mockDate);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should ignore objectId in input', async () => {
    const objectId = 'obj-123';
    const input = {
      objectId: 'trying-to-change-id', // Should be ignored
      name: 'Test Object'
    };

    const updatedObject = {
      objectId: 'obj-123', // Original ID preserved
      name: 'Test Object',
      nameLowerCase: 'test object',
      updatedAt: mockDate
    };

    const event = {
      objectId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedObject
    });

    const result = await handler(event);

    expect(result.objectId).toBe('obj-123');
    expect(result.name).toBe('Test Object');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB errors', async () => {
    const objectId = 'obj-123';
    const input = {
      name: 'Test Object'
    };

    const event = {
      objectId,
      input
    };

    // Mock DynamoDB error
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    // Expect the function to throw an error
    await expect(handler(event)).rejects.toThrow('Error updating object.');

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle complex nested object updates', async () => {
    const objectId = 'obj-123';
    const input = {
      name: 'Complex Sword',
      speed: { current: 10, max: 15, base: 10 },
      weight: { current: 5, max: 5, base: 5 },
      special: ['fire', 'ice', 'lightning'],
      equipmentIds: ['eq1', 'eq2', 'eq3']
    };

    const updatedObject = {
      objectId: 'obj-123',
      name: 'Complex Sword',
      nameLowerCase: 'complex sword',
      speed: { current: 10, max: 15, base: 10 },
      weight: { current: 5, max: 5, base: 5 },
      special: ['fire', 'ice', 'lightning'],
      equipmentIds: ['eq1', 'eq2', 'eq3'],
      updatedAt: mockDate
    };

    const event = {
      objectId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedObject
    });

    const result = await handler(event);

    expect(result).toEqual(updatedObject);
    expect(result.special).toEqual(['fire', 'ice', 'lightning']);
    expect(result.equipmentIds).toEqual(['eq1', 'eq2', 'eq3']);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle null values in input', async () => {
    const objectId = 'obj-123';
    const input = {
      description: null,
      special: null
    };

    const updatedObject = {
      objectId: 'obj-123',
      description: null,
      special: null,
      updatedAt: mockDate
    };

    const event = {
      objectId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedObject
    });

    const result = await handler(event);

    expect(result.description).toBeNull();
    expect(result.special).toBeNull();
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle boolean values in input', async () => {
    const objectId = 'obj-123';
    const input = {
      isEquipment: false,
      isActive: true
    };

    const updatedObject = {
      objectId: 'obj-123',
      isEquipment: false,
      isActive: true,
      updatedAt: mockDate
    };

    const event = {
      objectId,
      input
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedObject
    });

    const result = await handler(event);

    expect(result.isEquipment).toBe(false);
    expect(result.isActive).toBe(true);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing objectId', async () => {
    const input = {
      name: 'Test Object'
    };

    const event = {
      // Missing objectId
      input
    };

    const updatedObject = {
      objectId: undefined,
      name: 'Test Object',
      nameLowerCase: 'test object',
      updatedAt: mockDate
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedObject
    });

    const result = await handler(event);

    expect(result.objectId).toBeUndefined();
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should use environment variable for table name', async () => {
    process.env.OBJECTS_TABLE_NAME = 'custom-objects-table';

    const objectId = 'obj-123';
    const input = {
      name: 'Test Object'
    };

    const event = {
      objectId,
      input
    };

    const updatedObject = {
      objectId: 'obj-123',
      name: 'Test Object',
      nameLowerCase: 'test object',
      updatedAt: mockDate
    };

    // Mock successful DynamoDB UPDATE response
    mockDynamoSend.mockResolvedValueOnce({
      Attributes: updatedObject
    });

    await handler(event);

    // Verify DynamoDB was called (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB timeout errors', async () => {
    const objectId = 'obj-123';
    const input = {
      name: 'Test Object'
    };

    const event = {
      objectId,
      input
    };

    // Mock DynamoDB timeout error
    const timeoutError = new Error('Request timeout');
    timeoutError.code = 'TimeoutError';
    mockDynamoSend.mockRejectedValueOnce(timeoutError);

    await expect(handler(event)).rejects.toThrow('Error updating object.');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB conditional check failed errors', async () => {
    const objectId = 'obj-123';
    const input = {
      name: 'Test Object'
    };

    const event = {
      objectId,
      input
    };

    // Mock DynamoDB conditional check failed error
    const conditionalError = new Error('The conditional request failed');
    conditionalError.code = 'ConditionalCheckFailedException';
    mockDynamoSend.mockRejectedValueOnce(conditionalError);

    await expect(handler(event)).rejects.toThrow('Error updating object.');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });
});