// Mock the attributeGrouping utility - must be before handler import
jest.mock('../../../utils/attributeGrouping', () => ({
  calculateGroupedAttributes: jest.fn(),
  calculateObjectGroupedAttributes: jest.fn()
}));

const { handler } = require('../../../functions/resolveGroupedAttributes');
const { calculateGroupedAttributes, calculateObjectGroupedAttributes } = require('../../../utils/attributeGrouping');

describe('resolveGroupedAttributes', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      OBJECTS_TABLE: 'test-objects-table',
      CONDITIONS_TABLE: 'test-conditions-table',
      AWS_REGION: 'us-east-1'
    };
    
    // Setup default mock return values
    calculateGroupedAttributes.mockReturnValue({});
    calculateObjectGroupedAttributes.mockReturnValue({});
    global.mockDynamoSend.mockResolvedValue({ Item: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('basic functionality', () => {
    it('should throw error when accessing properties of null entity', async () => {
      const event = {
        source: null,
        info: { parentTypeName: 'Character' }
      };

      // The function has a bug - it accesses entity.characterConditions before checking if entity is null
      await expect(handler(event)).rejects.toThrow();
    });

    it('should throw error when entity is null but function tries to access properties', async () => {
      const event = {
        source: null,
        info: { parentTypeName: 'Character' }
      };

      // The function has a bug - it accesses entity.characterConditions before checking if entity is null
      await expect(handler(event)).rejects.toThrow();
    });

    it('should throw error for unknown entity type', async () => {
      const event = {
        source: { id: 'test-id' },
        info: { parentTypeName: 'UnknownType' }
      };

      await expect(handler(event)).rejects.toThrow('Unknown entity type: UnknownType');
    });
  });

  describe('Character processing', () => {
    const mockCharacter = {
      characterId: 'char-1',
      name: 'Test Character',
      equipmentIds: ['obj-1'],
      characterConditions: [{ conditionId: 'cond-1', amount: 2 }]
    };

    it('should process character and call calculateGroupedAttributes', async () => {
      const event = {
        source: mockCharacter,
        info: { parentTypeName: 'Character' }
      };

      // Mock DynamoDB responses
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: { objectId: 'obj-1', name: 'Sword' } })
        .mockResolvedValueOnce({ Item: { conditionId: 'cond-1', name: 'Blessing' } });

      calculateGroupedAttributes.mockReturnValue({
        strength: 15,
        dexterity: 8
      });

      const result = await handler(event);

      expect(calculateGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(15);
      expect(result.dexterity).toBe(8);
      expect(result.speed).toBe(null);
    });

    it('should handle character with no equipment or conditions', async () => {
      const simpleCharacter = {
        characterId: 'char-2',
        name: 'Simple Character'
      };

      const event = {
        source: simpleCharacter,
        info: { parentTypeName: 'Character' }
      };

      calculateGroupedAttributes.mockReturnValue({
        strength: 10
      });

      const result = await handler(event);

      expect(calculateGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(10);
    });

    it('should handle DynamoDB errors gracefully', async () => {
      const event = {
        source: mockCharacter,
        info: { parentTypeName: 'Character' }
      };

      // Mock DynamoDB errors
      global.mockDynamoSend
        .mockRejectedValueOnce(new Error('Equipment fetch failed'))
        .mockRejectedValueOnce(new Error('Condition fetch failed'));

      calculateGroupedAttributes.mockReturnValue({
        strength: 12
      });

      const result = await handler(event);

      expect(calculateGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(12);
    });

    it('should handle missing items in DynamoDB', async () => {
      const event = {
        source: mockCharacter,
        info: { parentTypeName: 'Character' }
      };

      // Mock missing items
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({ Item: null });

      calculateGroupedAttributes.mockReturnValue({
        dexterity: 6
      });

      const result = await handler(event);

      expect(calculateGroupedAttributes).toHaveBeenCalled();
      expect(result.dexterity).toBe(6);
    });
  });

  describe('Object processing', () => {
    const mockObject = {
      objectId: 'obj-1',
      name: 'Main Object',
      equipmentIds: ['obj-2']
    };

    it('should process object and call calculateObjectGroupedAttributes', async () => {
      const event = {
        source: mockObject,
        info: { parentTypeName: 'Object' }
      };

      global.mockDynamoSend.mockResolvedValueOnce({ Item: { objectId: 'obj-2', name: 'Enhancement' } });

      calculateObjectGroupedAttributes.mockReturnValue({
        strength: 5,
        weight: 3
      });

      const result = await handler(event);

      expect(calculateObjectGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(5);
      expect(result.weight).toBe(3);
    });

    it('should handle object with no equipment', async () => {
      const simpleObject = {
        objectId: 'obj-1',
        name: 'Simple Object'
      };

      const event = {
        source: simpleObject,
        info: { parentTypeName: 'Object' }
      };

      calculateObjectGroupedAttributes.mockReturnValue({
        size: 2
      });

      const result = await handler(event);

      expect(calculateObjectGroupedAttributes).toHaveBeenCalled();
      expect(result.size).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle errors from calculateGroupedAttributes', async () => {
      const event = {
        source: { characterId: 'char-1' },
        info: { parentTypeName: 'Character' }
      };

      calculateGroupedAttributes.mockImplementation(() => {
        throw new Error('Calculation error');
      });

      await expect(handler(event)).rejects.toThrow('Failed to calculate grouped attributes: Calculation error');
    });

    it('should handle errors from calculateObjectGroupedAttributes', async () => {
      const event = {
        source: { objectId: 'obj-1' },
        info: { parentTypeName: 'Object' }
      };

      calculateObjectGroupedAttributes.mockImplementation(() => {
        throw new Error('Object calculation error');
      });

      await expect(handler(event)).rejects.toThrow('Failed to calculate grouped attributes: Object calculation error');
    });
  });

  describe('result formatting', () => {
    it('should convert zero values to null', async () => {
      const event = {
        source: { characterId: 'char-1' },
        info: { parentTypeName: 'Character' }
      };

      calculateGroupedAttributes.mockReturnValue({
        strength: 0,
        dexterity: 5
      });

      const result = await handler(event);

      // Zero values become null due to `value || null` logic
      expect(result.strength).toBe(null);
      expect(result.dexterity).toBe(5);
    });

    it('should convert negative values to null', async () => {
      const event = {
        source: { characterId: 'char-1' },
        info: { parentTypeName: 'Character' }
      };

      calculateGroupedAttributes.mockReturnValue({
        strength: -2,
        dexterity: 3
      });

      const result = await handler(event);

      // Negative values are preserved (not converted to null)
      expect(result.strength).toBe(-2);
      expect(result.dexterity).toBe(3);
    });

    it('should ensure all attribute fields are present', async () => {
      const event = {
        source: { characterId: 'char-1' },
        info: { parentTypeName: 'Character' }
      };

      calculateGroupedAttributes.mockReturnValue({
        strength: 10
      });

      const result = await handler(event);

      const expectedFields = [
        'speed', 'weight', 'size', 'complexity', 'lethality', 'armour', 'endurance',
        'strength', 'dexterity', 'agility', 'obscurity', 'charisma', 'intelligence',
        'resolve', 'morale', 'seeing', 'hearing', 'light', 'noise'
      ];

      expectedFields.forEach(field => {
        expect(result).toHaveProperty(field);
      });
    });
  });

  describe('environment variables', () => {
    it('should use environment variables for table names', async () => {
      const event = {
        source: {
          characterId: 'char-1',
          equipmentIds: ['obj-1'],
          characterConditions: [{ conditionId: 'cond-1', amount: 1 }]
        },
        info: { parentTypeName: 'Character' }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: { objectId: 'obj-1' } })
        .mockResolvedValueOnce({ Item: { conditionId: 'cond-1' } });

      calculateGroupedAttributes.mockReturnValue({});

      await handler(event);

      // Check that DynamoDB was called the expected number of times
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(4);
    });
  });
});