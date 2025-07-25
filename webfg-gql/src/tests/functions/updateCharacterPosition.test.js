const { handler } = require('../../../functions/updateCharacterPosition');

describe('updateCharacterPosition', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      ENCOUNTERS_TABLE: 'test-encounters-table',
      CHARACTERS_TABLE: 'test-characters-table'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockEncounter = {
    encounterId: 'enc-1',
    currentTime: 1000,
    characterPositions: [
      { characterId: 'char-1', x: 5, y: 5 },
      { characterId: 'char-2', x: 10, y: 15 }
    ],
    objectPositions: [],
    terrainElements: [],
    gridElements: [],
    history: [
      { time: 500, type: 'ENCOUNTER_STARTED', description: 'Encounter started' }
    ]
  };

  const mockCharacter = {
    characterId: 'char-1',
    name: 'Test Hero',
    stats: {
      hitPoints: { current: 50 },
      surges: { current: 3 },
      exhaustion: { current: 0 }
    },
    conditions: ['blessed', 'focused']
  };

  const mockUpdatedEncounter = {
    ...mockEncounter,
    characterPositions: [
      { characterId: 'char-1', x: 20, y: 25 }, // Updated position
      { characterId: 'char-2', x: 10, y: 15 }
    ],
    history: [
      ...mockEncounter.history,
      {
        time: 1000,
        type: 'CHARACTER_MOVED',
        characterId: 'char-1',
        description: 'Test Hero moved to position (100ft, 125ft)',
        x: 20,
        y: 25,
        stats: {
          hitPoints: 50,
          surges: 3,
          exhaustion: 0
        },
        conditions: ['blessed', 'focused']
      }
    ]
  };

  describe('input validation', () => {
    it('should throw error when encounter not found', async () => {
      const event = {
        arguments: {
          encounterId: 'nonexistent-encounter',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Encounter nonexistent-encounter or its characterPositions not found');
    });

    it('should throw error when encounter has no characterPositions', async () => {
      const encounterNoPositions = {
        encounterId: 'enc-1',
        currentTime: 1000
        // No characterPositions
      };

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: encounterNoPositions });

      await expect(handler(event)).rejects.toThrow('Encounter enc-1 or its characterPositions not found');
    });

    it('should throw error when character not found in encounter', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-not-in-encounter',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockEncounter });

      await expect(handler(event)).rejects.toThrow('Character char-not-in-encounter not found in encounter enc-1');
    });

    it('should throw error when character not found in characters table', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: null }); // Character not found

      await expect(handler(event)).rejects.toThrow('Character with ID char-1 not found');
    });

    it('should handle missing coordinates with default values', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1'
          // No x, y coordinates
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
      expect(result.encounterId).toBe('enc-1');
    });
  });

  describe('position updates', () => {
    it('should update character position successfully', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 20,
          y: 25
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
      expect(result.encounterId).toBe('enc-1');
      expect(result.characterPositions).toBeDefined();
      expect(result.history).toBeDefined();
      expect(result.objectPositions).toBeDefined();
      expect(result.terrainElements).toBeDefined();
      expect(result.gridElements).toBeDefined();
    });

    it('should handle position update with zero coordinates', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 0,
          y: 0
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle negative coordinates', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: -5,
          y: -10
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle large coordinate values', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 999,
          y: 1000
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should update position for character at different index', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-2', // Second character in array
          x: 30,
          y: 35
        }
      };

      const char2 = { ...mockCharacter, characterId: 'char-2', name: 'Character Two' };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: char2 })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });
  });

  describe('character data handling', () => {
    it('should handle character with no name', async () => {
      const characterNoName = {
        ...mockCharacter
      };
      delete characterNoName.name;

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: characterNoName })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle character with missing stats', async () => {
      const characterNoStats = {
        characterId: 'char-1',
        name: 'Test Hero'
        // No stats field
      };

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: characterNoStats })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle character with missing conditions', async () => {
      const characterNoConditions = {
        ...mockCharacter
      };
      delete characterNoConditions.conditions;

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: characterNoConditions })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle character with partial stats', async () => {
      const characterPartialStats = {
        ...mockCharacter,
        stats: {
          hitPoints: { current: 30 }
          // Missing other stats
        }
      };

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: characterPartialStats })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });
  });

  describe('encounter state handling', () => {
    it('should handle encounter with no history', async () => {
      const encounterNoHistory = {
        ...mockEncounter
      };
      delete encounterNoHistory.history;

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: encounterNoHistory })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle encounter with missing optional fields', async () => {
      const encounterMinimal = {
        encounterId: 'enc-1',
        currentTime: 1000,
        characterPositions: [
          { characterId: 'char-1', x: 5, y: 5 }
        ]
        // Missing objectPositions, terrainElements, gridElements, history
      };

      const updatedMinimal = {
        ...encounterMinimal,
        characterPositions: [
          { characterId: 'char-1', x: 10, y: 15 }
        ],
        history: []
      };

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: encounterMinimal })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: updatedMinimal }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(result.characterPositions).toBeDefined();
      expect(result.objectPositions).toBeUndefined(); // Should preserve undefined
      expect(result.terrainElements).toBeUndefined();
      expect(result.gridElements).toBeUndefined();
      expect(result.history).toBeDefined();
    });

    it('should throw error if final fetch fails', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: null }); // Final fetch fails

      await expect(handler(event)).rejects.toThrow('Failed to re-fetch encounter enc-1 after update.');
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB get encounter errors', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB encounter get error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB encounter get error');
    });

    it('should handle DynamoDB get character errors', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockRejectedValueOnce(new Error('DynamoDB character get error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB character get error');
    });

    it('should handle DynamoDB update errors', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockRejectedValueOnce(new Error('DynamoDB update error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB update error');
    });

    it('should handle DynamoDB final fetch errors', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockRejectedValueOnce(new Error('DynamoDB final fetch error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB final fetch error');
    });
  });

  describe('environment variables', () => {
    it('should use ENCOUNTERS_TABLE and CHARACTERS_TABLE environment variables', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
      // Verify the function uses environment variables (implicit in the table access)
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in IDs', async () => {
      const specialEncounterId = 'enc-with-special-chars_@#$%^&*()';
      const specialCharacterId = 'char-with-special-chars_@#$%^&*()';

      const event = {
        arguments: {
          encounterId: specialEncounterId,
          characterId: specialCharacterId,
          x: 10,
          y: 15
        }
      };

      const specialEncounter = {
        ...mockEncounter,
        encounterId: specialEncounterId,
        characterPositions: [
          { characterId: specialCharacterId, x: 5, y: 5 }
        ]
      };

      const specialCharacter = {
        ...mockCharacter,
        characterId: specialCharacterId
      };

      const specialUpdated = {
        ...specialEncounter,
        characterPositions: [
          { characterId: specialCharacterId, x: 10, y: 15 }
        ]
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: specialEncounter })
        .mockResolvedValueOnce({ Item: specialCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: specialUpdated }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe(specialEncounterId);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle very long ID values', async () => {
      const longEncounterId = 'a'.repeat(1000);
      const longCharacterId = 'b'.repeat(1000);

      const event = {
        arguments: {
          encounterId: longEncounterId,
          characterId: longCharacterId,
          x: 10,
          y: 15
        }
      };

      const longEncounter = {
        ...mockEncounter,
        encounterId: longEncounterId,
        characterPositions: [
          { characterId: longCharacterId, x: 5, y: 5 }
        ]
      };

      const longCharacter = {
        ...mockCharacter,
        characterId: longCharacterId
      };

      const longUpdated = {
        ...longEncounter,
        characterPositions: [
          { characterId: longCharacterId, x: 10, y: 15 }
        ]
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: longEncounter })
        .mockResolvedValueOnce({ Item: longCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: longUpdated }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe(longEncounterId);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle multiple characters in encounter', async () => {
      const multiCharacterEncounter = {
        ...mockEncounter,
        characterPositions: [
          { characterId: 'char-1', x: 5, y: 5 },
          { characterId: 'char-2', x: 10, y: 15 },
          { characterId: 'char-3', x: 20, y: 25 },
          { characterId: 'char-4', x: 30, y: 35 }
        ]
      };

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-3', // Third character
          x: 100,
          y: 200
        }
      };

      const updatedMultiCharacter = {
        ...multiCharacterEncounter,
        characterPositions: [
          { characterId: 'char-1', x: 5, y: 5 },
          { characterId: 'char-2', x: 10, y: 15 },
          { characterId: 'char-3', x: 100, y: 200 }, // Updated
          { characterId: 'char-4', x: 30, y: 35 }
        ]
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: multiCharacterEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: updatedMultiCharacter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(result.characterPositions).toHaveLength(4);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });

    it('should handle decimal coordinates', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 10.5,
          y: 15.7
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({}) // Update result
        .mockResolvedValueOnce({ Item: mockUpdatedEncounter }); // Final fetch

      const result = await handler(event);

      expect(result.encounterId).toBe('enc-1');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });
  });
});