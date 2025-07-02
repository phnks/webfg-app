const { handler } = require('../../../functions/updateCondition');

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

describe('updateCondition Lambda function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONDITION_TABLE_NAME = 'test-conditions-table';
    
    mockSend.mockResolvedValue({
      Attributes: {
        conditionId: 'cond123',
        name: 'Updated Condition',
        description: 'An updated condition',
        conditionCategory: 'HELP',
        conditionType: 'BUFF',
        conditionTarget: 'STRENGTH'
      }
    });
  });

  afterEach(() => {
    delete process.env.CONDITION_TABLE_NAME;
  });

  test('should update condition successfully', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {
        name: 'Updated Condition',
        description: 'An updated condition',
        conditionCategory: 'HELP'
      }
    };

    const result = await handler(mockEvent);

    expect(UpdateCommand).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalled();
    expect(result.conditionId).toBe('cond123');
    expect(result.name).toBe('Updated Condition');
    expect(result.description).toBe('An updated condition');
  });

  test('should update name and nameLowerCase', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {
        name: 'STRENGTH BOOST'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':name']).toBe('STRENGTH BOOST');
    expect(updateCall.ExpressionAttributeValues[':nameLowerCase']).toBe('strength boost');
    expect(updateCall.UpdateExpression).toContain('#name = :name');
    expect(updateCall.UpdateExpression).toContain('#nameLowerCase = :nameLowerCase');
  });

  test('should update description and descriptionLowerCase', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {
        description: 'INCREASES CHARACTER STRENGTH'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':description']).toBe('INCREASES CHARACTER STRENGTH');
    expect(updateCall.ExpressionAttributeValues[':descriptionLowerCase']).toBe('increases character strength');
    expect(updateCall.UpdateExpression).toContain('#description = :description');
    expect(updateCall.UpdateExpression).toContain('#descriptionLowerCase = :descriptionLowerCase');
  });

  test('should update all supported fields', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {
        name: 'Complete Condition',
        description: 'A condition with all fields',
        conditionCategory: 'HARM',
        conditionType: 'DEBUFF',
        conditionTarget: 'DEXTERITY'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':name']).toBe('Complete Condition');
    expect(updateCall.ExpressionAttributeValues[':description']).toBe('A condition with all fields');
    expect(updateCall.ExpressionAttributeValues[':conditionCategory']).toBe('HARM');
    expect(updateCall.ExpressionAttributeValues[':conditionType']).toBe('DEBUFF');
    expect(updateCall.ExpressionAttributeValues[':conditionTarget']).toBe('DEXTERITY');
  });

  test('should handle partial updates', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {
        conditionCategory: 'HELP'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':conditionCategory']).toBe('HELP');
    expect(updateCall.ExpressionAttributeValues[':name']).toBeUndefined();
    expect(updateCall.UpdateExpression).not.toContain('#name');
  });

  test('should handle empty input error', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {}
    };

    await expect(handler(mockEvent)).rejects.toThrow('No fields to update');
  });

  test('should handle input with undefined fields', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {
        name: 'Valid Name',
        unknownField: 'should be ignored',
        conditionType: undefined
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':name']).toBe('Valid Name');
    expect(updateCall.ExpressionAttributeValues[':unknownField']).toBeUndefined();
    expect(updateCall.ExpressionAttributeValues[':conditionType']).toBeUndefined();
    expect(updateCall.UpdateExpression).not.toContain('unknownField');
    expect(updateCall.UpdateExpression).not.toContain('conditionType');
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB connection failed'));

    const mockEvent = {
      conditionId: 'cond123',
      input: {
        name: 'Error Test'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to update condition: DynamoDB connection failed');
  });

  test('should handle missing table environment variable', async () => {
    delete process.env.CONDITION_TABLE_NAME;

    const mockEvent = {
      conditionId: 'cond123',
      input: {
        name: 'Table Test'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.TableName).toBeUndefined();
  });

  test('should use correct table name and key', async () => {
    const mockEvent = {
      conditionId: 'test-cond-456',
      input: {
        name: 'Table Key Test'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.TableName).toBe('test-conditions-table');
    expect(updateCall.Key).toEqual({ conditionId: 'test-cond-456' });
  });

  test('should return ALL_NEW values', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {
        name: 'Return Test'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ReturnValues).toBe('ALL_NEW');
  });

  test('should handle null values in input', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {
        name: 'Valid Name',
        description: null,
        conditionCategory: 'HELP'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':name']).toBe('Valid Name');
    expect(updateCall.ExpressionAttributeValues[':description']).toBeNull();
    expect(updateCall.ExpressionAttributeValues[':descriptionLowerCase']).toBe('null');
    expect(updateCall.ExpressionAttributeValues[':conditionCategory']).toBe('HELP');
  });

  test('should handle empty string values', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {
        name: '',
        description: 'Valid description'
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':name']).toBe('');
    expect(updateCall.ExpressionAttributeValues[':nameLowerCase']).toBe('');
    expect(updateCall.ExpressionAttributeValues[':description']).toBe('Valid description');
    expect(updateCall.ExpressionAttributeValues[':descriptionLowerCase']).toBe('valid description');
  });

  test('should handle special characters in name and description', async () => {
    const mockEvent = {
      conditionId: 'cond123',
      input: {
        name: "Dragon's Curse +5 (Legendary)",
        description: "A very POWERFUL curse that affects ALL attributes!!!"
      }
    };

    await handler(mockEvent);

    const updateCall = UpdateCommand.mock.calls[0][0];
    expect(updateCall.ExpressionAttributeValues[':nameLowerCase']).toBe("dragon's curse +5 (legendary)");
    expect(updateCall.ExpressionAttributeValues[':descriptionLowerCase']).toBe("a very powerful curse that affects all attributes!!!");
  });
});