const { handler } = require('../../../functions/moveObjectFromReadyToEquipment');

describe('moveObjectFromReadyToEquipment', () => {
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
    readyIds: ['obj-1', 'obj-2', 'obj-3'],
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

    it('should throw error when object not in ready items', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-not-ready'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      await expect(handler(event)).rejects.toThrow('Object obj-not-ready is not in character\'s ready items');
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

      await expect(handler(event)).rejects.toThrow('Object undefined is not in character\'s ready items');
    });
  });

  describe('moving objects from ready to equipment', () => {
    it('should move object from ready to equipment', async () => {
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
            readyIds: ['obj-2', 'obj-3'],
            equipmentIds: ['obj-equipped-1', 'obj-1']
          }
        });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
      expect(result.readyIds).toEqual(['obj-2', 'obj-3']);
      expect(result.equipmentIds).toEqual(['obj-equipped-1', 'obj-1']);
      expect(result.readyIds).not.toContain('obj-1');
      expect(result.equipmentIds).toContain('obj-1');
    });

    it('should return character unchanged if object already in equipment', async () => {
      const characterWithObjectEquipped = {
        ...mockCharacter,
        readyIds: ['obj-1', 'obj-2', 'obj-3'],
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

    it('should handle character with no readyIds', async () => {
      const characterNoReady = {
        characterId: 'char-1',
        name: 'Test Character',
        equipmentIds: ['obj-equipped-1']
        // No readyIds field
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterNoReady });

      await expect(handler(event)).rejects.toThrow('Object obj-1 is not in character\'s ready items');
    });

    it('should handle character with no equipmentIds', async () => {
      const characterNoEquipment = {
        characterId: 'char-1',
        name: 'Test Character',
        readyIds: ['obj-1', 'obj-2']
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
            readyIds: ['obj-2'],
            equipmentIds: ['obj-1']
          }
        });

      const result = await handler(event);

      expect(result.readyIds).toEqual(['obj-2']);
      expect(result.equipmentIds).toEqual(['obj-1']);
    });

    it('should handle moving last item from ready', async () => {
      const characterOneItem = {
        ...mockCharacter,
        readyIds: ['obj-1'],
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
            readyIds: [],
            equipmentIds: ['obj-1']
          }
        });

      const result = await handler(event);

      expect(result.readyIds).toEqual([]);
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
            readyIds: ['obj-1', 'obj-3'],
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
            readyIds: ['obj-2', 'obj-3'],
            equipmentIds: ['obj-equipped-1', 'obj-1']
          }
        });

      const result1 = await handler(event1);
      expect(result1.equipmentIds).toContain('obj-1');

      jest.clearAllMocks();

      // Second move
      const updatedCharacter = {
        ...mockCharacter,
        readyIds: ['obj-2', 'obj-3'],
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
            readyIds: ['obj-3'],
            equipmentIds: ['obj-equipped-1', 'obj-1', 'obj-2']
          }
        });

      const result2 = await handler(event2);
      expect(result2.equipmentIds).toContain('obj-2');
      expect(result2.equipmentIds).toHaveLength(3);
    });

    it('should handle moving from middle of ready array', async () => {
      const characterMultipleReady = {
        ...mockCharacter,
        readyIds: ['obj-first', 'obj-middle', 'obj-last'],
        equipmentIds: ['obj-equipped-1']
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-middle'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterMultipleReady })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterMultipleReady,
            readyIds: ['obj-first', 'obj-last'],
            equipmentIds: ['obj-equipped-1', 'obj-middle']
          }
        });

      const result = await handler(event);

      expect(result.readyIds).toEqual(['obj-first', 'obj-last']);
      expect(result.equipmentIds).toContain('obj-middle');
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
        readyIds: [specialObjectId, 'obj-2'],
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
            readyIds: ['obj-2'],
            equipmentIds: [specialObjectId]
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toContain(specialObjectId);
      expect(result.readyIds).not.toContain(specialObjectId);
    });

    it('should handle very long object IDs', async () => {
      const longObjectId = 'a'.repeat(1000);
      const characterWithLongId = {
        ...mockCharacter,
        readyIds: [longObjectId],
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
            readyIds: [],
            equipmentIds: [longObjectId]
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toContain(longObjectId);
    });

    it('should handle large ready and equipment arrays', async () => {
      const largeReadyArray = Array.from({ length: 100 }, (_, i) => `ready-item-${i}`);
      const largeEquipmentArray = Array.from({ length: 50 }, (_, i) => `equip-item-${i}`);
      
      const characterWithLargeArrays = {
        ...mockCharacter,
        readyIds: largeReadyArray,
        equipmentIds: largeEquipmentArray
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'ready-item-50'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithLargeArrays })
        .mockResolvedValueOnce({
          Attributes: {
            ...characterWithLargeArrays,
            readyIds: largeReadyArray.filter(id => id !== 'ready-item-50'),
            equipmentIds: [...largeEquipmentArray, 'ready-item-50']
          }
        });

      const result = await handler(event);

      expect(result.readyIds).toHaveLength(99);
      expect(result.equipmentIds).toHaveLength(51);
      expect(result.equipmentIds).toContain('ready-item-50');
    });

    it('should handle empty ready and equipment arrays', async () => {
      const characterEmptyArrays = {
        characterId: 'char-1',
        name: 'Test Character',
        readyIds: [],
        equipmentIds: []
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: characterEmptyArrays });

      await expect(handler(event)).rejects.toThrow('Object obj-1 is not in character\'s ready items');
    });

    it('should handle moving from ready to first equipment slot', async () => {
      const characterNoEquipment = {
        characterId: 'char-1',
        name: 'Test Character',
        readyIds: ['obj-1'],
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
            readyIds: [],
            equipmentIds: ['obj-1']
          }
        });

      const result = await handler(event);

      expect(result.readyIds).toEqual([]);
      expect(result.equipmentIds).toEqual(['obj-1']);
    });
  });
});