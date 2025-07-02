const {
  applyConditionsToBreakdown,
  calculateAttributeBreakdown,
  calculateReadyAttributeBreakdown,
  calculateObjectAttributeBreakdown,
  calculateAttributeBreakdownWithSelectedReady
} = require('../../utils/attributeBreakdown');

describe('attributeBreakdown utilities', () => {
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
    ],
    conditions: [
      {
        conditionId: 'cond1',
        name: 'Strength Boost',
        conditionType: 'BUFF',
        conditionTarget: 'STRENGTH',
        amount: 2
      },
      {
        conditionId: 'cond2',
        name: 'Armor Penalty',
        conditionType: 'DEBUFF',
        conditionTarget: 'DEXTERITY',
        amount: -1
      }
    ]
  };

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

  describe('applyConditionsToBreakdown', () => {
    test('should apply buff condition to matching attribute', () => {
      const breakdown = [];
      const result = applyConditionsToBreakdown(mockCharacter, 'strength', breakdown, 10, 1);
      
      expect(result).toBeGreaterThan(10);
      expect(breakdown.length).toBeGreaterThan(0);
    });

    test('should apply debuff condition to matching attribute', () => {
      const breakdown = [];
      const result = applyConditionsToBreakdown(mockCharacter, 'dexterity', breakdown, 8, 1);
      
      expect(result).toBeLessThan(8);
      expect(breakdown.length).toBeGreaterThan(0);
    });

    test('should not apply conditions to non-matching attributes', () => {
      const breakdown = [];
      const result = applyConditionsToBreakdown(mockCharacter, 'armour', breakdown, 5, 1);
      
      expect(result).toBe(5); // No conditions target armour
    });

    test('should handle character with no conditions', () => {
      const characterNoConditions = { ...mockCharacter, conditions: [] };
      const breakdown = [];
      const result = applyConditionsToBreakdown(characterNoConditions, 'strength', breakdown, 10, 1);
      
      expect(result).toBe(10);
    });

    test('should handle character with undefined conditions', () => {
      const characterNoConditions = { ...mockCharacter, conditions: undefined };
      const breakdown = [];
      const result = applyConditionsToBreakdown(characterNoConditions, 'strength', breakdown, 10, 1);
      
      expect(result).toBe(10);
    });

    test('should skip invalid conditions', () => {
      const characterInvalidConditions = {
        ...mockCharacter,
        conditions: [
          { name: 'Invalid - Missing Target' },
          { conditionTarget: 'STRENGTH' }, // Missing other fields
          { conditionType: 'BUFF', amount: 5 } // Missing target
        ]
      };
      const breakdown = [];
      const result = applyConditionsToBreakdown(characterInvalidConditions, 'strength', breakdown, 10, 1);
      
      expect(result).toBe(10); // Should not apply any invalid conditions
    });

    test('should handle zero amount conditions', () => {
      const characterZeroCondition = {
        ...mockCharacter,
        conditions: [
          {
            name: 'Zero Effect',
            conditionType: 'BUFF',
            conditionTarget: 'STRENGTH',
            amount: 0
          }
        ]
      };
      const breakdown = [];
      const result = applyConditionsToBreakdown(characterZeroCondition, 'strength', breakdown, 10, 1);
      
      expect(result).toBe(10);
    });
  });

  describe('calculateAttributeBreakdown', () => {
    test('should calculate breakdown with base and equipment', () => {
      const result = calculateAttributeBreakdown(mockCharacter, 'strength');
      
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.breakdown)).toBe(true);
      expect(result.total).toBeGreaterThan(10); // Base + equipment + conditions
    });

    test('should handle non-existent attribute', () => {
      const result = calculateAttributeBreakdown(mockCharacter, 'nonexistent');
      
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('total');
      expect(result.total).toBe(0);
    });

    test('should handle character with no equipment', () => {
      const characterNoEquip = { ...mockCharacter, equipment: [] };
      const result = calculateAttributeBreakdown(characterNoEquip, 'strength');
      
      expect(result.total).toBeGreaterThan(10); // Should still have base + conditions
    });

    test('should handle character with undefined equipment', () => {
      const characterNoEquip = { ...mockCharacter, equipment: undefined };
      const result = calculateAttributeBreakdown(characterNoEquip, 'strength');
      
      expect(result.total).toBeGreaterThan(10);
    });

    test('should include step-by-step breakdown', () => {
      const result = calculateAttributeBreakdown(mockCharacter, 'strength');
      
      expect(result.breakdown.length).toBeGreaterThan(0);
      result.breakdown.forEach(step => {
        expect(step).toHaveProperty('step');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('value');
        expect(step).toHaveProperty('runningTotal');
      });
    });
  });

  describe('calculateReadyAttributeBreakdown', () => {
    test('should include ready objects in breakdown', () => {
      const result = calculateReadyAttributeBreakdown(mockCharacter, 'armour');
      
      expect(result.total).toBeGreaterThan(5); // Base + equipment + ready + conditions
      expect(result.breakdown.some(step => step.description.includes('Ready'))).toBe(true);
    });

    test('should handle character with no ready objects', () => {
      const characterNoReady = { ...mockCharacter, ready: [] };
      const result = calculateReadyAttributeBreakdown(characterNoReady, 'armour');
      
      expect(result.total).toBe(7); // Base + equipment, no ready
    });

    test('should handle character with undefined ready', () => {
      const characterNoReady = { ...mockCharacter, ready: undefined };
      const result = calculateReadyAttributeBreakdown(characterNoReady, 'armour');
      
      expect(result.total).toBe(7);
    });
  });

  describe('calculateObjectAttributeBreakdown', () => {
    test('should calculate object breakdown with parts', () => {
      const result = calculateObjectAttributeBreakdown(mockObject, 'strength');
      
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('total');
      expect(result.total).toBeGreaterThan(5); // Base + parts
    });

    test('should handle object with no parts', () => {
      const objectNoParts = { ...mockObject, parts: [] };
      const result = calculateObjectAttributeBreakdown(objectNoParts, 'strength');
      
      expect(result.total).toBe(5); // Just base value
    });

    test('should handle object with undefined parts', () => {
      const objectNoParts = { ...mockObject, parts: undefined };
      const result = calculateObjectAttributeBreakdown(objectNoParts, 'strength');
      
      expect(result.total).toBe(5);
    });

    test('should handle non-existent attribute', () => {
      const result = calculateObjectAttributeBreakdown(mockObject, 'nonexistent');
      
      expect(result.total).toBe(0);
    });
  });

  describe('calculateAttributeBreakdownWithSelectedReady', () => {
    test('should include specific ready object', () => {
      const result = calculateAttributeBreakdownWithSelectedReady(mockCharacter, 'armour', 'shield1');
      
      expect(result.total).toBeGreaterThan(7); // Should include the shield
      expect(result.breakdown.some(step => step.description.includes('shield1'))).toBe(true);
    });

    test('should handle non-existent ready object ID', () => {
      const result = calculateAttributeBreakdownWithSelectedReady(mockCharacter, 'armour', 'nonexistent');
      
      expect(result.total).toBe(7); // Should fallback to normal calculation
    });

    test('should handle null ready object ID', () => {
      const result = calculateAttributeBreakdownWithSelectedReady(mockCharacter, 'armour', null);
      
      expect(result.total).toBe(7);
    });

    test('should handle undefined ready object ID', () => {
      const result = calculateAttributeBreakdownWithSelectedReady(mockCharacter, 'armour', undefined);
      
      expect(result.total).toBe(7);
    });
  });

  describe('edge cases', () => {
    test('should handle null character', () => {
      expect(() => calculateAttributeBreakdown(null, 'strength')).not.toThrow();
    });

    test('should handle undefined character', () => {
      expect(() => calculateAttributeBreakdown(undefined, 'strength')).not.toThrow();
    });

    test('should handle null attribute name', () => {
      const result = calculateAttributeBreakdown(mockCharacter, null);
      expect(result.total).toBe(0);
    });

    test('should handle empty string attribute name', () => {
      const result = calculateAttributeBreakdown(mockCharacter, '');
      expect(result.total).toBe(0);
    });

    test('should handle very large attribute values', () => {
      const largeValueChar = {
        ...mockCharacter,
        strength: { attribute: { attributeValue: 999999 } }
      };
      const result = calculateAttributeBreakdown(largeValueChar, 'strength');
      expect(result.total).toBeGreaterThan(999999);
    });

    test('should handle negative attribute values', () => {
      const negativeChar = {
        ...mockCharacter,
        strength: { attribute: { attributeValue: -5 } }
      };
      const result = calculateAttributeBreakdown(negativeChar, 'strength');
      expect(typeof result.total).toBe('number');
    });

    test('should handle condition amount as string', () => {
      const stringAmountChar = {
        ...mockCharacter,
        conditions: [
          {
            name: 'String Amount',
            conditionType: 'BUFF',
            conditionTarget: 'STRENGTH',
            amount: '5' // String instead of number
          }
        ]
      };
      const result = calculateAttributeBreakdown(stringAmountChar, 'strength');
      expect(result.total).toBeGreaterThan(10);
    });
  });
});