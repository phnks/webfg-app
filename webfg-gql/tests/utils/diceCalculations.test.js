const { rollSingleDie, rollMultipleDice, rollWithAdvantage, rollWithDisadvantage } = require('../../utils/diceCalculations');

// Mock Math.random to control dice rolls
const mockMath = Object.create(global.Math);
mockMath.random = jest.fn();
global.Math = mockMath;

describe('diceCalculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rollSingleDie', () => {
    test('should roll within valid range', () => {
      Math.random.mockReturnValue(0.5); // Mid-range value
      
      expect(rollSingleDie(6)).toBe(4); // 0.5 * 6 + 1 = 4
      expect(rollSingleDie(20)).toBe(11); // 0.5 * 20 + 1 = 11
      expect(rollSingleDie(100)).toBe(51); // 0.5 * 100 + 1 = 51
    });

    test('should handle edge cases', () => {
      Math.random.mockReturnValue(0); // Minimum value
      expect(rollSingleDie(6)).toBe(1);
      
      Math.random.mockReturnValue(0.999); // Near maximum value
      expect(rollSingleDie(6)).toBe(6);
    });

    test('should handle invalid input', () => {
      expect(rollSingleDie(0)).toBe(0);
      expect(rollSingleDie(-1)).toBe(0);
      expect(rollSingleDie(null)).toBe(0);
      expect(rollSingleDie(undefined)).toBe(0);
    });

    test('should work with d1', () => {
      Math.random.mockReturnValue(0.5);
      expect(rollSingleDie(1)).toBe(1);
    });
  });

  describe('rollMultipleDice', () => {
    test('should roll multiple dice correctly', () => {
      Math.random
        .mockReturnValueOnce(0.5) // First die: 4
        .mockReturnValueOnce(0.1) // Second die: 1  
        .mockReturnValueOnce(0.9); // Third die: 6
      
      expect(rollMultipleDice(3, 6)).toBe(11); // 4 + 1 + 6 = 11
    });

    test('should handle single die', () => {
      Math.random.mockReturnValue(0.5);
      expect(rollMultipleDice(1, 6)).toBe(4);
    });

    test('should handle zero dice', () => {
      expect(rollMultipleDice(0, 6)).toBe(0);
    });

    test('should handle invalid input', () => {
      expect(rollMultipleDice(-1, 6)).toBe(0);
      expect(rollMultipleDice(3, 0)).toBe(0);
      expect(rollMultipleDice(null, 6)).toBe(0);
      expect(rollMultipleDice(3, null)).toBe(0);
    });

    test('should work with large numbers of dice', () => {
      // Mock 10 dice rolls, all returning 0.5 (which gives 4 on d6)
      for (let i = 0; i < 10; i++) {
        Math.random.mockReturnValueOnce(0.5);
      }
      
      expect(rollMultipleDice(10, 6)).toBe(40); // 10 * 4 = 40
    });
  });

  describe('rollWithAdvantage', () => {
    test('should take higher of two rolls', () => {
      Math.random
        .mockReturnValueOnce(0.1) // First roll: 2
        .mockReturnValueOnce(0.9); // Second roll: 6
      
      expect(rollWithAdvantage(6)).toBe(6);
    });

    test('should work with identical rolls', () => {
      Math.random
        .mockReturnValueOnce(0.5) // First roll: 4
        .mockReturnValueOnce(0.5); // Second roll: 4
      
      expect(rollWithAdvantage(6)).toBe(4);
    });

    test('should handle edge cases', () => {
      Math.random
        .mockReturnValueOnce(0) // First roll: 1
        .mockReturnValueOnce(0.999); // Second roll: 6
      
      expect(rollWithAdvantage(6)).toBe(6);
    });

    test('should handle invalid input', () => {
      expect(rollWithAdvantage(0)).toBe(0);
      expect(rollWithAdvantage(-1)).toBe(0);
      expect(rollWithAdvantage(null)).toBe(0);
    });
  });

  describe('rollWithDisadvantage', () => {
    test('should take lower of two rolls', () => {
      Math.random
        .mockReturnValueOnce(0.1) // First roll: 2
        .mockReturnValueOnce(0.9); // Second roll: 6
      
      expect(rollWithDisadvantage(6)).toBe(2);
    });

    test('should work with identical rolls', () => {
      Math.random
        .mockReturnValueOnce(0.5) // First roll: 4
        .mockReturnValueOnce(0.5); // Second roll: 4
      
      expect(rollWithDisadvantage(6)).toBe(4);
    });

    test('should handle edge cases', () => {
      Math.random
        .mockReturnValueOnce(0) // First roll: 1
        .mockReturnValueOnce(0.999); // Second roll: 6
      
      expect(rollWithDisadvantage(6)).toBe(1);
    });

    test('should handle invalid input', () => {
      expect(rollWithDisadvantage(0)).toBe(0);
      expect(rollWithDisadvantage(-1)).toBe(0);
      expect(rollWithDisadvantage(null)).toBe(0);
    });
  });

  describe('integration tests', () => {
    test('should work with different die types', () => {
      Math.random.mockReturnValue(0.5);
      
      expect(rollSingleDie(4)).toBe(3);   // d4
      expect(rollSingleDie(6)).toBe(4);   // d6
      expect(rollSingleDie(8)).toBe(5);   // d8
      expect(rollSingleDie(10)).toBe(6);  // d10
      expect(rollSingleDie(12)).toBe(7);  // d12
      expect(rollSingleDie(20)).toBe(11); // d20
      expect(rollSingleDie(100)).toBe(51); // d100
    });

    test('should produce consistent results with same random values', () => {
      Math.random.mockReturnValue(0.25);
      
      const single = rollSingleDie(6);
      const multiple = rollMultipleDice(1, 6);
      
      expect(single).toBe(multiple);
    });
  });

  describe('statistical properties', () => {
    test('should never exceed die maximum', () => {
      // Test with maximum possible random value
      Math.random.mockReturnValue(0.999999);
      
      expect(rollSingleDie(6)).toBeLessThanOrEqual(6);
      expect(rollSingleDie(20)).toBeLessThanOrEqual(20);
      expect(rollSingleDie(100)).toBeLessThanOrEqual(100);
    });

    test('should never be less than 1 for valid dice', () => {
      // Test with minimum possible random value
      Math.random.mockReturnValue(0);
      
      expect(rollSingleDie(6)).toBeGreaterThanOrEqual(1);
      expect(rollSingleDie(20)).toBeGreaterThanOrEqual(1);
      expect(rollSingleDie(100)).toBeGreaterThanOrEqual(1);
    });

    test('should produce integer results', () => {
      Math.random.mockReturnValue(0.333333);
      
      const result = rollSingleDie(6);
      expect(Number.isInteger(result)).toBe(true);
    });
  });
});