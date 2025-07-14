const { handler } = require('../../../functions/removeObjectFromInventory');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('@aws-sdk/lib-dynamodb');

describe('removeObjectFromInventory', () => {
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
          objectId: 'obj456'
        }
      };

      mockSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow('Character with ID char123 not found');
      
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'test-characters-table',
            Key: { characterId: 'char123' }
          }
        })
      );
    });

    it('should handle missing characterId', async () => {
      const event = {
        arguments: {
          objectId: 'obj456'
        }
      };

      mockSend.mockResolvedValueOnce({ Item: null });

      await expect(handler(event)).rejects.toThrow();
    });

    it('should handle missing objectId', async () => {
      const event = {
        arguments: {
          characterId: 'char123'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        inventoryIds: ['obj1', 'obj2']
      };

      mockSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);
      
      expect(result).toEqual(mockCharacter);
    });
  });

  describe('removing objects', () => {
    it('should remove object from inventory', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj2'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        inventoryIds: ['obj1', 'obj2', 'obj3']
      };

      const updatedCharacter = {
        ...mockCharacter,
        inventoryIds: ['obj1', 'obj3']
      };

      mockSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'test-characters-table',
            Key: { characterId: 'char123' },
            UpdateExpression: 'SET inventoryIds = :inventoryIds',
            ExpressionAttributeValues: {
              ':inventoryIds': ['obj1', 'obj3']
            },
            ReturnValues: 'ALL_NEW'
          }
        })
      );
    });

    it('should return character unchanged if object not in inventory', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj99'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        inventoryIds: ['obj1', 'obj2']
      };

      mockSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(result).toEqual(mockCharacter);
      expect(mockSend).toHaveBeenCalledTimes(1); // Only the get call, no update
    });

    it('should handle character with no inventoryIds', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj1'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character'
      };

      mockSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(result).toEqual(mockCharacter);
      expect(mockSend).toHaveBeenCalledTimes(1); // Only the get call
    });

    it('should handle character with empty inventoryIds array', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj1'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        inventoryIds: []
      };

      mockSend.mockResolvedValueOnce({ Item: mockCharacter });

      const result = await handler(event);

      expect(result).toEqual(mockCharacter);
      expect(mockSend).toHaveBeenCalledTimes(1); // Only the get call
    });

    it('should remove all occurrences of object if it appears multiple times', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj1'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        inventoryIds: ['obj1', 'obj2', 'obj1', 'obj3', 'obj1']
      };

      const updatedCharacter = {
        ...mockCharacter,
        inventoryIds: ['obj2', 'obj3']
      };

      mockSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.inventoryIds).not.toContain('obj1');
    });

    it('should handle removing the only object in inventory', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj1'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        inventoryIds: ['obj1']
      };

      const updatedCharacter = {
        ...mockCharacter,
        inventoryIds: []
      };

      mockSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.inventoryIds).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB get errors', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj456'
        }
      };

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB error');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle DynamoDB update errors', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj1'
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        inventoryIds: ['obj1', 'obj2']
      };

      mockSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockRejectedValueOnce(new Error('Update failed'));

      await expect(handler(event)).rejects.toThrow('Update failed');
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('environment variables', () => {
    it('should use CHARACTERS_TABLE environment variable', async () => {
      process.env.CHARACTERS_TABLE = 'custom-table';
      
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj456'
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
            TableName: 'custom-table',
            Key: { characterId: 'char123' }
          }
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in object IDs', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj-with-special!@#$%^&*()_+='
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        inventoryIds: ['obj1', 'obj-with-special!@#$%^&*()_+=', 'obj2']
      };

      const updatedCharacter = {
        ...mockCharacter,
        inventoryIds: ['obj1', 'obj2']
      };

      mockSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should handle very long object IDs', async () => {
      const longObjectId = 'o'.repeat(500);
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: longObjectId
        }
      };

      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        inventoryIds: ['obj1', longObjectId, 'obj2']
      };

      const updatedCharacter = {
        ...mockCharacter,
        inventoryIds: ['obj1', 'obj2']
      };

      mockSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
    });

    it('should handle large inventory arrays', async () => {
      const event = {
        arguments: {
          characterId: 'char123',
          objectId: 'obj50'
        }
      };

      const inventoryIds = Array.from({ length: 100 }, (_, i) => `obj${i}`);
      const mockCharacter = {
        characterId: 'char123',
        name: 'Test Character',
        inventoryIds
      };

      const updatedInventoryIds = inventoryIds.filter(id => id !== 'obj50');
      const updatedCharacter = {
        ...mockCharacter,
        inventoryIds: updatedInventoryIds
      };

      mockSend
        .mockResolvedValueOnce({ Item: mockCharacter })
        .mockResolvedValueOnce({ Attributes: updatedCharacter });

      const result = await handler(event);

      expect(result).toEqual(updatedCharacter);
      expect(result.inventoryIds).toHaveLength(99);
      expect(result.inventoryIds).not.toContain('obj50');
    });
  });
});