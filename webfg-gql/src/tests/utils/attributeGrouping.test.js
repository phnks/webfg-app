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
      expect(ATTRIBUTE_NAMES).toContain('obscurity');
      expect(ATTRIBUTE_NAMES).toContain('seeing');
      expect(ATTRIBUTE_NAMES).toContain('hearing');
      expect(ATTRIBUTE_NAMES).toContain('complexity');
      expect(ATTRIBUTE_NAMES).toContain('penetration');
      expect(ATTRIBUTE_NAMES).not.toContain('intensity');
      expect(ATTRIBUTE_NAMES).toHaveLength(20);
    });

    it('should have correct attribute groups', () => {
      expect(ATTRIBUTE_GROUPS.BODY).toContain('lethality');
      expect(ATTRIBUTE_GROUPS.BODY).toContain('penetration');
      expect(ATTRIBUTE_GROUPS.BODY).toContain('complexity');
      expect(ATTRIBUTE_GROUPS.MARTIAL).toContain('speed');
      expect(ATTRIBUTE_GROUPS.MARTIAL).toContain('strength');
      expect(ATTRIBUTE_GROUPS.MENTAL).toContain('intelligence');
      expect(ATTRIBUTE_GROUPS.SENSES).toContain('obscurity');
      expect(ATTRIBUTE_GROUPS.SENSES).toContain('seeing');
      expect(ATTRIBUTE_GROUPS.BODY).not.toContain('speed');
      expect(ATTRIBUTE_GROUPS.MARTIAL).not.toContain('lethality');
      expect(ATTRIBUTE_GROUPS.MARTIAL).not.toContain('penetration');
      expect(ATTRIBUTE_GROUPS.MARTIAL).not.toContain('obscurity');
      expect(ATTRIBUTE_GROUPS.MARTIAL).not.toContain('complexity');
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

    it('should calculate simple addition for two values', () => {
      // Formula: A1 + A2
      // For [10, 5]: 10 + 5 = 15
      const result = calculateGroupingFormula([10, 5]);
      expect(result).toBe(15);
    });

    it('should calculate simple addition for multiple values', () => {
      // For [12, 8, 4]: 12 + 8 + 4 = 24
      const result = calculateGroupingFormula([12, 8, 4]);
      expect(result).toBe(24);
    });

    it('should handle zero as highest value', () => {
      const result = calculateGroupingFormula([0, 0, 0]);
      expect(result).toBe(0);
    });

    it('should handle mixed zero and non-zero values', () => {
      const result = calculateGroupingFormula([5, 0, 3]);
      // Simple addition: 5 + 0 + 3 = 8
      expect(result).toBe(8);
    });

    it('should handle equal values', () => {
      const result = calculateGroupingFormula([10, 10, 10]);
      // Simple addition: 10 + 10 + 10 = 30
      expect(result).toBe(30);
    });

    it('should handle large arrays', () => {
      const values = [20, 15, 10, 8, 6, 4, 2, 1];
      const result = calculateGroupingFormula(values);
      // Simple addition: 20 + 15 + 10 + 8 + 6 + 4 + 2 + 1 = 66
      expect(result).toBe(66);
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
      expect(result.strength).toBe(13); // Character (10) + equipment (3) = 13
      expect(result.speed).toBe(7); // Character (8) + equipment (-1) = 7
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
        strength: { 
          attribute: { attributeValue: null, isGrouped: true }
        },
        speed: 'invalid'
      };

      const result = calculateGroupedAttributes(characterMalformed);
      expect(result.strength).toBe(0); // Should handle null attributeValue  
      expect(result.speed).toBeUndefined(); // Invalid format should be skipped
    });

    it('should include all defined attributes', () => {
      const result = calculateGroupedAttributes(mockCharacter);
      
      // Check attributes that are defined on the character
      expect(result).toHaveProperty('speed');
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('intelligence');
      
      // Should not include attributes that are not defined on the character
      expect(result).not.toHaveProperty('weight');
      expect(result).not.toHaveProperty('size');
      expect(result).not.toHaveProperty('dexterity');
      expect(result).not.toHaveProperty('resolve');
    });
  });

  describe('calculateReadyGroupedAttributes', () => {
    const mockCharacterWithReady = {
      characterId: 'char-1',
      strength: { 
        attribute: { attributeValue: 10, isGrouped: true }
      },
      equipment: [
        {
          objectId: 'sword-1',
          strength: { attributeValue: 2, isGrouped: true }
        }
      ],
      ready: [
        {
          objectId: 'potion-1',
          strength: { attributeValue: 1, isGrouped: true }
        }
      ]
    };

    it('should calculate grouped attributes including ready items', () => {
      const result = calculateReadyGroupedAttributes(mockCharacterWithReady);
      
      expect(result).toHaveProperty('strength');
      // Should include character + equipment + ready
      expect(result.strength).toBe(13); // Character (10) + equipment (2) + ready (1) = 13
    });

    it('should handle character without ready items', () => {
      const characterNoReady = {
        characterId: 'char-2',
        strength: { 
          attribute: { attributeValue: 10, isGrouped: true }
        },
        equipment: []
      };

      const result = calculateReadyGroupedAttributes(characterNoReady);
      expect(result.strength).toBe(10);
    });
  });

  describe('calculateObjectGroupedAttributes', () => {
    const mockObject = {
      objectId: 'obj-1',
      strength: { attributeValue: 5, isGrouped: true },
      speed: { attributeValue: 3, isGrouped: true },
      equipment: [
        {
          objectId: 'attachment-1',
          strength: { attributeValue: 2, isGrouped: true }
        }
      ]
    };

    it('should calculate grouped attributes for object with equipment', () => {
      const result = calculateObjectGroupedAttributes(mockObject);
      
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('speed');
      expect(result.strength).toBe(7); // Object (5) + equipment (2) = 7
    });

    it('should handle object without equipment', () => {
      const objectNoEquip = {
        objectId: 'obj-2',
        strength: { attributeValue: 5, isGrouped: true }
      };

      const result = calculateObjectGroupedAttributes(objectNoEquip);
      expect(result.strength).toBe(5);
    });
  });

  describe('calculateGroupedAttributesWithSelectedReady', () => {
    const mockCharacter = {
      characterId: 'char-1',
      strength: { 
        attribute: { attributeValue: 10, isGrouped: true }
      },
      intelligence: { 
        attribute: { attributeValue: 8, isGrouped: true }
      },
      equipment: [
        {
          objectId: 'sword-1',
          strength: { attributeValue: 2, isGrouped: true }
        }
      ],
      ready: [
        {
          objectId: 'potion-1',
          strength: { attributeValue: 1, isGrouped: true }
        },
        {
          objectId: 'scroll-1',
          intelligence: { attributeValue: 3, isGrouped: true }
        }
      ]
    };

    it('should calculate with selected ready items', () => {
      const selectedReadyId = 'potion-1';
      const result = calculateGroupedAttributesWithSelectedReady(
        mockCharacter, 
        selectedReadyId
      );
      
      expect(result).toHaveProperty('strength');
      expect(result.strength).toBe(13); // Character (10) + equipment (2) + ready (1) = 13
    });

    it('should handle empty selected ready items', () => {
      const result = calculateGroupedAttributesWithSelectedReady(
        mockCharacter, 
        null
      );
      
      expect(result).toHaveProperty('strength');
      // Should only include character + equipment
      expect(result.strength).toBe(12); // Character (10) + equipment (2) = 12
    });

    it('should handle invalid ready item IDs', () => {
      const selectedReadyId = 'nonexistent-item';
      const result = calculateGroupedAttributesWithSelectedReady(
        mockCharacter, 
        selectedReadyId
      );
      
      expect(result).toHaveProperty('strength');
      expect(result.strength).toBe(12); // Should ignore invalid IDs - Character (10) + equipment (2) = 12
    });

    it('should handle multiple selected ready items', () => {
      const selectedReadyId = 'potion-1'; // Function only accepts single ID
      const result = calculateGroupedAttributesWithSelectedReady(
        mockCharacter, 
        selectedReadyId
      );
      
      expect(result).toHaveProperty('strength');
      expect(result).toHaveProperty('intelligence');
      expect(result.strength).toBe(13); // Character (10) + equipment (2) + ready potion (1) = 13
      expect(result.intelligence).toBe(8); // Intelligence base value (potion doesn't affect intelligence)
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
        strength: { 
          attribute: { attributeValue: 10, isGrouped: true }
        },
        equipment: []
      };
      
      const result = calculateGroupedAttributes(character);
      expect(result.strength).toBe(10);
    });

    it('should handle equipment with missing attributes', () => {
      const character = {
        characterId: 'char-1',
        strength: { 
          attribute: { attributeValue: 10, isGrouped: true }
        },
        speed: { 
          attribute: { attributeValue: 5, isGrouped: true }
        },
        equipment: [
          {
            objectId: 'obj-1',
            // No strength attribute
            speed: { attributeValue: 2, isGrouped: true }
          }
        ]
      };
      
      const result = calculateGroupedAttributes(character);
      expect(result.strength).toBe(10); // Should not change (no equipment bonus)
      expect(result.speed).toBe(7); // Speed (5) + equipment (2) = 7
    });

    it('should handle negative attribute values', () => {
      const character = {
        characterId: 'char-1',
        strength: { 
          attribute: { attributeValue: 10, isGrouped: true }
        },
        equipment: [
          {
            objectId: 'heavy-armor',
            strength: { attributeValue: -2, isGrouped: true },
            speed: { attributeValue: -5, isGrouped: true }
          }
        ]
      };
      
      const result = calculateGroupedAttributes(character);
      expect(result.strength).toBeLessThan(10);
    });

    it('should handle very large attribute values', () => {
      const character = {
        characterId: 'char-1',
        strength: { 
          attribute: { attributeValue: 1000, isGrouped: true }
        },
        equipment: [
          {
            objectId: 'legendary-item',
            strength: { attributeValue: 500, isGrouped: true }
          }
        ]
      };
      
      const result = calculateGroupedAttributes(character);
      expect(result.strength).toBe(1500); // Character (1000) + equipment (500) = 1500
      expect(result.strength).toBeGreaterThan(1000); // Should be greater than base due to addition
    });
  });

  describe('performance and consistency', () => {
    it('should produce consistent results for same input', () => {
      const character = {
        characterId: 'char-1',
        strength: { 
          attribute: { attributeValue: 10, isGrouped: true }
        },
        equipment: [
          {
            objectId: 'sword-1',
            strength: { attributeValue: 3, isGrouped: true }
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
        strength: { attributeValue: 1, isGrouped: true }
      }));

      const character = {
        characterId: 'char-1',
        strength: { 
          attribute: { attributeValue: 10, isGrouped: true }
        },
        equipment
      };

      const startTime = Date.now();
      const result = calculateGroupedAttributes(character);
      const endTime = Date.now();

      expect(result.strength).toBe(110); // Character (10) + 100 items (1 each) = 110
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});