const {
  ATTRIBUTE_DICE_MAP,
  getDiceForAttribute,
  attributeUsesDice,
  calculateAttributeModifier,
  getAttributeRange,
  calculateDiceSuccessProbability,
  formatDiceRoll,
  analyzeSuccessRanges,
  calculateSubtractSuccessProbability,
  analyzeSubtractSuccessRanges,
  calculateDeltaSuccessProbability,
  analyzeDeltaSuccessRanges
} = require('../../utils/diceCalculations');

describe('diceCalculations utilities', () => {
  describe('ATTRIBUTE_DICE_MAP constant', () => {
    test('should have correct dice mappings', () => {
      expect(ATTRIBUTE_DICE_MAP.SPEED).toBe(4);
      expect(ATTRIBUTE_DICE_MAP.STRENGTH).toBe(8);
      expect(ATTRIBUTE_DICE_MAP.DEXTERITY).toBe(6);
      expect(ATTRIBUTE_DICE_MAP.AGILITY).toBe(10);
      expect(ATTRIBUTE_DICE_MAP.CHARISMA).toBe(100);
      expect(ATTRIBUTE_DICE_MAP.INTELLIGENCE).toBe(20);
      expect(ATTRIBUTE_DICE_MAP.RESOLVE).toBe(12);
    });

    test('should have null for static attributes', () => {
      expect(ATTRIBUTE_DICE_MAP.WEIGHT).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.SIZE).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.LETHALITY).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.ARMOUR).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.ARMOR).toBeNull();
    });
  });

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
      expect(calculateAttributeModifier(0, 2, 'STRENGTH')).toBe(0); // Math.max(0, 0-2)
      expect(calculateAttributeModifier(0, 2, 'WEIGHT')).toBe(0);
    });

    test('should handle undefined attribute value', () => {
      expect(calculateAttributeModifier(undefined, 2, 'STRENGTH')).toBe(0); // Math.max(0, 0-2)
      expect(calculateAttributeModifier(undefined, 2, 'WEIGHT')).toBe(0);
    });

    test('should handle null attribute value', () => {
      expect(calculateAttributeModifier(null, 2, 'STRENGTH')).toBe(0); // Math.max(0, 0-2)
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
      expect(calculateAttributeModifier(1, 5, 'STRENGTH')).toBe(0); // Math.max(0, 1-5)
    });
  });

  describe('getAttributeRange', () => {
    test('should return correct range for dice-based attributes', () => {
      const range = getAttributeRange('STRENGTH', 5);
      expect(range).toHaveProperty('min');
      expect(range).toHaveProperty('max');
      expect(range.min).toBe(6); // 1 + 5 modifier
      expect(range.max).toBe(13); // 8 + 5 modifier
    });

    test('should return static value for non-dice attributes', () => {
      const range = getAttributeRange('WEIGHT', 5);
      expect(range.min).toBe(5); // Just the modifier
      expect(range.max).toBe(5); // Just the modifier
    });

    test('should handle zero modifier', () => {
      const range = getAttributeRange('STRENGTH', 0);
      expect(range.min).toBe(1); // Minimum dice roll
      expect(range.max).toBe(8); // Maximum dice roll
    });

    test('should handle negative modifier', () => {
      const range = getAttributeRange('STRENGTH', -2);
      expect(range.min).toBe(-1); // 1 + (-2)
      expect(range.max).toBe(6); // 8 + (-2)
    });
  });

  describe('calculateDiceSuccessProbability', () => {
    test('should calculate probability for dice vs dice', () => {
      const probability = calculateDiceSuccessProbability('STRENGTH', 5, 'DEXTERITY', 3);
      expect(typeof probability).toBe('number');
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
    });

    test('should handle dice vs static', () => {
      const probability = calculateDiceSuccessProbability('STRENGTH', 10, 'WEIGHT', 5);
      expect(typeof probability).toBe('number');
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
    });

    test('should handle static vs static', () => {
      const probability = calculateDiceSuccessProbability('WEIGHT', 15, 'SIZE', 10);
      expect(probability).toBe(1); // 15 > 10, guaranteed success
    });

    test('should handle static tie scenarios', () => {
      const probability = calculateDiceSuccessProbability('WEIGHT', 10, 'SIZE', 10);
      expect(probability).toBe(0); // Tie goes to target
    });
  });

  describe('formatDiceRoll', () => {
    test('should format dice roll correctly', () => {
      const formatted = formatDiceRoll('STRENGTH', 5);
      expect(typeof formatted).toBe('string');
      expect(formatted).toBe('1d8+5'); // Expected format
    });

    test('should format static value correctly', () => {
      const formatted = formatDiceRoll('WEIGHT', 10);
      expect(typeof formatted).toBe('string');
      expect(formatted).toBe('Static: 10'); // Expected format for static
    });

    test('should handle zero modifier', () => {
      const formatted = formatDiceRoll('STRENGTH', 0);
      expect(formatted).toBe('1d8+0');
    });

    test('should handle negative modifier', () => {
      const formatted = formatDiceRoll('DEXTERITY', -2);
      expect(formatted).toBe('1d6+-2');
    });
  });

  describe('analyzeSuccessRanges', () => {
    test('should analyze success ranges for dice vs dice', () => {
      const analysis = analyzeSuccessRanges('STRENGTH', 5, 'DEXTERITY', 3);
      expect(analysis).toHaveProperty('sourceRange');
      expect(analysis).toHaveProperty('targetRange');
      expect(analysis).toHaveProperty('guaranteedSuccess');
      expect(analysis).toHaveProperty('guaranteedFailure');
      expect(analysis).toHaveProperty('partialSuccess');
    });

    test('should handle static vs dice', () => {
      const analysis = analyzeSuccessRanges('WEIGHT', 15, 'STRENGTH', 5);
      expect(analysis.sourceRange.min).toBe(15);
      expect(analysis.sourceRange.max).toBe(15);
    });
  });

  describe('calculateSubtractSuccessProbability', () => {
    test('should calculate subtract probability', () => {
      const probability = calculateSubtractSuccessProbability('STRENGTH', 10, 'DEXTERITY', 8);
      expect(typeof probability).toBe('number');
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeSubtractSuccessRanges', () => {
    test('should analyze subtract success ranges', () => {
      const analysis = analyzeSubtractSuccessRanges('STRENGTH', 10, 'DEXTERITY', 8);
      expect(analysis).toHaveProperty('sourceRange');
      expect(analysis).toHaveProperty('targetRange');
      expect(analysis).toHaveProperty('guaranteedSuccess');
      expect(analysis).toHaveProperty('guaranteedFailure');
    });
  });

  describe('calculateDeltaSuccessProbability', () => {
    test('should calculate delta probability', () => {
      const probability = calculateDeltaSuccessProbability('STRENGTH', 12);
      expect(typeof probability).toBe('number');
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeDeltaSuccessRanges', () => {
    test('should analyze delta success ranges', () => {
      const analysis = analyzeDeltaSuccessRanges('STRENGTH', 12);
      expect(analysis).toHaveProperty('sourceRange');
      expect(analysis).toHaveProperty('targetRange');
      expect(analysis).toHaveProperty('guaranteedSuccess');
      expect(analysis).toHaveProperty('guaranteedFailure');
      expect(analysis.targetRange.min).toBe(10);
      expect(analysis.targetRange.max).toBe(10);
    });
  });

  describe('edge cases', () => {
    test('should handle very large modifier values', () => {
      const range = getAttributeRange('STRENGTH', 999999);
      expect(range.min).toBe(1000000); // 1 + 999999
      expect(range.max).toBe(1000007); // 8 + 999999
    });

    test('should handle very large negative modifiers', () => {
      const range = getAttributeRange('STRENGTH', -999999);
      expect(range.min).toBe(-999998); // 1 + (-999999)
      expect(range.max).toBe(-999991); // 8 + (-999999)
    });

    test('should handle decimal modifiers', () => {
      const range = getAttributeRange('STRENGTH', 5.7);
      expect(Number.isInteger(range.min)).toBe(true);
      expect(Number.isInteger(range.max)).toBe(true);
    });

    test('should handle all dice types consistently', () => {
      const strengthRange = getAttributeRange('STRENGTH', 5);
      expect(strengthRange.max - strengthRange.min).toBe(7); // d8 range
      
      const speedRange = getAttributeRange('SPEED', 5);
      expect(speedRange.max - speedRange.min).toBe(3); // d4 range
      
      const charismaRange = getAttributeRange('CHARISMA', 5);
      expect(charismaRange.max - charismaRange.min).toBe(99); // d100 range
    });
  });
});