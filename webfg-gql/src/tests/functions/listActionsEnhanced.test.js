const { handler } = require('../../../functions/listActionsEnhanced');

describe('listActionsEnhanced', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      ACTIONS_TABLE_NAME: 'test-actions-table'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockActions = [
    {
      actionId: 'action-1',
      name: 'Attack',
      nameLowerCase: 'attack',
      description: 'Basic attack action',
      sourceAttribute: 'strength',
      targetAttribute: 'armor',
      targetType: 'normal'
    },
    {
      actionId: 'action-2',
      name: 'Defend',
      nameLowerCase: 'defend',
      description: 'Defensive action',
      sourceAttribute: 'dexterity',
      targetAttribute: 'agility',
      targetType: 'normal'
    },
    {
      actionId: 'action-3',
      name: 'Cast Spell',
      nameLowerCase: 'cast spell',
      description: 'Magic action',
      sourceAttribute: 'intelligence',
      targetAttribute: 'resolve',
      targetType: 'spell'
    }
  ];

  describe('basic functionality', () => {
    it('should list actions with default pagination', async () => {
      const event = {};

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockActions.slice(0, 2),
        Count: 2,
        ScannedCount: 2
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result).toEqual({
        items: mockActions.slice(0, 2),
        nextCursor: null,
        hasNextPage: false,
        totalCount: null
      });
    });

    it('should handle empty results', async () => {
      const event = {};

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [],
        Count: 0,
        ScannedCount: 0
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result).toEqual({
        items: [],
        nextCursor: null,
        hasNextPage: false,
        totalCount: null
      });
    });

    it('should handle pagination with cursor', async () => {
      const cursor = Buffer.from(JSON.stringify({ actionId: 'action-1' })).toString('base64');
      const event = {
        filter: {
          pagination: {
            cursor: cursor,
            limit: 5
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockActions[1]],
        Count: 1,
        ScannedCount: 1
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('should return nextCursor when there are more results', async () => {
      const event = {
        filter: {
          pagination: {
            limit: 1 // Set limit to 1 so that 2 items exceed the limit
          }
        }
      };

      const lastEvaluatedKey = { actionId: 'action-2' };
      // Return 2 items but limit is 1, so there should be a next page
      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockActions.slice(0, 2),
        Count: 2,
        ScannedCount: 2,
        LastEvaluatedKey: lastEvaluatedKey
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1); // Trimmed to limit
      expect(result.hasNextPage).toBe(true);
      const expectedToken = Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
      expect(result.nextCursor).toBe(expectedToken);
    });
  });

  describe('filtering', () => {
    it('should filter by search term', async () => {
      const event = {
        filter: {
          search: 'attack'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockActions[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Attack');
    });

    it('should filter by source attribute', async () => {
      const event = {
        filter: {
          sourceAttribute: 'strength'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockActions[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('should combine multiple filters', async () => {
      const event = {
        filter: {
          search: 'action',
          sourceAttribute: 'strength',
          targetType: 'normal'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockActions[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });
  });

  describe('sorting', () => {
    it('should apply ascending sort', async () => {
      const event = {
        filter: {
          sort: [{
            field: 'name',
            direction: 'ASC'
          }]
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockActions,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      // Check that items are sorted ascending by name
      expect(result.items[0].name).toBe('Attack');
      expect(result.items[1].name).toBe('Cast Spell');
      expect(result.items[2].name).toBe('Defend');
    });

    it('should apply descending sort', async () => {
      const event = {
        filter: {
          sort: [{
            field: 'name',
            direction: 'DESC'
          }]
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockActions,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      // Check that items are sorted descending by name
      expect(result.items[0].name).toBe('Defend');
      expect(result.items[1].name).toBe('Cast Spell');
      expect(result.items[2].name).toBe('Attack');
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB errors', async () => {
      const event = {};

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB error');
    });

    it('should handle invalid cursor gracefully', async () => {
      const event = {
        filter: {
          pagination: {
            cursor: 'invalid-base64-cursor'
          }
        }
      };

      // The function should handle invalid cursor and likely throw or default
      await expect(handler(event)).rejects.toThrow();
    });
  });

  describe('pagination limits', () => {
    it('should respect custom limit', async () => {
      const event = {
        filter: {
          pagination: {
            limit: 5
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockActions.slice(0, 2),
        Count: 2,
        ScannedCount: 2
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(2);
    });

    it('should enforce maximum limit', async () => {
      const event = {
        filter: {
          pagination: {
            limit: 500 // Above max
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockActions,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    it('should handle null filter', async () => {
      const event = {
        filter: null
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockActions,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(mockActions);
    });

    it('should handle empty search string', async () => {
      const event = {
        filter: {
          search: ''
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockActions,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(mockActions);
    });
  });
});