const { describe, it, expect } = require('@jest/globals');

// Import the utility functions
const { toInt, toFloat } = require('../../utils/stringToNumber');

describe('toInt function', () => {
  
  describe('valid number conversions', () => {
    it('should convert integer strings to numbers', () => {
      expect(toInt('123')).toBe(123);
      expect(toInt('0')).toBe(0);
      expect(toInt('-456')).toBe(-456);
    });

    it('should truncate decimal strings to integers', () => {
      expect(toInt('123.45')).toBe(123);
      expect(toInt('0.9')).toBe(0);
      expect(toInt('-67.89')).toBe(-67);
    });

    it('should handle numbers that are already numbers', () => {
      expect(toInt(123)).toBe(123);
      expect(toInt(123.45)).toBe(123);
      expect(toInt(0)).toBe(0);
      expect(toInt(-456)).toBe(-456);
    });

    it('should handle strings with leading/trailing whitespace', () => {
      expect(toInt('  123  ')).toBe(123);
      expect(toInt('\t456\n')).toBe(456);
      expect(toInt(' -789 ')).toBe(-789);
    });
  });

  describe('invalid input handling', () => {
    it('should return default value for invalid strings', () => {
      expect(toInt('abc')).toBe(0);
      expect(toInt('123abc')).toBe(123); // parseInt stops at first invalid char
      expect(toInt('abc123')).toBe(0);
    });

    it('should return default value for empty strings', () => {
      expect(toInt('')).toBe(0);
      expect(toInt('   ')).toBe(0);
    });

    it('should return default value for null and undefined', () => {
      expect(toInt(null)).toBe(0);
      expect(toInt(undefined)).toBe(0);
    });

    it('should use custom default value', () => {
      expect(toInt('abc', 42)).toBe(42);
      expect(toInt('', -1)).toBe(-1);
      expect(toInt(null, 999)).toBe(999);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values', () => {
      expect(toInt('0')).toBe(0);
      expect(toInt(0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(toInt('-5')).toBe(-5);
      expect(toInt(-10)).toBe(-10);
    });

    it('should handle very large numbers', () => {
      expect(toInt('999999999')).toBe(999999999);
    });
  });
});

describe('toFloat function', () => {
  
  describe('valid number conversions', () => {
    it('should convert decimal strings to numbers', () => {
      expect(toFloat('123.45')).toBe(123.45);
      expect(toFloat('0.5')).toBe(0.5);
      expect(toFloat('-67.89')).toBe(-67.89);
    });

    it('should convert integer strings to numbers', () => {
      expect(toFloat('123')).toBe(123);
      expect(toFloat('0')).toBe(0);
      expect(toFloat('-456')).toBe(-456);
    });

    it('should handle numbers that are already numbers', () => {
      expect(toFloat(123.45)).toBe(123.45);
      expect(toFloat(123)).toBe(123);
      expect(toFloat(0)).toBe(0);
      expect(toFloat(-456.78)).toBe(-456.78);
    });

    it('should handle strings with leading/trailing whitespace', () => {
      expect(toFloat('  123.45  ')).toBe(123.45);
      expect(toFloat('\t456.78\n')).toBe(456.78);
      expect(toFloat(' -789.12 ')).toBe(-789.12);
    });

    it('should handle scientific notation', () => {
      expect(toFloat('1e3')).toBe(1000);
      expect(toFloat('1.23e2')).toBe(123);
      expect(toFloat('5e-2')).toBe(0.05);
    });
  });

  describe('invalid input handling', () => {
    it('should return default value for invalid strings', () => {
      expect(toFloat('abc')).toBe(0);
      expect(toFloat('abc123')).toBe(0);
    });

    it('should return default value for empty strings', () => {
      expect(toFloat('')).toBe(0);
      expect(toFloat('   ')).toBe(0);
    });

    it('should return default value for null and undefined', () => {
      expect(toFloat(null)).toBe(0);
      expect(toFloat(undefined)).toBe(0);
    });

    it('should use custom default value', () => {
      expect(toFloat('abc', 42.5)).toBe(42.5);
      expect(toFloat('', -1.1)).toBe(-1.1);
      expect(toFloat(null, 999.99)).toBe(999.99);
    });
  });

  describe('edge cases', () => {
    it('should handle Infinity', () => {
      expect(toFloat('Infinity')).toBe(Infinity);
      expect(toFloat('-Infinity')).toBe(-Infinity);
      expect(toFloat(Infinity)).toBe(Infinity);
    });

    it('should handle very small numbers', () => {
      expect(toFloat('0.0000000001')).toBe(0.0000000001);
      expect(toFloat('5e-10')).toBe(5e-10);
    });

    it('should handle very large numbers', () => {
      expect(toFloat('1.7976931348623157e+100')).toBe(1.7976931348623157e+100);
    });
  });

  describe('game-specific use cases', () => {
    it('should handle typical character attribute values', () => {
      for (let i = 1; i <= 100; i += 5) {
        expect(toFloat(i.toString())).toBe(i);
        expect(toInt(i.toString())).toBe(i);
      }
    });

    it('should handle object attributes like weight and size', () => {
      expect(toFloat('0.1')).toBe(0.1);
      expect(toFloat('1000.5')).toBe(1000.5);
      expect(toFloat('0.001')).toBe(0.001);
    });

    it('should handle negative attributes from debuffs', () => {
      expect(toFloat('-5.5')).toBe(-5.5);
      expect(toInt('-10')).toBe(-10);
    });
  });

  describe('type safety', () => {
    it('should always return a number type', () => {
      expect(typeof toInt('123')).toBe('number');
      expect(typeof toInt('abc')).toBe('number');
      expect(typeof toFloat('123.45')).toBe('number');
      expect(typeof toFloat('abc')).toBe('number');
    });

    it('should never return NaN for invalid input', () => {
      const invalidInputs = ['abc', '', null, undefined, {}, []];
      
      invalidInputs.forEach(input => {
        const intResult = toInt(input);
        const floatResult = toFloat(input);
        expect(Number.isNaN(intResult)).toBe(false);
        expect(Number.isNaN(floatResult)).toBe(false);
      });
    });
  });
});