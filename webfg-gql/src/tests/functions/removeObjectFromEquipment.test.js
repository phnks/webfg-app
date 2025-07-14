const { handler } = require('../../../functions/removeObjectFromEquipment');

describe('removeObjectFromEquipment', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CHARACTERS_TABLE: 'test-characters-table'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockCharacter = {
    characterId: 'char-1',
    name: 'Test Character',
    equipmentIds: ['obj-1', 'obj-2', 'obj-3']
  };

  describe('input validation', () => {
    it('should throw error when character not found', async () => {
      const event = {
        arguments: {
          characterId: 'nonexistent-char',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Character with ID nonexistent-char not found');
    });

    it('should handle missing characterId', async () => {
      const event = {
        arguments: {
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Character with ID undefined not found');
    });

    it('should handle missing objectId', async () => {
      const event = {
        arguments: {
          characterId: 'char-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);
      
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(mockCharacter); // Character unchanged
    });
  });

  describe('removing objects from equipment', () => {
    it('should remove object from equipment', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-2'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['obj-1', 'obj-3'] // obj-2 removed
          }
        });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
      expect(result.equipmentIds).toEqual(['obj-1', 'obj-3']);
      expect(result.equipmentIds).not.toContain('obj-2');
      expect(result.equipmentIds).toHaveLength(2);
    });

    it('should return character unchanged if object not in equipment', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-not-equipped'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(mockCharacter);
      expect(result.equipmentIds).toHaveLength(3); // Unchanged
    });

    it('should handle character with no equipmentIds', async () => {
      const characterNoEquipment = {
        characterId: 'char-1',
        name: 'Test Character'
        // No equipmentIds field
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterNoEquipment });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(characterNoEquipment);
    });

    it('should handle character with empty equipmentIds', async () => {
      const characterEmptyEquipment = {
        characterId: 'char-1',
        name: 'Test Character',
        equipmentIds: []
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterEmptyEquipment });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(characterEmptyEquipment);
    });

    it('should remove first item from equipment', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1' // First item
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['obj-2', 'obj-3']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toEqual(['obj-2', 'obj-3']);
      expect(result.equipmentIds[0]).toBe('obj-2'); // New first item
    });

    it('should remove last item from equipment', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-3' // Last item
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['obj-1', 'obj-2']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toEqual(['obj-1', 'obj-2']);
      expect(result.equipmentIds).toHaveLength(2);
    });

    it('should remove middle item from equipment', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-2' // Middle item
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['obj-1', 'obj-3']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toEqual(['obj-1', 'obj-3']);
      expect(result.equipmentIds).not.toContain('obj-2');
    });

    it('should handle removing only item from equipment', async () => {
      const characterOneItem = {
        ...mockCharacter,
        equipmentIds: ['obj-1']
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterOneItem })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterOneItem,
            equipmentIds: []
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toEqual([]);
    });

    it('should handle removing multiple different objects sequentially', async () => {
      // First removal
      const event1 = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['obj-2', 'obj-3']
          }
        });

      const result1 = await handler(event1);
      expect(result1.equipmentIds).not.toContain('obj-1');

      jest.clearAllMocks();

      // Second removal
      const updatedCharacter = {
        ...mockCharacter,
        equipmentIds: ['obj-2', 'obj-3']
      };

      const event2 = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-3'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: updatedCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...updatedCharacter,
            equipmentIds: ['obj-2']
          }
        });

      const result2 = await handler(event2);
      expect(result2.equipmentIds).toEqual(['obj-2']);
      expect(result2.equipmentIds).toHaveLength(1);
    });

    it('should remove all occurrences if object appears multiple times', async () => {
      const characterDuplicates = {
        ...mockCharacter,
        equipmentIds: ['obj-1', 'obj-2', 'obj-1', 'obj-3'] // obj-1 appears twice
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterDuplicates })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterDuplicates,
            equipmentIds: ['obj-2', 'obj-3'] // Both obj-1 instances removed
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toEqual(['obj-2', 'obj-3']);
      expect(result.equipmentIds).not.toContain('obj-1');
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB get errors', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB get error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB get error');
    });

    it('should handle DynamoDB update errors', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockRejectedValueOnce(new Error('DynamoDB update error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB update error');
    });
  });

  describe('environment variables', () => {
    it('should use CHARACTERS_TABLE environment variable', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: mockCharacter });

      await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in object IDs', async () => {
      const specialObjectId = 'obj-with-special-chars_@#$%^&*()';
      const characterWithSpecialObject = {
        ...mockCharacter,
        equipmentIds: ['obj-1', specialObjectId, 'obj-3']
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: specialObjectId
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithSpecialObject })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterWithSpecialObject,
            equipmentIds: ['obj-1', 'obj-3']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).not.toContain(specialObjectId);
      expect(result.equipmentIds).toEqual(['obj-1', 'obj-3']);
    });

    it('should handle very long object IDs', async () => {
      const longObjectId = 'a'.repeat(1000);
      const characterWithLongId = {
        ...mockCharacter,
        equipmentIds: [longObjectId, 'obj-2']
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: longObjectId
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithLongId })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterWithLongId,
            equipmentIds: ['obj-2']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).not.toContain(longObjectId);
      expect(result.equipmentIds).toEqual(['obj-2']);
    });

    it('should handle large equipment arrays', async () => {
      const largeEquipmentArray = Array.from({ length: 1000 }, (_, i) => `item-${i}`);
      const characterWithLargeArray = {
        ...mockCharacter,
        equipmentIds: largeEquipmentArray
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'item-500'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithLargeArray })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterWithLargeArray,
            equipmentIds: largeEquipmentArray.filter(id => id !== 'item-500')
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toHaveLength(999);
      expect(result.equipmentIds).not.toContain('item-500');
    });

    it('should preserve array order when removing items', async () => {
      const orderedCharacter = {
        ...mockCharacter,
        equipmentIds: ['first', 'second', 'third', 'fourth', 'fifth']
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'third'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: orderedCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...orderedCharacter,
            equipmentIds: ['first', 'second', 'fourth', 'fifth']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toEqual(['first', 'second', 'fourth', 'fifth']);
      expect(result.equipmentIds[0]).toBe('first');
      expect(result.equipmentIds[1]).toBe('second');
      expect(result.equipmentIds[2]).toBe('fourth');
      expect(result.equipmentIds[3]).toBe('fifth');
    });

    it('should handle null object ID gracefully', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: null
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(mockCharacter);
    });
  });
});