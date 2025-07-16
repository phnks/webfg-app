const { handler } = require('../../../functions/advanceEncounterTime');

describe('advanceEncounterTime', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env = {
      ...originalEnv,
      ENCOUNTERS_TABLE: 'test-encounters-table'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('basic functionality', () => {
    it('should advance encounter time successfully', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: 150
        }
      };

      const mockEncounter = {
        encounterId: 'encounter123',
        name: 'Test Encounter',
        currentTime: 100
      };

      const updatedEncounter = {
        ...mockEncounter,
        currentTime: 150
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: updatedEncounter });

      const result = await handler(event);

      expect(result).toEqual(updatedEncounter);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });

    it('should handle encounter not found', async () => {
      const event = {
        arguments: {
          encounterId: 'nonexistent',
          newTime: 150
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Encounter with ID nonexistent not found');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('input validation', () => {
    it('should handle missing encounterId', async () => {
      const event = {
        arguments: {
          newTime: 150
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow();
    });

    it('should handle missing newTime', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123'
        }
      };

      const mockEncounter = {
        encounterId: 'encounter123',
        name: 'Test Encounter',
        currentTime: 100
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: { ...mockEncounter, currentTime: undefined } });

      const result = await handler(event);
      
      expect(result.currentTime).toBeUndefined();
    });

    it('should handle zero newTime', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: 0
        }
      };

      const mockEncounter = {
        encounterId: 'encounter123',
        currentTime: 100
      };

      const updatedEncounter = {
        ...mockEncounter,
        currentTime: 0
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: updatedEncounter });

      const result = await handler(event);

      expect(result.currentTime).toBe(0);
    });

    it('should handle negative newTime', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: -10
        }
      };

      const mockEncounter = {
        encounterId: 'encounter123',
        currentTime: 100
      };

      const updatedEncounter = {
        ...mockEncounter,
        currentTime: -10
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: updatedEncounter });

      const result = await handler(event);

      expect(result.currentTime).toBe(-10);
    });
  });

  describe('time advancement scenarios', () => {
    it('should handle advancing time forward', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: 200
        }
      };

      const mockEncounter = {
        encounterId: 'encounter123',
        currentTime: 100
      };

      const updatedEncounter = {
        ...mockEncounter,
        currentTime: 200
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: updatedEncounter });

      const result = await handler(event);

      expect(result.currentTime).toBe(200);
    });

    it('should handle advancing time backward', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: 50
        }
      };

      const mockEncounter = {
        encounterId: 'encounter123',
        currentTime: 100
      };

      const updatedEncounter = {
        ...mockEncounter,
        currentTime: 50
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: updatedEncounter });

      const result = await handler(event);

      expect(result.currentTime).toBe(50);
    });

    it('should handle setting same time', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: 100
        }
      };

      const mockEncounter = {
        encounterId: 'encounter123',
        currentTime: 100
      };

      const updatedEncounter = {
        ...mockEncounter,
        currentTime: 100
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: updatedEncounter });

      const result = await handler(event);

      expect(result.currentTime).toBe(100);
    });

    it('should handle large time values', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: 999999999
        }
      };

      const mockEncounter = {
        encounterId: 'encounter123',
        currentTime: 100
      };

      const updatedEncounter = {
        ...mockEncounter,
        currentTime: 999999999
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: updatedEncounter });

      const result = await handler(event);

      expect(result.currentTime).toBe(999999999);
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB get errors', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: 150
        }
      };

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB get error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB get error');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should handle DynamoDB update errors', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: 150
        }
      };

      const mockEncounter = {
        encounterId: 'encounter123',
        currentTime: 100
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockRejectedValueOnce(new Error('DynamoDB update error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB update error');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('environment variables', () => {
    it('should use ENCOUNTERS_TABLE environment variable', async () => {
      process.env.ENCOUNTERS_TABLE = 'custom-encounters-table';
      
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: 150
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      try {
        await handler(event);
      } catch (e) {
        // Expected to throw
      }

      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in encounterId', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter-special!@#$%^&*()_+=',
          newTime: 150
        }
      };

      const mockEncounter = {
        encounterId: 'encounter-special!@#$%^&*()_+=',
        currentTime: 100
      };

      const updatedEncounter = {
        ...mockEncounter,
        currentTime: 150
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: updatedEncounter });

      const result = await handler(event);

      expect(result.encounterId).toBe('encounter-special!@#$%^&*()_+=');
    });

    it('should handle encounter with additional properties', async () => {
      const event = {
        arguments: {
          encounterId: 'encounter123',
          newTime: 150
        }
      };

      const mockEncounter = {
        encounterId: 'encounter123',
        name: 'Test Encounter',
        currentTime: 100,
        currentInitiative: 1,
        currentRound: 2,
        characterPositions: [
          { characterId: 'char1', x: 10, y: 15 }
        ],
        timeline: [
          { timeStamp: 50, event: 'Combat started' }
        ]
      };

      const updatedEncounter = {
        ...mockEncounter,
        currentTime: 150
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: updatedEncounter });

      const result = await handler(event);

      expect(result.currentTime).toBe(150);
      expect(result.name).toBe('Test Encounter');
      expect(result.currentInitiative).toBe(1);
      expect(result.currentRound).toBe(2);
      expect(result.characterPositions).toEqual([
        { characterId: 'char1', x: 10, y: 15 }
      ]);
    });
  });
});