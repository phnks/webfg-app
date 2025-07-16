const { handler } = require('../../../functions/addActionToCharacter');

describe('addActionToCharacter', () => {
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
    it('should throw error when character not found', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'action456'
        }
      };

      // Mock GetCommand to return no character
      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Character with ID char123 not found');
      
      // Verify the GetCommand was called
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should handle missing characterId', async () => {
      const event = {
        arguments: {
          actionId: 'action456'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow();
    });

    it('should handle missing actionId', async () => {
      const event = {
        arguments: {
          characterId: 'char123'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        actionIds: ['action1', 'action2']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action1', 'action2', undefined]
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);
      
      expect(result).toEqual(updatedCharacter);
    });
  });

  describe('adding actions', () => {
    it('should add action to character with existing actions', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'action456'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        actionIds: ['action1', 'action2']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action1', 'action2', 'action456']
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });

    it('should add action to character with no existing actions', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'action456'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character'
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action456']
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });

    it('should not add duplicate action', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'action1'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        actionIds: ['action1', 'action2']
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(result).toEqual(mockCharacter);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1); // Only the get call, no update
    });

    it('should handle character with empty actionIds array', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'action456'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        actionIds: []
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action456']
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB get errors', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'action456'
        }
      };

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB error');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should handle DynamoDB update errors', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'action456'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        actionIds: ['action1']
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockRejectedValueOnce(new Error('Update failed'));

      await expect(handler(event)).rejects.toThrow('Update failed');
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('environment variables', () => {
    it('should use CHARACTERS_TABLE environment variable', async () => {
      process.env.CHARACTERS_TABLE = 'custom-table';
      
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'action456'
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
    it('should handle special characters in action IDs', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'action-with-special!@#$%^&*()_+='
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        actionIds: []
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action-with-special!@#$%^&*()_+=']
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should handle very long action IDs', async () => {
      const longActionId = 'a'.repeat(500);
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: longActionId
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        actionIds: []
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: [longActionId]
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should handle large action arrays', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'newAction'
        }
      };

      const existingActions = Array.from({ length: 100 }, (_, i) => `action${i}`);
      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        actionIds: existingActions
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: [...existingActions, 'newAction']
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).toHaveLength(101);
    });
  });
});