const { handler } = require('../../../functions/moveObjectToEquipment');

describe('moveObjectToEquipment', () => {
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
    stashIds: ['obj-1', 'obj-2', 'obj-3'],
    equipmentIds: ['obj-equipped-1']
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

    it('should throw error when object not in stash', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-not-in-stash'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      await expect(handler(event)).rejects.toThrow('Object obj-not-in-stash is not in character\'s stash');
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

      await expect(handler(event)).rejects.toThrow('Object undefined is not in character\'s stash');
    });
  });

  describe('moving objects to equipment', () => {
    it('should move object from stash to equipment', async () => {
      const event = {
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
            stashIds: ['obj-2', 'obj-3'],
            equipmentIds: ['obj-equipped-1', 'obj-1']
          }
        });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
      expect(result.stashIds).toEqual(['obj-2', 'obj-3']);
      expect(result.equipmentIds).toEqual(['obj-equipped-1', 'obj-1']);
      expect(result.stashIds).not.toContain('obj-1');
      expect(result.equipmentIds).toContain('obj-1');
    });

    it('should return character unchanged if object already equipped', async () => {
      const characterWithObjectEquipped = {
        ...mockCharacter,
        stashIds: ['obj-1', 'obj-2', 'obj-3'],
        equipmentIds: ['obj-equipped-1', 'obj-1'] // obj-1 is already equipped
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterWithObjectEquipped });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(characterWithObjectEquipped);
    });

    it('should handle character with no stashIds', async () => {
      const characterNoStash = {
        characterId: 'char-1',
        name: 'Test Character',
        equipmentIds: ['obj-equipped-1']
        // No stashIds field
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterNoStash });

      await expect(handler(event)).rejects.toThrow('Object obj-1 is not in character\'s stash');
    });

    it('should handle character with no equipmentIds', async () => {
      const characterNoEquipment = {
        characterId: 'char-1',
        name: 'Test Character',
        stashIds: ['obj-1', 'obj-2']
        // No equipmentIds field
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterNoEquipment })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterNoEquipment,
            stashIds: ['obj-2'],
            equipmentIds: ['obj-1']
          }
        });

      const result = await handler(event);

      expect(result.stashIds).toEqual(['obj-2']);
      expect(result.equipmentIds).toEqual(['obj-1']);
    });

    it('should handle moving last item from stash', async () => {
      const characterOneItem = {
        ...mockCharacter,
        stashIds: ['obj-1'],
        equipmentIds: []
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
            stashIds: [],
            equipmentIds: ['obj-1']
          }
        });

      const result = await handler(event);

      expect(result.stashIds).toEqual([]);
      expect(result.equipmentIds).toEqual(['obj-1']);
    });

    it('should preserve order in equipment array', async () => {
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
            stashIds: ['obj-1', 'obj-3'],
            equipmentIds: ['obj-equipped-1', 'obj-2'] // obj-2 added to end
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds[0]).toBe('obj-equipped-1');
      expect(result.equipmentIds[1]).toBe('obj-2');
    });

    it('should handle moving multiple objects sequentially', async () => {
      // First move
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
            stashIds: ['obj-2', 'obj-3'],
            equipmentIds: ['obj-equipped-1', 'obj-1']
          }
        });

      const result1 = await handler(event1);
      expect(result1.equipmentIds).toContain('obj-1');

      jest.clearAllMocks();

      // Second move
      const updatedCharacter = {
        ...mockCharacter,
        stashIds: ['obj-2', 'obj-3'],
        equipmentIds: ['obj-equipped-1', 'obj-1']
      };

      const event2 = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-2'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: updatedCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...updatedCharacter,
            stashIds: ['obj-3'],
            equipmentIds: ['obj-equipped-1', 'obj-1', 'obj-2']
          }
        });

      const result2 = await handler(event2);
      expect(result2.equipmentIds).toContain('obj-2');
      expect(result2.equipmentIds).toHaveLength(3);
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
        stashIds: [specialObjectId, 'obj-2'],
        equipmentIds: []
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
            stashIds: ['obj-2'],
            equipmentIds: [specialObjectId]
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toContain(specialObjectId);
      expect(result.stashIds).not.toContain(specialObjectId);
    });

    it('should handle very long object IDs', async () => {
      const longObjectId = 'a'.repeat(1000);
      const characterWithLongId = {
        ...mockCharacter,
        stashIds: [longObjectId],
        equipmentIds: []
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
            stashIds: [],
            equipmentIds: [longObjectId]
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toContain(longObjectId);
    });

    it('should handle large stash and equipment arrays', async () => {
      const largeStashArray = Array.from({ length: 100 }, (_, i) => `stash-item-${i}`);
      const largeEquipmentArray = Array.from({ length: 50 }, (_, i) => `equip-item-${i}`);
      
      const characterWithLargeArrays = {
        ...mockCharacter,
        stashIds: largeStashArray,
        equipmentIds: largeEquipmentArray
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'stash-item-50'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithLargeArrays })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterWithLargeArrays,
            stashIds: largeStashArray.filter(id => id !== 'stash-item-50'),
            equipmentIds: [...largeEquipmentArray, 'stash-item-50']
          }
        });

      const result = await handler(event);

      expect(result.stashIds).toHaveLength(99);
      expect(result.equipmentIds).toHaveLength(51);
      expect(result.equipmentIds).toContain('stash-item-50');
    });

    it('should handle empty stash and equipment arrays', async () => {
      const characterEmptyArrays = {
        characterId: 'char-1',
        name: 'Test Character',
        stashIds: [],
        equipmentIds: []
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterEmptyArrays });

      await expect(handler(event)).rejects.toThrow('Object obj-1 is not in character\'s stash');
    });

    it('should handle moving from stash to first equipment slot', async () => {
      const characterNoEquipment = {
        characterId: 'char-1',
        name: 'Test Character',
        stashIds: ['obj-1'],
        equipmentIds: []
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterNoEquipment })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterNoEquipment,
            stashIds: [],
            equipmentIds: ['obj-1']
          }
        });

      const result = await handler(event);

      expect(result.stashIds).toEqual([]);
      expect(result.equipmentIds).toEqual(['obj-1']);
    });
  });
});