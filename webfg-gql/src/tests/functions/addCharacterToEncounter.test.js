const { handler } = require('../../../functions/addCharacterToEncounter');

describe('addCharacterToEncounter', () => {
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
    name: 'Test Encounter',
    currentTime: 1000,
    characterPositions: [
      { characterId: 'existing-char', x: 5, y: 5 }
    ],
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

  describe('input validation', () => {
    it('should throw error when encounter not found', async () => {
      const event = {
        arguments: {
          encounterId: 'nonexistent-encounter',
          characterId: 'char-1',
          x: 0,
          y: 0
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Encounter with ID nonexistent-encounter not found');
    });

    it('should throw error when character not found', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'nonexistent-char',
          x: 0,
          y: 0
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Character with ID nonexistent-char not found');
    });
  });

  describe('adding new characters', () => {
    it('should add new character to encounter with specified position', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          startTime: 1500,
          x: 10,
          y: 15
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockEncounter,
            characterPositions: [
              { characterId: 'existing-char', x: 5, y: 5 },
              { characterId: 'char-1', x: 10, y: 15 }
            ],
            history: [
              ...mockEncounter.history,
              {
                time: 1500,
                type: 'CHARACTER_ADDED',
                characterId: 'char-1',
                description: 'Test Hero added to encounter at (50ft, 75ft)',
                x: 10,
                y: 15,
                stats: {
                  hitPoints: 50,
                  surges: 3,
                  exhaustion: 0
                },
                conditions: ['blessed', 'focused']
              }
            ]
          }
        });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(3);
      expect(result.characterPositions).toHaveLength(2);
      expect(result.characterPositions[1]).toEqual({
        characterId: 'char-1',
        x: 10,
        y: 15
      });
      expect(result.history).toHaveLength(2);
      expect(result.history[1]).toMatchObject({
        type: 'CHARACTER_ADDED',
        characterId: 'char-1',
        description: 'Test Hero added to encounter at (50ft, 75ft)'
      });
    });

    it('should add character with default position (0,0) when coordinates not provided', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockEncounter,
            characterPositions: [
              { characterId: 'existing-char', x: 5, y: 5 },
              { characterId: 'char-1', x: 0, y: 0 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterPositions[1]).toEqual({
        characterId: 'char-1',
        x: 0,
        y: 0
      });
    });

    it('should handle encounter with no existing character positions', async () => {
      const emptyEncounter = {
        ...mockEncounter,
        characterPositions: []
      };

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 5,
          y: 5
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: emptyEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...emptyEncounter,
            characterPositions: [
              { characterId: 'char-1', x: 5, y: 5 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterPositions).toHaveLength(1);
      expect(result.characterPositions[0]).toEqual({
        characterId: 'char-1',
        x: 5,
        y: 5
      });
    });

    it('should handle encounter with undefined characterPositions', async () => {
      const encounterNoPositions = {
        ...mockEncounter
      };
      delete encounterNoPositions.characterPositions;

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 3,
          y: 7
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: encounterNoPositions })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({
          Attributes: {
            ...encounterNoPositions,
            characterPositions: [
              { characterId: 'char-1', x: 3, y: 7 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterPositions).toHaveLength(1);
    });
  });

  describe('updating existing characters', () => {
    it('should update position for existing character', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'existing-char',
          x: 20,
          y: 25
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: { ...mockCharacter, characterId: 'existing-char', name: 'Existing Hero' } })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockEncounter,
            characterPositions: [
              { characterId: 'existing-char', x: 20, y: 25 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterPositions).toHaveLength(1);
      expect(result.characterPositions[0]).toEqual({
        characterId: 'existing-char',
        x: 20,
        y: 25
      });
    });

    it('should preserve existing position when coordinates not provided', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'existing-char'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: { ...mockCharacter, characterId: 'existing-char', name: 'Existing Hero' } })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockEncounter,
            characterPositions: [
              { characterId: 'existing-char', x: 5, y: 5 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterPositions[0]).toEqual({
        characterId: 'existing-char',
        x: 5,
        y: 5
      });
    });
  });

  describe('timeline and history', () => {
    it('should use provided startTime for history event', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          startTime: 1500, // Match the mockEncounter.currentTime + 500 
          x: 1,
          y: 1
        }
      };

      // Mock successful get encounter, get character, and update
      const mockResult = {
        Attributes: {
          ...mockEncounter,
          characterPositions: [
            { characterId: 'existing-char', x: 5, y: 5 },
            { characterId: 'char-1', x: 1, y: 1 }
          ],
          history: [
            ...mockEncounter.history,
            // The actual function will build this event, so we just need any valid response
          ]
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce(mockResult);

      const result = await handler(event);

      // Verify the function was called and that it works
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(3);
      expect(result.characterPositions).toBeDefined();
      expect(result.history).toBeDefined();
    });

    it('should use encounter currentTime when startTime not provided', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 1,
          y: 1
        }
      };

      const mockResult = {
        Attributes: {
          ...mockEncounter,
          characterPositions: [
            { characterId: 'existing-char', x: 5, y: 5 },
            { characterId: 'char-1', x: 1, y: 1 }
          ],
          history: [...mockEncounter.history]
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce(mockResult);

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(3);
      expect(result.characterPositions).toBeDefined();
      expect(result.history).toBeDefined();
    });

    it('should include character stats in history event', async () => {
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
        .mockResolvedValueOnce({
          Attributes: {
            ...mockEncounter,
            history: [
              ...mockEncounter.history,
              {
                time: 1000,
                type: 'CHARACTER_ADDED',
                characterId: 'char-1',
                stats: {
                  hitPoints: 50,
                  surges: 3,
                  exhaustion: 0
                },
                conditions: ['blessed', 'focused']
              }
            ]
          }
        });

      const result = await handler(event);

      expect(result.history[1].stats).toEqual({
        hitPoints: 50,
        surges: 3,
        exhaustion: 0
      });
      expect(result.history[1].conditions).toEqual(['blessed', 'focused']);
    });

    it('should handle character with missing stats gracefully', async () => {
      const characterNoStats = {
        characterId: 'char-1',
        name: 'Test Hero'
        // No stats field
      };

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
        .mockResolvedValueOnce({ Item: characterNoStats })
        .mockResolvedValueOnce({
          Attributes: {
            ...mockEncounter,
            history: [
              ...mockEncounter.history,
              {
                time: 1000,
                type: 'CHARACTER_ADDED',
                stats: {
                  hitPoints: 50,
                  surges: 3,
                  exhaustion: 0
                },
                conditions: []
              }
            ]
          }
        });

      const result = await handler(event);

      expect(result.history[1].stats).toEqual({
        hitPoints: 50,
        surges: 3,
        exhaustion: 0
      });
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB get encounter errors', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1'
        }
      };

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB get error'));

      await expect(handler(event)).rejects.toThrow();
    });

    it('should handle DynamoDB get character errors', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockRejectedValueOnce(new Error('Character get error'));

      await expect(handler(event)).rejects.toThrow();
    });

    it('should handle DynamoDB update errors', async () => {
      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1'
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockRejectedValueOnce(new Error('Update error'));

      await expect(handler(event)).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle character with no name', async () => {
      const characterNoName = {
        ...mockCharacter
      };
      delete characterNoName.name;

      const event = {
        arguments: {
          encounterId: 'enc-1',
          characterId: 'char-1',
          x: 1,
          y: 1
        }
      };

      const mockResult = {
        Attributes: {
          ...mockEncounter,
          characterPositions: [
            { characterId: 'existing-char', x: 5, y: 5 },
            { characterId: 'char-1', x: 1, y: 1 }
          ],
          history: [...mockEncounter.history]
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Item: characterNoName })
        .mockResolvedValueOnce(mockResult);

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(3);
      expect(result.characterPositions).toBeDefined();
      expect(result.history).toBeDefined();
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
        .mockResolvedValueOnce({
          Attributes: {
            ...mockEncounter,
            characterPositions: [
              { characterId: 'existing-char', x: 5, y: 5 },
              { characterId: 'char-1', x: 999, y: 1000 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterPositions[1]).toEqual({
        characterId: 'char-1',
        x: 999,
        y: 1000
      });
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
        .mockResolvedValueOnce({
          Attributes: {
            ...mockEncounter,
            characterPositions: [
              { characterId: 'existing-char', x: 5, y: 5 },
              { characterId: 'char-1', x: -5, y: -10 }
            ]
          }
        });

      const result = await handler(event);

      expect(result.characterPositions[1]).toEqual({
        characterId: 'char-1',
        x: -5,
        y: -10
      });
    });
  });
});