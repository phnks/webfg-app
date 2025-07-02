const { handler } = require('../../../functions/resolveCharacterObjects');

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
  ScanCommand: jest.fn()
}));

const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('resolveCharacterObjects resolver', () => {
  const mockObjects = [
    {
      objectId: 'obj1',
      name: 'Iron Sword',
      characterId: 'char123'
    },
    {
      objectId: 'obj2',
      name: 'Leather Armor',
      characterId: 'char123'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE = 'test-objects-table';
    
    mockSend.mockResolvedValue({
      Items: mockObjects
    });
  });

  afterEach(() => {
    delete process.env.OBJECTS_TABLE;
  });

  test('should resolve objects for character', async () => {
    const mockEvent = {
      parent: {
        characterId: 'char123'
      }
    };

    const result = await handler(mockEvent);

    expect(ScanCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result).toEqual(mockObjects);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.FilterExpression).toContain('#characterId = :characterId');
    expect(scanCall.ExpressionAttributeValues[':characterId']).toBe('char123');
  });

  test('should handle character with no objects', async () => {
    mockSend.mockResolvedValue({
      Items: []
    });

    const mockEvent = {
      parent: {
        characterId: 'char123'
      }
    };

    const result = await handler(mockEvent);

    expect(result).toEqual([]);
  });

  test('should handle missing character ID', async () => {
    const mockEvent = {
      parent: {}
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle missing parent', async () => {
    const mockEvent = {};

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const mockEvent = {
      parent: {
        characterId: 'char123'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.OBJECTS_TABLE;

    const mockEvent = {
      parent: {
        characterId: 'char123'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle null parent', async () => {
    const mockEvent = {
      parent: null
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should filter objects by character ID correctly', async () => {
    const mockEvent = {
      parent: {
        characterId: 'different-char'
      }
    };

    await handler(mockEvent);

    const scanCall = ScanCommand.mock.calls[0][0];
    expect(scanCall.ExpressionAttributeValues[':characterId']).toBe('different-char');
  });
});