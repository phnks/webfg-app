const { handler } = require('../../../functions/removeConditionFromCharacter');

describe('removeConditionFromCharacter', () => {
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
      { conditionId: 'cond-1', amount: 2 },
      { conditionId: 'cond-2', amount: 1 },
      { conditionId: 'cond-3', amount: 3 }
    ]
  };

  describe('input validation', () => {
    it('should throw error when character not found', async () => {
      const event = {
        characterId: 'nonexistent-char',
        conditionId: 'cond-1'
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Character not found: nonexistent-char');
    });

    it('should handle missing characterId', async () => {
      const event = {
        conditionId: 'cond-1'
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Character not found: undefined');
    });

    it('should handle missing conditionId', async () => {
      const event = {
        characterId: 'char-1'
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);
      
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(mockCharacter); // Character unchanged
    });
  });

  describe('removing conditions', () => {
    it('should remove condition from character', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-2'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            characterConditions: [
              { conditionId: 'cond-1', amount: 2 },
              { conditionId: 'cond-3', amount: 3 }
            ]
          }
        });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
      expect(result.characterConditions).toHaveLength(2);
      expect(result.characterConditions).not.toContainEqual({ conditionId: 'cond-2', amount: 1 });
      expect(result.characterConditions).toContainEqual({ conditionId: 'cond-1', amount: 2 });
      expect(result.characterConditions).toContainEqual({ conditionId: 'cond-3', amount: 3 });
    });

    it('should return character unchanged if condition not found', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'nonexistent-condition'
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(mockCharacter);
      expect(result.characterConditions).toHaveLength(3); // Unchanged
    });

    it('should handle character with no characterConditions', async () => {
      const characterNoConditions = {
        characterId: 'char-1',
        name: 'Test Character'
        // No characterConditions field
      };

      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1'
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterNoConditions });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(characterNoConditions);
    });

    it('should handle character with empty characterConditions', async () => {
      const characterEmptyConditions = {
        characterId: 'char-1',
        name: 'Test Character',
        characterConditions: []
      };

      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1'
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterEmptyConditions });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(characterEmptyConditions);
    });

    it('should remove first condition from array', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1' // First condition
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            characterConditions: [
              { conditionId: 'cond-2', amount: 1 },
              { conditionId: 'cond-3', amount: 3 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toHaveLength(2);
      expect(result.characterConditions[0]).toEqual({ conditionId: 'cond-2', amount: 1 });
    });

    it('should remove last condition from array', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-3' // Last condition
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            characterConditions: [
              { conditionId: 'cond-1', amount: 2 },
              { conditionId: 'cond-2', amount: 1 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toHaveLength(2);
      expect(result.characterConditions).not.toContainEqual({ conditionId: 'cond-3', amount: 3 });
    });

    it('should remove middle condition from array', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-2' // Middle condition
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            characterConditions: [
              { conditionId: 'cond-1', amount: 2 },
              { conditionId: 'cond-3', amount: 3 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toHaveLength(2);
      expect(result.characterConditions).toContainEqual({ conditionId: 'cond-1', amount: 2 });
      expect(result.characterConditions).toContainEqual({ conditionId: 'cond-3', amount: 3 });
      expect(result.characterConditions).not.toContainEqual({ conditionId: 'cond-2', amount: 1 });
    });

    it('should handle removing only condition from character', async () => {
      const characterOneCondition = {
        ...mockCharacter,
        characterConditions: [{ conditionId: 'cond-1', amount: 2 }]
      };

      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterOneCondition })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterOneCondition,
            characterConditions: []
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toEqual([]);
    });

    it('should remove all occurrences if condition appears multiple times', async () => {
      const characterDuplicates = {
        ...mockCharacter,
        characterConditions: [
          { conditionId: 'cond-1', amount: 2 },
          { conditionId: 'cond-2', amount: 1 },
          { conditionId: 'cond-1', amount: 3 }, // Duplicate
          { conditionId: 'cond-3', amount: 2 }
        ]
      };

      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterDuplicates })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterDuplicates,
            characterConditions: [
              { conditionId: 'cond-2', amount: 1 },
              { conditionId: 'cond-3', amount: 2 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toHaveLength(2);
      expect(result.characterConditions.filter(c => c.conditionId === 'cond-1')).toHaveLength(0);
    });

    it('should handle removing multiple different conditions sequentially', async () => {
      // First removal
      const event1 = {
        characterId: 'char-1',
        conditionId: 'cond-1'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            characterConditions: [
              { conditionId: 'cond-2', amount: 1 },
              { conditionId: 'cond-3', amount: 3 }
            ]
          }
        });

      const result1 = await handler(event1);
      expect(result1.characterConditions).toHaveLength(2);

      jest.clearAllMocks();

      // Second removal
      const updatedCharacter = {
        ...mockCharacter,
        characterConditions: [
          { conditionId: 'cond-2', amount: 1 },
          { conditionId: 'cond-3', amount: 3 }
        ]
      };

      const event2 = {
        characterId: 'char-1',
        conditionId: 'cond-3'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: updatedCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...updatedCharacter,
            characterConditions: [
              { conditionId: 'cond-2', amount: 1 }
            ]
          }
        });

      const result2 = await handler(event2);
      expect(result2.characterConditions).toEqual([{ conditionId: 'cond-2', amount: 1 }]);
    });

    it('should preserve condition amounts when removing other conditions', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-2'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            characterConditions: [
              { conditionId: 'cond-1', amount: 2 },
              { conditionId: 'cond-3', amount: 3 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toContainEqual({ conditionId: 'cond-1', amount: 2 });
      expect(result.characterConditions).toContainEqual({ conditionId: 'cond-3', amount: 3 });
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB get errors', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1'
      };

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB get error'));

      await expect(handler(event)).rejects.toThrow('Failed to remove condition from character: DynamoDB get error');
    });

    it('should handle DynamoDB update errors', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockRejectedValueOnce(new Error('DynamoDB update error'));

      await expect(handler(event)).rejects.toThrow('Failed to remove condition from character: DynamoDB update error');
    });
  });

  describe('environment variables', () => {
    it('should use CHARACTER_TABLE_NAME environment variable', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: 'cond-1'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: mockCharacter });

      await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in condition IDs', async () => {
      const specialConditionId = 'cond-with-special-chars_@#$%^&*()';
      const characterWithSpecialCondition = {
        ...mockCharacter,
        characterConditions: [
          { conditionId: 'cond-1', amount: 2 },
          { conditionId: specialConditionId, amount: 1 },
          { conditionId: 'cond-3', amount: 3 }
        ]
      };

      const event = {
        characterId: 'char-1',
        conditionId: specialConditionId
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithSpecialCondition })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterWithSpecialCondition,
            characterConditions: [
              { conditionId: 'cond-1', amount: 2 },
              { conditionId: 'cond-3', amount: 3 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).not.toContainEqual({ conditionId: specialConditionId, amount: 1 });
      expect(result.characterConditions).toHaveLength(2);
    });

    it('should handle very long condition IDs', async () => {
      const longConditionId = 'a'.repeat(1000);
      const characterWithLongId = {
        ...mockCharacter,
        characterConditions: [
          { conditionId: longConditionId, amount: 1 },
          { conditionId: 'cond-2', amount: 2 }
        ]
      };

      const event = {
        characterId: 'char-1',
        conditionId: longConditionId
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithLongId })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterWithLongId,
            characterConditions: [
              { conditionId: 'cond-2', amount: 2 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).not.toContainEqual({ conditionId: longConditionId, amount: 1 });
      expect(result.characterConditions).toEqual([{ conditionId: 'cond-2', amount: 2 }]);
    });

    it('should handle large condition arrays', async () => {
      const largeConditionArray = Array.from({ length: 1000 }, (_, i) => ({
        conditionId: `condition-${i}`,
        amount: Math.floor(Math.random() * 10) + 1
      }));
      
      const characterWithLargeArray = {
        ...mockCharacter,
        characterConditions: largeConditionArray
      };

      const event = {
        characterId: 'char-1',
        conditionId: 'condition-500'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithLargeArray })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterWithLargeArray,
            characterConditions: largeConditionArray.filter(c => c.conditionId !== 'condition-500')
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toHaveLength(999);
      expect(result.characterConditions.filter(c => c.conditionId === 'condition-500')).toHaveLength(0);
    });

    it('should preserve array order when removing conditions', async () => {
      const orderedCharacter = {
        ...mockCharacter,
        characterConditions: [
          { conditionId: 'first', amount: 1 },
          { conditionId: 'second', amount: 2 },
          { conditionId: 'third', amount: 3 },
          { conditionId: 'fourth', amount: 4 },
          { conditionId: 'fifth', amount: 5 }
        ]
      };

      const event = {
        characterId: 'char-1',
        conditionId: 'third'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: orderedCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...orderedCharacter,
            characterConditions: [
              { conditionId: 'first', amount: 1 },
              { conditionId: 'second', amount: 2 },
              { conditionId: 'fourth', amount: 4 },
              { conditionId: 'fifth', amount: 5 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions[0]).toEqual({ conditionId: 'first', amount: 1 });
      expect(result.characterConditions[1]).toEqual({ conditionId: 'second', amount: 2 });
      expect(result.characterConditions[2]).toEqual({ conditionId: 'fourth', amount: 4 });
      expect(result.characterConditions[3]).toEqual({ conditionId: 'fifth', amount: 5 });
    });

    it('should handle null condition ID gracefully', async () => {
      const event = {
        characterId: 'char-1',
        conditionId: null
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(mockCharacter);
    });

    it('should handle different amount values correctly', async () => {
      const characterVariousAmounts = {
        ...mockCharacter,
        characterConditions: [
          { conditionId: 'cond-zero', amount: 0 },
          { conditionId: 'cond-negative', amount: -5 },
          { conditionId: 'cond-large', amount: 999999 },
          { conditionId: 'cond-remove', amount: 1 }
        ]
      };

      const event = {
        characterId: 'char-1',
        conditionId: 'cond-remove'
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterVariousAmounts })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterVariousAmounts,
            characterConditions: [
              { conditionId: 'cond-zero', amount: 0 },
              { conditionId: 'cond-negative', amount: -5 },
              { conditionId: 'cond-large', amount: 999999 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterConditions).toHaveLength(3);
      expect(result.characterConditions).toContainEqual({ conditionId: 'cond-zero', amount: 0 });
      expect(result.characterConditions).toContainEqual({ conditionId: 'cond-negative', amount: -5 });
      expect(result.characterConditions).toContainEqual({ conditionId: 'cond-large', amount: 999999 });
      expect(result.characterConditions).not.toContainEqual({ conditionId: 'cond-remove', amount: 1 });
    });
  });
});