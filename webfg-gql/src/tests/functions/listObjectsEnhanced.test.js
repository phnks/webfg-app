const { handler } = require('../../../functions/listObjectsEnhanced');

describe('listObjectsEnhanced', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      OBJECTS_TABLE_NAME: 'test-objects-table'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockObjects = [
    {
      objectId: 'obj-1',
      name: 'Steel Sword',
      nameLowerCase: 'steel sword',
      objectCategory: 'WEAPON',
      strength: { attributeValue: 5, isGrouped: true },
      weight: { attributeValue: 3, isGrouped: true },
      size: { attributeValue: 2, isGrouped: true }
    },
    {
      objectId: 'obj-2',
      name: 'Leather Armor',
      nameLowerCase: 'leather armor',
      objectCategory: 'ARMOR',
      armour: { attributeValue: 4, isGrouped: true },
      weight: { attributeValue: 5, isGrouped: true },
      size: { attributeValue: 3, isGrouped: true }
    },
    {
      objectId: 'obj-3',
      name: 'Magic Ring',
      nameLowerCase: 'magic ring',
      objectCategory: 'ACCESSORY',
      intelligence: { attributeValue: 2, isGrouped: true },
      weight: { attributeValue: 1, isGrouped: true },
      size: { attributeValue: 1, isGrouped: true }
    }
  ];

  describe('basic functionality', () => {
    it('should list objects with default pagination', async () => {
      const event = {};

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockObjects.slice(0, 2),
        Count: 2,
        ScannedCount: 2
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result).toEqual({
        items: mockObjects.slice(0, 2),
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
      const cursor = Buffer.from(JSON.stringify({ objectId: 'obj-1' })).toString('base64');
      const event = {
        filter: {
          pagination: {
            cursor: cursor,
            limit: 5
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockObjects[1]],
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

      const lastEvaluatedKey = { objectId: 'obj-2' };
      // Return 2 items but limit is 1, so there should be a next page
      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockObjects.slice(0, 2),
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
          search: 'sword'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockObjects[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Steel Sword');
    });

    it('should filter by object category', async () => {
      const event = {
        filter: {
          objectCategory: 'WEAPON'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockObjects[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].objectCategory).toBe('WEAPON');
    });

    it('should filter by attribute values', async () => {
      const event = {
        filter: {
          strength: {
            gte: 4
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockObjects[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Steel Sword');
    });

    it('should combine multiple filters', async () => {
      const event = {
        filter: {
          search: 'armor',
          objectCategory: 'ARMOR',
          weight: {
            lte: 10
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockObjects[1]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Leather Armor');
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
        Items: mockObjects,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      // Check that items are sorted ascending by name
      expect(result.items[0].name).toBe('Leather Armor');
      expect(result.items[1].name).toBe('Magic Ring');
      expect(result.items[2].name).toBe('Steel Sword');
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
        Items: mockObjects,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      // Check that items are sorted descending by name
      expect(result.items[0].name).toBe('Steel Sword');
      expect(result.items[1].name).toBe('Magic Ring');
      expect(result.items[2].name).toBe('Leather Armor');
    });

    it('should sort by numeric attributes', async () => {
      const event = {
        filter: {
          sort: [{
            field: 'weight.attributeValue',
            direction: 'ASC'
          }]
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockObjects,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      // Check that items are sorted by weight (1, 3, 5)
      expect(result.items[0].name).toBe('Magic Ring'); // weight 1
      expect(result.items[1].name).toBe('Steel Sword'); // weight 3
      expect(result.items[2].name).toBe('Leather Armor'); // weight 5
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
        Items: mockObjects.slice(0, 2),
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
        Items: mockObjects,
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
        Items: mockObjects,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(mockObjects);
    });

    it('should handle empty search string', async () => {
      const event = {
        filter: {
          search: ''
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockObjects,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(mockObjects);
    });

    it('should handle objects without nameLowerCase field (backwards compatibility)', async () => {
      const oldFormatObjects = [
        {
          objectId: 'obj-old',
          name: 'Old Object',
          objectCategory: 'MISC'
        }
      ];

      const event = {
        filter: {
          search: 'old'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: oldFormatObjects,
        Count: 1,
        ScannedCount: 1
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(oldFormatObjects);
    });

    it('should handle multiple attribute filters', async () => {
      const event = {
        filter: {
          strength: {
            gte: 3
          },
          weight: {
            lte: 5
          },
          size: {
            eq: 2
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockObjects[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Steel Sword');
    });
  });

  describe('specific object categories', () => {
    it('should filter weapons', async () => {
      const event = {
        filter: {
          objectCategory: 'WEAPON'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockObjects[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].objectCategory).toBe('WEAPON');
    });

    it('should filter armor', async () => {
      const event = {
        filter: {
          objectCategory: 'ARMOR'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockObjects[1]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].objectCategory).toBe('ARMOR');
    });

    it('should filter accessories', async () => {
      const event = {
        filter: {
          objectCategory: 'ACCESSORY'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockObjects[2]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].objectCategory).toBe('ACCESSORY');
    });
  });
});