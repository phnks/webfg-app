const {
  calculateExpectedSuccesses,
  adjustDicePools,
  calculateActionDifficulty,
  getSingleCharacterSourceAttributeValue,
  getSingleCharacterTargetAttributeValue,
  getSingleEntityTargetAttributeValue,
  groupSourceAttributes,
  groupTargetAttributes,
  calculateActionTest
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
      expect(result.target).toBe(13); // 25/2 = 12.5, rounded to 13
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

  describe('calculateActionDifficulty', () => {
    it('should calculate action difficulty correctly', () => {
      const difficulty = calculateActionDifficulty(10, 8);
      expect(typeof difficulty).toBe('number');
      expect(difficulty).toBeGreaterThanOrEqual(0);
      expect(difficulty).toBeLessThanOrEqual(1);
    });

    it('should handle zero values', () => {
      expect(calculateActionDifficulty(0, 0)).toBe(0.5);
      expect(calculateActionDifficulty(10, 0)).toBe(1.0);
      expect(calculateActionDifficulty(0, 10)).toBe(0.0);
    });

    it('should return reasonable probabilities', () => {
      // Higher source should have higher success probability
      const lowSource = calculateActionDifficulty(5, 10);
      const highSource = calculateActionDifficulty(15, 10);
      expect(highSource).toBeGreaterThan(lowSource);
    });
  });

  describe('getSingleCharacterSourceAttributeValue', () => {
    const mockCharacter = {
      characterId: 'char-1',
      name: 'Test Character',
      strength: { 
        attribute: { attributeValue: 10 }
      },
      equipment: [],
      ready: []
    };

    it('should get single character source attribute value', () => {
      const value = getSingleCharacterSourceAttributeValue(mockCharacter, 'strength');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing attributes', () => {
      const value = getSingleCharacterSourceAttributeValue(mockCharacter, 'nonexistent');
      expect(value).toBe(0);
    });

    it('should handle empty character', () => {
      const value = getSingleCharacterSourceAttributeValue({}, 'strength');
      expect(value).toBe(0);
    });
  });

  describe('getSingleCharacterTargetAttributeValue', () => {
    const mockCharacter = {
      characterId: 'char-1',
      name: 'Test Character',
      armor: { 
        attribute: { attributeValue: 8 }
      },
      equipment: []
    };

    it('should get single character target attribute value', () => {
      const value = getSingleCharacterTargetAttributeValue(mockCharacter, 'armor');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing attributes', () => {
      const value = getSingleCharacterTargetAttributeValue(mockCharacter, 'nonexistent');
      expect(value).toBe(0);
    });

    it('should handle empty character', () => {
      const value = getSingleCharacterTargetAttributeValue({}, 'armor');
      expect(value).toBe(0);
    });
  });

  describe('groupSourceAttributes', () => {
    const mockCharacter = {
      characterId: 'char-1',
      name: 'Test Character',
      strength: { 
        attribute: { attributeValue: 10 }
      },
      equipment: []
    };

    it('should group source attributes from single character', () => {
      const value = groupSourceAttributes([mockCharacter], 'strength');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty character array', () => {
      const value = groupSourceAttributes([], 'strength');
      expect(value).toBe(0);
    });

    it('should handle multiple characters', () => {
      const character2 = {
        characterId: 'char-2',
        name: 'Test Character 2',
        strength: { 
          attribute: { attributeValue: 8 }
        },
        equipment: []
      };
      const value = groupSourceAttributes([mockCharacter, character2], 'strength');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });

  describe('groupTargetAttributes', () => {
    const mockCharacter = {
      characterId: 'char-1',
      name: 'Test Character',
      armor: { 
        attribute: { attributeValue: 8 }
      },
      equipment: []
    };

    it('should group target attributes from single character', () => {
      const value = groupTargetAttributes([mockCharacter], 'armor', 'CHARACTER');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty entity array', () => {
      const value = groupTargetAttributes([], 'armor', 'CHARACTER');
      expect(value).toBe(0);
    });

    it('should handle multiple entities', () => {
      const character2 = {
        characterId: 'char-2',
        name: 'Test Character 2',
        armor: { 
          attribute: { attributeValue: 6 }
        },
        equipment: []
      };
      const value = groupTargetAttributes([mockCharacter, character2], 'armor', 'CHARACTER');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateActionTest', () => {
    it('should perform complete action test calculation', () => {
      const sourceCharacter = {
        characterId: 'char-1',
        name: 'Source Character',
        strength: { 
          attribute: { attributeValue: 12 }
        },
        fatigue: 1,
        equipment: []
      };

      const targetCharacter = {
        characterId: 'char-2',
        name: 'Target Character',
        armor: { 
          attribute: { attributeValue: 10 }
        },
        fatigue: 0,
        equipment: []
      };

      const params = {
        sourceCharacters: [sourceCharacter],
        targetEntities: [targetCharacter],
        sourceAttribute: 'STRENGTH',
        targetAttribute: 'ARMOR',
        targetType: 'CHARACTER'
      };

      const result = calculateActionTest(params);
      
      expect(result).toHaveProperty('difficulty');
      expect(result).toHaveProperty('sourceValue');
      expect(result).toHaveProperty('targetValue');
      expect(result).toHaveProperty('successPercentage');
      expect(result).toHaveProperty('sourceModifier');
      expect(result).toHaveProperty('targetModifier');
      expect(typeof result.difficulty).toBe('number');
      expect(result.difficulty).toBeGreaterThanOrEqual(0);
      expect(result.difficulty).toBeLessThanOrEqual(1);
    });

    it('should handle override values', () => {
      const sourceCharacter = {
        characterId: 'char-1',
        name: 'Source Character',
        strength: { 
          attribute: { attributeValue: 12 }
        },
        fatigue: 0,
        equipment: []
      };

      const params = {
        sourceCharacters: [sourceCharacter],
        targetEntities: [],
        sourceAttribute: 'STRENGTH',
        targetAttribute: 'ARMOR',
        targetType: 'CHARACTER',
        override: true,
        overrideValue: 15
      };

      const result = calculateActionTest(params);
      expect(result.targetValue).toBe(15);
    });

    it('should handle empty arrays', () => {
      const params = {
        sourceCharacters: [],
        targetEntities: [],
        sourceAttribute: 'STRENGTH',
        targetAttribute: 'ARMOR',
        targetType: 'CHARACTER'
      };

      const result = calculateActionTest(params);
      expect(result.sourceValue).toBe(0);
      expect(result.targetValue).toBe(0);
    });
  });
});