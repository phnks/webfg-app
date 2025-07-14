const { handler } = require('../../../functions/advanceEncounterTime');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('@aws-sdk/lib-dynamodb');

describe('advanceEncounterTime', () => {
  let mockDocClient;
  const mockSend = jest.fn();
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocClient = {
      send: mockSend
    };
    DynamoDBDocumentClient.from = jest.fn().mockReturnValue(mockDocClient);
    
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

      mockSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockResolvedValueOnce({ Attributes: updatedEncounter });

      const result = await handler(event);

      expect(result).toEqual(updatedEncounter);
      expect(mockSend).toHaveBeenCalledTimes(2);
      
      // Check GET command
      expect(mockSend).toHaveBeenNthCalledWith(1, 
        expect.objectContaining({
          input: {
            TableName: 'test-encounters-table',
            Key: { encounterId: 'encounter123' }
          }
        })
      );

      // Check UPDATE command
      expect(mockSend).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          input: {
            TableName: 'test-encounters-table',
            Key: { encounterId: 'encounter123' },
            UpdateExpression: 'SET currentTime = :newTime',
            ExpressionAttributeValues: {
              ':newTime': 150
            },
            ReturnValues: 'ALL_NEW'
          }
        })
      );
    });

    it('should handle encounter not found', async () => {
      const event = {
        arguments: {
          encounterId: 'nonexistent',
          newTime: 150
        }
      };

      mockSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Encounter with ID nonexistent not found');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('input validation', () => {
    it('should handle missing encounterId', async () => {
      const event = {
        arguments: {
          newTime: 150
        }
      };

      mockSend.mockResolvedValueOnce({ Item: null });

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

      mockSend
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

      mockSend
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

      mockSend
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

      mockSend
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

      mockSend
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

      mockSend
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

      mockSend
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

      mockSend.mockRejectedValueOnce(new Error('DynamoDB get error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB get error');
      expect(mockSend).toHaveBeenCalledTimes(1);
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

      mockSend
        .mockResolvedValueOnce({ Item: mockEncounter })
        .mockRejectedValueOnce(new Error('DynamoDB update error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB update error');
      expect(mockSend).toHaveBeenCalledTimes(2);
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

      mockSend.mockResolvedValueOnce({ Item: null });

      try {
        await handler(event);
      } catch (e) {
        // Expected to throw
      }

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'custom-encounters-table',
            Key: { encounterId: 'encounter123' }
          }
        })
      );
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

      mockSend
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

      mockSend
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