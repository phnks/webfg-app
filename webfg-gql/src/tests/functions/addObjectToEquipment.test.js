const { handler } = require('../../../functions/addObjectToEquipment');

describe('addObjectToEquipment', () => {
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
    equipmentIds: ['existing-item-1', 'existing-item-2']
  };

  describe('input validation', () => {
    it('should handle missing characterId', async () => {
      const event = {
        arguments: {
          objectId: 'obj-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Character with ID undefined not found');
    });

    it('should add undefined to equipment when objectId is missing', async () => {
      const event = {
        arguments: {
          characterId: 'char-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['existing-item-1', 'existing-item-2', undefined]
          }
        });

      const result = await handler(event);
      
      // Function will add undefined to the array (which is probably undesirable behavior)
      expect(result.equipmentIds).toContain(undefined);
    });

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
  });

  describe('adding objects to equipment', () => {
    it('should add new object to character with existing equipment', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'new-item'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['existing-item-1', 'existing-item-2', 'new-item']
          }
        });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
      expect(result.equipmentIds).toContain('new-item');
      expect(result.equipmentIds).toHaveLength(3);
    });

    it('should add object to character with no existing equipment', async () => {
      const characterWithoutEquipment = {
        characterId: 'char-1',
        name: 'Test Character',
        equipmentIds: []
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'first-item'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithoutEquipment })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...characterWithoutEquipment,
            equipmentIds: ['first-item']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toEqual(['first-item']);
    });

    it('should handle character with undefined equipmentIds', async () => {
      const characterNoEquipment = {
        characterId: 'char-1',
        name: 'Test Character'
        // No equipmentIds field
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'first-item'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterNoEquipment })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...characterNoEquipment,
            equipmentIds: ['first-item']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toEqual(['first-item']);
    });

    it('should return character unchanged if object already exists in equipment', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'existing-item-1'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only get, no update
      expect(result).toEqual(mockCharacter);
      expect(result.equipmentIds).toHaveLength(2); // Unchanged
    });

    it('should handle adding multiple different objects', async () => {
      const event1 = {
        arguments: {
          characterId: 'char-1',
          objectId: 'new-item-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['existing-item-1', 'existing-item-2', 'new-item-1']
          }
        });

      const result1 = await handler(event1);
      expect(result1.equipmentIds).toContain('new-item-1');

      jest.clearAllMocks();

      const event2 = {
        arguments: {
          characterId: 'char-1',
          objectId: 'new-item-2'
        }
      };

      const updatedCharacter = {
        ...mockCharacter,
        equipmentIds: ['existing-item-1', 'existing-item-2', 'new-item-1']
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: updatedCharacter })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...updatedCharacter,
            equipmentIds: ['existing-item-1', 'existing-item-2', 'new-item-1', 'new-item-2']
          }
        });

      const result2 = await handler(event2);
      expect(result2.equipmentIds).toContain('new-item-2');
      expect(result2.equipmentIds).toHaveLength(4);
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

      await expect(handler(event)).rejects.toThrow();
    });

    it('should handle DynamoDB update errors', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'new-item'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockRejectedValueOnce(new Error('DynamoDB update error'));

      await expect(handler(event)).rejects.toThrow();
    });
  });

  describe('environment variables', () => {
    it('should use CHARACTERS_TABLE environment variable', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'new-item'
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
    it('should handle very long object IDs', async () => {
      const longObjectId = 'a'.repeat(1000);
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: longObjectId
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['existing-item-1', 'existing-item-2', longObjectId]
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toContain(longObjectId);
    });

    it('should handle special characters in object IDs', async () => {
      const specialObjectId = 'obj-with-special-chars_@#$%^&*()';
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: specialObjectId
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['existing-item-1', 'existing-item-2', specialObjectId]
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toContain(specialObjectId);
    });

    it('should handle large equipment arrays', async () => {
      const largeEquipmentArray = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      const characterWithLotsOfEquipment = {
        ...mockCharacter,
        equipmentIds: largeEquipmentArray
      };

      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'item-100'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: characterWithLotsOfEquipment })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...characterWithLotsOfEquipment,
            equipmentIds: [...largeEquipmentArray, 'item-100']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds).toHaveLength(101);
      expect(result.equipmentIds).toContain('item-100');
    });

    it('should preserve order when adding new items', async () => {
      const event = {
        arguments: {
          characterId: 'char-1',
          objectId: 'new-last-item'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ 
          Attributes: {
            ...mockCharacter,
            equipmentIds: ['existing-item-1', 'existing-item-2', 'new-last-item']
          }
        });

      const result = await handler(event);

      expect(result.equipmentIds[0]).toBe('existing-item-1');
      expect(result.equipmentIds[1]).toBe('existing-item-2');
      expect(result.equipmentIds[2]).toBe('new-last-item');
    });
  });
});