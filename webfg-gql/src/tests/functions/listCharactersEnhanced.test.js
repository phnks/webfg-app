const { handler } = require('../../../functions/listCharactersEnhanced');

describe('listCharactersEnhanced', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CHARACTERS_TABLE_NAME: 'test-characters-table'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockCharacters = [
    {
      characterId: 'char-1',
      name: 'Aragorn',
      nameLowerCase: 'aragorn',
      characterCategory: 'HUMAN',
      will: 15,
      fatigue: 3,
      strength: { current: 16, max: 18, base: 16 },
      dexterity: { current: 14, max: 16, base: 14 },
      armour: { current: 8, max: 10, base: 8 }
    },
    {
      characterId: 'char-2',
      name: 'Legolas',
      nameLowerCase: 'legolas',
      characterCategory: 'ELF',
      will: 12,
      fatigue: 1,
      strength: { current: 12, max: 14, base: 12 },
      dexterity: { current: 18, max: 20, base: 18 },
      perception: { current: 16, max: 18, base: 16 }
    },
    {
      characterId: 'char-3',
      name: 'Gandalf',
      nameLowerCase: 'gandalf',
      characterCategory: 'WIZARD',
      will: 20,
      fatigue: 0,
      intelligence: { current: 20, max: 22, base: 20 },
      resolve: { current: 18, max: 20, base: 18 },
      charisma: { current: 16, max: 18, base: 16 }
    }
  ];

  describe('basic functionality', () => {
    it('should list characters with default pagination', async () => {
      const event = {};

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockCharacters.slice(0, 2),
        Count: 2,
        ScannedCount: 2
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result).toEqual({
        items: mockCharacters.slice(0, 2),
        nextCursor: null,
        hasNextPage: false,
        totalCount: null
      });
    });

    it('should handle empty results', async () => {
      const event = {};

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [],
        Count: 0,
        ScannedCount: 0
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result).toEqual({
        items: [],
        nextCursor: null,
        hasNextPage: false,
        totalCount: null
      });
    });

    it('should handle pagination with cursor', async () => {
      const cursor = Buffer.from(JSON.stringify({ characterId: 'char-1' })).toString('base64');
      const event = {
        filter: {
          pagination: {
            cursor: cursor,
            limit: 5
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[1]],
        Count: 1,
        ScannedCount: 1
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('should return nextCursor when there are more results', async () => {
      const event = {
        filter: {
          pagination: {
            limit: 1 // Set limit to 1 so that 2 items exceed the limit
          }
        }
      };

      const lastEvaluatedKey = { characterId: 'char-2' };
      // Return 2 items but limit is 1, so there should be a next page
      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockCharacters.slice(0, 2),
        Count: 2,
        ScannedCount: 2,
        LastEvaluatedKey: lastEvaluatedKey
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1); // Trimmed to limit
      expect(result.hasNextPage).toBe(true);
      const expectedToken = Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
      expect(result.nextCursor).toBe(expectedToken);
    });
  });

  describe('filtering', () => {
    it('should filter by search term', async () => {
      const event = {
        filter: {
          search: 'aragorn'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Aragorn');
    });

    it('should filter by character category', async () => {
      const event = {
        filter: {
          characterCategory: 'ELF'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[1]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].characterCategory).toBe('ELF');
    });

    it('should filter by will attribute', async () => {
      const event = {
        filter: {
          will: {
            gte: 15
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[0], mockCharacters[2]],
        Count: 2,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Aragorn');
      expect(result.items[1].name).toBe('Gandalf');
    });

    it('should filter by fatigue', async () => {
      const event = {
        filter: {
          fatigue: {
            lte: 1
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[1], mockCharacters[2]],
        Count: 2,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Legolas');
      expect(result.items[1].name).toBe('Gandalf');
    });

    it('should filter by attribute values', async () => {
      const event = {
        filter: {
          strength: {
            gte: 15
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Aragorn');
    });

    it('should combine multiple filters', async () => {
      const event = {
        filter: {
          search: 'elf',
          characterCategory: 'ELF',
          dexterity: {
            gte: 16
          },
          fatigue: {
            lte: 2
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[1]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Legolas');
    });
  });

  describe('sorting', () => {
    it('should apply ascending sort', async () => {
      const event = {
        filter: {
          sort: [{
            field: 'name',
            direction: 'ASC'
          }]
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockCharacters,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      // Check that items are sorted ascending by name
      expect(result.items[0].name).toBe('Aragorn');
      expect(result.items[1].name).toBe('Gandalf');
      expect(result.items[2].name).toBe('Legolas');
    });

    it('should apply descending sort', async () => {
      const event = {
        filter: {
          sort: [{
            field: 'name',
            direction: 'DESC'
          }]
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockCharacters,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      // Check that items are sorted descending by name
      expect(result.items[0].name).toBe('Legolas');
      expect(result.items[1].name).toBe('Gandalf');
      expect(result.items[2].name).toBe('Aragorn');
    });

    it('should sort by numeric attributes', async () => {
      const event = {
        filter: {
          sort: [{
            field: 'will',
            direction: 'ASC'
          }]
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockCharacters,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      // Check that items are sorted by will (12, 15, 20)
      expect(result.items[0].name).toBe('Legolas'); // will 12
      expect(result.items[1].name).toBe('Aragorn'); // will 15
      expect(result.items[2].name).toBe('Gandalf'); // will 20
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB errors', async () => {
      const event = {};

      global.mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(handler(event)).rejects.toThrow('DynamoDB error');
    });

    it('should handle invalid cursor gracefully', async () => {
      const event = {
        filter: {
          pagination: {
            cursor: 'invalid-base64-cursor'
          }
        }
      };

      // The function should handle invalid cursor and likely throw or default
      await expect(handler(event)).rejects.toThrow();
    });
  });

  describe('pagination limits', () => {
    it('should respect custom limit', async () => {
      const event = {
        filter: {
          pagination: {
            limit: 5
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockCharacters.slice(0, 2),
        Count: 2,
        ScannedCount: 2
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(2);
    });

    it('should enforce maximum limit', async () => {
      const event = {
        filter: {
          pagination: {
            limit: 500 // Above max
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockCharacters,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    it('should handle null filter', async () => {
      const event = {
        filter: null
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockCharacters,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(mockCharacters);
    });

    it('should handle empty search string', async () => {
      const event = {
        filter: {
          search: ''
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: mockCharacters,
        Count: 3,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(mockCharacters);
    });

    it('should handle characters without nameLowerCase field (backwards compatibility)', async () => {
      const oldFormatCharacters = [
        {
          characterId: 'char-old',
          name: 'Old Character',
          characterCategory: 'HUMAN'
        }
      ];

      const event = {
        filter: {
          search: 'old'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: oldFormatCharacters,
        Count: 1,
        ScannedCount: 1
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toEqual(oldFormatCharacters);
    });

    it('should handle multiple attribute filters', async () => {
      const event = {
        filter: {
          strength: {
            gte: 12
          },
          dexterity: {
            gte: 14
          },
          will: {
            gte: 10
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[0], mockCharacters[1]],
        Count: 2,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(2);
    });
  });

  describe('specific character categories', () => {
    it('should filter humans', async () => {
      const event = {
        filter: {
          characterCategory: 'HUMAN'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].characterCategory).toBe('HUMAN');
    });

    it('should filter elves', async () => {
      const event = {
        filter: {
          characterCategory: 'ELF'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[1]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].characterCategory).toBe('ELF');
    });

    it('should filter wizards', async () => {
      const event = {
        filter: {
          characterCategory: 'WIZARD'
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[2]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].characterCategory).toBe('WIZARD');
    });
  });

  describe('character attributes', () => {
    it('should filter by high strength characters', async () => {
      const event = {
        filter: {
          strength: {
            gte: 15
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[0]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Aragorn');
    });

    it('should filter by high intelligence characters', async () => {
      const event = {
        filter: {
          intelligence: {
            gte: 18
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[2]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Gandalf');
    });

    it('should filter by high dexterity characters', async () => {
      const event = {
        filter: {
          dexterity: {
            gte: 16
          }
        }
      };

      global.mockDynamoSend.mockResolvedValueOnce({
        Items: [mockCharacters[1]],
        Count: 1,
        ScannedCount: 3
      });

      const result = await handler(event);

      expect(global.mockDynamoSend).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Legolas');
    });
  });
});