const { 
  calculateExpectedSuccesses,
  adjustDicePools,
  calculateActionDifficulty
} = require('../../utils/actionCalculations');

// Mock external dependencies
jest.mock('../../utils/attributeGrouping', () => ({
  calculateGroupedAttributes: jest.fn(),
  calculateReadyGroupedAttributes: jest.fn(),
  calculateObjectGroupedAttributes: jest.fn(),
  calculateGroupingFormula: jest.fn(),
  calculateGroupedAttributesWithSelectedReady: jest.fn()
}));

jest.mock('../../utils/diceCalculations', () => ({
  attributeUsesDice: jest.fn(),
  calculateAttributeModifier: jest.fn(),
  getAttributeRange: jest.fn(),
  calculateDiceSuccessProbability: jest.fn(),
  formatDiceRoll: jest.fn(),
  analyzeSuccessRanges: jest.fn(),
  calculateSubtractSuccessProbability: jest.fn(),
  analyzeSubtractSuccessRanges: jest.fn(),
  calculateDeltaSuccessProbability: jest.fn(),
  analyzeDeltaSuccessRanges: jest.fn()
}));

describe('actionCalculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateExpectedSuccesses', () => {
    test('should calculate expected successes for dice pool', () => {
      expect(calculateExpectedSuccesses(2)).toBe(1); // 2 * 0.5 = 1
      expect(calculateExpectedSuccesses(4)).toBe(2); // 4 * 0.5 = 2
      expect(calculateExpectedSuccesses(10)).toBe(5); // 10 * 0.5 = 5
    });

    test('should handle zero dice', () => {
      expect(calculateExpectedSuccesses(0)).toBe(0);
    });

    test('should handle single die', () => {
      expect(calculateExpectedSuccesses(1)).toBe(0.5);
    });

    test('should handle large dice pools', () => {
      expect(calculateExpectedSuccesses(20)).toBe(10);
      expect(calculateExpectedSuccesses(100)).toBe(50);
    });
  });

  describe('adjustDicePools', () => {
    test('should not adjust pools when total is 20 or less', () => {
      expect(adjustDicePools(10, 10)).toEqual({ adjustedSource: 10, adjustedTarget: 10 });
      expect(adjustDicePools(5, 15)).toEqual({ adjustedSource: 5, adjustedTarget: 15 });
      expect(adjustDicePools(0, 20)).toEqual({ adjustedSource: 0, adjustedTarget: 20 });
    });

    test('should halve pools when total exceeds 20', () => {
      expect(adjustDicePools(15, 15)).toEqual({ adjustedSource: 8, adjustedTarget: 8 }); // 15/2 = 7.5 → 8
      expect(adjustDicePools(12, 10)).toEqual({ adjustedSource: 6, adjustedTarget: 5 }); // 12/2=6, 10/2=5
    });

    test('should handle multiple halving rounds', () => {
      expect(adjustDicePools(50, 50)).toEqual({ adjustedSource: 7, adjustedTarget: 7 }); 
      // Round 1: 50+50=100 > 20, halve to 25+25=50
      // Round 2: 25+25=50 > 20, halve to 13+13=26 (rounded)
      // Round 3: 13+13=26 > 20, halve to 7+7=14
    });

    test('should handle edge cases with zero', () => {
      expect(adjustDicePools(25, 0)).toEqual({ adjustedSource: 13, adjustedTarget: 0 });
      expect(adjustDicePools(0, 25)).toEqual({ adjustedSource: 0, adjustedTarget: 13 });
    });

    test('should prevent infinite loops', () => {
      const result = adjustDicePools(1000, 1000);
      expect(result.adjustedSource).toBeGreaterThanOrEqual(0);
      expect(result.adjustedTarget).toBeGreaterThanOrEqual(0);
      expect(result.adjustedSource + result.adjustedTarget).toBeLessThanOrEqual(20);
    });
  });

  describe('calculateActionDifficulty', () => {
    test('should return 50% for equal zero values', () => {
      expect(calculateActionDifficulty(0, 0)).toBe(0.5);
    });

    test('should return 100% for unopposed actions', () => {
      expect(calculateActionDifficulty(5, 0)).toBe(1.0);
      expect(calculateActionDifficulty(10, 0)).toBe(1.0);
      expect(calculateActionDifficulty(1, 0)).toBe(1.0);
    });

    test('should return 0% when no source dice', () => {
      expect(calculateActionDifficulty(0, 5)).toBe(0.0);
      expect(calculateActionDifficulty(0, 10)).toBe(0.0);
      expect(calculateActionDifficulty(0, 1)).toBe(0.0);
    });

    test('should calculate reasonable probabilities for opposed actions', () => {
      // Equal dice pools should be around 50%
      const equalResult = calculateActionDifficulty(5, 5);
      expect(equalResult).toBeGreaterThan(0);
      expect(equalResult).toBeLessThan(1);
      expect(equalResult).toBeCloseTo(0.5, 1); // Within 0.1 of 50%

      // More source dice should have higher success probability
      const advantageResult = calculateActionDifficulty(8, 4);
      expect(advantageResult).toBeGreaterThan(0.5);

      // Fewer source dice should have lower success probability  
      const disadvantageResult = calculateActionDifficulty(4, 8);
      expect(disadvantageResult).toBeLessThan(0.5);
    });

    test('should handle large dice pools properly', () => {
      // Should still use adjusted pools internally
      const result = calculateActionDifficulty(50, 50);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
      expect(typeof result).toBe('number');
    });

    test('should return valid probabilities', () => {
      const testCases = [
        [1, 1], [2, 3], [5, 2], [10, 15], [3, 7]
      ];
      
      testCases.forEach(([source, target]) => {
        const result = calculateActionDifficulty(source, target);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
        expect(typeof result).toBe('number');
        expect(Number.isNaN(result)).toBe(false);
      });
    });
  });

  describe('integration tests', () => {
    test('should work with realistic game scenarios', () => {
      // Character with 6 strength dice vs armor with 3 protection dice
      const attackResult = calculateActionDifficulty(6, 3);
      expect(attackResult).toBeGreaterThan(0.5); // Should favor attacker

      // Difficult task: 2 dice vs 8 dice opposition
      const difficultResult = calculateActionDifficulty(2, 8);
      expect(difficultResult).toBeLessThan(0.3); // Should be very difficult

      // Easy task: 10 dice vs 1 die opposition
      const easyResult = calculateActionDifficulty(10, 1);
      expect(easyResult).toBeGreaterThan(0.8); // Should be very easy
    });

    test('should handle edge cases gracefully', () => {
      expect(() => calculateActionDifficulty(-1, 5)).not.toThrow();
      expect(() => calculateActionDifficulty(5, -1)).not.toThrow();
      expect(() => calculateActionDifficulty(null, 5)).not.toThrow();
      expect(() => calculateActionDifficulty(5, null)).not.toThrow();
    });
  });
});