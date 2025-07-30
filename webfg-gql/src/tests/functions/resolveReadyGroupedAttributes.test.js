// Mock the attributeGrouping utility - must be before handler import
jest.mock('../../../utils/attributeGrouping', () => ({
  calculateReadyGroupedAttributes: jest.fn()
}));

const { handler } = require('../../../functions/resolveReadyGroupedAttributes');
const { calculateReadyGroupedAttributes } = require('../../../utils/attributeGrouping');

describe('resolveReadyGroupedAttributes', () => {
  const originalEnv = process.env;
  
  // Mock data used across all tests
  const mockCharacter = {
    characterId: 'char-1',
    name: 'Test Character',
    equipmentIds: ['obj-1'],
    readyIds: ['obj-2'],
    characterConditions: [{ conditionId: 'cond-1', amount: 2 }]
  };

  const mockEquipment = {
    objectId: 'obj-1',
    name: 'Sword',
    strength: { attributeValue: 3, isGrouped: true }
  };

  const mockReadyObject = {
    objectId: 'obj-2',
    name: 'Potion',
    dexterity: { attributeValue: 2, isGrouped: true }
  };

  const mockCondition = {
    conditionId: 'cond-1',
    name: 'Blessing',
    conditionType: 'HELP',
    conditionTarget: 'strength'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      OBJECTS_TABLE: 'test-objects-table',
      CONDITIONS_TABLE: 'test-conditions-table',
      AWS_REGION: 'us-east-1'
    };
    
    // Setup minimal default mock return values 
    // Don't set calculateReadyGroupedAttributes here - let tests set it specifically
    global.mockDynamoSend.mockResolvedValue({ Item: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('basic functionality', () => {
    it('should return null attributes when no character is provided', async () => {
      const event = {
        source: null
      };

      const result = await handler(event);

      expect(result).toEqual({
        speed: null,
        weight: null,
        size: null,
        lethality: null,
        penetration: null,
        complexity: null,
        armour: null,
        endurance: null,
        strength: null,
        dexterity: null,
        agility: null,
        obscurity: null,
        charisma: null,
        intelligence: null,
        resolve: null,
        morale: null,
        seeing: null,
        hearing: null,
        light: null,
        noise: null
      });
    });

    it('should handle undefined character', async () => {
      const event = {
        source: undefined
      };

      const result = await handler(event);

      expect(result).toEqual({
        speed: null,
        weight: null,
        size: null,
        lethality: null,
        penetration: null,
        complexity: null,
        armour: null,
        endurance: null,
        strength: null,
        dexterity: null,
        agility: null,
        obscurity: null,
        charisma: null,
        intelligence: null,
        resolve: null,
        morale: null,
        seeing: null,
        hearing: null,
        light: null,
        noise: null
      });
    });
  });

  describe('character processing', () => {

    it('should process character with equipment, ready objects, and conditions', async () => {
      const event = {
        source: mockCharacter
      };

      // Mock DynamoDB responses
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEquipment })     // Equipment fetch
        .mockResolvedValueOnce({ Item: mockReadyObject })   // Ready object fetch
        .mockResolvedValueOnce({ Item: mockCondition });    // Condition fetch

      // Clear previous mocks and set specific return value
      calculateReadyGroupedAttributes.mockClear();
      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 15,
        dexterity: 8,
        speed: 12
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(15);
      expect(result.dexterity).toBe(8);
      expect(result.speed).toBe(12);
    });

    it('should handle character with no equipment', async () => {
      const characterNoEquip = {
        ...mockCharacter,
        equipmentIds: []
      };

      const event = {
        source: characterNoEquip
      };

      // Mock ready object and condition fetches
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockReadyObject })
        .mockResolvedValueOnce({ Item: mockCondition });

      calculateReadyGroupedAttributes.mockReturnValue({
        dexterity: 10
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.dexterity).toBe(10);
    });

    it('should handle character with no ready objects', async () => {
      const characterNoReady = {
        ...mockCharacter,
        readyIds: []
      };

      const event = {
        source: characterNoReady
      };

      // Mock equipment and condition fetches
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEquipment })
        .mockResolvedValueOnce({ Item: mockCondition });

      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 13
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(13);
    });

    it('should handle character with no conditions', async () => {
      const characterNoConditions = {
        ...mockCharacter,
        characterConditions: []
      };

      const event = {
        source: characterNoConditions
      };

      // Mock equipment and ready object fetches
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEquipment })
        .mockResolvedValueOnce({ Item: mockReadyObject });

      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 12,
        dexterity: 7
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(12);
      expect(result.dexterity).toBe(7);
    });

    it('should handle character with no arrays defined', async () => {
      const simpleCharacter = {
        characterId: 'char-2',
        name: 'Simple Character'
      };

      const event = {
        source: simpleCharacter
      };

      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 8
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(8);
    });

    it('should handle missing items in DynamoDB', async () => {
      const event = {
        source: mockCharacter
      };

      // Mock missing items (null responses)
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: null })  // Missing equipment
        .mockResolvedValueOnce({ Item: null })  // Missing ready object
        .mockResolvedValueOnce({ Item: null }); // Missing condition

      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 10
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(10);
    });

    it('should handle DynamoDB errors gracefully', async () => {
      const event = {
        source: mockCharacter
      };

      // Mock DynamoDB errors
      global.mockDynamoSend
        .mockRejectedValueOnce(new Error('Equipment fetch failed'))
        .mockRejectedValueOnce(new Error('Ready object fetch failed'))
        .mockRejectedValueOnce(new Error('Condition fetch failed'));

      calculateReadyGroupedAttributes.mockReturnValue({
        dexterity: 6
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.dexterity).toBe(6);
    });
  });

  describe('result formatting', () => {
    it('should preserve zero values (not convert to null)', async () => {
      const event = {
        source: { characterId: 'char-1' }
      };

      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 0,
        dexterity: 5,
        speed: 0
      });

      const result = await handler(event);

      // Zero values should be preserved (unlike resolveGroupedAttributes)
      expect(result.strength).toBe(0);
      expect(result.dexterity).toBe(5);
      expect(result.speed).toBe(0);
    });

    it('should preserve negative values', async () => {
      const event = {
        source: { characterId: 'char-1' }
      };

      calculateReadyGroupedAttributes.mockReturnValue({
        strength: -2,
        dexterity: 3
      });

      const result = await handler(event);

      // Negative values should be preserved
      expect(result.strength).toBe(-2);
      expect(result.dexterity).toBe(3);
    });

    it('should convert undefined values to null', async () => {
      const event = {
        source: { characterId: 'char-1' }
      };

      // Clear previous mocks and set specific return value
      calculateReadyGroupedAttributes.mockClear();
      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 10
        // Other attributes not defined (undefined)
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(10);
      expect(result.dexterity).toBe(null);
      expect(result.speed).toBe(null);
    });

    it('should ensure all attribute fields are present', async () => {
      const event = {
        source: { characterId: 'char-1' }
      };

      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 10
      });

      const result = await handler(event);

      const expectedFields = [
        'speed', 'weight', 'size', 'lethality', 'penetration', 'complexity', 'armour', 'endurance',
        'strength', 'dexterity', 'agility', 'obscurity', 'charisma', 'intelligence',
        'resolve', 'morale', 'seeing', 'hearing', 'light', 'noise'
      ];

      expectedFields.forEach(field => {
        expect(result).toHaveProperty(field);
      });
    });
  });

  describe('error handling', () => {
    it('should handle errors from calculateReadyGroupedAttributes', async () => {
      const event = {
        source: { characterId: 'char-1' }
      };

      // Clear previous mocks and set implementation to throw
      calculateReadyGroupedAttributes.mockClear();
      calculateReadyGroupedAttributes.mockImplementation(() => {
        throw new Error('Calculation error');
      });

      await expect(handler(event)).rejects.toThrow('Failed to calculate ready grouped attributes: Calculation error');
    });

    it('should handle partial DynamoDB responses', async () => {
      const event = {
        source: {
          characterId: 'char-1',
          equipmentIds: ['obj-1', 'obj-2'],
          readyIds: ['obj-3'],
          characterConditions: [{ conditionId: 'cond-1', amount: 1 }]
        }
      };

      // Mock partial success/failure
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEquipment })    // Success
        .mockRejectedValueOnce(new Error('Network error')) // Failure
        .mockResolvedValueOnce({ Item: mockReadyObject })  // Success
        .mockResolvedValueOnce({ Item: mockCondition });   // Success

      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 12
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(12);
    });
  });

  describe('environment variables', () => {
    it('should use environment variables for table names', async () => {
      const event = {
        source: {
          characterId: 'char-1',
          equipmentIds: ['obj-1'],
          readyIds: ['obj-2'],
          characterConditions: [{ conditionId: 'cond-1', amount: 1 }]
        }
      };

      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEquipment })
        .mockResolvedValueOnce({ Item: mockReadyObject })
        .mockResolvedValueOnce({ Item: mockCondition });

      calculateReadyGroupedAttributes.mockReturnValue({});

      await handler(event);

      // Check that DynamoDB was called the expected number of times
      expect(global.mockDynamoSend).toHaveBeenCalledTimes(3);
    });
  });

  describe('complex scenarios', () => {
    it('should handle character with multiple equipment and ready objects', async () => {
      const complexCharacter = {
        characterId: 'char-1',
        name: 'Complex Character',
        equipmentIds: ['obj-1', 'obj-2'],
        readyIds: ['obj-3', 'obj-4'],
        characterConditions: [
          { conditionId: 'cond-1', amount: 2 },
          { conditionId: 'cond-2', amount: -1 }
        ]
      };

      const event = {
        source: complexCharacter
      };

      // Mock multiple successful responses
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: { objectId: 'obj-1', name: 'Sword' } })
        .mockResolvedValueOnce({ Item: { objectId: 'obj-2', name: 'Armor' } })
        .mockResolvedValueOnce({ Item: { objectId: 'obj-3', name: 'Potion' } })
        .mockResolvedValueOnce({ Item: { objectId: 'obj-4', name: 'Scroll' } })
        .mockResolvedValueOnce({ Item: { conditionId: 'cond-1', name: 'Blessing' } })
        .mockResolvedValueOnce({ Item: { conditionId: 'cond-2', name: 'Curse' } });

      // Clear previous mocks and set specific return value
      calculateReadyGroupedAttributes.mockClear();
      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 18,
        dexterity: 12,
        intelligence: 15
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(18);
      expect(result.dexterity).toBe(12);
      expect(result.intelligence).toBe(15);
    });

    it('should handle mixed success and failure in data fetching', async () => {
      const event = {
        source: {
          characterId: 'char-1',
          equipmentIds: ['obj-1', 'missing-obj'],
          readyIds: ['obj-2'],
          characterConditions: [{ conditionId: 'missing-cond', amount: 1 }]
        }
      };

      // Mock mixed responses
      global.mockDynamoSend
        .mockResolvedValueOnce({ Item: mockEquipment })    // Equipment success
        .mockResolvedValueOnce({ Item: null })             // Equipment missing
        .mockResolvedValueOnce({ Item: mockReadyObject })  // Ready success
        .mockResolvedValueOnce({ Item: null });            // Condition missing

      calculateReadyGroupedAttributes.mockReturnValue({
        strength: 14,
        dexterity: 9
      });

      const result = await handler(event);

      expect(calculateReadyGroupedAttributes).toHaveBeenCalled();
      expect(result.strength).toBe(14);
      expect(result.dexterity).toBe(9);
    });
  });
});