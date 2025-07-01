const { calculateActionResult, processActionEffects, rollDice } = require('../../utils/actionCalculations');

// Mock external dependencies
jest.mock('../../utils/diceCalculations', () => ({
  rollMultipleDice: jest.fn(),
  rollSingleDie: jest.fn()
}));

const { rollMultipleDice, rollSingleDie } = require('../../utils/diceCalculations');

describe('actionCalculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rollDice', () => {
    test('should roll a single die when count is 1', () => {
      rollSingleDie.mockReturnValue(6);
      
      const result = rollDice(1, 8);
      
      expect(rollSingleDie).toHaveBeenCalledWith(8);
      expect(rollMultipleDice).not.toHaveBeenCalled();
      expect(result).toBe(6);
    });

    test('should roll multiple dice when count > 1', () => {
      rollMultipleDice.mockReturnValue(15);
      
      const result = rollDice(3, 6);
      
      expect(rollMultipleDice).toHaveBeenCalledWith(3, 6);
      expect(rollSingleDie).not.toHaveBeenCalled();
      expect(result).toBe(15);
    });

    test('should return 0 for invalid inputs', () => {
      expect(rollDice(0, 6)).toBe(0);
      expect(rollDice(-1, 6)).toBe(0);
      expect(rollDice(1, 0)).toBe(0);
      expect(rollDice(1, -1)).toBe(0);
    });

    test('should handle edge cases', () => {
      rollSingleDie.mockReturnValue(1);
      
      expect(rollDice(1, 1)).toBe(1);
      expect(rollSingleDie).toHaveBeenCalledWith(1);
    });
  });

  describe('calculateActionResult', () => {
    test('should calculate basic action result', () => {
      const mockAction = {
        name: 'Test Attack',
        diceCount: 2,
        diceType: 6,
        modifier: 3,
        effectType: 'DAMAGE'
      };

      rollMultipleDice.mockReturnValue(8);

      const result = calculateActionResult(mockAction);

      expect(result.total).toBe(11); // 8 + 3
      expect(result.diceRoll).toBe(8);
      expect(result.modifier).toBe(3);
      expect(result.action).toBe('Test Attack');
    });

    test('should handle actions without dice', () => {
      const mockAction = {
        name: 'Static Effect',
        diceCount: 0,
        diceType: 0,
        modifier: 5,
        effectType: 'HEAL'
      };

      const result = calculateActionResult(mockAction);

      expect(result.total).toBe(5);
      expect(result.diceRoll).toBe(0);
      expect(result.modifier).toBe(5);
      expect(rollSingleDie).not.toHaveBeenCalled();
      expect(rollMultipleDice).not.toHaveBeenCalled();
    });

    test('should handle missing properties gracefully', () => {
      const mockAction = {
        name: 'Incomplete Action'
        // Missing other properties
      };

      const result = calculateActionResult(mockAction);

      expect(result.total).toBe(0);
      expect(result.diceRoll).toBe(0);
      expect(result.modifier).toBe(0);
      expect(result.action).toBe('Incomplete Action');
    });

    test('should handle null/undefined action', () => {
      expect(() => calculateActionResult(null)).not.toThrow();
      expect(() => calculateActionResult(undefined)).not.toThrow();
      
      const nullResult = calculateActionResult(null);
      expect(nullResult.total).toBe(0);
      expect(nullResult.action).toBeUndefined();
    });
  });

  describe('processActionEffects', () => {
    test('should process damage effects', () => {
      const actionResult = {
        total: 10,
        action: 'Sword Strike',
        effectType: 'DAMAGE'
      };

      const target = {
        id: 'char1',
        currentHealth: 20,
        maxHealth: 20
      };

      const result = processActionEffects(actionResult, target);

      expect(result.newHealth).toBe(10); // 20 - 10
      expect(result.effectApplied).toBe(true);
      expect(result.effectType).toBe('DAMAGE');
      expect(result.amount).toBe(10);
    });

    test('should process healing effects', () => {
      const actionResult = {
        total: 8,
        action: 'Healing Potion',
        effectType: 'HEAL'
      };

      const target = {
        id: 'char1',
        currentHealth: 5,
        maxHealth: 20
      };

      const result = processActionEffects(actionResult, target);

      expect(result.newHealth).toBe(13); // 5 + 8
      expect(result.effectApplied).toBe(true);
      expect(result.effectType).toBe('HEAL');
      expect(result.amount).toBe(8);
    });

    test('should not heal above max health', () => {
      const actionResult = {
        total: 15,
        action: 'Major Healing',
        effectType: 'HEAL'
      };

      const target = {
        id: 'char1',
        currentHealth: 18,
        maxHealth: 20
      };

      const result = processActionEffects(actionResult, target);

      expect(result.newHealth).toBe(20); // Capped at max health
      expect(result.actualAmount).toBe(2); // Only healed 2 points
    });

    test('should not reduce health below 0', () => {
      const actionResult = {
        total: 15,
        action: 'Massive Attack',
        effectType: 'DAMAGE'
      };

      const target = {
        id: 'char1',
        currentHealth: 5,
        maxHealth: 20
      };

      const result = processActionEffects(actionResult, target);

      expect(result.newHealth).toBe(0); // Capped at 0
      expect(result.actualAmount).toBe(5); // Only took 5 damage
    });

    test('should handle unknown effect types', () => {
      const actionResult = {
        total: 10,
        action: 'Unknown Effect',
        effectType: 'UNKNOWN'
      };

      const target = {
        id: 'char1',
        currentHealth: 15,
        maxHealth: 20
      };

      const result = processActionEffects(actionResult, target);

      expect(result.newHealth).toBe(15); // No change
      expect(result.effectApplied).toBe(false);
      expect(result.effectType).toBe('UNKNOWN');
    });

    test('should handle missing target properties', () => {
      const actionResult = {
        total: 10,
        action: 'Test',
        effectType: 'DAMAGE'
      };

      const target = {
        id: 'char1'
        // Missing health properties
      };

      const result = processActionEffects(actionResult, target);

      expect(result.effectApplied).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('integration tests', () => {
    test('should process complete action sequence', () => {
      const mockAction = {
        name: 'Fireball',
        diceCount: 3,
        diceType: 6,
        modifier: 4,
        effectType: 'DAMAGE'
      };

      const target = {
        id: 'enemy1',
        currentHealth: 25,
        maxHealth: 25
      };

      rollMultipleDice.mockReturnValue(12); // 3d6 = 12

      const actionResult = calculateActionResult(mockAction);
      const effectResult = processActionEffects(actionResult, target);

      expect(actionResult.total).toBe(16); // 12 + 4
      expect(effectResult.newHealth).toBe(9); // 25 - 16
      expect(effectResult.effectApplied).toBe(true);
    });
  });
});