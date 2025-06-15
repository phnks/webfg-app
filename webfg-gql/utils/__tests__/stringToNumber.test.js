const { describe, it, expect } = require('@jest/globals');

// Import the utility function
const stringToNumber = require('../stringToNumber');

describe('stringToNumber utility function', () => {
  
  describe('valid number conversions', () => {
    it('should convert integer strings to numbers', () => {
      expect(stringToNumber('123')).toBe(123);
      expect(stringToNumber('0')).toBe(0);
      expect(stringToNumber('-456')).toBe(-456);
    });

    it('should convert decimal strings to numbers', () => {
      expect(stringToNumber('123.45')).toBe(123.45);
      expect(stringToNumber('0.5')).toBe(0.5);
      expect(stringToNumber('-67.89')).toBe(-67.89);
    });

    it('should handle numbers that are already numbers', () => {
      expect(stringToNumber(123)).toBe(123);
      expect(stringToNumber(123.45)).toBe(123.45);
      expect(stringToNumber(0)).toBe(0);
      expect(stringToNumber(-456)).toBe(-456);
    });

    it('should handle strings with leading/trailing whitespace', () => {
      expect(stringToNumber('  123  ')).toBe(123);
      expect(stringToNumber('\t456\n')).toBe(456);
      expect(stringToNumber(' -789.12 ')).toBe(-789.12);
    });

    it('should handle scientific notation', () => {
      expect(stringToNumber('1e3')).toBe(1000);
      expect(stringToNumber('1.23e2')).toBe(123);
      expect(stringToNumber('5e-2')).toBe(0.05);
    });

    it('should handle very large numbers', () => {
      expect(stringToNumber('9999999999999999')).toBe(9999999999999999);
      expect(stringToNumber('1.7976931348623157e+308')).toBe(1.7976931348623157e+308);
    });

    it('should handle very small numbers', () => {
      expect(stringToNumber('0.0000000001')).toBe(0.0000000001);
      expect(stringToNumber('5e-324')).toBe(5e-324);
    });
  });

  describe('invalid input handling', () => {
    it('should return default value for invalid strings', () => {
      expect(stringToNumber('abc')).toBe(0);
      expect(stringToNumber('123abc')).toBe(0);
      expect(stringToNumber('abc123')).toBe(0);
      expect(stringToNumber('12.34.56')).toBe(0);
    });

    it('should return default value for empty strings', () => {
      expect(stringToNumber('')).toBe(0);
      expect(stringToNumber('   ')).toBe(0);
      expect(stringToNumber('\t\n')).toBe(0);
    });

    it('should return default value for null and undefined', () => {
      expect(stringToNumber(null)).toBe(0);
      expect(stringToNumber(undefined)).toBe(0);
    });

    it('should return default value for boolean values', () => {
      expect(stringToNumber(true)).toBe(0);
      expect(stringToNumber(false)).toBe(0);
    });

    it('should return default value for objects', () => {
      expect(stringToNumber({})).toBe(0);
      expect(stringToNumber([])).toBe(0);
      expect(stringToNumber({ value: 123 })).toBe(0);
    });
  });

  describe('custom default values', () => {
    it('should use custom default value for invalid input', () => {
      expect(stringToNumber('abc', 42)).toBe(42);
      expect(stringToNumber('', -1)).toBe(-1);
      expect(stringToNumber(null, 999)).toBe(999);
    });

    it('should use custom default for empty strings', () => {
      expect(stringToNumber('   ', 100)).toBe(100);
      expect(stringToNumber('', 0.5)).toBe(0.5);
    });

    it('should still convert valid numbers even with custom default', () => {
      expect(stringToNumber('123', 999)).toBe(123);
      expect(stringToNumber('45.67', -1)).toBe(45.67);
    });
  });

  describe('edge cases', () => {
    it('should handle Infinity', () => {
      expect(stringToNumber('Infinity')).toBe(Infinity);
      expect(stringToNumber('-Infinity')).toBe(-Infinity);
      expect(stringToNumber(Infinity)).toBe(Infinity);
    });

    it('should handle NaN input', () => {
      expect(stringToNumber(NaN)).toBe(0);
      expect(stringToNumber('NaN')).toBe(0);
    });

    it('should handle very long number strings', () => {
      const longNumber = '1' + '0'.repeat(300);
      const result = stringToNumber(longNumber);
      expect(result).toBe(Infinity);
    });

    it('should handle numbers with plus sign', () => {
      expect(stringToNumber('+123')).toBe(123);
      expect(stringToNumber('+45.67')).toBe(45.67);
    });

    it('should handle hex, octal, and binary strings as invalid', () => {
      // These should be treated as invalid since we want strict decimal parsing
      expect(stringToNumber('0x123')).toBe(0);
      expect(stringToNumber('0o777')).toBe(0);
      expect(stringToNumber('0b1010')).toBe(0);
    });
  });

  describe('consistency with game attribute requirements', () => {
    it('should handle typical character attribute values', () => {
      // Test common character attribute ranges
      for (let i = 0; i <= 100; i += 5) {
        expect(stringToNumber(i.toString())).toBe(i);
        expect(stringToNumber(`${i}.0`)).toBe(i);
      }
    });

    it('should handle negative attributes gracefully', () => {
      // Negative attributes might occur with debuffs
      expect(stringToNumber('-5')).toBe(-5);
      expect(stringToNumber('-10.5')).toBe(-10.5);
    });

    it('should handle inventory item attributes', () => {
      // Test object weight, size, etc.
      expect(stringToNumber('0.1')).toBe(0.1);
      expect(stringToNumber('1000')).toBe(1000);
      expect(stringToNumber('0.001')).toBe(0.001);
    });
  });

  describe('performance considerations', () => {
    it('should handle arrays of values efficiently', () => {
      const testValues = ['1', '2', '3', '4', '5', 'invalid', '6', '7'];
      const results = testValues.map(val => stringToNumber(val));
      
      expect(results).toEqual([1, 2, 3, 4, 5, 0, 6, 7]);
    });

    it('should handle repeated calls consistently', () => {
      const testValue = '123.45';
      
      for (let i = 0; i < 100; i++) {
        expect(stringToNumber(testValue)).toBe(123.45);
      }
    });
  });

  describe('type safety', () => {
    it('should always return a number type', () => {
      expect(typeof stringToNumber('123')).toBe('number');
      expect(typeof stringToNumber('abc')).toBe('number');
      expect(typeof stringToNumber(null)).toBe('number');
      expect(typeof stringToNumber(undefined)).toBe('number');
      expect(typeof stringToNumber({})).toBe('number');
    });

    it('should never return NaN for invalid input', () => {
      const invalidInputs = ['abc', '', null, undefined, {}, [], true, false];
      
      invalidInputs.forEach(input => {
        const result = stringToNumber(input);
        expect(Number.isNaN(result)).toBe(false);
      });
    });
  });

  describe('integration with GraphQL scalar types', () => {
    it('should handle GraphQL Int type conversion', () => {
      // GraphQL Int should be 32-bit signed integer
      expect(stringToNumber('2147483647')).toBe(2147483647); // Max Int32
      expect(stringToNumber('-2147483648')).toBe(-2147483648); // Min Int32
    });

    it('should handle GraphQL Float type conversion', () => {
      expect(stringToNumber('3.14159')).toBe(3.14159);
      expect(stringToNumber('1.23e-10')).toBe(1.23e-10);
    });

    it('should handle string inputs from GraphQL variables', () => {
      // GraphQL variables might come as strings
      expect(stringToNumber('42')).toBe(42);
      expect(stringToNumber('3.14')).toBe(3.14);
    });
  });
});