import {
  ATTRIBUTE_DICE_MAP,
  getDiceForAttribute,
  attributeUsesDice,
  getDiceRange,
  calculateAttributeModifier,
  formatDiceRoll,
  getAttributeRange
} from '../../utils/diceMapping';

describe('diceMapping utility', () => {
  describe('ATTRIBUTE_DICE_MAP', () => {
    test('contains expected static attributes', () => {
      expect(ATTRIBUTE_DICE_MAP.WEIGHT).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.SIZE).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.LETHALITY).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.ARMOUR).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.ARMOR).toBeNull(); // Alternative spelling
      expect(ATTRIBUTE_DICE_MAP.ENDURANCE).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.PERCEPTION).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.INTENSITY).toBeNull();
      expect(ATTRIBUTE_DICE_MAP.MORALE).toBeNull();
    });

    test('contains expected dice-based attributes', () => {
      expect(ATTRIBUTE_DICE_MAP.SPEED).toBe('d4');
      expect(ATTRIBUTE_DICE_MAP.STRENGTH).toBe('d8');
      expect(ATTRIBUTE_DICE_MAP.DEXTERITY).toBe('d6');
      expect(ATTRIBUTE_DICE_MAP.AGILITY).toBe('d10');
      expect(ATTRIBUTE_DICE_MAP.CHARISMA).toBe('d100');
      expect(ATTRIBUTE_DICE_MAP.INTELLIGENCE).toBe('d20');
      expect(ATTRIBUTE_DICE_MAP.RESOLVE).toBe('d12');
    });
  });

  describe('getDiceForAttribute', () => {
    test('returns dice type for dice-based attributes', () => {
      expect(getDiceForAttribute('SPEED')).toBe('d4');
      expect(getDiceForAttribute('STRENGTH')).toBe('d8');
      expect(getDiceForAttribute('DEXTERITY')).toBe('d6');
      expect(getDiceForAttribute('AGILITY')).toBe('d10');
      expect(getDiceForAttribute('CHARISMA')).toBe('d100');
      expect(getDiceForAttribute('INTELLIGENCE')).toBe('d20');
      expect(getDiceForAttribute('RESOLVE')).toBe('d12');
    });

    test('returns null for static attributes', () => {
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

    test('handles case insensitive input', () => {
      expect(getDiceForAttribute('speed')).toBe('d4');
      expect(getDiceForAttribute('Speed')).toBe('d4');
      expect(getDiceForAttribute('SPEED')).toBe('d4');
      expect(getDiceForAttribute('sPeEd')).toBe('d4');
      
      expect(getDiceForAttribute('weight')).toBeNull();
      expect(getDiceForAttribute('Weight')).toBeNull();
      expect(getDiceForAttribute('WEIGHT')).toBeNull();
    });

    test('returns null for unknown attributes', () => {
      expect(getDiceForAttribute('UNKNOWN')).toBeNull();
      expect(getDiceForAttribute('FOO')).toBeNull();
      expect(getDiceForAttribute('BAR')).toBeNull();
    });

    test('handles null/undefined input', () => {
      expect(getDiceForAttribute(null)).toBeNull();
      expect(getDiceForAttribute(undefined)).toBeNull();
      expect(getDiceForAttribute('')).toBeNull();
    });
  });

  describe('attributeUsesDice', () => {
    test('returns true for dice-based attributes', () => {
      expect(attributeUsesDice('SPEED')).toBe(true);
      expect(attributeUsesDice('STRENGTH')).toBe(true);
      expect(attributeUsesDice('DEXTERITY')).toBe(true);
      expect(attributeUsesDice('AGILITY')).toBe(true);
      expect(attributeUsesDice('CHARISMA')).toBe(true);
      expect(attributeUsesDice('INTELLIGENCE')).toBe(true);
      expect(attributeUsesDice('RESOLVE')).toBe(true);
    });

    test('returns false for static attributes', () => {
      expect(attributeUsesDice('WEIGHT')).toBe(false);
      expect(attributeUsesDice('SIZE')).toBe(false);
      expect(attributeUsesDice('LETHALITY')).toBe(false);
      expect(attributeUsesDice('ARMOUR')).toBe(false);
      expect(attributeUsesDice('ARMOR')).toBe(false);
      expect(attributeUsesDice('ENDURANCE')).toBe(false);
      expect(attributeUsesDice('PERCEPTION')).toBe(false);
      expect(attributeUsesDice('INTENSITY')).toBe(false);
      expect(attributeUsesDice('MORALE')).toBe(false);
    });

    test('returns false for unknown attributes', () => {
      expect(attributeUsesDice('UNKNOWN')).toBe(false);
      expect(attributeUsesDice('FOO')).toBe(false);
      expect(attributeUsesDice(null)).toBe(false);
      expect(attributeUsesDice(undefined)).toBe(false);
      expect(attributeUsesDice('')).toBe(false);
    });
  });

  describe('getDiceRange', () => {
    test('returns correct range for standard dice', () => {
      expect(getDiceRange('d4')).toEqual({ min: 1, max: 4 });
      expect(getDiceRange('d6')).toEqual({ min: 1, max: 6 });
      expect(getDiceRange('d8')).toEqual({ min: 1, max: 8 });
      expect(getDiceRange('d10')).toEqual({ min: 1, max: 10 });
      expect(getDiceRange('d12')).toEqual({ min: 1, max: 12 });
      expect(getDiceRange('d20')).toEqual({ min: 1, max: 20 });
      expect(getDiceRange('d100')).toEqual({ min: 1, max: 100 });
    });

    test('returns zero range for null/undefined input', () => {
      expect(getDiceRange(null)).toEqual({ min: 0, max: 0 });
      expect(getDiceRange(undefined)).toEqual({ min: 0, max: 0 });
      expect(getDiceRange('')).toEqual({ min: 0, max: 0 });
    });

    test('handles unusual dice types', () => {
      expect(getDiceRange('d2')).toEqual({ min: 1, max: 2 });
      expect(getDiceRange('d3')).toEqual({ min: 1, max: 3 });
      expect(getDiceRange('d30')).toEqual({ min: 1, max: 30 });
    });
  });

  describe('calculateAttributeModifier', () => {
    test('no longer applies fatigue to dice-based attributes', () => {
      expect(calculateAttributeModifier(10, 2, 'STRENGTH')).toBe(10);
      expect(calculateAttributeModifier(15, 5, 'SPEED')).toBe(15);
      expect(calculateAttributeModifier(8, 3, 'DEXTERITY')).toBe(8);
    });

    test('does not apply fatigue to static attributes', () => {
      expect(calculateAttributeModifier(10, 2, 'WEIGHT')).toBe(10);
      expect(calculateAttributeModifier(15, 5, 'SIZE')).toBe(15);
      expect(calculateAttributeModifier(8, 3, 'ARMOUR')).toBe(8);
    });

    test('fatigue parameter is ignored', () => {
      expect(calculateAttributeModifier(5, 10, 'STRENGTH')).toBe(5);
      expect(calculateAttributeModifier(3, 8, 'SPEED')).toBe(3);
      expect(calculateAttributeModifier(0, 5, 'DEXTERITY')).toBe(0);
    });

    test('handles null/undefined values', () => {
      expect(calculateAttributeModifier(null, 2, 'STRENGTH')).toBe(0);
      expect(calculateAttributeModifier(10, null, 'STRENGTH')).toBe(10);
      expect(calculateAttributeModifier(null, null, 'STRENGTH')).toBe(0);
      
      expect(calculateAttributeModifier(null, 2, 'WEIGHT')).toBe(0);
      expect(calculateAttributeModifier(10, null, 'WEIGHT')).toBe(10);
    });

    test('rounds decimal values', () => {
      expect(calculateAttributeModifier(10.4, 0, 'STRENGTH')).toBe(10);
      expect(calculateAttributeModifier(10.5, 0, 'STRENGTH')).toBe(11);
      expect(calculateAttributeModifier(10.9, 0, 'STRENGTH')).toBe(11);
      
      expect(calculateAttributeModifier(10.4, 0, 'WEIGHT')).toBe(10);
      expect(calculateAttributeModifier(10.5, 0, 'WEIGHT')).toBe(11);
      expect(calculateAttributeModifier(10.9, 0, 'WEIGHT')).toBe(11);
    });

    test('handles edge case with fatigue parameter', () => {
      expect(calculateAttributeModifier(5, 5, 'STRENGTH')).toBe(5); // Fatigue ignored
      expect(calculateAttributeModifier(5, 5, 'WEIGHT')).toBe(5); // Static attribute
    });
  });

  describe('formatDiceRoll', () => {
    test('formats dice-based attributes correctly', () => {
      expect(formatDiceRoll('SPEED', 5)).toBe('1d4+5');
      expect(formatDiceRoll('STRENGTH', 8)).toBe('1d8+8');
      expect(formatDiceRoll('DEXTERITY', 3)).toBe('1d6+3');
      expect(formatDiceRoll('AGILITY', 12)).toBe('1d10+12');
      expect(formatDiceRoll('CHARISMA', 0)).toBe('1d100+0');
      expect(formatDiceRoll('INTELLIGENCE', 15)).toBe('1d20+15');
      expect(formatDiceRoll('RESOLVE', 7)).toBe('1d12+7');
    });

    test('formats static attributes correctly', () => {
      expect(formatDiceRoll('WEIGHT', 10)).toBe('Static: 10');
      expect(formatDiceRoll('SIZE', 5)).toBe('Static: 5');
      expect(formatDiceRoll('LETHALITY', 0)).toBe('Static: 0');
      expect(formatDiceRoll('ARMOUR', 15)).toBe('Static: 15');
      expect(formatDiceRoll('ARMOR', 8)).toBe('Static: 8');
    });

    test('handles unknown attributes as static', () => {
      expect(formatDiceRoll('UNKNOWN', 10)).toBe('Static: 10');
      expect(formatDiceRoll('FOO', 5)).toBe('Static: 5');
    });

    test('handles negative modifiers', () => {
      expect(formatDiceRoll('STRENGTH', -2)).toBe('1d8+-2');
      expect(formatDiceRoll('WEIGHT', -5)).toBe('Static: -5');
    });
  });

  describe('getAttributeRange', () => {
    test('calculates range for dice-based attributes', () => {
      expect(getAttributeRange('SPEED', 5)).toEqual({ min: 6, max: 9 }); // d4: 1-4, +5 = 6-9
      expect(getAttributeRange('STRENGTH', 3)).toEqual({ min: 4, max: 11 }); // d8: 1-8, +3 = 4-11
      expect(getAttributeRange('DEXTERITY', 0)).toEqual({ min: 1, max: 6 }); // d6: 1-6, +0 = 1-6
      expect(getAttributeRange('AGILITY', 10)).toEqual({ min: 11, max: 20 }); // d10: 1-10, +10 = 11-20
      expect(getAttributeRange('CHARISMA', 2)).toEqual({ min: 3, max: 102 }); // d100: 1-100, +2 = 3-102
      expect(getAttributeRange('INTELLIGENCE', 8)).toEqual({ min: 9, max: 28 }); // d20: 1-20, +8 = 9-28
      expect(getAttributeRange('RESOLVE', 4)).toEqual({ min: 5, max: 16 }); // d12: 1-12, +4 = 5-16
    });

    test('returns static value for static attributes', () => {
      expect(getAttributeRange('WEIGHT', 10)).toEqual({ min: 10, max: 10 });
      expect(getAttributeRange('SIZE', 5)).toEqual({ min: 5, max: 5 });
      expect(getAttributeRange('LETHALITY', 0)).toEqual({ min: 0, max: 0 });
      expect(getAttributeRange('ARMOUR', 15)).toEqual({ min: 15, max: 15 });
    });

    test('handles unknown attributes as static', () => {
      expect(getAttributeRange('UNKNOWN', 7)).toEqual({ min: 7, max: 7 });
      expect(getAttributeRange('FOO', 12)).toEqual({ min: 12, max: 12 });
    });

    test('handles negative modifiers', () => {
      expect(getAttributeRange('STRENGTH', -2)).toEqual({ min: -1, max: 6 }); // d8: 1-8, -2 = -1-6
      expect(getAttributeRange('WEIGHT', -5)).toEqual({ min: -5, max: -5 });
    });

    test('handles zero modifier', () => {
      expect(getAttributeRange('SPEED', 0)).toEqual({ min: 1, max: 4 });
      expect(getAttributeRange('WEIGHT', 0)).toEqual({ min: 0, max: 0 });
    });
  });
});