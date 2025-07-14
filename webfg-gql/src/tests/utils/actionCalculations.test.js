const {
  calculateExpectedSuccesses,
  adjustDicePools,
  performActionTest,
  calculateActionTestProbability,
  runActionAnalysis,
  calculateDamageReduction,
  calculateNetDamage,
  createActionTestResult,
  enhanceCharacterWithObjects,
  calculateActionDice
} = require('../../../utils/actionCalculations');

describe('actionCalculations', () => {
  describe('calculateExpectedSuccesses', () => {
    it('should calculate expected successes correctly', () => {
      expect(calculateExpectedSuccesses(0)).toBe(0);
      expect(calculateExpectedSuccesses(2)).toBe(1);
      expect(calculateExpectedSuccesses(4)).toBe(2);
      expect(calculateExpectedSuccesses(10)).toBe(5);
      expect(calculateExpectedSuccesses(20)).toBe(10);
    });

    it('should handle decimal dice counts', () => {
      expect(calculateExpectedSuccesses(1.5)).toBe(0.75);
      expect(calculateExpectedSuccesses(3.2)).toBe(1.6);
    });

    it('should handle negative dice counts', () => {
      expect(calculateExpectedSuccesses(-2)).toBe(-1);
    });
  });

  describe('adjustDicePools', () => {
    it('should not adjust dice pools when total is 20 or less', () => {
      const result = adjustDicePools(10, 10);
      expect(result.source).toBe(10);
      expect(result.target).toBe(10);
    });

    it('should not adjust when total is exactly 20', () => {
      const result = adjustDicePools(12, 8);
      expect(result.source).toBe(12);
      expect(result.target).toBe(8);
    });

    it('should halve dice pools when total exceeds 20', () => {
      const result = adjustDicePools(15, 15);
      expect(result.source).toBe(8); // 15/2 = 7.5, rounded to 8
      expect(result.target).toBe(8);
    });

    it('should continue halving until total is 20 or less', () => {
      const result = adjustDicePools(30, 30);
      // First iteration: 30+30=60 > 20, so 15+15=30
      // Second iteration: 15+15=30 > 20, so 8+8=16
      expect(result.source).toBe(8);
      expect(result.target).toBe(8);
    });

    it('should handle zero dice pools', () => {
      const result = adjustDicePools(0, 25);
      expect(result.source).toBe(0);
      expect(result.target).toBe(6); // 25/2 = 12.5, rounded to 13, then 13/2 = 6.5, rounded to 6
    });

    it('should handle very large dice pools', () => {
      const result = adjustDicePools(100, 100);
      // Multiple iterations needed to get under 20
      expect(result.source + result.target).toBeLessThanOrEqual(20);
      expect(result.source).toBeGreaterThanOrEqual(0);
      expect(result.target).toBeGreaterThanOrEqual(0);
    });

    it('should maintain minimum of 0 dice', () => {
      const result = adjustDicePools(1, 100);
      expect(result.source).toBeGreaterThanOrEqual(0);
      expect(result.target).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performActionTest', () => {
    const mockCharacter = {
      characterId: 'char-1',
      strength: { current: 10, max: 15, base: 10 },
      armor: { current: 8, max: 12, base: 8 },
      fatigue: 2
    };

    const mockAction = {
      actionId: 'action-1',
      name: 'Attack',
      source: 'strength',
      target: 'armor',
      type: 'normal'
    };

    it('should perform basic action test', () => {
      const result = performActionTest(mockCharacter, mockAction);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('sourceRoll');
      expect(result).toHaveProperty('targetRoll');
      expect(result).toHaveProperty('sourceDice');
      expect(result).toHaveProperty('targetDice');
      expect(result).toHaveProperty('netSuccesses');
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle subtract type actions', () => {
      const subtractAction = {
        ...mockAction,
        type: 'subtract'
      };

      const result = performActionTest(mockCharacter, subtractAction);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('damage');
    });

    it('should handle delta type actions', () => {
      const deltaAction = {
        ...mockAction,
        type: 'delta'
      };

      const result = performActionTest(mockCharacter, deltaAction);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('delta');
    });

    it('should handle missing attributes gracefully', () => {
      const characterMissingAttribs = {
        characterId: 'char-2',
        fatigue: 0
      };

      const result = performActionTest(characterMissingAttribs, mockAction);
      expect(result).toHaveProperty('success');
      expect(result.sourceDice).toBe(0);
      expect(result.targetDice).toBe(0);
    });
  });

  describe('calculateActionTestProbability', () => {
    const mockCharacter = {
      strength: { current: 10, max: 15, base: 10 },
      armor: { current: 8, max: 12, base: 8 },
      fatigue: 0
    };

    const mockAction = {
      source: 'strength',
      target: 'armor',
      type: 'normal'
    };

    it('should calculate probability for normal action', () => {
      const result = calculateActionTestProbability(mockCharacter, mockAction);
      
      expect(result).toHaveProperty('successProbability');
      expect(result).toHaveProperty('sourceDice');
      expect(result).toHaveProperty('targetDice');
      expect(result.successProbability).toBeGreaterThanOrEqual(0);
      expect(result.successProbability).toBeLessThanOrEqual(1);
    });

    it('should handle subtract type probability', () => {
      const subtractAction = {
        ...mockAction,
        type: 'subtract'
      };

      const result = calculateActionTestProbability(mockCharacter, subtractAction);
      expect(result).toHaveProperty('successProbability');
      expect(result).toHaveProperty('expectedDamage');
    });

    it('should handle delta type probability', () => {
      const deltaAction = {
        ...mockAction,
        type: 'delta'
      };

      const result = calculateActionTestProbability(mockCharacter, deltaAction);
      expect(result).toHaveProperty('successProbability');
      expect(result).toHaveProperty('expectedDelta');
    });
  });

  describe('runActionAnalysis', () => {
    const mockCharacter = {
      strength: { current: 10, max: 15, base: 10 },
      armor: { current: 8, max: 12, base: 8 },
      fatigue: 0
    };

    const mockAction = {
      source: 'strength',
      target: 'armor',
      type: 'normal'
    };

    it('should run comprehensive action analysis', () => {
      const result = runActionAnalysis(mockCharacter, mockAction, 1000);
      
      expect(result).toHaveProperty('probability');
      expect(result).toHaveProperty('simulation');
      expect(result).toHaveProperty('ranges');
      expect(result.simulation).toHaveProperty('successRate');
      expect(result.simulation).toHaveProperty('totalTests');
      expect(result.simulation.totalTests).toBe(1000);
    });

    it('should handle different simulation counts', () => {
      const result = runActionAnalysis(mockCharacter, mockAction, 100);
      expect(result.simulation.totalTests).toBe(100);
    });

    it('should include range analysis', () => {
      const result = runActionAnalysis(mockCharacter, mockAction, 500);
      expect(result.ranges).toHaveProperty('sourceRange');
      expect(result.ranges).toHaveProperty('targetRange');
    });
  });

  describe('calculateDamageReduction', () => {
    it('should calculate damage reduction correctly', () => {
      expect(calculateDamageReduction(10, 5)).toBe(5);
      expect(calculateDamageReduction(3, 8)).toBe(0); // Can't reduce below 0
      expect(calculateDamageReduction(0, 5)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(calculateDamageReduction(-5, 3)).toBe(0);
      expect(calculateDamageReduction(10, -3)).toBe(10);
    });
  });

  describe('calculateNetDamage', () => {
    it('should calculate net damage after reduction', () => {
      expect(calculateNetDamage(10, 3)).toBe(7);
      expect(calculateNetDamage(5, 8)).toBe(0); // Can't go below 0
      expect(calculateNetDamage(0, 5)).toBe(0);
    });

    it('should handle negative inputs', () => {
      expect(calculateNetDamage(-5, 3)).toBe(0);
      expect(calculateNetDamage(10, -3)).toBe(10);
    });
  });

  describe('createActionTestResult', () => {
    it('should create properly formatted action test result', () => {
      const params = {
        success: true,
        sourceRoll: 3,
        targetRoll: 2,
        sourceDice: 10,
        targetDice: 8,
        netSuccesses: 1,
        damage: 5,
        character: { characterId: 'char-1' },
        action: { actionId: 'action-1' }
      };

      const result = createActionTestResult(params);
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('sourceRoll', 3);
      expect(result).toHaveProperty('targetRoll', 2);
      expect(result).toHaveProperty('netSuccesses', 1);
      expect(result).toHaveProperty('damage', 5);
    });

    it('should handle optional parameters', () => {
      const params = {
        success: false,
        sourceDice: 5,
        targetDice: 7
      };

      const result = createActionTestResult(params);
      expect(result).toHaveProperty('success', false);
      expect(result.sourceDice).toBe(5);
      expect(result.targetDice).toBe(7);
    });
  });

  describe('enhanceCharacterWithObjects', () => {
    const mockCharacter = {
      characterId: 'char-1',
      strength: { current: 10, max: 15, base: 10 },
      equipmentIds: ['obj-1'],
      readyIds: ['obj-2']
    };

    const mockObjects = [
      {
        objectId: 'obj-1',
        name: 'Sword',
        strength: { current: 2, max: 2, base: 2 }
      },
      {
        objectId: 'obj-2',
        name: 'Shield',
        armor: { current: 3, max: 3, base: 3 }
      }
    ];

    it('should enhance character with equipment and ready objects', () => {
      const result = enhanceCharacterWithObjects(mockCharacter, mockObjects);
      
      expect(result).toHaveProperty('equipment');
      expect(result).toHaveProperty('ready');
      expect(result.equipment).toHaveLength(1);
      expect(result.ready).toHaveLength(1);
      expect(result.equipment[0].name).toBe('Sword');
      expect(result.ready[0].name).toBe('Shield');
    });

    it('should handle missing objects', () => {
      const result = enhanceCharacterWithObjects(mockCharacter, []);
      expect(result.equipment).toHaveLength(0);
      expect(result.ready).toHaveLength(0);
    });

    it('should handle character with no equipment/ready IDs', () => {
      const characterNoEquip = {
        characterId: 'char-2',
        strength: { current: 10, max: 15, base: 10 }
      };

      const result = enhanceCharacterWithObjects(characterNoEquip, mockObjects);
      expect(result.equipment).toHaveLength(0);
      expect(result.ready).toHaveLength(0);
    });
  });

  describe('calculateActionDice', () => {
    const mockCharacter = {
      strength: { current: 10, max: 15, base: 10 },
      armor: { current: 8, max: 12, base: 8 },
      fatigue: 2
    };

    const mockAction = {
      source: 'strength',
      target: 'armor'
    };

    it('should calculate dice pools for action', () => {
      const result = calculateActionDice(mockCharacter, mockAction);
      
      expect(result).toHaveProperty('sourceDice');
      expect(result).toHaveProperty('targetDice');
      expect(typeof result.sourceDice).toBe('number');
      expect(typeof result.targetDice).toBe('number');
      expect(result.sourceDice).toBeGreaterThanOrEqual(0);
      expect(result.targetDice).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing attributes', () => {
      const characterMissingAttribs = {
        fatigue: 0
      };

      const result = calculateActionDice(characterMissingAttribs, mockAction);
      expect(result.sourceDice).toBe(0);
      expect(result.targetDice).toBe(0);
    });

    it('should apply fatigue correctly', () => {
      const characterNoFatigue = { ...mockCharacter, fatigue: 0 };
      const characterHighFatigue = { ...mockCharacter, fatigue: 5 };

      const resultNoFatigue = calculateActionDice(characterNoFatigue, mockAction);
      const resultHighFatigue = calculateActionDice(characterHighFatigue, mockAction);

      expect(resultNoFatigue.sourceDice).toBeGreaterThanOrEqual(resultHighFatigue.sourceDice);
    });
  });

  describe('integration tests', () => {
    it('should perform complete action workflow', () => {
      const character = {
        characterId: 'char-1',
        strength: { current: 12, max: 15, base: 12 },
        armor: { current: 10, max: 12, base: 10 },
        fatigue: 1,
        equipmentIds: ['sword-1'],
        readyIds: ['shield-1']
      };

      const action = {
        actionId: 'action-1',
        name: 'Melee Attack',
        source: 'strength',
        target: 'armor',
        type: 'normal'
      };

      const objects = [
        {
          objectId: 'sword-1',
          name: 'Iron Sword',
          strength: { current: 2, max: 2, base: 2 }
        },
        {
          objectId: 'shield-1',
          name: 'Iron Shield',
          armor: { current: 2, max: 2, base: 2 }
        }
      ];

      // Test probability calculation
      const probability = calculateActionTestProbability(character, action);
      expect(probability).toHaveProperty('successProbability');

      // Test actual action performance
      const testResult = performActionTest(character, action);
      expect(testResult).toHaveProperty('success');

      // Test comprehensive analysis
      const analysis = runActionAnalysis(character, action, 100);
      expect(analysis).toHaveProperty('probability');
      expect(analysis).toHaveProperty('simulation');
    });
  });
});