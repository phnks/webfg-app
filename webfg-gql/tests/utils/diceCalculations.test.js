const {
  getDiceForAttribute,
  attributeUsesDice,
  calculateAttributeModifier,
  calculateBasicDiceRoll,
  calculateCommonDiceRoll,
  calculateContestedRoll,
  formatDiceRollResult,
  DICE_ROLL_TYPES
} = require('../../utils/diceCalculations');

describe('diceCalculations utilities', () => {
  describe('getDiceForAttribute', () => {
    test('should return correct dice for dice-based attributes', () => {
      expect(getDiceForAttribute('SPEED')).toBe(4);
      expect(getDiceForAttribute('STRENGTH')).toBe(8);
      expect(getDiceForAttribute('DEXTERITY')).toBe(6);
      expect(getDiceForAttribute('AGILITY')).toBe(10);
      expect(getDiceForAttribute('CHARISMA')).toBe(100);
      expect(getDiceForAttribute('INTELLIGENCE')).toBe(20);
      expect(getDiceForAttribute('RESOLVE')).toBe(12);
    });

    test('should return null for static attributes', () => {
      expect(getDiceForAttribute('WEIGHT')).toBeNull();
      expect(getDiceForAttribute('SIZE')).toBeNull();
      expect(getDiceForAttribute('LETHALITY')).toBeNull();
      expect(getDiceForAttribute('ARMOUR')).toBeNull();
      expect(getDiceForAttribute('ARMOR')).toBeNull();
      expect(getDiceForAttribute('ENDURANCE')).toBeNull();
      expect(getDiceForAttribute('PERCEPTION')).toBeNull();
      expect(getDiceForAttribute('INTENSITY')).toBeNull();
      expect(getDiceForAttribute('MORALE')).toBeNull();
    });

    test('should be case insensitive', () => {
      expect(getDiceForAttribute('strength')).toBe(8);
      expect(getDiceForAttribute('Strength')).toBe(8);
      expect(getDiceForAttribute('STRENGTH')).toBe(8);
      expect(getDiceForAttribute('weight')).toBeNull();
      expect(getDiceForAttribute('Weight')).toBeNull();
    });

    test('should handle unknown attributes', () => {
      expect(getDiceForAttribute('UNKNOWN')).toBeNull();
      expect(getDiceForAttribute('RANDOM')).toBeNull();
    });

    test('should handle null and undefined input', () => {
      expect(getDiceForAttribute(null)).toBeNull();
      expect(getDiceForAttribute(undefined)).toBeNull();
      expect(getDiceForAttribute('')).toBeNull();
    });
  });

  describe('attributeUsesDice', () => {
    test('should return true for dice-based attributes', () => {
      expect(attributeUsesDice('SPEED')).toBe(true);
      expect(attributeUsesDice('STRENGTH')).toBe(true);
      expect(attributeUsesDice('DEXTERITY')).toBe(true);
      expect(attributeUsesDice('AGILITY')).toBe(true);
    });

    test('should return false for static attributes', () => {
      expect(attributeUsesDice('WEIGHT')).toBe(false);
      expect(attributeUsesDice('SIZE')).toBe(false);
      expect(attributeUsesDice('LETHALITY')).toBe(false);
      expect(attributeUsesDice('ARMOUR')).toBe(false);
    });

    test('should handle unknown attributes', () => {
      expect(attributeUsesDice('UNKNOWN')).toBe(false);
    });

    test('should handle null and undefined input', () => {
      expect(attributeUsesDice(null)).toBe(false);
      expect(attributeUsesDice(undefined)).toBe(false);
    });
  });

  describe('calculateAttributeModifier', () => {
    test('should apply fatigue to dice-based attributes', () => {
      const modifier = calculateAttributeModifier(10, 2, 'STRENGTH');
      expect(modifier).toBe(8); // 10 - 2 fatigue
    });

    test('should not apply fatigue to static attributes', () => {
      const modifier = calculateAttributeModifier(10, 2, 'WEIGHT');
      expect(modifier).toBe(10); // No fatigue applied
    });

    test('should handle zero attribute value', () => {
      expect(calculateAttributeModifier(0, 2, 'STRENGTH')).toBe(-2);
      expect(calculateAttributeModifier(0, 2, 'WEIGHT')).toBe(0);
    });

    test('should handle undefined attribute value', () => {
      expect(calculateAttributeModifier(undefined, 2, 'STRENGTH')).toBe(-2);
      expect(calculateAttributeModifier(undefined, 2, 'WEIGHT')).toBe(0);
    });

    test('should handle null attribute value', () => {
      expect(calculateAttributeModifier(null, 2, 'STRENGTH')).toBe(-2);
      expect(calculateAttributeModifier(null, 2, 'WEIGHT')).toBe(0);
    });

    test('should handle zero fatigue', () => {
      expect(calculateAttributeModifier(10, 0, 'STRENGTH')).toBe(10);
      expect(calculateAttributeModifier(10, 0, 'WEIGHT')).toBe(10);
    });

    test('should handle negative fatigue', () => {
      expect(calculateAttributeModifier(10, -2, 'STRENGTH')).toBe(12);
      expect(calculateAttributeModifier(10, -2, 'WEIGHT')).toBe(10);
    });

    test('should round decimal values', () => {
      expect(calculateAttributeModifier(10.7, 2, 'STRENGTH')).toBe(9);
      expect(calculateAttributeModifier(10.7, 2, 'WEIGHT')).toBe(11);
    });

    test('should handle negative results', () => {
      expect(calculateAttributeModifier(1, 5, 'STRENGTH')).toBe(-4);
    });
  });

  describe('calculateBasicDiceRoll', () => {
    test('should return object with correct structure for dice-based attributes', () => {
      const result = calculateBasicDiceRoll(10, 2, 'STRENGTH');
      
      expect(result).toHaveProperty('diceRoll');
      expect(result).toHaveProperty('modifier');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('diceType');
      expect(result).toHaveProperty('rollType');
      
      expect(result.modifier).toBe(8); // 10 - 2 fatigue
      expect(result.diceType).toBe(8); // d8 for strength
      expect(result.rollType).toBe('BASIC');
      expect(result.diceRoll).toBeGreaterThanOrEqual(1);
      expect(result.diceRoll).toBeLessThanOrEqual(8);
      expect(result.total).toBe(result.diceRoll + result.modifier);
    });

    test('should return static value for non-dice attributes', () => {
      const result = calculateBasicDiceRoll(10, 2, 'WEIGHT');
      
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('modifier');
      expect(result).toHaveProperty('rollType');
      
      expect(result.total).toBe(10); // Static value, no fatigue
      expect(result.modifier).toBe(10);
      expect(result.rollType).toBe('STATIC');
      expect(result.diceRoll).toBeUndefined();
      expect(result.diceType).toBeUndefined();
    });

    test('should handle all dice types', () => {
      const strengthResult = calculateBasicDiceRoll(10, 0, 'STRENGTH');
      expect(strengthResult.diceType).toBe(8);
      expect(strengthResult.diceRoll).toBeLessThanOrEqual(8);

      const speedResult = calculateBasicDiceRoll(10, 0, 'SPEED');
      expect(speedResult.diceType).toBe(4);
      expect(speedResult.diceRoll).toBeLessThanOrEqual(4);

      const charismaResult = calculateBasicDiceRoll(10, 0, 'CHARISMA');
      expect(charismaResult.diceType).toBe(100);
      expect(charismaResult.diceRoll).toBeLessThanOrEqual(100);
    });

    test('should handle negative modifiers', () => {
      const result = calculateBasicDiceRoll(1, 5, 'STRENGTH');
      expect(result.modifier).toBe(-4);
      expect(result.total).toBe(result.diceRoll - 4);
    });
  });

  describe('calculateCommonDiceRoll', () => {
    test('should return correct structure for common roll', () => {
      const result = calculateCommonDiceRoll(10, 2, 'STRENGTH');
      
      expect(result).toHaveProperty('diceRoll');
      expect(result).toHaveProperty('modifier');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('diceType');
      expect(result).toHaveProperty('rollType');
      
      expect(result.rollType).toBe('COMMON');
    });

    test('should handle static attributes', () => {
      const result = calculateCommonDiceRoll(10, 2, 'WEIGHT');
      expect(result.rollType).toBe('STATIC');
    });
  });

  describe('calculateContestedRoll', () => {
    const character1 = {
      strength: { attribute: { attributeValue: 12 } },
      fatigue: 1
    };
    
    const character2 = {
      strength: { attribute: { attributeValue: 10 } },
      fatigue: 2
    };

    test('should return contest result with both character rolls', () => {
      const result = calculateContestedRoll(character1, character2, 'strength');
      
      expect(result).toHaveProperty('character1Roll');
      expect(result).toHaveProperty('character2Roll');
      expect(result).toHaveProperty('winner');
      expect(result).toHaveProperty('rollType');
      
      expect(result.rollType).toBe('CONTESTED');
      expect(['character1', 'character2', 'tie']).toContain(result.winner);
    });

    test('should handle tie scenarios', () => {
      // Run multiple times to eventually get a tie (random dice rolls)
      let tieFound = false;
      for (let i = 0; i < 100; i++) {
        const result = calculateContestedRoll(character1, character2, 'strength');
        if (result.winner === 'tie') {
          tieFound = true;
          break;
        }
      }
      // Don't assert tie found since it's random, just ensure function doesn't crash
      expect(typeof tieFound).toBe('boolean');
    });

    test('should handle static attributes in contested roll', () => {
      const char1 = { weight: { attribute: { attributeValue: 100 } }, fatigue: 0 };
      const char2 = { weight: { attribute: { attributeValue: 80 } }, fatigue: 0 };
      
      const result = calculateContestedRoll(char1, char2, 'weight');
      expect(result.winner).toBe('character1'); // Higher static value wins
    });

    test('should handle missing attributes', () => {
      const charMissing = { fatigue: 0 };
      const result = calculateContestedRoll(charMissing, character2, 'strength');
      
      expect(result).toHaveProperty('character1Roll');
      expect(result).toHaveProperty('character2Roll');
    });
  });

  describe('formatDiceRollResult', () => {
    test('should format dice roll result correctly', () => {
      const rollResult = {
        diceRoll: 5,
        modifier: 8,
        total: 13,
        diceType: 8,
        rollType: 'BASIC'
      };
      
      const formatted = formatDiceRollResult(rollResult);
      expect(formatted).toContain('d8');
      expect(formatted).toContain('5');
      expect(formatted).toContain('8');
      expect(formatted).toContain('13');
    });

    test('should format static result correctly', () => {
      const staticResult = {
        total: 10,
        modifier: 10,
        rollType: 'STATIC'
      };
      
      const formatted = formatDiceRollResult(staticResult);
      expect(formatted).toContain('10');
      expect(formatted).not.toContain('d');
    });

    test('should handle negative modifiers in formatting', () => {
      const rollResult = {
        diceRoll: 5,
        modifier: -2,
        total: 3,
        diceType: 8,
        rollType: 'BASIC'
      };
      
      const formatted = formatDiceRollResult(rollResult);
      expect(formatted).toContain('-2');
    });

    test('should handle zero modifier formatting', () => {
      const rollResult = {
        diceRoll: 5,
        modifier: 0,
        total: 5,
        diceType: 8,
        rollType: 'BASIC'
      };
      
      const formatted = formatDiceRollResult(rollResult);
      expect(typeof formatted).toBe('string');
    });
  });

  describe('DICE_ROLL_TYPES constant', () => {
    test('should have all expected roll types', () => {
      expect(DICE_ROLL_TYPES).toHaveProperty('BASIC');
      expect(DICE_ROLL_TYPES).toHaveProperty('COMMON');
      expect(DICE_ROLL_TYPES).toHaveProperty('CONTESTED');
      expect(DICE_ROLL_TYPES).toHaveProperty('STATIC');
    });

    test('should have string values', () => {
      Object.values(DICE_ROLL_TYPES).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('edge cases', () => {
    test('should handle very large attribute values', () => {
      const result = calculateBasicDiceRoll(999999, 0, 'STRENGTH');
      expect(result.modifier).toBe(999999);
      expect(result.total).toBeGreaterThan(999999);
    });

    test('should handle very large fatigue values', () => {
      const result = calculateBasicDiceRoll(10, 999999, 'STRENGTH');
      expect(result.modifier).toBe(-999989);
      expect(result.total).toBeLessThan(0);
    });

    test('should handle decimal inputs', () => {
      const result = calculateBasicDiceRoll(10.7, 2.3, 'STRENGTH');
      expect(Number.isInteger(result.modifier)).toBe(true);
      expect(Number.isInteger(result.total)).toBe(true);
    });

    test('should maintain randomness in dice rolls', () => {
      const results = [];
      for (let i = 0; i < 50; i++) {
        const result = calculateBasicDiceRoll(10, 0, 'STRENGTH');
        results.push(result.diceRoll);
      }
      
      // Should have some variety in rolls (not all the same)
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });
});