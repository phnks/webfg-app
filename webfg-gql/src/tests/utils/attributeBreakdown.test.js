const {
  calculateAttributeBreakdown,
  calculateObjectAttributeBreakdown
} = require('../../../utils/attributeBreakdown');

// Mock the stringToNumber module
jest.mock('../../../utils/stringToNumber', () => ({
  toInt: jest.fn((value, defaultValue) => {
    if (typeof value === 'number') return Math.floor(value);
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? defaultValue : num;
    }
    return defaultValue;
  })
}));

// Mock the attributeGrouping module
jest.mock('../../../utils/attributeGrouping', () => ({
  extractAttributeInfo: jest.fn((attributeData) => {
    if (!attributeData) return null;
    
    // Handle character attributes
    if (attributeData.attribute) {
      return {
        value: attributeData.attribute.attributeValue || 0,
        isGrouped: attributeData.attribute.isGrouped !== undefined ? attributeData.attribute.isGrouped : true
      };
    }
    
    // Handle object attributes
    if (attributeData.attributeValue !== undefined) {
      return {
        value: attributeData.attributeValue || 0,
        isGrouped: attributeData.isGrouped !== undefined ? attributeData.isGrouped : true
      };
    }
    
    return null;
  }),
  calculateGroupingFormula: jest.fn((values) => {
    if (!values || values.length === 0) return 0;
    if (values.length === 1) return values[0];
    
    const A1 = values[0];
    let sum = A1;
    
    for (let i = 1; i < values.length; i++) {
      const Ai = values[i];
      const scalingFactor = 0.25;
      
      if (A1 > 0) {
        sum += Ai * (scalingFactor + Ai / A1);
      } else {
        sum += Ai * scalingFactor;
      }
    }
    
    return sum / values.length;
  }),
  calculateGroupedAttributes: jest.fn((character) => {
    // Simple mock that returns base values
    const result = {};
    if (character.strength) {
      result.strength = character.strength.attribute?.attributeValue || 0;
    }
    if (character.lethality) {
      result.lethality = character.lethality.attribute?.attributeValue || 0;
    }
    return result;
  }),
  calculateObjectGroupedAttributes: jest.fn((object) => {
    // Simple mock that returns base values
    const result = {};
    if (object.strength) {
      result.strength = object.strength.attributeValue || 0;
    }
    if (object.lethality) {
      result.lethality = object.lethality.attributeValue || 0;
    }
    return result;
  })
}));

describe('attributeBreakdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAttributeBreakdown', () => {
    const mockCharacter = {
      name: 'Test Character',
      characterId: 'char-1',
      strength: {
        attribute: {
          attributeValue: 10,
          isGrouped: true
        }
      },
      equipment: [
        {
          name: 'Iron Sword',
          objectId: 'sword-1',
          strength: {
            attributeValue: 3,
            isGrouped: true
          }
        }
      ]
    };

    it('should return empty breakdown for null character', () => {
      const result = calculateAttributeBreakdown(null, 'strength');
      expect(result).toEqual([]);
    });

    it('should return empty breakdown for character without attribute', () => {
      const characterNoAttr = {
        name: 'Test Character',
        characterId: 'char-1'
      };
      
      const result = calculateAttributeBreakdown(characterNoAttr, 'strength');
      expect(result).toEqual([]);
    });

    it('should handle character with non-grouped attribute and no equipment', () => {
      const characterNotGrouped = {
        name: 'Test Character',
        strength: {
          attribute: {
            attributeValue: 10,
            isGrouped: false
          }
        }
      };

      const result = calculateAttributeBreakdown(characterNotGrouped, 'strength');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        step: 1,
        entityName: 'Test Character',
        entityType: 'character',
        attributeValue: 10,
        isGrouped: false,
        runningTotal: 10,
        formula: null
      });
    });

    it('should handle character with grouped attribute but no equipment', () => {
      const characterNoEquip = {
        name: 'Test Character',
        strength: {
          attribute: {
            attributeValue: 10,
            isGrouped: true
          }
        },
        equipment: []
      };

      const result = calculateAttributeBreakdown(characterNoEquip, 'strength');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        step: 1,
        entityName: 'Test Character',
        entityType: 'character',
        attributeValue: 10,
        isGrouped: true,
        runningTotal: 10
      });
    });

    it('should calculate breakdown with character and equipment', () => {
      const result = calculateAttributeBreakdown(mockCharacter, 'strength');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        step: 1,
        entityName: 'Test Character',
        entityType: 'character',
        attributeValue: 10,
        isGrouped: true
      });
      expect(result[1]).toMatchObject({
        step: 2,
        entityName: 'Iron Sword',
        entityType: 'equipment',
        attributeValue: 3,
        isGrouped: true
      });
    });

    it('should handle character with non-grouped attribute but grouped equipment', () => {
      const characterMixed = {
        name: 'Test Character',
        strength: {
          attribute: {
            attributeValue: 10,
            isGrouped: false
          }
        },
        equipment: [
          {
            name: 'Iron Sword',
            strength: {
              attributeValue: 3,
              isGrouped: true
            }
          }
        ]
      };

      const result = calculateAttributeBreakdown(characterMixed, 'strength');
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        entityName: 'Test Character',
        entityType: 'character',
        isGrouped: false,
        formula: 'Not participating in grouping'
      });
    });

    it('should handle equipment with their own equipment (nested)', () => {
      const characterNested = {
        name: 'Test Character',
        strength: {
          attribute: {
            attributeValue: 10,
            isGrouped: true
          }
        },
        equipment: [
          {
            name: 'Enhanced Sword',
            strength: {
              attributeValue: 3,
              isGrouped: true
            },
            equipment: [
              {
                name: 'Sword Enhancement',
                strength: {
                  attributeValue: 1,
                  isGrouped: true
                }
              }
            ]
          }
        ]
      };

      const result = calculateAttributeBreakdown(characterNested, 'strength');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].entityName).toBe('Test Character');
    });

    it('should apply conditions to breakdown', () => {
      const characterWithConditions = {
        ...mockCharacter,
        conditions: [
          {
            name: 'Blessing',
            conditionType: 'HELP',
            conditionTarget: 'strength',
            amount: 2
          },
          {
            name: 'Curse',
            conditionType: 'HINDER',
            conditionTarget: 'strength',
            amount: 1
          }
        ]
      };

      const result = calculateAttributeBreakdown(characterWithConditions, 'strength');
      
      // Should have character, equipment, and conditions
      expect(result.length).toBeGreaterThan(2);
      
      // Find condition steps
      const helpCondition = result.find(step => step.entityName === 'Blessing');
      const hinderCondition = result.find(step => step.entityName === 'Curse');
      
      expect(helpCondition).toBeDefined();
      expect(helpCondition.entityType).toBe('condition');
      expect(hinderCondition).toBeDefined();
      expect(hinderCondition.entityType).toBe('condition');
    });

    it('should handle conditions with invalid amounts', () => {
      const characterWithInvalidConditions = {
        ...mockCharacter,
        conditions: [
          {
            name: 'Invalid Condition',
            conditionType: 'HELP',
            conditionTarget: 'strength',
            amount: null
          },
          {
            name: 'Zero Condition',
            conditionType: 'HELP',
            conditionTarget: 'strength',
            amount: 0
          }
        ]
      };

      const result = calculateAttributeBreakdown(characterWithInvalidConditions, 'strength');
      
      // Should not include invalid conditions
      const invalidCondition = result.find(step => step.entityName === 'Invalid Condition');
      const zeroCondition = result.find(step => step.entityName === 'Zero Condition');
      
      expect(invalidCondition).toBeUndefined();
      expect(zeroCondition).toBeUndefined();
    });

    it('should handle conditions targeting different attributes', () => {
      const characterWithOtherConditions = {
        ...mockCharacter,
        conditions: [
          {
            name: 'Speed Boost',
            conditionType: 'HELP',
            conditionTarget: 'speed',
            amount: 2
          }
        ]
      };

      const result = calculateAttributeBreakdown(characterWithOtherConditions, 'strength');
      
      // Should not include conditions for other attributes
      const speedCondition = result.find(step => step.entityName === 'Speed Boost');
      expect(speedCondition).toBeUndefined();
    });

    it('should handle multiple equipment items', () => {
      const characterMultiEquip = {
        name: 'Test Character',
        strength: {
          attribute: {
            attributeValue: 10,
            isGrouped: true
          }
        },
        equipment: [
          {
            name: 'Iron Sword',
            strength: {
              attributeValue: 3,
              isGrouped: true
            }
          },
          {
            name: 'Steel Armor',
            strength: {
              attributeValue: 2,
              isGrouped: true
            }
          },
          {
            name: 'Power Gauntlets',
            strength: {
              attributeValue: 5,
              isGrouped: true
            }
          }
        ]
      };

      const result = calculateAttributeBreakdown(characterMultiEquip, 'strength');
      expect(result.length).toBeGreaterThanOrEqual(4); // Character + 3 equipment
      
      // Should be sorted by value (highest first after character)
      const powerGauntlets = result.find(step => step.entityName === 'Power Gauntlets');
      const ironSword = result.find(step => step.entityName === 'Iron Sword');
      expect(powerGauntlets).toBeDefined();
      expect(ironSword).toBeDefined();
    });

    it('should handle equipment with non-grouped attributes', () => {
      const characterMixedEquip = {
        name: 'Test Character',
        strength: {
          attribute: {
            attributeValue: 10,
            isGrouped: true
          }
        },
        equipment: [
          {
            name: 'Grouped Sword',
            strength: {
              attributeValue: 3,
              isGrouped: true
            }
          },
          {
            name: 'Non-Grouped Item',
            strength: {
              attributeValue: 5,
              isGrouped: false
            }
          }
        ]
      };

      const result = calculateAttributeBreakdown(characterMixedEquip, 'strength');
      
      // Should only include grouped equipment
      const groupedSword = result.find(step => step.entityName === 'Grouped Sword');
      const nonGroupedItem = result.find(step => step.entityName === 'Non-Grouped Item');
      
      expect(groupedSword).toBeDefined();
      expect(nonGroupedItem).toBeUndefined();
    });

    it('should properly calculate weighted average formula in breakdown', () => {
      const result = calculateAttributeBreakdown(mockCharacter, 'strength');
      
      if (result.length > 1) {
        const secondStep = result[1];
        expect(secondStep.formula).toMatch(/Weighted Average/);
        expect(secondStep.runningTotal).toBeDefined();
        expect(typeof secondStep.runningTotal).toBe('number');
      }
    });
  });

  describe('calculateObjectAttributeBreakdown', () => {
    const mockObject = {
      name: 'Test Object',
      objectId: 'obj-1',
      strength: {
        attributeValue: 8,
        isGrouped: true
      },
      equipment: [
        {
          name: 'Enhancement',
          strength: {
            attributeValue: 2,
            isGrouped: true
          }
        }
      ]
    };

    it('should return empty breakdown for null object', () => {
      const result = calculateObjectAttributeBreakdown(null, 'strength');
      expect(result).toEqual([]);
    });

    it('should return empty breakdown for object without attribute', () => {
      const objectNoAttr = {
        name: 'Test Object',
        objectId: 'obj-1'
      };
      
      const result = calculateObjectAttributeBreakdown(objectNoAttr, 'strength');
      expect(result).toEqual([]);
    });

    it('should handle object with non-grouped attribute', () => {
      const objectNotGrouped = {
        name: 'Test Object',
        strength: {
          attributeValue: 8,
          isGrouped: false
        }
      };

      const result = calculateObjectAttributeBreakdown(objectNotGrouped, 'strength');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        step: 1,
        entityName: 'Test Object',
        entityType: 'object',
        attributeValue: 8,
        isGrouped: false,
        runningTotal: 8
      });
    });

    it('should handle object with no equipment', () => {
      const objectNoEquip = {
        name: 'Test Object',
        strength: {
          attributeValue: 8,
          isGrouped: true
        },
        equipment: []
      };

      const result = calculateObjectAttributeBreakdown(objectNoEquip, 'strength');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        step: 1,
        entityName: 'Test Object',
        entityType: 'object',
        attributeValue: 8,
        isGrouped: true
      });
    });

    it('should calculate breakdown with object and equipment', () => {
      const result = calculateObjectAttributeBreakdown(mockObject, 'strength');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        step: 1,
        entityName: 'Test Object',
        entityType: 'object',
        attributeValue: 8,
        isGrouped: true
      });
      expect(result[1]).toMatchObject({
        step: 2,
        entityName: 'Enhancement',
        entityType: 'equipment',
        attributeValue: 2,
        isGrouped: true
      });
    });

    it('should handle nested equipment on objects', () => {
      const objectNested = {
        name: 'Complex Object',
        strength: {
          attributeValue: 8,
          isGrouped: true
        },
        equipment: [
          {
            name: 'Primary Enhancement',
            strength: {
              attributeValue: 3,
              isGrouped: true
            },
            equipment: [
              {
                name: 'Sub Enhancement',
                strength: {
                  attributeValue: 1,
                  isGrouped: true
                }
              }
            ]
          }
        ]
      };

      const result = calculateObjectAttributeBreakdown(objectNested, 'strength');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].entityName).toBe('Complex Object');
    });

    it('should handle multiple equipment items on object', () => {
      const objectMultiEquip = {
        name: 'Enhanced Object',
        strength: {
          attributeValue: 8,
          isGrouped: true
        },
        equipment: [
          {
            name: 'Enhancement A',
            strength: {
              attributeValue: 2,
              isGrouped: true
            }
          },
          {
            name: 'Enhancement B',
            strength: {
              attributeValue: 4,
              isGrouped: true
            }
          },
          {
            name: 'Enhancement C',
            strength: {
              attributeValue: 1,
              isGrouped: true
            }
          }
        ]
      };

      const result = calculateObjectAttributeBreakdown(objectMultiEquip, 'strength');
      expect(result.length).toBeGreaterThanOrEqual(4); // Object + 3 enhancements
    });

    it('should exclude non-grouped equipment from object breakdown', () => {
      const objectMixedEquip = {
        name: 'Mixed Object',
        strength: {
          attributeValue: 8,
          isGrouped: true
        },
        equipment: [
          {
            name: 'Grouped Enhancement',
            strength: {
              attributeValue: 3,
              isGrouped: true
            }
          },
          {
            name: 'Non-Grouped Enhancement',
            strength: {
              attributeValue: 5,
              isGrouped: false
            }
          }
        ]
      };

      const result = calculateObjectAttributeBreakdown(objectMixedEquip, 'strength');
      
      const groupedEnh = result.find(step => step.entityName === 'Grouped Enhancement');
      const nonGroupedEnh = result.find(step => step.entityName === 'Non-Grouped Enhancement');
      
      expect(groupedEnh).toBeDefined();
      expect(nonGroupedEnh).toBeUndefined();
    });

    it('should properly sort equipment by grouped value', () => {
      const objectSortTest = {
        name: 'Sort Test Object',
        strength: {
          attributeValue: 5,
          isGrouped: true
        },
        equipment: [
          {
            name: 'Small Enhancement',
            strength: {
              attributeValue: 1,
              isGrouped: true
            }
          },
          {
            name: 'Large Enhancement',
            strength: {
              attributeValue: 10,
              isGrouped: true
            }
          },
          {
            name: 'Medium Enhancement',
            strength: {
              attributeValue: 3,
              isGrouped: true
            }
          }
        ]
      };

      const result = calculateObjectAttributeBreakdown(objectSortTest, 'strength');
      
      // Find the positions of different enhancements
      const largeIndex = result.findIndex(step => step.entityName === 'Large Enhancement');
      const mediumIndex = result.findIndex(step => step.entityName === 'Medium Enhancement');
      const smallIndex = result.findIndex(step => step.entityName === 'Small Enhancement');
      
      // Large should come before medium, medium before small
      expect(largeIndex).toBeLessThan(mediumIndex);
      expect(mediumIndex).toBeLessThan(smallIndex);
    });

    it('should calculate proper running totals in breakdown', () => {
      const result = calculateObjectAttributeBreakdown(mockObject, 'strength');
      
      if (result.length > 1) {
        // Each step should have a valid running total
        result.forEach(step => {
          expect(step.runningTotal).toBeDefined();
          expect(typeof step.runningTotal).toBe('number');
          expect(step.runningTotal).toBeGreaterThan(0);
        });
        
        // Running totals should be meaningful values (not necessarily monotonic due to weighted average)
        for (let i = 1; i < result.length; i++) {
          expect(result[i].runningTotal).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle character with undefined name', () => {
      const character = {
        characterId: 'char-1',
        strength: {
          attribute: {
            attributeValue: 10,
            isGrouped: true
          }
        }
      };

      const result = calculateAttributeBreakdown(character, 'strength');
      expect(result[0].entityName).toBe('Character');
    });

    it('should handle object with undefined name', () => {
      const object = {
        objectId: 'obj-1',
        strength: {
          attributeValue: 8,
          isGrouped: true
        }
      };

      const result = calculateObjectAttributeBreakdown(object, 'strength');
      expect(result[0].entityName).toBe('Object');
    });

    it('should handle equipment with undefined names', () => {
      const character = {
        name: 'Test Character',
        strength: {
          attribute: {
            attributeValue: 10,
            isGrouped: true
          }
        },
        equipment: [
          {
            objectId: 'sword-1',
            strength: {
              attributeValue: 3,
              isGrouped: true
            }
          }
        ]
      };

      const result = calculateAttributeBreakdown(character, 'strength');
      expect(result.length).toBeGreaterThan(1);
    });

    it('should handle conditions with missing fields', () => {
      const character = {
        name: 'Test Character',
        strength: {
          attribute: {
            attributeValue: 10,
            isGrouped: true
          }
        },
        conditions: [
          {
            name: 'Incomplete Condition'
            // Missing conditionType, conditionTarget, amount
          },
          {
            conditionType: 'HELP'
            // Missing name, conditionTarget, amount
          }
        ]
      };

      const result = calculateAttributeBreakdown(character, 'strength');
      
      // Should not include invalid conditions
      const incompleteCondition = result.find(step => step.entityName === 'Incomplete Condition');
      expect(incompleteCondition).toBeUndefined();
    });

    it('should handle very large attribute values', () => {
      const character = {
        name: 'Powerful Character',
        strength: {
          attribute: {
            attributeValue: 1000,
            isGrouped: true
          }
        },
        equipment: [
          {
            name: 'Legendary Weapon',
            strength: {
              attributeValue: 500,
              isGrouped: true
            }
          }
        ]
      };

      const result = calculateAttributeBreakdown(character, 'strength');
      expect(result.length).toBe(2);
      expect(result[0].attributeValue).toBe(1000);
      expect(result[1].attributeValue).toBe(500);
    });

    it('should handle zero and negative attribute values', () => {
      const character = {
        name: 'Weak Character',
        strength: {
          attribute: {
            attributeValue: 0,
            isGrouped: true
          }
        },
        equipment: [
          {
            name: 'Cursed Item',
            strength: {
              attributeValue: -2,
              isGrouped: true
            }
          }
        ]
      };

      const result = calculateAttributeBreakdown(character, 'strength');
      expect(result.length).toBe(2);
      expect(result[0].attributeValue).toBe(0);
      expect(result[1].attributeValue).toBe(-2);
    });
  });
});