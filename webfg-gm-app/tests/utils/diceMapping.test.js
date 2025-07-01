import {
  ATTRIBUTE_DICE_MAP,
  getDiceForAttribute,
  attributeUsesDice,
  getDiceRange,
  calculateAttributeModifier,
  formatDiceRoll,
  getAttributeRange
} from '../../src/utils/diceMapping';

describe('diceMapping utility', () => {
  describe('ATTRIBUTE_DICE_MAP', () => {
    test('should contain all expected attributes', () => {
      expect(ATTRIBUTE_DICE_MAP).toHaveProperty('SPEED', 'd4');
      expect(ATTRIBUTE_DICE_MAP).toHaveProperty('STRENGTH', 'd8');
      expect(ATTRIBUTE_DICE_MAP).toHaveProperty('DEXTERITY', 'd6');
      expect(ATTRIBUTE_DICE_MAP).toHaveProperty('AGILITY', 'd10');
      expect(ATTRIBUTE_DICE_MAP).toHaveProperty('CHARISMA', 'd100');
      expect(ATTRIBUTE_DICE_MAP).toHaveProperty('INTELLIGENCE', 'd20');
      expect(ATTRIBUTE_DICE_MAP).toHaveProperty('RESOLVE', 'd12');
    });

    test('should have null values for static attributes', () => {
      expect(ATTRIBUTE_DICE_MAP.WEIGHT).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.SIZE).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.LETHALITY).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.ARMOUR).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.ARMOR).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.ENDURANCE).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.PERCEPTION).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.INTENSITY).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.MORALE).toBeNull();
    });
  });

  describe('getDiceForAttribute', () => {
    test('should return correct dice for dice-based attributes', () => {
      expect(getDiceForAttribute('SPEED')).toBe('d4');
      expect(getDiceForAttribute('STRENGTH')).toBe('d8');
      expect(getDiceForAttribute('DEXTERITY')).toBe('d6');
      expect(getDiceForAttribute('AGILITY')).toBe('d10');
      expect(getDiceForAttribute('CHARISMA')).toBe('d100');
      expect(getDiceForAttribute('INTELLIGENCE')).toBe('d20');
      expect(getDiceForAttribute('RESOLVE')).toBe('d12');
    });

    test('should return null for static attributes', () => {
      expect(getDiceForAttribute('WEIGHT')).toBeNull();
      expect(getDiceForAttribute('SIZE')).toBeNull();
      expect(getDiceForAttribute('LETHALITY')).toBeNull();
      expect(getDiceForAttribute('ARMOR')).toBeNull();
    });

    test('should be case insensitive', () => {
      expect(getDiceForAttribute('speed')).toBe('d4');
      expect(getDiceForAttribute('Speed')).toBe('d4');
      expect(getDiceForAttribute('SPEED')).toBe('d4');
      expect(getDiceForAttribute('weight')).toBeNull();
      expect(getDiceForAttribute('Weight')).toBeNull();
    });

    test('should handle null/undefined input', () => {
      expect(getDiceForAttribute(null)).toBeNull();
      expect(getDiceForAttribute(undefined)).toBeNull();
      expect(getDiceForAttribute('')).toBeNull();
    });

    test('should return null for unknown attributes', () => {
      expect(getDiceForAttribute('UNKNOWN_ATTRIBUTE')).toBeNull();
      expect(getDiceForAttribute('MAGIC')).toBeNull();
    });
  });

  describe('attributeUsesDice', () => {
    test('should return true for dice-based attributes', () => {
      expect(attributeUsesDice('SPEED')).toBe(true);
      expect(attributeUsesDice('STRENGTH')).toBe(true);
      expect(attributeUsesDice('DEXTERITY')).toBe(true);
      expect(attributeUsesDice('AGILITY')).toBe(true);
      expect(attributeUsesDice('CHARISMA')).toBe(true);
      expect(attributeUsesDice('INTELLIGENCE')).toBe(true);
      expect(attributeUsesDice('RESOLVE')).toBe(true);
    });

    test('should return false for static attributes', () => {
      expect(attributeUsesDice('WEIGHT')).toBe(false);
      expect(attributeUsesDice('SIZE')).toBe(false);
      expect(attributeUsesDice('LETHALITY')).toBe(false);
      expect(attributeUsesDice('ARMOR')).toBe(false);
      expect(attributeUsesDice('ENDURANCE')).toBe(false);
    });

    test('should return false for unknown attributes', () => {
      expect(attributeUsesDice('UNKNOWN_ATTRIBUTE')).toBe(false);
      expect(attributeUsesDice(null)).toBe(false);
      expect(attributeUsesDice(undefined)).toBe(false);
    });
  });

  describe('getDiceRange', () => {
    test('should return correct ranges for different dice types', () => {
      expect(getDiceRange('d4')).toEqual({ min: 1, max: 4 });
      expect(getDiceRange('d6')).toEqual({ min: 1, max: 6 });
      expect(getDiceRange('d8')).toEqual({ min: 1, max: 8 });
      expect(getDiceRange('d10')).toEqual({ min: 1, max: 10 });
      expect(getDiceRange('d12')).toEqual({ min: 1, max: 12 });
      expect(getDiceRange('d20')).toEqual({ min: 1, max: 20 });
      expect(getDiceRange('d100')).toEqual({ min: 1, max: 100 });
    });

    test('should handle edge cases', () => {
      expect(getDiceRange(null)).toEqual({ min: 0, max: 0 });
      expect(getDiceRange(undefined)).toEqual({ min: 0, max: 0 });
      expect(getDiceRange('')).toEqual({ min: 0, max: 0 });
    });

    test('should handle custom dice types', () => {
      expect(getDiceRange('d3')).toEqual({ min: 1, max: 3 });
      expect(getDiceRange('d30')).toEqual({ min: 1, max: 30 });
    });
  });

  describe('calculateAttributeModifier', () => {
    test('should return attribute value for static attributes', () => {
      expect(calculateAttributeModifier(10, 3, 'WEIGHT')).toBe(10);
      expect(calculateAttributeModifier(15, 5, 'SIZE')).toBe(15);
      expect(calculateAttributeModifier(7.8, 2, 'ARMOR')).toBe(8); // Should round
    });

    test('should subtract fatigue for dice-based attributes', () => {
      expect(calculateAttributeModifier(10, 3, 'STRENGTH')).toBe(7);
      expect(calculateAttributeModifier(15, 5, 'DEXTERITY')).toBe(10);
      expect(calculateAttributeModifier(8, 2, 'SPEED')).toBe(6);
    });

    test('should not allow negative modifiers for dice-based attributes', () => {
      expect(calculateAttributeModifier(5, 10, 'STRENGTH')).toBe(0);
      expect(calculateAttributeModifier(3, 8, 'DEXTERITY')).toBe(0);
      expect(calculateAttributeModifier(0, 5, 'SPEED')).toBe(0);
    });

    test('should handle null/undefined values', () => {
      expect(calculateAttributeModifier(null, 3, 'STRENGTH')).toBe(0);
      expect(calculateAttributeModifier(10, null, 'STRENGTH')).toBe(10);
      expect(calculateAttributeModifier(null, null, 'STRENGTH')).toBe(0);
      expect(calculateAttributeModifier(undefined, undefined, 'WEIGHT')).toBe(0);
    });

    test('should round decimal values', () => {
      expect(calculateAttributeModifier(10.4, 0, 'WEIGHT')).toBe(10);
      expect(calculateAttributeModifier(10.5, 0, 'WEIGHT')).toBe(11);
      expect(calculateAttributeModifier(10.7, 2.3, 'STRENGTH')).toBe(8); // 10.7 - 2.3 = 8.4, rounded down
      expect(calculateAttributeModifier(10.7, 2.2, 'STRENGTH')).toBe(9); // 10.7 - 2.2 = 8.5, rounded up
    });
  });

  describe('formatDiceRoll', () => {
    test('should format dice-based attributes correctly', () => {
      expect(formatDiceRoll('STRENGTH', 5)).toBe('1d8+5');
      expect(formatDiceRoll('DEXTERITY', 3)).toBe('1d6+3');
      expect(formatDiceRoll('SPEED', 0)).toBe('1d4+0');
      expect(formatDiceRoll('CHARISMA', 10)).toBe('1d100+10');
    });

    test('should format static attributes correctly', () => {
      expect(formatDiceRoll('WEIGHT', 10)).toBe('Static: 10');
      expect(formatDiceRoll('SIZE', 5)).toBe('Static: 5');
      expect(formatDiceRoll('ARMOR', 0)).toBe('Static: 0');
    });

    test('should handle unknown attributes as static', () => {
      expect(formatDiceRoll('UNKNOWN', 7)).toBe('Static: 7');
      expect(formatDiceRoll(null, 5)).toBe('Static: 5');
    });
  });

  describe('getAttributeRange', () => {
    test('should return correct ranges for dice-based attributes', () => {
      expect(getAttributeRange('STRENGTH', 5)).toEqual({ min: 6, max: 13 }); // 1d8+5 = 1+5 to 8+5
      expect(getAttributeRange('DEXTERITY', 3)).toEqual({ min: 4, max: 9 }); // 1d6+3 = 1+3 to 6+3
      expect(getAttributeRange('SPEED', 0)).toEqual({ min: 1, max: 4 }); // 1d4+0 = 1+0 to 4+0
      expect(getAttributeRange('CHARISMA', 10)).toEqual({ min: 11, max: 110 }); // 1d100+10
    });

    test('should return same min/max for static attributes', () => {
      expect(getAttributeRange('WEIGHT', 10)).toEqual({ min: 10, max: 10 });
      expect(getAttributeRange('SIZE', 5)).toEqual({ min: 5, max: 5 });
      expect(getAttributeRange('ARMOR', 0)).toEqual({ min: 0, max: 0 });
    });

    test('should handle unknown attributes as static', () => {
      expect(getAttributeRange('UNKNOWN', 7)).toEqual({ min: 7, max: 7 });
      expect(getAttributeRange(null, 5)).toEqual({ min: 5, max: 5 });
    });

    test('should handle negative modifiers correctly', () => {
      expect(getAttributeRange('STRENGTH', -2)).toEqual({ min: -1, max: 6 }); // 1d8-2 = 1-2 to 8-2
      expect(getAttributeRange('WEIGHT', -5)).toEqual({ min: -5, max: -5 }); // Static -5
    });
  });
});