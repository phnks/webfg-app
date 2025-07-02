const { handler } = require('../../../functions/deleteCharacter');

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
  DeleteCommand: jest.fn()
}));

const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('deleteCharacter Lambda function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
  });

  afterEach(() => {
    delete process.env.CHARACTERS_TABLE;
  });

  test('should delete character successfully', async () => {
    mockSend.mockResolvedValue({
      Attributes: {
        characterId: 'char123',
        name: 'Deleted Character'
      }
    });

    const mockEvent = {
      characterId: 'char123'
    };

    const result = await handler(mockEvent);

    expect(DeleteCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result.characterId).toBe('char123');
  });

  test('should handle missing characterId', async () => {
    const mockEvent = {};

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const mockEvent = {
      characterId: 'char123'
    };

    await expect(handler(mockEvent)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.CHARACTERS_TABLE;

    const mockEvent = {
      characterId: 'char123'
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle character not found', async () => {
    mockSend.mockResolvedValue({});

    const mockEvent = {
      characterId: 'nonexistent'
    };

    const result = await handler(mockEvent);
    
    // Should return null when character wasn't found
    expect(result).toBeNull();
  });
});