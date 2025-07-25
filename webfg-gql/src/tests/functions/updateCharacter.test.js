const { handler } = require('../../../functions/updateCharacter');

describe('updateCharacter', () => {
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

  describe('input validation', () => {
    it('should throw error when CHARACTERS_TABLE environment variable not set', async () => {
      delete process.env.CHARACTERS_TABLE;

      const event = {
        characterId: 'char-1',
        input: { name: 'Test Character' }
      };

      await expect(handler(event)).rejects.toThrow('Internal server error: CHARACTERS_TABLE not set.');
    });

    it('should throw error when characterId is missing', async () => {
      const event = {
        input: { name: 'Test Character' }
      };

      await expect(handler(event)).rejects.toThrow('characterId is required.');
    });

    it('should throw error when no fields specified for update', async () => {
      const event = {
        characterId: 'char-1',
        input: {}
      };

      await expect(handler(event)).rejects.toThrow('No fields specified for update.');
    });
  });

  describe('character updates', () => {
    it('should update character name and generate nameLowerCase', async () => {
      const event = {
        characterId: 'char-1',
        input: { name: 'Test Hero' }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        name: 'Test Hero',
        nameLowerCase: 'test hero'
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedCharacter);
    });

    it('should update multiple character fields', async () => {
      const event = {
        characterId: 'char-1',
        input: {
          name: 'Updated Hero',
          characterCategory: 'ELF',
          will: 15,
          strength: 12,
          dexterity: 10
        }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        name: 'Updated Hero',
        nameLowerCase: 'updated hero',
        characterCategory: 'ELF',
        will: 15,
        strength: 12,
        dexterity: 10
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should update attribute values', async () => {
      const event = {
        characterId: 'char-1',
        input: {
          speed: 8,
          weight: 180,
          size: 6,
          armour: 5,
          endurance: 12,
          lethality: 7,
          agility: 9,
          perception: 11,
          intensity: 4,
          resolve: 13,
          morale: 10,
          intelligence: 14,
          charisma: 6
        }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        ...event.input
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should update arrays (actionIds, stashIds, equipmentIds, readyIds)', async () => {
      const event = {
        characterId: 'char-1',
        input: {
          actionIds: ['action-1', 'action-2'],
          stashIds: ['item-1', 'item-2', 'item-3'],
          equipmentIds: ['equip-1', 'equip-2'],
          readyIds: ['ready-1']
        }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        ...event.input
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should update values and special fields', async () => {
      const event = {
        characterId: 'char-1',
        input: {
          values: { honor: 10, reputation: 5 },
          special: { notes: 'Special abilities here' }
        }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        ...event.input
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should handle name with special characters', async () => {
      const event = {
        characterId: 'char-1',
        input: { name: 'Tëst Hërø with Special Chars!' }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        name: 'Tëst Hërø with Special Chars!',
        nameLowerCase: 'tëst hërø with special chars!'
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result.nameLowerCase).toBe('tëst hërø with special chars!');
    });

    it('should handle empty arrays', async () => {
      const event = {
        characterId: 'char-1',
        input: {
          actionIds: [],
          stashIds: [],
          equipmentIds: [],
          readyIds: []
        }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        actionIds: [],
        stashIds: [],
        equipmentIds: [],
        readyIds: []
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should handle zero values', async () => {
      const event = {
        characterId: 'char-1',
        input: {
          will: 0,
          strength: 0,
          speed: 0
        }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        will: 0,
        strength: 0,
        speed: 0
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should handle negative values', async () => {
      const event = {
        characterId: 'char-1',
        input: {
          will: -5,
        }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        will: -5,
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should return null when character not found', async () => {
      const event = {
        characterId: 'nonexistent-char',
        input: { name: 'Test Character' }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: {} // Empty attributes indicate character not found
      });

      const result = await handler(event);

      expect(result).toBeNull();
    });

    it('should return null when no attributes returned', async () => {
      const event = {
        characterId: 'char-1',
        input: { name: 'Test Character' }
      };

      global.mockDynamoSend.mockResolvedValueOnce({}); // No Attributes field

      const result = await handler(event);

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB update errors', async () => {
      const event = {
        characterId: 'char-1',
        input: { name: 'Test Character' }
      };

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB update error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB update error');
    });

    it('should handle validation errors from DynamoDB', async () => {
      const event = {
        characterId: 'char-1',
        input: { name: 'Test Character' }
      };

      const validationError = new Error('ValidationException');
      validationError.name = 'ValidationException';
      global.mockDynamoSend.mockRejectedValueOnce(validationError);

      await expect(handler(event)).rejects.toThrow('ValidationException');
    });
  });

  describe('edge cases', () => {
    it('should handle very long character ID', async () => {
      const longCharacterId = 'a'.repeat(1000);
      const event = {
        characterId: longCharacterId,
        input: { name: 'Test Character' }
      };

      const updatedCharacter = {
        characterId: longCharacterId,
        name: 'Test Character',
        nameLowerCase: 'test character'
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should handle very long name', async () => {
      const longName = 'A'.repeat(10000);
      const event = {
        characterId: 'char-1',
        input: { name: longName }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        name: longName,
        nameLowerCase: longName.toLowerCase()
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result.nameLowerCase).toBe(longName.toLowerCase());
    });

    it('should handle large arrays', async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => `item-${i}`);
      const event = {
        characterId: 'char-1',
        input: {
          actionIds: largeArray,
          stashIds: largeArray
        }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        actionIds: largeArray,
        stashIds: largeArray
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result.actionIds).toHaveLength(1000);
      expect(result.stashIds).toHaveLength(1000);
    });

    it('should handle complex values object', async () => {
      const complexValues = {
        nested: {
          deeply: {
            nested: {
              value: 42,
              array: [1, 2, 3],
              boolean: true
            }
          }
        },
        array: [{ a: 1 }, { b: 2 }]
      };

      const event = {
        characterId: 'char-1',
        input: { values: complexValues }
      };

      const updatedCharacter = {
        characterId: 'char-1',
        values: complexValues
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result.values).toEqual(complexValues);
    });

    it('should handle null values in input', async () => {
      const event = {
        characterId: 'char-1',
        input: {
          name: 'Test Character',
          will: null,
        }
      };

      // null values should still be processed by addUpdateField
      const updatedCharacter = {
        characterId: 'char-1',
        name: 'Test Character',
        nameLowerCase: 'test character',
        will: null,
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Attributes: updatedCharacter
      });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });
  });
});