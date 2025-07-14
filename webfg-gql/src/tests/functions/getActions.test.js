const { handler } = require('../../../functions/getActions');

describe('getActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACTIONS_TABLE = 'test-actions-table';
  });

  it('should get multiple actions successfully', async () => {
    const actionIds = ['action-1', 'action-2', 'action-3'];
    const mockActions = [
      {
        actionId: 'action-1',
        name: 'Attack',
        source: 'strength',
        target: 'armor'
      },
      {
        actionId: 'action-2',
        name: 'Defend',
        source: 'endurance',
        target: 'damage'
      },
      {
        actionId: 'action-3',
        name: 'Dodge',
        source: 'agility',
        target: 'accuracy'
      }
    ];

    const event = {
      arguments: {
        actionIds
      }
    };

    // Mock successful DynamoDB BATCH GET response
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-actions-table': mockActions
      }
    });

    const result = await handler(event);

    // Verify the result
    expect(result).toEqual(mockActions);
    expect(result).toHaveLength(3);

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no actionIds provided', async () => {
    const event = {
      arguments: {
        actionIds: []
      }
    };

    const result = await handler(event);

    expect(result).toEqual([]);
    // DynamoDB should not be called
    expect(mockDynamoSend).not.toHaveBeenCalled();
  });

  it('should handle single action request', async () => {
    const actionIds = ['action-single'];
    const mockAction = {
      actionId: 'action-single',
      name: 'Special Attack',
      source: 'strength',
      target: 'armor',
      type: 'special'
    };

    const event = {
      arguments: {
        actionIds
      }
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-actions-table': [mockAction]
      }
    });

    const result = await handler(event);

    expect(result).toEqual([mockAction]);
    expect(result).toHaveLength(1);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle empty response from DynamoDB', async () => {
    const actionIds = ['action-1', 'action-2'];

    const event = {
      arguments: {
        actionIds
      }
    };

    // Mock DynamoDB response with no items
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-actions-table': []
      }
    });

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing Responses property', async () => {
    const actionIds = ['action-1'];

    const event = {
      arguments: {
        actionIds
      }
    };

    // Mock DynamoDB response with no Responses property
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle missing table in Responses', async () => {
    const actionIds = ['action-1'];

    const event = {
      arguments: {
        actionIds
      }
    };

    // Mock DynamoDB response with Responses but no table
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {}
    });

    const result = await handler(event);

    expect(result).toEqual([]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle DynamoDB errors', async () => {
    const actionIds = ['action-1', 'action-2'];

    const event = {
      arguments: {
        actionIds
      }
    };

    // Mock DynamoDB error
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    await expect(handler(event)).rejects.toThrow('DynamoDB connection error');

    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should use environment variable for table name', async () => {
    process.env.ACTIONS_TABLE = 'custom-actions-table';

    const actionIds = ['action-1'];
    const mockAction = {
      actionId: 'action-1',
      name: 'Test Action'
    };

    const event = {
      arguments: {
        actionIds
      }
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'custom-actions-table': [mockAction]
      }
    });

    const result = await handler(event);

    expect(result).toEqual([mockAction]);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle large batch of actionIds', async () => {
    // Create 25 action IDs
    const actionIds = Array.from({ length: 25 }, (_, i) => `action-${i}`);
    const mockActions = actionIds.map(id => ({
      actionId: id,
      name: `Action ${id}`,
      source: 'strength',
      target: 'armor'
    }));

    const event = {
      arguments: {
        actionIds
      }
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-actions-table': mockActions
      }
    });

    const result = await handler(event);

    expect(result).toHaveLength(25);
    expect(result[0].actionId).toBe('action-0');
    expect(result[24].actionId).toBe('action-24');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle actions with different types', async () => {
    const actionIds = ['action-1', 'action-2', 'action-3'];
    const mockActions = [
      {
        actionId: 'action-1',
        name: 'Normal Attack',
        type: 'normal',
        source: 'strength',
        target: 'armor'
      },
      {
        actionId: 'action-2',
        name: 'Special Attack',
        type: 'special',
        source: 'dexterity',
        target: 'armor'
      },
      {
        actionId: 'action-3',
        name: 'Magic Attack',
        type: 'magic',
        source: 'intelligence',
        target: 'resolve'
      }
    ];

    const event = {
      arguments: {
        actionIds
      }
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-actions-table': mockActions
      }
    });

    const result = await handler(event);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('normal');
    expect(result[1].type).toBe('special');
    expect(result[2].type).toBe('magic');
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should handle partial results when some actions not found', async () => {
    const actionIds = ['action-1', 'action-missing', 'action-3'];
    const mockActions = [
      {
        actionId: 'action-1',
        name: 'Action 1'
      },
      {
        actionId: 'action-3',
        name: 'Action 3'
      }
      // action-missing is not in the response
    ];

    const event = {
      arguments: {
        actionIds
      }
    };

    // Mock DynamoDB response with only 2 of 3 requested actions
    mockDynamoSend.mockResolvedValueOnce({
      Responses: {
        'test-actions-table': mockActions
      }
    });

    const result = await handler(event);

    // Should return only found actions
    expect(result).toHaveLength(2);
    expect(result.find(a => a.actionId === 'action-1')).toBeDefined();
    expect(result.find(a => a.actionId === 'action-3')).toBeDefined();
    expect(result.find(a => a.actionId === 'action-missing')).toBeUndefined();
  });
});