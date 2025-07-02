const { handler } = require('../../../functions/updateCharacter');

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

describe('updateCharacter Lambda function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
    
    mockSend.mockResolvedValue({
      Attributes: {
        characterId: 'char123',
        name: 'Updated Character',
        characterCategory: 'HUMAN'
      }
    });
  });

  afterEach(() => {
    delete process.env.CHARACTERS_TABLE;
  });

  test('should update character successfully', async () => {
    const mockEvent = {
      characterId: 'char123',
      input: {
        name: 'Updated Character',
        will: 15
      }
    };

    const result = await handler(mockEvent);

    expect(UpdateCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result.characterId).toBe('char123');
    expect(result.name).toBe('Updated Character');
  });

  test('should handle missing characterId', async () => {
    const mockEvent = {
      input: {
        name: 'Updated Character'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle empty input', async () => {
    const mockEvent = {
      input: {}
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const mockEvent = {
      characterId: 'char123',
      input: {
        name: 'Updated Character'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('DynamoDB error');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.CHARACTERS_TABLE;

    const mockEvent = {
      characterId: 'char123',
      input: {
        name: 'Updated Character'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });
});