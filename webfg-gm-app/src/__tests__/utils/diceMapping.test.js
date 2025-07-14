import { 
  getDiceFromValue, 
  getValueFromDice, 
  parseDiceString, 
  formatDiceString,
  validateDiceString 
} from '../../utils/diceMapping';

describe('diceMapping utils', () => {
  describe('getDiceFromValue', () => {
    test('converts basic values to dice', () => {
      expect(getDiceFromValue(10)).toEqual({ dice: '2d6', modifier: -2 });
      expect(getDiceFromValue(12)).toEqual({ dice: '2d6', modifier: 0 });
      expect(getDiceFromValue(14)).toEqual({ dice: '2d6', modifier: 2 });
    });

    test('handles edge cases', () => {
      expect(getDiceFromValue(6)).toEqual({ dice: '1d6', modifier: 0 });
      expect(getDiceFromValue(18)).toEqual({ dice: '3d6', modifier: 0 });
    });

    test('handles invalid values', () => {
      expect(getDiceFromValue(0)).toEqual({ dice: '1d6', modifier: -6 });
      expect(getDiceFromValue(-5)).toEqual({ dice: '1d6', modifier: -11 });
    });
  });

  describe('getValueFromDice', () => {
    test('converts dice to values', () => {
      expect(getValueFromDice('2d6', 0)).toBe(12);
      expect(getValueFromDice('2d6', 2)).toBe(14);
      expect(getValueFromDice('2d6', -2)).toBe(10);
    });

    test('handles different dice types', () => {
      expect(getValueFromDice('1d6', 0)).toBe(6);
      expect(getValueFromDice('3d6', 0)).toBe(18);
      expect(getValueFromDice('4d6', 0)).toBe(24);
    });

    test('handles modifiers', () => {
      expect(getValueFromDice('2d6', 5)).toBe(17);
      expect(getValueFromDice('2d6', -5)).toBe(7);
    });
  });

  describe('parseDiceString', () => {
    test('parses standard dice strings', () => {
      expect(parseDiceString('2d6+2')).toEqual({ dice: '2d6', modifier: 2 });
      expect(parseDiceString('3d6-1')).toEqual({ dice: '3d6', modifier: -1 });
      expect(parseDiceString('1d6')).toEqual({ dice: '1d6', modifier: 0 });
    });

    test('handles whitespace', () => {
      expect(parseDiceString(' 2d6 + 2 ')).toEqual({ dice: '2d6', modifier: 2 });
      expect(parseDiceString('3d6 - 1')).toEqual({ dice: '3d6', modifier: -1 });
    });

    test('handles invalid strings', () => {
      expect(parseDiceString('invalid')).toEqual({ dice: '1d6', modifier: 0 });
      expect(parseDiceString('')).toEqual({ dice: '1d6', modifier: 0 });
      expect(parseDiceString(null)).toEqual({ dice: '1d6', modifier: 0 });
    });
  });

  describe('formatDiceString', () => {
    test('formats dice with positive modifiers', () => {
      expect(formatDiceString('2d6', 2)).toBe('2d6+2');
      expect(formatDiceString('3d6', 5)).toBe('3d6+5');
    });

    test('formats dice with negative modifiers', () => {
      expect(formatDiceString('2d6', -2)).toBe('2d6-2');
      expect(formatDiceString('3d6', -5)).toBe('3d6-5');
    });

    test('formats dice with no modifier', () => {
      expect(formatDiceString('2d6', 0)).toBe('2d6');
      expect(formatDiceString('1d6', 0)).toBe('1d6');
    });

    test('handles edge cases', () => {
      expect(formatDiceString('', 0)).toBe('');
      expect(formatDiceString('2d6', null)).toBe('2d6');
      expect(formatDiceString('2d6', undefined)).toBe('2d6');
    });
  });

  describe('validateDiceString', () => {
    test('validates correct dice strings', () => {
      expect(validateDiceString('2d6')).toBe(true);
      expect(validateDiceString('3d6+2')).toBe(true);
      expect(validateDiceString('1d6-1')).toBe(true);
      expect(validateDiceString('4d6+10')).toBe(true);
    });

    test('rejects invalid dice strings', () => {
      expect(validateDiceString('invalid')).toBe(false);
      expect(validateDiceString('2x6')).toBe(false);
      expect(validateDiceString('d6')).toBe(false);
      expect(validateDiceString('2d')).toBe(false);
      expect(validateDiceString('')).toBe(false);
      expect(validateDiceString(null)).toBe(false);
      expect(validateDiceString(undefined)).toBe(false);
    });

    test('handles edge cases', () => {
      expect(validateDiceString('0d6')).toBe(false);
      expect(validateDiceString('2d0')).toBe(false);
      expect(validateDiceString('2d6+')).toBe(false);
      expect(validateDiceString('2d6-')).toBe(false);
    });
  });
});