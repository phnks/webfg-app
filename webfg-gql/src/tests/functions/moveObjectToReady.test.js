const { handler } = require('../../../functions/moveObjectToReady');

describe('moveObjectToReady', () => {
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
    equipmentIds: ['obj-1', 'obj-2', 'obj-3'],
    readyIds: ['obj-ready-1']
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

    it('should throw error when object not in equipment', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-not-in-equipment'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      await expect(handler(event)).rejects.toThrow('Object obj-not-in-equipment is not in character\'s equipment');
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

      await expect(handler(event)).rejects.toThrow('Object undefined is not in character\'s equipment');
    });
  });

  describe('moving objects to ready', () => {
    it('should move object from equipment to ready', async () => {
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
            equipmentIds: ['obj-2', 'obj-3'],
            readyIds: ['obj-ready-1', 'obj-1']
          }
        });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
      expect(result.equipmentIds).toEqual(['obj-2', 'obj-3']);
      expect(result.readyIds).toEqual(['obj-ready-1', 'obj-1']);
      expect(result.equipmentIds).not.toContain('obj-1');
      expect(result.readyIds).toContain('obj-1');
    });

    it('should return character unchanged if object already ready', async () => {
      const characterWithObjectReady = {
        ...mockCharacter,
        equipmentIds: ['obj-1', 'obj-2', 'obj-3'],
        readyIds: ['obj-ready-1', 'obj-1'] // obj-1 is already ready
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterWithObjectReady });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(characterWithObjectReady);
    });

    it('should handle character with no equipmentIds', async () => {
      const characterNoEquipment = {
        characterId: 'char-1',
        name: 'Test Character',
        readyIds: ['obj-ready-1']
        // No equipmentIds field
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterNoEquipment });

      await expect(handler(event)).rejects.toThrow('Object obj-1 is not in character\'s equipment');
    });

    it('should handle character with no readyIds', async () => {
      const characterNoReady = {
        characterId: 'char-1',
        name: 'Test Character',
        equipmentIds: ['obj-1', 'obj-2']
        // No readyIds field
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterNoReady })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterNoReady,
            equipmentIds: ['obj-2'],
            readyIds: ['obj-1']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toEqual(['obj-2']);
      expect(result.readyIds).toEqual(['obj-1']);
    });

    it('should handle moving last item from equipment', async () => {
      const characterOneItem = {
        ...mockCharacter,
        equipmentIds: ['obj-1'],
        readyIds: []
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
            equipmentIds: [],
            readyIds: ['obj-1']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toEqual([]);
      expect(result.readyIds).toEqual(['obj-1']);
    });

    it('should preserve order in ready array', async () => {
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
            equipmentIds: ['obj-1', 'obj-3'],
            readyIds: ['obj-ready-1', 'obj-2'] // obj-2 added to end
          }
        });

      const result = await handler(event);

      expect(result.readyIds[0]).toBe('obj-ready-1');
      expect(result.readyIds[1]).toBe('obj-2');
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
            equipmentIds: ['obj-2', 'obj-3'],
            readyIds: ['obj-ready-1', 'obj-1']
          }
        });

      const result1 = await handler(event1);
      expect(result1.readyIds).toContain('obj-1');

      jest.clearAllMocks();

      // Second move
      const updatedCharacter = {
        ...mockCharacter,
        equipmentIds: ['obj-2', 'obj-3'],
        readyIds: ['obj-ready-1', 'obj-1']
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
            equipmentIds: ['obj-3'],
            readyIds: ['obj-ready-1', 'obj-1', 'obj-2']
          }
        });

      const result2 = await handler(event2);
      expect(result2.readyIds).toContain('obj-2');
      expect(result2.readyIds).toHaveLength(3);
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
        equipmentIds: [specialObjectId, 'obj-2'],
        readyIds: []
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
            equipmentIds: ['obj-2'],
            readyIds: [specialObjectId]
          }
        });

      const result = await handler(event);

      expect(result.readyIds).toContain(specialObjectId);
      expect(result.equipmentIds).not.toContain(specialObjectId);
    });

    it('should handle very long object IDs', async () => {
      const longObjectId = 'a'.repeat(1000);
      const characterWithLongId = {
        ...mockCharacter,
        equipmentIds: [longObjectId],
        readyIds: []
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
            equipmentIds: [],
            readyIds: [longObjectId]
          }
        });

      const result = await handler(event);

      expect(result.readyIds).toContain(longObjectId);
    });

    it('should handle large equipment and ready arrays', async () => {
      const largeEquipmentArray = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      const largeReadyArray = Array.from({ length: 50 }, (_, i) => `ready-item-${i}`);
      
      const characterWithLargeArrays = {
        ...mockCharacter,
        equipmentIds: largeEquipmentArray,
        readyIds: largeReadyArray
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'item-50'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithLargeArrays })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterWithLargeArrays,
            equipmentIds: largeEquipmentArray.filter(id => id !== 'item-50'),
            readyIds: [...largeReadyArray, 'item-50']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toHaveLength(99);
      expect(result.readyIds).toHaveLength(51);
      expect(result.readyIds).toContain('item-50');
    });

    it('should handle empty equipment and ready arrays', async () => {
      const characterEmptyArrays = {
        characterId: 'char-1',
        name: 'Test Character',
        equipmentIds: [],
        readyIds: []
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterEmptyArrays });

      await expect(handler(event)).rejects.toThrow('Object obj-1 is not in character\'s equipment');
    });
  });
});