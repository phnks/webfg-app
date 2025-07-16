const { handler } = require('../../../functions/resolveCharacterBody');

describe('resolveCharacterBody', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env = {
      ...originalEnv,
      OBJECTS_TABLE: 'test-objects-table'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('basic functionality', () => {
    it('should return empty array when no bodyId in source', async () => {
      const event = {
        source: {}
      };

      const result = await handler(event);
      
      expect(result).toEqual([]);
      expect(global.mockDynamoSend).not.toHaveBeenCalled();
    });

    it('should return empty array when bodyId is empty array', async () => {
      const event = {
        source: {
          bodyId: []
        }
      };

      const result = await handler(event);
      
      expect(result).toEqual([]);
      expect(global.mockDynamoSend).not.toHaveBeenCalled();
    });

    it('should return empty array when source is null', async () => {
      const event = {
        source: null
      };

      const result = await handler(event);
      
      expect(result).toEqual([]);
      expect(global.mockDynamoSend).not.toHaveBeenCalled();
    });

    it('should fetch body items for single bodyId', async () => {
      const event = {
        source: {
          bodyId: ['body1']
        }
      };

      const mockBodyItem = {
        objectId: 'body1',
        name: 'Body Part 1',
        objectCategory: 'BODY'
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-objects-table': [mockBodyItem]
        }
      });

      const result = await handler(event);

      expect(result).toEqual([mockBodyItem]);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should fetch multiple body items', async () => {
      const event = {
        source: {
          bodyId: ['body1', 'body2', 'body3']
        }
      };

      const mockBodyItems = [
        { objectId: 'body1', name: 'Body Part 1' },
        { objectId: 'body2', name: 'Body Part 2' },
        { objectId: 'body3', name: 'Body Part 3' }
      ];

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-objects-table': mockBodyItems
        }
      });

      const result = await handler(event);

      expect(result).toEqual(mockBodyItems);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('batch processing', () => {
    it('should handle more than 25 items in multiple batches', async () => {
      const bodyIds = Array.from({ length: 30 }, (_, i) => `body${i}`);
      
      const event = {
        source: {
          bodyId: bodyIds
        }
      };

      const firstBatchItems = Array.from({ length: 25 }, (_, i) => ({
        objectId: `body${i}`,
        name: `Body Part ${i}`
      }));

      const secondBatchItems = Array.from({ length: 5 }, (_, i) => ({
        objectId: `body${i + 25}`,
        name: `Body Part ${i + 25}`
      }));

      global.mockDynamoSend
        .mockResolvedValueOnce({
          Responses: {
            'test-objects-table': firstBatchItems
          }
        })
        .mockResolvedValueOnce({
          Responses: {
            'test-objects-table': secondBatchItems
          }
        });

      const result = await handler(event);

      expect(result).toHaveLength(30);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });

    it('should handle exactly 25 items in single batch', async () => {
      const bodyIds = Array.from({ length: 25 }, (_, i) => `body${i}`);
      
      const event = {
        source: {
          bodyId: bodyIds
        }
      };

      const mockItems = bodyIds.map(id => ({
        objectId: id,
        name: `Body Part ${id}`
      }));

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-objects-table': mockItems
        }
      });

      const result = await handler(event);

      expect(result).toHaveLength(25);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should handle 50 items in two batches', async () => {
      const bodyIds = Array.from({ length: 50 }, (_, i) => `body${i}`);
      
      const event = {
        source: {
          bodyId: bodyIds
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({
          Responses: {
            'test-objects-table': Array.from({ length: 25 }, (_, i) => ({
              objectId: `body${i}`,
              name: `Body Part ${i}`
            }))
          }
        })
        .mockResolvedValueOnce({
          Responses: {
            'test-objects-table': Array.from({ length: 25 }, (_, i) => ({
              objectId: `body${i + 25}`,
              name: `Body Part ${i + 25}`
            }))
          }
        });

      const result = await handler(event);

      expect(result).toHaveLength(50);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB errors', async () => {
      const event = {
        source: {
          bodyId: ['body1']
        }
      };

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB error');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should handle empty responses', async () => {
      const event = {
        source: {
          bodyId: ['body1', 'body2']
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {}
      });

      const result = await handler(event);

      expect(result).toEqual([]);
    });

    it('should handle null responses', async () => {
      const event = {
        source: {
          bodyId: ['body1']
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: null
      });

      const result = await handler(event);

      expect(result).toEqual([]);
    });

    it('should handle partial responses', async () => {
      const event = {
        source: {
          bodyId: ['body1', 'body2', 'body3']
        }
      };

      // Only body1 and body3 are found
      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-objects-table': [
            { objectId: 'body1', name: 'Body Part 1' },
            { objectId: 'body3', name: 'Body Part 3' }
          ]
        }
      });

      const result = await handler(event);

      expect(result).toHaveLength(2);
      expect(result.map(item => item.objectId)).toEqual(['body1', 'body3']);
    });
  });

  describe('environment variables', () => {
    it('should use OBJECTS_TABLE environment variable', async () => {
      process.env.OBJECTS_TABLE = 'custom-objects-table';
      
      const event = {
        source: {
          bodyId: ['body1']
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'custom-objects-table': [{ objectId: 'body1' }]
        }
      });

      await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle very large number of body items', async () => {
      const bodyIds = Array.from({ length: 100 }, (_, i) => `body${i}`);
      
      const event = {
        source: {
          bodyId: bodyIds
        }
      };

      // Mock 4 batches (25 + 25 + 25 + 25)
      for (let i = 0; i < 4; i++) {
        const batchStart = i * 25;
        const batchSize = Math.min(25, 100 - batchStart);
        
        global.mockDynamoSend.mockResolvedValueOnce({
          Responses: {
            'test-objects-table': Array.from({ length: batchSize }, (_, j) => ({
              objectId: `body${batchStart + j}`,
              name: `Body Part ${batchStart + j}`
            }))
          }
        });
      }

      const result = await handler(event);

      expect(result).toHaveLength(100);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle duplicate bodyIds', async () => {
      const event = {
        source: {
          bodyId: ['body1', 'body1', 'body2']
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-objects-table': [
            { objectId: 'body1', name: 'Body Part 1' },
            { objectId: 'body2', name: 'Body Part 2' }
          ]
        }
      });

      const result = await handler(event);

      // DynamoDB BatchGet will handle duplicates, typically returning unique items
      expect(result).toHaveLength(2);
    });

    it('should handle special characters in bodyIds', async () => {
      const event = {
        source: {
          bodyId: ['body-special!@#$%', 'body_underscore', 'body.dot']
        }
      };

      const mockItems = [
        { objectId: 'body-special!@#$%', name: 'Special Body' },
        { objectId: 'body_underscore', name: 'Underscore Body' },
        { objectId: 'body.dot', name: 'Dot Body' }
      ];

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-objects-table': mockItems
        }
      });

      const result = await handler(event);

      expect(result).toEqual(mockItems);
    });
  });
});