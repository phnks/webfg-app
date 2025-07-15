const {
  calculateGroupingFormula,
  calculateGroupedAttributes,
  calculateReadyGroupedAttributes,
  calculateObjectGroupedAttributes,
  calculateGroupedAttributesWithSelectedReady,
  ATTRIBUTE_NAMES,
  ATTRIBUTE_GROUPS
} = require('../../../utils/attributeGrouping');

describe('attributeGrouping', () => {
  describe('ATTRIBUTE_NAMES and ATTRIBUTE_GROUPS constants', () => {
    it('should have correct attribute names', () => {
      expect(ATTRIBUTE_NAMES).toContain('strength');
      expect(ATTRIBUTE_NAMES).toContain('speed');
      expect(ATTRIBUTE_NAMES).toContain('intelligence');
      expect(ATTRIBUTE_NAMES).toHaveLength(15);
    });

    it('should have correct attribute groups', () => {
      expect(ATTRIBUTE_GROUPS.BODY).toContain('speed');
      expect(ATTRIBUTE_GROUPS.MARTIAL).toContain('strength');
      expect(ATTRIBUTE_GROUPS.MENTAL).toContain('intelligence');
    });
  });

  describe('calculateGroupingFormula', () => {
    it('should return 0 for empty array', () => {
      expect(calculateGroupingFormula([])).toBe(0);
      expect(calculateGroupingFormula(null)).toBe(0);
      expect(calculateGroupingFormula(undefined)).toBe(0);
    });

    it('should return single value unchanged', () => {
      expect(calculateGroupingFormula([10])).toBe(10);
      expect(calculateGroupingFormula([0])).toBe(0);
      expect(calculateGroupingFormula([100])).toBe(100);
    });

    it('should calculate weighted average for two values', () => {
      // Formula: (A1 + A2*(0.25+A2/A1)) / 2
      // For [10, 5]: (10 + 5*(0.25+5/10)) / 2 = (10 + 5*0.75) / 2 = 13.75 / 2 = 6.875
      const result = calculateGroupingFormula([10, 5]);
      expect(result).toBeCloseTo(6.875, 3);
    });

    it('should calculate formula for multiple values', () => {
      // For [12, 8, 4]
      const result = calculateGroupingFormula([12, 8, 4]);
      // A1=12, A2=8*(0.25+8/12)=8*0.917=7.33, A3=4*(0.25+4/12)=4*0.583=2.33
      // Sum = 12 + 7.33 + 2.33 = 21.66, divided by 3 = 7.22
      expect(result).toBeCloseTo(7.22, 1);
    });

    it('should handle zero as highest value', () => {
      const result = calculateGroupingFormula([0, 0, 0]);
      expect(result).toBe(0);
    });

    it('should handle mixed zero and non-zero values', () => {
      const result = calculateGroupingFormula([5, 0, 3]);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle equal values', () => {
      const result = calculateGroupingFormula([10, 10, 10]);
      // Each additional 10 gets weighted: 10*(0.25+10/10) = 10*1.25 = 12.5
      // Sum = 10 + 12.5 + 12.5 = 35, divided by 3 = 11.67
      expect(result).toBeCloseTo(11.67, 1);
    });

    it('should handle large arrays', () => {
      const values = [20, 15, 10, 8, 6, 4, 2, 1];
      const result = calculateGroupingFormula(values);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(20); // Should be less than max
    });
  });

  describe('calculateGroupedAttributes', () => {
    const mockCharacter = {
      characterId: 'char-1',
      strength: { 
        attribute: { attributeValue: 10, isGrouped: true }
      },
      speed: { 
        attribute: { attributeValue: 8, isGrouped: true }
      },
      intelligence: { 
        attribute: { attributeValue: 12, isGrouped: true }
      },
      equipment: [
        {
          objectId: 'sword-1',
          strength: { attributeValue: 3, isGrouped: true },
          speed: { attributeValue: -1, isGrouped: true }
        }
      ]
    };

    it('should calculate grouped attributes for character with equipment', () => {
      const result = calculateGroupedAttributes(mockCharacter);
      
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('speed');
      expect(result).toHaveProperty('intelligence');
      
      // Based on weighted formula: higher value (10) + bonus weighted by formula
      // The exact values depend on the grouping formula implementation
      expect(typeof result.strength).toBe('number');
      expect(typeof result.speed).toBe('number');
      expect(typeof result.intelligence).toBe('number');
      
      // Since we have equipment, the result should be different from base values
      expect(result.strength).not.toBe(10); // Should be modified by equipment
      expect(result.speed).not.toBe(8); // Should be modified by equipment
      expect(result.intelligence).toBe(12); // No equipment bonus, should stay same
    });

    it('should handle character without equipment', () => {
      const characterNoEquip = {
        characterId: 'char-2',
        strength: { 
          attribute: { attributeValue: 10, isGrouped: true }
        },
        speed: { 
          attribute: { attributeValue: 8, isGrouped: true }
        }
      };

      const result = calculateGroupedAttributes(characterNoEquip);
      expect(result.strength).toBe(10);
      expect(result.speed).toBe(8);
    });

    it('should handle missing attributes', () => {
      const characterMinimal = {
        characterId: 'char-3',
        strength: { 
          attribute: { attributeValue: 5, isGrouped: true }
        }
      };

      const result = calculateGroupedAttributes(characterMinimal);
      expect(result.strength).toBe(5);
      // Missing attributes are not included in the result
      expect(result.speed).toBeUndefined();
    });

    it('should handle malformed attribute objects', () => {
      const characterMalformed = {
        characterId: 'char-4',
        strength: { current: null, max: 15, base: 10 },
        speed: 'invalid'
      };

      const result = calculateGroupedAttributes(characterMalformed);
      expect(result.strength).toBe(0); // Should handle null current
      expect(result.speed).toBe(0); // Should handle invalid format
    });

    it('should include all attribute groups', () => {
      const result = calculateGroupedAttributes(mockCharacter);
      
      // Check BODY attributes
      expect(result).toHaveProperty('speed');
      expect(result).toHaveProperty('weight');
      expect(result).toHaveProperty('size');
      
      // Check MARTIAL attributes
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('dexterity');
      
      // Check MENTAL attributes
      expect(result).toHaveProperty('intelligence');
      expect(result).toHaveProperty('resolve');
    });
  });

  describe('calculateReadyGroupedAttributes', () => {
    const mockCharacterWithReady = {
      characterId: 'char-1',
      strength: { current: 10, max: 15, base: 10 },
      equipment: [
        {
          objectId: 'sword-1',
          strength: { current: 2, max: 2, base: 2 }
        }
      ],
      ready: [
        {
          objectId: 'potion-1',
          strength: { current: 1, max: 1, base: 1 }
        }
      ]
    };

    it('should calculate grouped attributes including ready items', () => {
      const result = calculateReadyGroupedAttributes(mockCharacterWithReady);
      
      expect(result).toHaveProperty('strength');
      // Should include character + equipment + ready
      expect(result.strength).toBeGreaterThan(10);
    });

    it('should handle character without ready items', () => {
      const characterNoReady = {
        characterId: 'char-2',
        strength: { current: 10, max: 15, base: 10 },
        equipment: []
      };

      const result = calculateReadyGroupedAttributes(characterNoReady);
      expect(result.strength).toBe(10);
    });
  });

  describe('calculateObjectGroupedAttributes', () => {
    const mockObject = {
      objectId: 'obj-1',
      strength: { current: 5, max: 8, base: 5 },
      speed: { current: 3, max: 5, base: 3 },
      equipment: [
        {
          objectId: 'attachment-1',
          strength: { current: 2, max: 2, base: 2 }
        }
      ]
    };

    it('should calculate grouped attributes for object with equipment', () => {
      const result = calculateObjectGroupedAttributes(mockObject);
      
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('speed');
      expect(result.strength).toBeGreaterThan(5); // Should include equipment
    });

    it('should handle object without equipment', () => {
      const objectNoEquip = {
        objectId: 'obj-2',
        strength: { current: 5, max: 8, base: 5 }
      };

      const result = calculateObjectGroupedAttributes(objectNoEquip);
      expect(result.strength).toBe(5);
    });
  });

  describe('calculateGroupedAttributesWithSelectedReady', () => {
    const mockCharacter = {
      characterId: 'char-1',
      strength: { current: 10, max: 15, base: 10 },
      equipment: [
        {
          objectId: 'sword-1',
          strength: { current: 2, max: 2, base: 2 }
        }
      ],
      ready: [
        {
          objectId: 'potion-1',
          strength: { current: 1, max: 1, base: 1 }
        },
        {
          objectId: 'scroll-1',
          intelligence: { current: 3, max: 3, base: 3 }
        }
      ]
    };

    it('should calculate with selected ready items', () => {
      const selectedReadyIds = ['potion-1'];
      const result = calculateGroupedAttributesWithSelectedReady(
        mockCharacter, 
        selectedReadyIds
      );
      
      expect(result).toHaveProperty('strength');
      expect(result.strength).toBeGreaterThan(12); // Base + equipment + selected ready
    });

    it('should handle empty selected ready items', () => {
      const result = calculateGroupedAttributesWithSelectedReady(
        mockCharacter, 
        []
      );
      
      expect(result).toHaveProperty('strength');
      // Should only include character + equipment
      expect(result.strength).toBe(12); // 10 base + 2 equipment
    });

    it('should handle invalid ready item IDs', () => {
      const selectedReadyIds = ['nonexistent-item'];
      const result = calculateGroupedAttributesWithSelectedReady(
        mockCharacter, 
        selectedReadyIds
      );
      
      expect(result).toHaveProperty('strength');
      expect(result.strength).toBe(12); // Should ignore invalid IDs
    });

    it('should handle multiple selected ready items', () => {
      const selectedReadyIds = ['potion-1', 'scroll-1'];
      const result = calculateGroupedAttributesWithSelectedReady(
        mockCharacter, 
        selectedReadyIds
      );
      
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('intelligence');
      expect(result.strength).toBeGreaterThan(12);
      expect(result.intelligence).toBeGreaterThan(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null character', () => {
      expect(() => calculateGroupedAttributes(null)).not.toThrow();
    });

    it('should handle undefined character', () => {
      expect(() => calculateGroupedAttributes(undefined)).not.toThrow();
    });

    it('should handle character with empty equipment array', () => {
      const character = {
        characterId: 'char-1',
        strength: { current: 10, max: 15, base: 10 },
        equipment: []
      };
      
      const result = calculateGroupedAttributes(character);
      expect(result.strength).toBe(10);
    });

    it('should handle equipment with missing attributes', () => {
      const character = {
        characterId: 'char-1',
        strength: { current: 10, max: 15, base: 10 },
        equipment: [
          {
            objectId: 'obj-1',
            // No strength attribute
            speed: { current: 2, max: 2, base: 2 }
          }
        ]
      };
      
      const result = calculateGroupedAttributes(character);
      expect(result.strength).toBe(10); // Should not change
      expect(result.speed).toBe(2); // Should pick up equipment bonus
    });

    it('should handle negative attribute values', () => {
      const character = {
        characterId: 'char-1',
        strength: { current: 10, max: 15, base: 10 },
        equipment: [
          {
            objectId: 'heavy-armor',
            strength: { current: -2, max: -2, base: -2 },
            speed: { current: -5, max: -5, base: -5 }
          }
        ]
      };
      
      const result = calculateGroupedAttributes(character);
      expect(result.strength).toBeLessThan(10);
    });

    it('should handle very large attribute values', () => {
      const character = {
        characterId: 'char-1',
        strength: { current: 1000, max: 1500, base: 1000 },
        equipment: [
          {
            objectId: 'legendary-item',
            strength: { current: 500, max: 500, base: 500 }
          }
        ]
      };
      
      const result = calculateGroupedAttributes(character);
      expect(result.strength).toBeGreaterThan(1000);
      expect(result.strength).toBeLessThan(1500); // Should be between base and sum
    });
  });

  describe('performance and consistency', () => {
    it('should produce consistent results for same input', () => {
      const character = {
        characterId: 'char-1',
        strength: { current: 10, max: 15, base: 10 },
        equipment: [
          {
            objectId: 'sword-1',
            strength: { current: 3, max: 3, base: 3 }
          }
        ]
      };

      const result1 = calculateGroupedAttributes(character);
      const result2 = calculateGroupedAttributes(character);
      
      expect(result1.strength).toBe(result2.strength);
    });

    it('should handle large equipment arrays efficiently', () => {
      const equipment = Array.from({ length: 100 }, (_, i) => ({
        objectId: `item-${i}`,
        strength: { current: 1, max: 1, base: 1 }
      }));

      const character = {
        characterId: 'char-1',
        strength: { current: 10, max: 15, base: 10 },
        equipment
      };

      const startTime = Date.now();
      const result = calculateGroupedAttributes(character);
      const endTime = Date.now();

      expect(result.strength).toBeGreaterThan(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});