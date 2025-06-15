const { describe, it, expect, beforeEach, jest } = require('@jest/globals');

// Import the module under test
const actionCalculations = require('../actionCalculations');

describe('actionCalculations utility functions', () => {
  
  describe('calculateDifficulty', () => {
    it('should calculate basic difficulty correctly', () => {
      const result = actionCalculations.calculateDifficulty(10, 5);
      expect(result).toBe(-5); // target - source = 5 - 10 = -5
    });

    it('should handle positive difficulty', () => {
      const result = actionCalculations.calculateDifficulty(5, 10);
      expect(result).toBe(5); // target - source = 10 - 5 = 5
    });

    it('should handle zero values', () => {
      expect(actionCalculations.calculateDifficulty(0, 0)).toBe(0);
      expect(actionCalculations.calculateDifficulty(10, 0)).toBe(-10);
      expect(actionCalculations.calculateDifficulty(0, 10)).toBe(10);
    });

    it('should handle negative values', () => {
      expect(actionCalculations.calculateDifficulty(-5, 10)).toBe(15);
      expect(actionCalculations.calculateDifficulty(10, -5)).toBe(-15);
      expect(actionCalculations.calculateDifficulty(-5, -10)).toBe(-5);
    });
  });

  describe('calculateRollRequirement', () => {
    it('should calculate roll requirement for easy difficulty', () => {
      const result = actionCalculations.calculateRollRequirement(-10);
      expect(result.rollNeeded).toBeLessThanOrEqual(2);
      expect(result.description).toContain('Very Easy');
    });

    it('should calculate roll requirement for hard difficulty', () => {
      const result = actionCalculations.calculateRollRequirement(10);
      expect(result.rollNeeded).toBeGreaterThanOrEqual(15);
      expect(result.description).toContain('Hard');
    });

    it('should handle zero difficulty', () => {
      const result = actionCalculations.calculateRollRequirement(0);
      expect(result.rollNeeded).toBeGreaterThanOrEqual(2);
      expect(result.rollNeeded).toBeLessThanOrEqual(20);
      expect(result.description).toContain('Normal');
    });

    it('should handle extreme difficulties', () => {
      const veryEasy = actionCalculations.calculateRollRequirement(-50);
      expect(veryEasy.rollNeeded).toBe(2); // Minimum roll

      const impossible = actionCalculations.calculateRollRequirement(50);
      expect(impossible.rollNeeded).toBeGreaterThanOrEqual(20);
      expect(impossible.description).toContain('Impossible');
    });
  });

  describe('rollDice', () => {
    beforeEach(() => {
      // Reset Math.random mock
      jest.spyOn(Math, 'random').mockRestore();
    });

    it('should roll within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const result = actionCalculations.rollDice();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(20);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('should roll maximum value with Math.random = 0.9999', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.9999);
      const result = actionCalculations.rollDice();
      expect(result).toBe(20);
    });

    it('should roll minimum value with Math.random = 0', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);
      const result = actionCalculations.rollDice();
      expect(result).toBe(1);
    });

    it('should roll middle value with Math.random = 0.5', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = actionCalculations.rollDice();
      expect(result).toBe(11); // Math.floor(0.5 * 20) + 1 = 10 + 1 = 11
    });
  });

  describe('calculateActionSuccess', () => {
    it('should determine success when roll exceeds requirement', () => {
      const result = actionCalculations.calculateActionSuccess(15, 10);
      expect(result.success).toBe(true);
      expect(result.margin).toBe(5);
      expect(result.criticalSuccess).toBe(false);
    });

    it('should determine failure when roll is below requirement', () => {
      const result = actionCalculations.calculateActionSuccess(8, 10);
      expect(result.success).toBe(false);
      expect(result.margin).toBe(-2);
      expect(result.criticalFailure).toBe(false);
    });

    it('should determine critical success on roll of 20', () => {
      const result = actionCalculations.calculateActionSuccess(20, 15);
      expect(result.success).toBe(true);
      expect(result.criticalSuccess).toBe(true);
      expect(result.margin).toBe(5);
    });

    it('should determine critical failure on roll of 1', () => {
      const result = actionCalculations.calculateActionSuccess(1, 5);
      expect(result.success).toBe(false);
      expect(result.criticalFailure).toBe(true);
      expect(result.margin).toBe(-4);
    });

    it('should handle edge case where roll equals requirement', () => {
      const result = actionCalculations.calculateActionSuccess(10, 10);
      expect(result.success).toBe(true);
      expect(result.margin).toBe(0);
    });
  });

  describe('calculateAttributeModifier', () => {
    it('should calculate modifier for equipped items', () => {
      const equippedItems = [
        { object: { strength: 5, dexterity: 2 } },
        { object: { strength: 3, agility: -1 } }
      ];

      const result = actionCalculations.calculateAttributeModifier(equippedItems, 'strength');
      expect(result).toBe(8); // 5 + 3 = 8
    });

    it('should calculate modifier for conditions', () => {
      const conditions = [
        { condition: { type: 'help', attribute: 'strength', value: 5 } },
        { condition: { type: 'hinder', attribute: 'strength', value: 2 } }
      ];

      const result = actionCalculations.calculateAttributeModifier(conditions, 'strength');
      expect(result).toBe(3); // 5 - 2 = 3
    });

    it('should return zero for empty arrays', () => {
      expect(actionCalculations.calculateAttributeModifier([], 'strength')).toBe(0);
      expect(actionCalculations.calculateAttributeModifier(null, 'strength')).toBe(0);
      expect(actionCalculations.calculateAttributeModifier(undefined, 'strength')).toBe(0);
    });

    it('should ignore items without the specified attribute', () => {
      const items = [
        { object: { dexterity: 5 } },
        { object: { agility: 3 } }
      ];

      const result = actionCalculations.calculateAttributeModifier(items, 'strength');
      expect(result).toBe(0);
    });

    it('should handle mixed positive and negative modifiers', () => {
      const items = [
        { object: { strength: 10, agility: -5 } },
        { object: { strength: -3, agility: 2 } }
      ];

      expect(actionCalculations.calculateAttributeModifier(items, 'strength')).toBe(7); // 10 - 3 = 7
      expect(actionCalculations.calculateAttributeModifier(items, 'agility')).toBe(-3); // -5 + 2 = -3
    });
  });

  describe('calculateFinalAttribute', () => {
    it('should calculate final attribute with all modifiers', () => {
      const baseValue = 10;
      const equippedItems = [{ object: { strength: 5 } }];
      const conditions = [{ condition: { type: 'help', attribute: 'strength', value: 3 } }];

      const result = actionCalculations.calculateFinalAttribute(
        baseValue,
        'strength',
        equippedItems,
        conditions
      );

      expect(result).toBe(18); // 10 + 5 + 3 = 18
    });

    it('should handle negative final values', () => {
      const baseValue = 5;
      const conditions = [{ condition: { type: 'hinder', attribute: 'strength', value: 10 } }];

      const result = actionCalculations.calculateFinalAttribute(
        baseValue,
        'strength',
        [],
        conditions
      );

      expect(result).toBe(-5); // 5 - 10 = -5
    });

    it('should handle missing or invalid base value', () => {
      expect(actionCalculations.calculateFinalAttribute(null, 'strength', [], [])).toBe(0);
      expect(actionCalculations.calculateFinalAttribute(undefined, 'strength', [], [])).toBe(0);
      expect(actionCalculations.calculateFinalAttribute('invalid', 'strength', [], [])).toBe(0);
    });
  });

  describe('getActionChain', () => {
    it('should return single action for normal type', () => {
      const action = { id: 'action-1', name: 'Hit', type: 'normal' };
      const result = actionCalculations.getActionChain(action, []);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(action);
    });

    it('should return action chain for trigger type', () => {
      const actions = [
        { id: 'action-1', name: 'Hit', type: 'trigger', triggersActionId: 'action-2' },
        { id: 'action-2', name: 'Break', type: 'trigger', triggersActionId: 'action-3' },
        { id: 'action-3', name: 'Kill', type: 'destroy' }
      ];

      const result = actionCalculations.getActionChain(actions[0], actions);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Hit');
      expect(result[1].name).toBe('Break');
      expect(result[2].name).toBe('Kill');
    });

    it('should handle circular references gracefully', () => {
      const actions = [
        { id: 'action-1', name: 'Action1', type: 'trigger', triggersActionId: 'action-2' },
        { id: 'action-2', name: 'Action2', type: 'trigger', triggersActionId: 'action-1' }
      ];

      const result = actionCalculations.getActionChain(actions[0], actions);

      // Should prevent infinite loop
      expect(result.length).toBeLessThan(10);
    });

    it('should handle missing triggered action', () => {
      const action = { id: 'action-1', name: 'Hit', type: 'trigger', triggersActionId: 'missing' };
      const result = actionCalculations.getActionChain(action, [action]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(action);
    });
  });

  describe('formatDifficultyDescription', () => {
    it('should format very easy difficulty', () => {
      expect(actionCalculations.formatDifficultyDescription(-15)).toContain('Very Easy');
    });

    it('should format easy difficulty', () => {
      expect(actionCalculations.formatDifficultyDescription(-8)).toContain('Easy');
    });

    it('should format normal difficulty', () => {
      expect(actionCalculations.formatDifficultyDescription(0)).toContain('Normal');
    });

    it('should format hard difficulty', () => {
      expect(actionCalculations.formatDifficultyDescription(8)).toContain('Hard');
    });

    it('should format very hard difficulty', () => {
      expect(actionCalculations.formatDifficultyDescription(15)).toContain('Very Hard');
    });

    it('should format impossible difficulty', () => {
      expect(actionCalculations.formatDifficultyDescription(25)).toContain('Impossible');
    });
  });

  describe('integration tests', () => {
    it('should perform complete action test calculation', () => {
      const sourceCharacter = mockCharacter({ strength: 15 });
      const targetCharacter = mockCharacter({ armor: 8 });
      const action = mockAction({ source: 'strength', target: 'armor' });

      const equippedItems = [{ object: { strength: 3 } }];
      const conditions = [{ condition: { type: 'help', attribute: 'strength', value: 2 } }];

      // Calculate final source attribute
      const finalSource = actionCalculations.calculateFinalAttribute(
        sourceCharacter.strength,
        'strength',
        equippedItems,
        conditions
      );

      // Calculate difficulty
      const difficulty = actionCalculations.calculateDifficulty(finalSource, targetCharacter.armor);

      // Get roll requirement
      const rollReq = actionCalculations.calculateRollRequirement(difficulty);

      expect(finalSource).toBe(20); // 15 + 3 + 2 = 20
      expect(difficulty).toBe(-12); // 8 - 20 = -12
      expect(rollReq.rollNeeded).toBeLessThan(5); // Very easy
      expect(rollReq.description).toContain('Very Easy');
    });
  });
});