const { handler } = require('../../../functions/listConditionsEnhanced');

describe('listConditionsEnhanced', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CONDITIONS_TABLE_NAME: 'test-conditions-table'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockConditions = [
    {
      conditionId: 'cond-1',
      name: 'Blessed',
      nameLowerCase: 'blessed',
      description: 'Divine protection blessing',
      descriptionLowerCase: 'divine protection blessing',
      conditionCategory: 'MAGICAL',
      conditionType: 'HELP',
      conditionTarget: 'armor'
    },
    {
      conditionId: 'cond-2',
      name: 'Poisoned',
      nameLowerCase: 'poisoned',
      description: 'Suffering from poison damage',
      descriptionLowerCase: 'suffering from poison damage',
      conditionCategory: 'PHYSICAL',
      conditionType: 'HARM',
      conditionTarget: 'endurance'
    },
    {
      conditionId: 'cond-3',
      name: 'Focused',
      nameLowerCase: 'focused',
      description: 'Enhanced mental concentration',
      descriptionLowerCase: 'enhanced mental concentration',
      conditionCategory: 'MENTAL',
      conditionType: 'HELP',
      conditionTarget: 'intelligence'
    }
  ];

  describe('basic functionality', () => {
    it('should list conditions with default pagination', async () => {
      const event = {};

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockConditions.slice(0, 2),
        Count: 2,
        ScannedCount: 2
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result).toEqual({
        items: mockConditions.slice(0, 2),
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
      const cursor = Buffer.from(JSON.stringify({ conditionId: 'cond-1' })).toString('base64');
      const event = {
        filter: {
          pagination: {
            cursor: cursor,
            limit: 5
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[1]],
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

      const lastEvaluatedKey = { conditionId: 'cond-2' };
      // Return 2 items but limit is 1, so there should be a next page
      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockConditions.slice(0, 2),
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
    it('should filter by search term in name', async () => {
      const event = {
        filter: {
          search: 'blessed'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Blessed');
    });

    it('should filter by search term in description', async () => {
      const event = {
        filter: {
          search: 'poison'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[1]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Poisoned');
    });

    it('should filter by condition category', async () => {
      const event = {
        filter: {
          conditionCategory: 'MAGICAL'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].conditionCategory).toBe('MAGICAL');
    });

    it('should filter by condition type', async () => {
      const event = {
        filter: {
          conditionType: 'HELP'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[0], mockConditions[2]],
        Count: 2,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(2);
      expect(result.items[0].conditionType).toBe('HELP');
      expect(result.items[1].conditionType).toBe('HELP');
    });

    it('should filter by condition target', async () => {
      const event = {
        filter: {
          conditionTarget: 'armor'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].conditionTarget).toBe('armor');
    });

    it('should combine multiple filters', async () => {
      const event = {
        filter: {
          search: 'mental',
          conditionCategory: 'MENTAL',
          conditionType: 'HELP',
          conditionTarget: 'intelligence'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[2]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Focused');
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
        Items: mockConditions,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      // Check that items are sorted ascending by name
      expect(result.items[0].name).toBe('Blessed');
      expect(result.items[1].name).toBe('Focused');
      expect(result.items[2].name).toBe('Poisoned');
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
        Items: mockConditions,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      // Check that items are sorted descending by name
      expect(result.items[0].name).toBe('Poisoned');
      expect(result.items[1].name).toBe('Focused');
      expect(result.items[2].name).toBe('Blessed');
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
        Items: mockConditions.slice(0, 2),
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
        Items: mockConditions,
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
        Items: mockConditions,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(mockConditions);
    });

    it('should handle empty search string', async () => {
      const event = {
        filter: {
          search: ''
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockConditions,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(mockConditions);
    });

    it('should handle conditions without nameLowerCase field (backwards compatibility)', async () => {
      const oldFormatConditions = [
        {
          conditionId: 'cond-old',
          name: 'Old Condition',
          description: 'An old format condition',
          conditionCategory: 'OTHER'
        }
      ];

      const event = {
        filter: {
          search: 'old'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: oldFormatConditions,
        Count: 1,
        ScannedCount: 1
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(oldFormatConditions);
    });
  });

  describe('specific condition types', () => {
    it('should filter helpful conditions', async () => {
      const event = {
        filter: {
          conditionType: 'HELP'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[0], mockConditions[2]],
        Count: 2,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(2);
      expect(result.items.every(item => item.conditionType === 'HELP')).toBe(true);
    });

    it('should filter harmful conditions', async () => {
      const event = {
        filter: {
          conditionType: 'HARM'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[1]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].conditionType).toBe('HARM');
    });
  });

  describe('condition categories', () => {
    it('should filter magical conditions', async () => {
      const event = {
        filter: {
          conditionCategory: 'MAGICAL'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].conditionCategory).toBe('MAGICAL');
    });

    it('should filter physical conditions', async () => {
      const event = {
        filter: {
          conditionCategory: 'PHYSICAL'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[1]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].conditionCategory).toBe('PHYSICAL');
    });

    it('should filter mental conditions', async () => {
      const event = {
        filter: {
          conditionCategory: 'MENTAL'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockConditions[2]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].conditionCategory).toBe('MENTAL');
    });
  });
});