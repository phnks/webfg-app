const { handler } = require('../../../functions/getCharacterActions');

describe('getCharacterActions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set default mock return value
    global.mockDynamoSend.mockResolvedValue({
      Responses: {
        'test-actions-table': []
      }
    });
    
    process.env = {
      ...originalEnv,
      ACTIONS_TABLE: 'test-actions-table'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('basic functionality', () => {
    it('should return empty array when no actionIds in source', async () => {
      const event = {
        source: {}
      };

      const result = await handler(event);
      
      expect(result).toEqual([]);
      expect(global.mockDynamoSend).not.toHaveBeenCalled();
    });

    it('should return empty array when actionIds is empty array', async () => {
      const event = {
        source: {
          actionIds: []
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

    it('should fetch actions for single actionId', async () => {
      const event = {
        source: {
          actionIds: ['action1']
        }
      };

      const mockAction = {
        actionId: 'action1',
        name: 'Test Action',
        sourceAttribute: 'STRENGTH',
        targetAttribute: 'DEFENSE'
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-actions-table': [mockAction]
        }
      });

      const result = await handler(event);

      expect(result).toEqual([mockAction]);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should fetch multiple actions', async () => {
      const event = {
        source: {
          actionIds: ['action1', 'action2', 'action3']
        }
      };

      const mockActions = [
        { actionId: 'action1', name: 'Action 1' },
        { actionId: 'action2', name: 'Action 2' },
        { actionId: 'action3', name: 'Action 3' }
      ];

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-actions-table': mockActions
        }
      });

      const result = await handler(event);

      expect(result).toEqual(mockActions);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('batch processing', () => {
    it('should handle more than 25 items in multiple batches', async () => {
      const actionIds = Array.from({ length: 30 }, (_, i) => `action${i}`);
      
      const event = {
        source: {
          actionIds: actionIds
        }
      };

      const firstBatchActions = Array.from({ length: 25 }, (_, i) => ({
        actionId: `action${i}`,
        name: `Action ${i}`
      }));

      const secondBatchActions = Array.from({ length: 5 }, (_, i) => ({
        actionId: `action${i + 25}`,
        name: `Action ${i + 25}`
      }));

      global.mockDynamoSend
        .mockResolvedValueOnce({
          Responses: {
            'test-actions-table': firstBatchActions
          }
        })
        .mockResolvedValueOnce({
          Responses: {
            'test-actions-table': secondBatchActions
          }
        });

      const result = await handler(event);

      expect(result).toHaveLength(30);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });

    it('should handle exactly 25 items in single batch', async () => {
      const actionIds = Array.from({ length: 25 }, (_, i) => `action${i}`);
      
      const event = {
        source: {
          actionIds: actionIds
        }
      };

      const mockActions = actionIds.map(id => ({
        actionId: id,
        name: `Action ${id}`
      }));

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-actions-table': mockActions
        }
      });

      const result = await handler(event);

      expect(result).toHaveLength(25);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should handle 50 items in two batches', async () => {
      const actionIds = Array.from({ length: 50 }, (_, i) => `action${i}`);
      
      const event = {
        source: {
          actionIds: actionIds
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({
          Responses: {
            'test-actions-table': Array.from({ length: 25 }, (_, i) => ({
              actionId: `action${i}`,
              name: `Action ${i}`
            }))
          }
        })
        .mockResolvedValueOnce({
          Responses: {
            'test-actions-table': Array.from({ length: 25 }, (_, i) => ({
              actionId: `action${i + 25}`,
              name: `Action ${i + 25}`
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
          actionIds: ['action1']
        }
      };

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB error');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should handle empty responses', async () => {
      const event = {
        source: {
          actionIds: ['action1', 'action2']
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
          actionIds: ['action1']
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
          actionIds: ['action1', 'action2', 'action3']
        }
      };

      // Only action1 and action3 are found
      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-actions-table': [
            { actionId: 'action1', name: 'Action 1' },
            { actionId: 'action3', name: 'Action 3' }
          ]
        }
      });

      const result = await handler(event);

      expect(result).toHaveLength(2);
      expect(result.map(action => action.actionId)).toEqual(['action1', 'action3']);
    });
  });

  describe('environment variables', () => {
    it('should use ACTIONS_TABLE environment variable', async () => {
      process.env.ACTIONS_TABLE = 'custom-actions-table';
      
      const event = {
        source: {
          actionIds: ['action1']
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'custom-actions-table': [{ actionId: 'action1' }]
        }
      });

      await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle very large number of actions', async () => {
      const actionIds = Array.from({ length: 100 }, (_, i) => `action${i}`);
      
      const event = {
        source: {
          actionIds: actionIds
        }
      };

      // Mock 4 batches (25 + 25 + 25 + 25)
      for (let i = 0; i < 4; i++) {
        const batchStart = i * 25;
        const batchSize = Math.min(25, 100 - batchStart);
        
        global.mockDynamoSend.mockResolvedValueOnce({
          Responses: {
            'test-actions-table': Array.from({ length: batchSize }, (_, j) => ({
              actionId: `action${batchStart + j}`,
              name: `Action ${batchStart + j}`
            }))
          }
        });
      }

      const result = await handler(event);

      expect(result).toHaveLength(100);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle duplicate actionIds', async () => {
      const event = {
        source: {
          actionIds: ['action1', 'action1', 'action2']
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-actions-table': [
            { actionId: 'action1', name: 'Action 1' },
            { actionId: 'action2', name: 'Action 2' }
          ]
        }
      });

      const result = await handler(event);

      // DynamoDB BatchGet will handle duplicates, typically returning unique items
      expect(result).toHaveLength(2);
    });

    it('should handle special characters in actionIds', async () => {
      const event = {
        source: {
          actionIds: ['action-special!@#$%', 'action_underscore', 'action.dot']
        }
      };

      const mockActions = [
        { actionId: 'action-special!@#$%', name: 'Special Action' },
        { actionId: 'action_underscore', name: 'Underscore Action' },
        { actionId: 'action.dot', name: 'Dot Action' }
      ];

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-actions-table': mockActions
        }
      });

      const result = await handler(event);

      expect(result).toEqual(mockActions);
    });

    it('should handle actions with complex structure', async () => {
      const event = {
        source: {
          actionIds: ['action1']
        }
      };

      const complexAction = {
        actionId: 'action1',
        name: 'Complex Action',
        sourceAttribute: 'STRENGTH',
        targetAttribute: 'DEFENSE',
        actionCategory: 'PHYSICAL',
        targetType: 'CHARACTER',
        effectType: 'DAMAGE',
        objectUsage: 'MELEE',
        formula: 'CONTEST',
        description: 'A complex action with many properties'
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Responses: {
          'test-actions-table': [complexAction]
        }
      });

      const result = await handler(event);

      expect(result).toEqual([complexAction]);
    });
  });
});