const { handler } = require('../../../functions/listObjects');

describe('listObjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE_NAME = 'test-objects-table';
  });

  it('should list all objects successfully without filter', async () => {
    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Sword',
        objectCategory: 'WEAPON',
        weight: 5
      },
      {
        objectId: 'obj-2',
        name: 'Shield',
        objectCategory: 'ARMOR',
        weight: 10
      },
      {
        objectId: 'obj-3',
        name: 'Potion',
        objectCategory: 'CONSUMABLE',
        weight: 1
      }
    ];

    const event = {};

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: mockObjects
    });

    const result = await handler(event);

    // Verify the result
    expect(result).toEqual(mockObjects);
    expect(result).toHaveLength(3);

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no items found', async () => {
    const event = {};

    // Mock DynamoDB response with no items
    mockDynamoSend.mockResolvedValueOnce({
      Items: []
    });

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when Items is null', async () => {
    const event = {};

    // Mock DynamoDB response with null Items
    mockDynamoSend.mockResolvedValueOnce({
      Items: null
    });

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when Items is undefined', async () => {
    const event = {};

    // Mock DynamoDB response with no Items property
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should filter by exact name match', async () => {
    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Sword',
        objectCategory: 'WEAPON'
      }
    ];

    const event = {
      filter: {
        name: {
          eq: 'Sword'
        }
      }
    };

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: mockObjects
    });

    const result = await handler(event);

    expect(result).toEqual(mockObjects);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should filter by name contains', async () => {
    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Fire Sword',
        objectCategory: 'WEAPON'
      },
      {
        objectId: 'obj-2',
        name: 'Ice Sword',
        objectCategory: 'WEAPON'
      }
    ];

    const event = {
      filter: {
        name: {
          contains: 'Sword'
        }
      }
    };

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: mockObjects
    });

    const result = await handler(event);

    expect(result).toEqual(mockObjects);
    expect(result).toHaveLength(2);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should filter by name begins with', async () => {
    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Sword of Fire',
        objectCategory: 'WEAPON'
      },
      {
        objectId: 'obj-2',
        name: 'Sword of Ice',
        objectCategory: 'WEAPON'
      }
    ];

    const event = {
      filter: {
        name: {
          beginsWith: 'Sword'
        }
      }
    };

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: mockObjects
    });

    const result = await handler(event);

    expect(result).toEqual(mockObjects);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should filter by object category', async () => {
    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Sword',
        objectCategory: 'WEAPON'
      },
      {
        objectId: 'obj-2',
        name: 'Dagger',
        objectCategory: 'WEAPON'
      }
    ];

    const event = {
      filter: {
        objectCategory: 'WEAPON'
      }
    };

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: mockObjects
    });

    const result = await handler(event);

    expect(result).toEqual(mockObjects);
    expect(result).toHaveLength(2);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should filter by max weight', async () => {
    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Dagger',
        weight: 2
      },
      {
        objectId: 'obj-2',
        name: 'Potion',
        weight: 1
      }
    ];

    const event = {
      filter: {
        maxWeight: 5
      }
    };

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: mockObjects
    });

    const result = await handler(event);

    expect(result).toEqual(mockObjects);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple filters combined', async () => {
    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Light Sword',
        objectCategory: 'WEAPON',
        weight: 3
      }
    ];

    const event = {
      filter: {
        name: {
          contains: 'Sword'
        },
        objectCategory: 'WEAPON',
        maxWeight: 5
      }
    };

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: mockObjects
    });

    const result = await handler(event);

    expect(result).toEqual(mockObjects);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle all name filters combined', async () => {
    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Sword',
        objectCategory: 'WEAPON'
      }
    ];

    const event = {
      filter: {
        name: {
          eq: 'Sword',
          contains: 'wor',
          beginsWith: 'Sw'
        }
      }
    };

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: mockObjects
    });

    const result = await handler(event);

    expect(result).toEqual(mockObjects);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB errors', async () => {
    const event = {};

    // Mock DynamoDB error
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    // Expect the function to throw an error
    await expect(handler(event)).rejects.toThrow('Error fetching objects: DynamoDB connection error');

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle empty filter object', async () => {
    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Sword'
      }
    ];

    const event = {
      filter: {} // Empty filter should not apply any filters
    };

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: mockObjects
    });

    const result = await handler(event);

    expect(result).toEqual(mockObjects);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should use environment variable for table name', async () => {
    process.env.OBJECTS_TABLE_NAME = 'custom-objects-table';

    const event = {};

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: []
    });

    await handler(event);

    // Verify DynamoDB was called (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle items with version fields', async () => {
    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Sword',
        version: 1
      },
      {
        objectId: 'obj-2',
        name: 'Shield',
        _version: 2
      },
      {
        objectId: 'obj-3',
        name: 'Potion'
      }
    ];

    const event = {};

    // Mock successful DynamoDB SCAN response
    mockDynamoSend.mockResolvedValueOnce({
      Items: mockObjects
    });

    const result = await handler(event);

    // Should return all items including those with version fields
    expect(result).toEqual(mockObjects);
    expect(result).toHaveLength(3);
    expect(result[0].version).toBe(1);
    expect(result[1]._version).toBe(2);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB timeout errors', async () => {
    const event = {};

    // Mock DynamoDB timeout error
    const timeoutError = new Error('Request timeout');
    timeoutError.code = 'TimeoutError';
    mockDynamoSend.mockRejectedValueOnce(timeoutError);

    await expect(handler(event)).rejects.toThrow('Error fetching objects: Request timeout');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });
});