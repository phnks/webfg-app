const { handler } = require('../../../functions/addConditionToCharacter');

describe('addConditionToCharacter', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CHARACTER_TABLE_NAME: 'test-characters-table'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockCharacter = {
    characterId: 'char-1',
    name: 'Test Character',
    characterConditions: [
      { conditionId: 'existing-condition', amount: 2 }
    ]
  };

  describe('input validation', () => {
    it('should throw error when characterId is missing', async () => {
      const event = {
        conditionId: 'cond-1',
        amount: 1
      };

      await expect(handler(event)).rejects.toThrow('Both characterId and conditionId are required');
    });

    it('should throw error when conditionId is missing', async () => {
      const event = {
        characterId: 'char-1',
        amount: 1
      };

      await expect(handler(event)).rejects.toThrow('Both characterId and conditionId are required');
    });

    it('should throw error when amount is 0', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1',
        amount: 0
      };

      await expect(handler(event)).rejects.toThrow('Amount must be at least 1');
    });

    it('should throw error when amount is negative', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1',
        amount: -1
      };

      await expect(handler(event)).rejects.toThrow('Amount must be at least 1');
    });

    it('should default amount to 1 when not provided', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1'
      };

      // Mock character with no existing conditions
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: { ...mockCharacter, characterConditions: [] } })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            characterConditions: [{ conditionId: 'cond-1', amount: 1 }]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toContainEqual({
        conditionId: 'cond-1',
        amount: 1
      });
    });
  });

  describe('adding new conditions', () => {
    it('should add new condition to character with no existing conditions', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'new-condition',
        amount: 3
      };

      // Mock character with no existing conditions
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: { ...mockCharacter, characterConditions: [] } })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            characterConditions: [{ conditionId: 'new-condition', amount: 3 }]
          }
        });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
      expect(result.characterConditions).toContainEqual({
        conditionId: 'new-condition',
        amount: 3
      });
    });

    it('should add new condition to character with existing conditions', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'new-condition',
        amount: 2
      };

      // Mock character with existing conditions
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            characterConditions: [
              { conditionId: 'existing-condition', amount: 2 },
              { conditionId: 'new-condition', amount: 2 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toHaveLength(2);
      expect(result.characterConditions).toContainEqual({
        conditionId: 'new-condition',
        amount: 2
      });
      expect(result.characterConditions).toContainEqual({
        conditionId: 'existing-condition',
        amount: 2
      });
    });

    it('should handle character with undefined characterConditions', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'new-condition',
        amount: 1
      };

      const characterWithoutConditions = {
        characterId: 'char-1',
        name: 'Test Character'
        // No characterConditions field
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithoutConditions })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...characterWithoutConditions,
            characterConditions: [{ conditionId: 'new-condition', amount: 1 }]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toContainEqual({
        conditionId: 'new-condition',
        amount: 1
      });
    });
  });

  describe('updating existing conditions', () => {
    it('should update amount for existing condition', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'existing-condition',
        amount: 5
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            characterConditions: [
              { conditionId: 'existing-condition', amount: 5 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toHaveLength(1);
      expect(result.characterConditions[0]).toEqual({
        conditionId: 'existing-condition',
        amount: 5
      });
    });

    it('should find and update condition in middle of array', async () => {
      const characterWithMultipleConditions = {
        ...mockCharacter,
        characterConditions: [
          { conditionId: 'first-condition', amount: 1 },
          { conditionId: 'middle-condition', amount: 2 },
          { conditionId: 'last-condition', amount: 3 }
        ]
      };

      const event = {
        characterId: 'char-1',
        conditionId: 'middle-condition',
        amount: 10
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithMultipleConditions })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...characterWithMultipleConditions,
            characterConditions: [
              { conditionId: 'first-condition', amount: 1 },
              { conditionId: 'middle-condition', amount: 10 },
              { conditionId: 'last-condition', amount: 3 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toHaveLength(3);
      expect(result.characterConditions[1]).toEqual({
        conditionId: 'middle-condition',
        amount: 10
      });
    });
  });

  describe('amount parsing', () => {
    it('should parse string amounts correctly', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'new-condition',
        amount: '5'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: { ...mockCharacter, characterConditions: [] } })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            characterConditions: [{ conditionId: 'new-condition', amount: 5 }]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions[0].amount).toBe(5);
      expect(typeof result.characterConditions[0].amount).toBe('number');
    });

    it('should handle decimal amounts by truncating to integer', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'new-condition',
        amount: 3.7
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: { ...mockCharacter, characterConditions: [] } })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            characterConditions: [{ conditionId: 'new-condition', amount: 3 }]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions[0].amount).toBe(3);
    });

    it('should default to 1 for invalid amount values', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'new-condition',
        amount: 'invalid'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: { ...mockCharacter, characterConditions: [] } })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            characterConditions: [{ conditionId: 'new-condition', amount: 1 }]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions[0].amount).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle character not found', async () => {
      const event = {
        characterId: 'nonexistent-char',
        conditionId: 'cond-1',
        amount: 1
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Character not found');
    });

    it('should handle DynamoDB get errors', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1',
        amount: 1
      };

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB get error'));

      await expect(handler(event)).rejects.toThrow('Failed to add condition to character');
    });

    it('should handle DynamoDB update errors', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1',
        amount: 1
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockRejectedValueOnce(new Error('DynamoDB update error'));

      await expect(handler(event)).rejects.toThrow('Failed to add condition to character');
    });
  });

  describe('environment variables', () => {
    it('should use CHARACTER_TABLE_NAME environment variable', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1',
        amount: 1
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: mockCharacter });

      await handler(event);

      // Check that the mock was called (table name is set via environment variables)
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle very large amount values', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'new-condition',
        amount: 999999
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: { ...mockCharacter, characterConditions: [] } })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            characterConditions: [{ conditionId: 'new-condition', amount: 999999 }]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions[0].amount).toBe(999999);
    });

    it('should handle null and undefined amount gracefully', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'new-condition',
        amount: null
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: { ...mockCharacter, characterConditions: [] } })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            characterConditions: [{ conditionId: 'new-condition', amount: 1 }]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions[0].amount).toBe(1);
    });
  });
});