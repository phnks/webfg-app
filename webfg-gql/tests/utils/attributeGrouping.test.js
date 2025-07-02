const {
  calculateGroupedAttributes,
  calculateReadyGroupedAttributes,
  calculateObjectGroupedAttributes,
  calculateGroupingFormula,
  calculateGroupedAttributesWithSelectedReady
} = require('../../utils/attributeGrouping');

describe('attributeGrouping utilities', () => {
  const mockCharacter = {
    characterId: 'char1',
    name: 'Test Character',
    strength: { attribute: { attributeValue: 10 } },
    dexterity: { attribute: { attributeValue: 8 } },
    armour: { attribute: { attributeValue: 5 } },
    equipment: [
      {
        objectId: 'sword1',
        name: 'Iron Sword',
        strength: { attributeValue: 3 },
        lethality: { attributeValue: 8 }
      },
      {
        objectId: 'armor1', 
        name: 'Leather Armor',
        armour: { attributeValue: 2 },
        dexterity: { attributeValue: -1 }
      }
    ],
    ready: [
      {
        objectId: 'shield1',
        name: 'Small Shield', 
        armour: { attributeValue: 3 }
      }
    ]
  };

  describe('calculateGroupingFormula', () => {
    test('should return 0 for empty array', () => {
      expect(calculateGroupingFormula([])).toBe(0);
    });

    test('should return single value for array of one', () => {
      expect(calculateGroupingFormula([10])).toBe(10);
    });

    test('should calculate weighted average for multiple values', () => {
      const result = calculateGroupingFormula([10, 8, 6]);
      expect(result).toBeGreaterThan(6);
      expect(result).toBeLessThan(10);
    });

    test('should handle negative values', () => {
      const result = calculateGroupingFormula([5, -2, 3]);
      expect(typeof result).toBe('number');
    });

    test('should handle zero values', () => {
      const result = calculateGroupingFormula([0, 5, 0]);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('calculateGroupedAttributes', () => {
    test('should calculate basic grouped attributes', () => {
      const result = calculateGroupedAttributes(mockCharacter);
      
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('dexterity');
      expect(result).toHaveProperty('armour');
      
      // Should combine base + equipment (using weighted formula)
      expect(result.strength).toBeGreaterThan(5); // combined strength
      expect(result.armour).toBeGreaterThan(2); // combined armour
    });

    test('should handle character with no equipment', () => {
      const characterNoEquip = {
        ...mockCharacter,
        equipment: []
      };
      
      const result = calculateGroupedAttributes(characterNoEquip);
      expect(result.strength).toBe(10); // just base value
    });

    test('should handle character with undefined equipment', () => {
      const characterNoEquip = {
        ...mockCharacter,
        equipment: undefined
      };
      
      const result = calculateGroupedAttributes(characterNoEquip);
      expect(result.strength).toBe(10);
    });

    test('should handle missing attribute values', () => {
      const characterMissingAttrs = {
        characterId: 'char2',
        name: 'Test Character 2'
      };
      
      const result = calculateGroupedAttributes(characterMissingAttrs);
      expect(typeof result).toBe('object');
    });
  });

  describe('calculateReadyGroupedAttributes', () => {
    test('should calculate attributes with ready objects', () => {
      const result = calculateReadyGroupedAttributes(mockCharacter);
      
      expect(result).toHaveProperty('armour');
      // Should include equipment + ready objects
      expect(result.armour).toBeGreaterThan(2); // combined armour
    });

    test('should handle character with no ready objects', () => {
      const characterNoReady = {
        ...mockCharacter,
        ready: []
      };
      
      const result = calculateReadyGroupedAttributes(characterNoReady);
      expect(result.strength).toBeGreaterThan(5); // should still have equipment
    });
  });

  describe('calculateObjectGroupedAttributes', () => {
    const mockObject = {
      objectId: 'obj1',
      name: 'Test Object',
      strength: { attributeValue: 5 },
      weight: { attributeValue: 10 },
      parts: [
        {
          objectId: 'part1',
          strength: { attributeValue: 2 },
          lethality: { attributeValue: 3 }
        }
      ]
    };

    test('should calculate object attributes with parts', () => {
      const result = calculateObjectGroupedAttributes(mockObject);
      
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('weight');
      expect(result.strength).toBeGreaterThan(4); // base + parts
    });

    test('should handle object with no parts', () => {
      const objectNoParts = {
        ...mockObject,
        parts: []
      };
      
      const result = calculateObjectGroupedAttributes(objectNoParts);
      expect(result.strength).toBe(5); // just base
    });

    test('should handle object with undefined parts', () => {
      const objectNoParts = {
        ...mockObject,
        parts: undefined
      };
      
      const result = calculateObjectGroupedAttributes(objectNoParts);
      expect(result.strength).toBe(5);
    });
  });

  describe('calculateGroupedAttributesWithSelectedReady', () => {
    test('should calculate with specific ready object selected', () => {
      const result = calculateGroupedAttributesWithSelectedReady(mockCharacter, 'shield1');
      
      expect(result).toHaveProperty('armour');
      // Should include the selected ready object
      expect(result.armour).toBeGreaterThan(2);
    });

    test('should handle non-existent ready object ID', () => {
      const result = calculateGroupedAttributesWithSelectedReady(mockCharacter, 'nonexistent');
      
      expect(typeof result).toBe('object');
      // Should fallback to normal calculation
    });

    test('should handle null ready object ID', () => {
      const result = calculateGroupedAttributesWithSelectedReady(mockCharacter, null);
      
      expect(typeof result).toBe('object');
    });
  });

  describe('edge cases', () => {
    test('should handle null character', () => {
      expect(() => calculateGroupedAttributes(null)).not.toThrow();
    });

    test('should handle undefined character', () => {
      expect(() => calculateGroupedAttributes(undefined)).not.toThrow();
    });

    test('should handle character with circular references', () => {
      const circularChar = { ...mockCharacter };
      circularChar.self = circularChar;
      
      expect(() => calculateGroupedAttributes(circularChar)).not.toThrow();
    });

    test('should handle very large attribute values', () => {
      const largeValueChar = {
        ...mockCharacter,
        strength: { attribute: { attributeValue: 999999 } }
      };
      
      const result = calculateGroupedAttributes(largeValueChar);
      expect(result.strength).toBeGreaterThan(499999);
    });

    test('should handle negative attribute values', () => {
      const negativeChar = {
        ...mockCharacter,
        strength: { attribute: { attributeValue: -5 } }
      };
      
      const result = calculateGroupedAttributes(negativeChar);
      expect(typeof result.strength).toBe('number');
    });
  });
});