const { handler } = require('../../../functions/removeActionFromCharacter');

describe('removeActionFromCharacter', () => {
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

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);
      
      expect(result).toEqual(mockCharacter);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('removing actions', () => {
    it('should remove action from character actionIds', async () => {
      const characterId = 'char123';
      const actionId = 'action456';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', 'action456', 'action789']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action123', 'action789']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).not.toContain(actionId);
      expect(result.actionIds).toHaveLength(2);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(2);
    });

    it('should return character unchanged when action does not exist', async () => {
      const characterId = 'char123';
      const actionId = 'action999';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', 'action456', 'action789']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(result).toEqual(mockCharacter);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should handle character with no actionIds', async () => {
      const characterId = 'char123';
      const actionId = 'action456';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character'
        // No actionIds property
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(result).toEqual(mockCharacter);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should handle character with empty actionIds array', async () => {
      const characterId = 'char123';
      const actionId = 'action456';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: []
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(result).toEqual(mockCharacter);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });

    it('should remove first action from array', async () => {
      const characterId = 'char123';
      const actionId = 'action123';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', 'action456', 'action789']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action456', 'action789']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).toEqual(['action456', 'action789']);
    });

    it('should remove last action from array', async () => {
      const characterId = 'char123';
      const actionId = 'action789';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', 'action456', 'action789']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action123', 'action456']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).toEqual(['action123', 'action456']);
    });

    it('should remove middle action from array', async () => {
      const characterId = 'char123';
      const actionId = 'action456';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', 'action456', 'action789']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action123', 'action789']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).toEqual(['action123', 'action789']);
    });

    it('should handle removing only action from character', async () => {
      const characterId = 'char123';
      const actionId = 'action456';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action456']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: []
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).toHaveLength(0);
    });

    it('should remove all occurrences if action appears multiple times', async () => {
      const characterId = 'char123';
      const actionId = 'action456';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', 'action456', 'action789', 'action456']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action123', 'action789']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).not.toContain(actionId);
      expect(result.actionIds).toHaveLength(2);
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

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB Error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB Error');
    });

    it('should handle DynamoDB update errors', async () => {
      const characterId = 'char123';
      const actionId = 'action456';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', 'action456', 'action789']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockRejectedValueOnce(new Error('Update Error'));

      await expect(handler(event)).rejects.toThrow('Update Error');
    });
  });

  describe('environment variables', () => {
    it('should use CHARACTERS_TABLE environment variable', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          actionId: 'action456'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow();
      
      expect(global.mockDynamoSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'test-characters-table'
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in action IDs', async () => {
      const characterId = 'char123';
      const actionId = 'action-with-special@chars!';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', 'action-with-special@chars!', 'action789']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action123', 'action789']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).not.toContain(actionId);
    });

    it('should handle very long action IDs', async () => {
      const characterId = 'char123';
      const actionId = 'a'.repeat(100);
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', actionId, 'action789']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action123', 'action789']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).not.toContain(actionId);
    });

    it('should handle large action arrays', async () => {
      const characterId = 'char123';
      const actionId = 'action50';
      
      const actionIds = Array.from({ length: 100 }, (_, i) => `action${i}`);
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: actionIds.filter(id => id !== actionId)
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).not.toContain(actionId);
      expect(result.actionIds).toHaveLength(99);
    });

    it('should preserve array order when removing actions', async () => {
      const characterId = 'char123';
      const actionId = 'action456';
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', 'action456', 'action789', 'action999']
      };

      const updatedCharacter = {
        ...mockCharacter,
        actionIds: ['action123', 'action789', 'action999']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.actionIds).toEqual(['action123', 'action789', 'action999']);
    });

    it('should handle null action ID gracefully', async () => {
      const characterId = 'char123';
      const actionId = null;
      
      const mockCharacter = {
        characterId,
        name: 'Test Character',
        actionIds: ['action123', 'action456', 'action789']
      };

      const event = {
        arguments: { characterId, actionId }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(result).toEqual(mockCharacter);
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(1);
    });
  });
});