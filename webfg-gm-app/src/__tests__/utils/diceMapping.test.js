import { 
  ATTRIBUTE_DICE_MAP,
  getDiceForAttribute,
  attributeUsesDice,
  getDiceRange,
  calculateAttributeModifier,
  formatDiceRoll,
  getAttributeRange
} from '../../utils/diceMapping';

describe('diceMapping utils', () => {
  describe('ATTRIBUTE_DICE_MAP', () => {
    test('contains expected static attributes', () => {
      expect(ATTRIBUTE_DICE_MAP.WEIGHT).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.SIZE).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.LETHALITY).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.ARMOUR).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.ARMOR).toBeNull();
    });

    test('contains expected dice-based attributes', () => {
      expect(ATTRIBUTE_DICE_MAP.SPEED).toBe('d4');
      expect(ATTRIBUTE_DICE_MAP.STRENGTH).toBe('d8');
      expect(ATTRIBUTE_DICE_MAP.DEXTERITY).toBe('d6');
      expect(ATTRIBUTE_DICE_MAP.AGILITY).toBe('d10');
      expect(ATTRIBUTE_DICE_MAP.CHARISMA).toBe('d100');
    });
  });

  describe('getDiceForAttribute', () => {
    test('returns correct dice for dice-based attributes', () => {
      expect(getDiceForAttribute('STRENGTH')).toBe('d8');
      expect(getDiceForAttribute('strength')).toBe('d8');
      expect(getDiceForAttribute('DEXTERITY')).toBe('d6');
      expect(getDiceForAttribute('SPEED')).toBe('d4');
    });

    test('returns null for static attributes', () => {
      expect(getDiceForAttribute('WEIGHT')).toBeNull();
      expect(getDiceForAttribute('SIZE')).toBeNull();
      expect(getDiceForAttribute('ARMOUR')).toBeNull();
    });

    test('handles invalid attributes', () => {
      expect(getDiceForAttribute('INVALID')).toBeNull();
      expect(getDiceForAttribute('')).toBeNull();
      expect(getDiceForAttribute(null)).toBeNull();
    });
  });

  describe('attributeUsesDice', () => {
    test('returns true for dice-based attributes', () => {
      expect(attributeUsesDice('STRENGTH')).toBe(true);
      expect(attributeUsesDice('DEXTERITY')).toBe(true);
      expect(attributeUsesDice('AGILITY')).toBe(true);
    });

    test('returns false for static attributes', () => {
      expect(attributeUsesDice('WEIGHT')).toBe(false);
      expect(attributeUsesDice('SIZE')).toBe(false);
      expect(attributeUsesDice('ARMOUR')).toBe(false);
    });

    test('returns false for invalid attributes', () => {
      expect(attributeUsesDice('INVALID')).toBe(false);
      expect(attributeUsesDice('')).toBe(false);
      expect(attributeUsesDice(null)).toBe(false);
    });
  });

  describe('getDiceRange', () => {
    test('returns correct ranges for dice types', () => {
      expect(getDiceRange('d4')).toEqual({ min: 1, max: 4 });
      expect(getDiceRange('d6')).toEqual({ min: 1, max: 6 });
      expect(getDiceRange('d8')).toEqual({ min: 1, max: 8 });
      expect(getDiceRange('d10')).toEqual({ min: 1, max: 10 });
      expect(getDiceRange('d20')).toEqual({ min: 1, max: 20 });
      expect(getDiceRange('d100')).toEqual({ min: 1, max: 100 });
    });

    test('handles invalid dice types', () => {
      expect(getDiceRange('')).toEqual({ min: 0, max: 0 });
      expect(getDiceRange(null)).toEqual({ min: 0, max: 0 });
      expect(getDiceRange(undefined)).toEqual({ min: 0, max: 0 });
    });
  });

  describe('calculateAttributeModifier', () => {
    test('applies fatigue to dice-based attributes', () => {
      expect(calculateAttributeModifier(10, 2, 'STRENGTH')).toBe(8);
      expect(calculateAttributeModifier(15, 3, 'DEXTERITY')).toBe(12);
      expect(calculateAttributeModifier(8, 1, 'SPEED')).toBe(7);
    });

    test('does not apply fatigue to static attributes', () => {
      expect(calculateAttributeModifier(10, 2, 'WEIGHT')).toBe(10);
      expect(calculateAttributeModifier(15, 3, 'SIZE')).toBe(15);
      expect(calculateAttributeModifier(8, 1, 'ARMOUR')).toBe(8);
    });

    test('prevents negative modifiers', () => {
      expect(calculateAttributeModifier(2, 5, 'STRENGTH')).toBe(0);
      expect(calculateAttributeModifier(0, 1, 'DEXTERITY')).toBe(0);
    });

    test('rounds values correctly', () => {
      expect(calculateAttributeModifier(10.4, 0, 'STRENGTH')).toBe(10);
      expect(calculateAttributeModifier(10.5, 0, 'STRENGTH')).toBe(11);
      expect(calculateAttributeModifier(10.9, 0, 'STRENGTH')).toBe(11);
    });
  });

  describe('formatDiceRoll', () => {
    test('formats dice-based attributes', () => {
      expect(formatDiceRoll('STRENGTH', 5)).toBe('1d8+5');
      expect(formatDiceRoll('DEXTERITY', 10)).toBe('1d6+10');
      expect(formatDiceRoll('SPEED', 2)).toBe('1d4+2');
    });

    test('formats static attributes', () => {
      expect(formatDiceRoll('WEIGHT', 10)).toBe('Static: 10');
      expect(formatDiceRoll('SIZE', 15)).toBe('Static: 15');
      expect(formatDiceRoll('ARMOUR', 5)).toBe('Static: 5');
    });

    test('handles invalid attributes', () => {
      expect(formatDiceRoll('INVALID', 5)).toBe('Static: 5');
      expect(formatDiceRoll('', 10)).toBe('Static: 10');
    });
  });

  describe('getAttributeRange', () => {
    test('calculates ranges for dice-based attributes', () => {
      expect(getAttributeRange('STRENGTH', 5)).toEqual({ min: 6, max: 13 }); // 1d8+5
      expect(getAttributeRange('DEXTERITY', 3)).toEqual({ min: 4, max: 9 }); // 1d6+3
      expect(getAttributeRange('SPEED', 2)).toEqual({ min: 3, max: 6 }); // 1d4+2
    });

    test('returns same value for static attributes', () => {
      expect(getAttributeRange('WEIGHT', 10)).toEqual({ min: 10, max: 10 });
      expect(getAttributeRange('SIZE', 15)).toEqual({ min: 15, max: 15 });
      expect(getAttributeRange('ARMOUR', 5)).toEqual({ min: 5, max: 5 });
    });

    test('handles invalid attributes as static', () => {
      expect(getAttributeRange('INVALID', 8)).toEqual({ min: 8, max: 8 });
      expect(getAttributeRange('', 12)).toEqual({ min: 12, max: 12 });
    });
  });
});