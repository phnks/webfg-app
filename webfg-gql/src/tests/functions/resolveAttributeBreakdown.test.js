const { handler } = require('../../../functions/resolveAttributeBreakdown');

// Mock the AWS SDK
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockSend
    }))
  },
  GetCommand: jest.fn((params) => params)
}));

// Mock the breakdown utilities
jest.mock('../../../utils/attributeBreakdown', () => ({
  calculateAttributeBreakdown: jest.fn(),
  calculateObjectAttributeBreakdown: jest.fn()
}));

jest.mock('../../../utils/stringToNumber', () => ({
  toInt: jest.fn((value, defaultVal) => {
    if (typeof value === 'number') return Math.floor(value);
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? defaultVal : num;
    }
    return defaultVal;
  })
}));

const { calculateAttributeBreakdown, calculateObjectAttributeBreakdown } = require('../../../utils/attributeBreakdown');

describe('resolveAttributeBreakdown', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      OBJECTS_TABLE: 'test-objects-table',
      CONDITIONS_TABLE: 'test-conditions-table',
      AWS_REGION: 'us-east-1'
    };
    
    // Setup default mock return values
    calculateAttributeBreakdown.mockReturnValue([]);
    calculateObjectAttributeBreakdown.mockReturnValue([]);
    mockSend.mockResolvedValue({ Item: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('basic functionality', () => {
    it('should return empty array when no entity is provided', async () => {
      const event = {
        source: null,
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'strength' }
      };

      const result = await handler(event);
      expect(result).toEqual([]);
    });

    it('should return empty array when no attribute name is provided', async () => {
      const event = {
        source: { characterId: 'char-1' },
        info: { parentTypeName: 'Character' },
        arguments: {}
      };

      const result = await handler(event);
      expect(result).toEqual([]);
    });

    it('should throw error for unknown entity type', async () => {
      const event = {
        source: { id: 'test-id' },
        info: { parentTypeName: 'UnknownType' },
        arguments: { attributeName: 'strength' }
      };

      await expect(handler(event)).rejects.toThrow('Unknown entity type: UnknownType');
    });
  });

  describe('Character processing', () => {
    const mockCharacter = {
      characterId: 'char-1',
      name: 'Test Character',
      equipmentIds: ['obj-1', 'obj-2'],
      characterConditions: [{ conditionId: 'cond-1', amount: 2 }]
    };

    const mockEquipment = [
      {
        objectId: 'obj-1',
        name: 'Sword',
        strength: { attributeValue: 3, isGrouped: true }
      },
      {
        objectId: 'obj-2',
        name: 'Shield',
        armor: { attributeValue: 2, isGrouped: true }
      }
    ];

    const mockCondition = {
      conditionId: 'cond-1',
      name: 'Blessing',
      conditionType: 'HELP',
      conditionTarget: 'strength'
    };

    const mockBreakdown = [
      {
        step: 1,
        entityName: 'Test Character',
        entityType: 'character',
        attributeValue: 10,
        isGrouped: true,
        runningTotal: 10,
        formula: null
      },
      {
        step: 2,
        entityName: 'Sword',
        entityType: 'equipment',
        attributeValue: 3,
        isGrouped: true,
        runningTotal: 13,
        formula: 'Weighted Average: (10 + 3*(0.25+3/10)) / 2'
      }
    ];

    it('should calculate character attribute breakdown', async () => {
      const event = {
        source: mockCharacter,
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'strength' }
      };

      // Mock DynamoDB responses for equipment and conditions
      mockSend
        .mockResolvedValueOnce({ Item: mockEquipment[0] }) // First equipment
        .mockResolvedValueOnce({ Item: mockEquipment[1] }) // Second equipment  
        .mockResolvedValueOnce({ Item: mockCondition });   // Condition

      calculateAttributeBreakdown.mockReturnValue(mockBreakdown);

      const result = await handler(event);

      expect(calculateAttributeBreakdown).toHaveBeenCalled();
      expect(calculateAttributeBreakdown).toHaveBeenCalledWith(
        expect.objectContaining({
          characterId: 'char-1',
          name: 'Test Character',
          equipment: expect.arrayContaining([
            expect.objectContaining({ objectId: 'obj-1' }),
            expect.objectContaining({ objectId: 'obj-2' })
          ]),
          conditions: expect.arrayContaining([
            expect.objectContaining({ conditionId: 'cond-1', amount: 2 })
          ])
        }),
        'strength'
      );
      expect(result).toEqual(mockBreakdown);
    });

    it('should handle character with no equipment', async () => {
      const characterNoEquip = {
        ...mockCharacter,
        equipmentIds: []
      };

      const event = {
        source: characterNoEquip,
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'strength' }
      };

      // Mock condition fetch
      mockSend.mockResolvedValueOnce({ Item: mockCondition });

      const simpleBreakdown = [
        {
          step: 1,
          entityName: 'Test Character',
          entityType: 'character',
          attributeValue: 10,
          runningTotal: 10
        }
      ];

      calculateAttributeBreakdown.mockReturnValue(simpleBreakdown);

      const result = await handler(event);

      expect(calculateAttributeBreakdown).toHaveBeenCalled();
      expect(result).toEqual(simpleBreakdown);
    });

    it('should handle character with no conditions', async () => {
      const characterNoConditions = {
        ...mockCharacter,
        characterConditions: []
      };

      const event = {
        source: characterNoConditions,
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'strength' }
      };

      // Mock equipment fetches
      mockSend
        .mockResolvedValueOnce({ Item: mockEquipment[0] })
        .mockResolvedValueOnce({ Item: mockEquipment[1] });

      calculateAttributeBreakdown.mockReturnValue(mockBreakdown);

      const result = await handler(event);

      expect(calculateAttributeBreakdown).toHaveBeenCalled();
      expect(result).toEqual(mockBreakdown);
    });

    it('should handle missing equipment objects', async () => {
      const event = {
        source: mockCharacter,
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'strength' }
      };

      // Mock missing equipment and present condition
      mockSend
        .mockResolvedValueOnce({ Item: null })              // Missing equipment
        .mockResolvedValueOnce({ Item: mockEquipment[1] })  // Present equipment
        .mockResolvedValueOnce({ Item: mockCondition });    // Present condition

      calculateAttributeBreakdown.mockReturnValue(mockBreakdown);

      const result = await handler(event);

      expect(calculateAttributeBreakdown).toHaveBeenCalled();
      expect(result).toEqual(mockBreakdown);
    });

    it('should handle DynamoDB errors gracefully', async () => {
      const event = {
        source: mockCharacter,
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'strength' }
      };

      // Mock DynamoDB errors
      mockSend
        .mockRejectedValueOnce(new Error('Equipment fetch failed'))
        .mockResolvedValueOnce({ Item: mockEquipment[1] })
        .mockResolvedValueOnce({ Item: mockCondition });

      calculateAttributeBreakdown.mockReturnValue(mockBreakdown);

      const result = await handler(event);

      expect(calculateAttributeBreakdown).toHaveBeenCalled();
      expect(result).toEqual(mockBreakdown);
    });
  });

  describe('Object processing', () => {
    const mockObject = {
      objectId: 'obj-1',
      name: 'Main Object',
      equipmentIds: ['obj-2', 'obj-3']
    };

    const mockObjectEquipment = [
      {
        objectId: 'obj-2',
        name: 'Enhancement 1',
        strength: { attributeValue: 2, isGrouped: true }
      },
      {
        objectId: 'obj-3',
        name: 'Enhancement 2',
        strength: { attributeValue: 1, isGrouped: true }
      }
    ];

    const mockObjectBreakdown = [
      {
        step: 1,
        entityName: 'Main Object',
        entityType: 'object',
        attributeValue: 5,
        isGrouped: true,
        runningTotal: 5,
        formula: null
      },
      {
        step: 2,
        entityName: 'Enhancement 1',
        entityType: 'equipment',
        attributeValue: 2,
        isGrouped: true,
        runningTotal: 6.5,
        formula: 'Weighted Average: (5 + 2*(0.25+2/5)) / 2'
      }
    ];

    it('should calculate object attribute breakdown', async () => {
      const event = {
        source: mockObject,
        info: { parentTypeName: 'Object' },
        arguments: { attributeName: 'strength' }
      };

      // Mock equipment fetches
      mockSend
        .mockResolvedValueOnce({ Item: mockObjectEquipment[0] })
        .mockResolvedValueOnce({ Item: mockObjectEquipment[1] });

      calculateObjectAttributeBreakdown.mockReturnValue(mockObjectBreakdown);

      const result = await handler(event);

      expect(calculateObjectAttributeBreakdown).toHaveBeenCalled();
      expect(result).toEqual(mockObjectBreakdown);
    });

    it('should handle object with no equipment', async () => {
      const objectNoEquip = {
        ...mockObject,
        equipmentIds: []
      };

      const event = {
        source: objectNoEquip,
        info: { parentTypeName: 'Object' },
        arguments: { attributeName: 'strength' }
      };

      const simpleObjectBreakdown = [
        {
          step: 1,
          entityName: 'Main Object',
          entityType: 'object',
          attributeValue: 5,
          runningTotal: 5
        }
      ];

      calculateObjectAttributeBreakdown.mockReturnValue(simpleObjectBreakdown);

      const result = await handler(event);

      expect(calculateObjectAttributeBreakdown).toHaveBeenCalled();
      expect(result).toEqual(simpleObjectBreakdown);
    });

    it('should handle object with undefined equipmentIds', async () => {
      const simpleObject = {
        objectId: 'obj-1',
        name: 'Simple Object'
        // No equipmentIds field
      };

      const event = {
        source: simpleObject,
        info: { parentTypeName: 'Object' },
        arguments: { attributeName: 'weight' }
      };

      const breakdown = [
        {
          step: 1,
          entityName: 'Simple Object',
          entityType: 'object',
          attributeValue: 3,
          runningTotal: 3
        }
      ];

      calculateObjectAttributeBreakdown.mockReturnValue(breakdown);

      const result = await handler(event);

      expect(calculateObjectAttributeBreakdown).toHaveBeenCalled();
      expect(result).toEqual(breakdown);
    });

    it('should handle missing object equipment', async () => {
      const event = {
        source: mockObject,
        info: { parentTypeName: 'Object' },
        arguments: { attributeName: 'strength' }
      };

      // Mock one missing, one present equipment
      mockSend
        .mockResolvedValueOnce({ Item: null })
        .mockResolvedValueOnce({ Item: mockObjectEquipment[1] });

      calculateObjectAttributeBreakdown.mockReturnValue(mockObjectBreakdown);

      const result = await handler(event);

      expect(calculateObjectAttributeBreakdown).toHaveBeenCalled();
      expect(result).toEqual(mockObjectBreakdown);
    });
  });

  describe('error handling', () => {
    it('should handle errors from calculateAttributeBreakdown', async () => {
      const event = {
        source: { characterId: 'char-1' },
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'strength' }
      };

      calculateAttributeBreakdown.mockImplementation(() => {
        throw new Error('Breakdown calculation error');
      });

      await expect(handler(event)).rejects.toThrow('Failed to calculate attribute breakdown: Breakdown calculation error');
    });

    it('should handle errors from calculateObjectAttributeBreakdown', async () => {
      const event = {
        source: { objectId: 'obj-1' },
        info: { parentTypeName: 'Object' },
        arguments: { attributeName: 'strength' }
      };

      calculateObjectAttributeBreakdown.mockImplementation(() => {
        throw new Error('Object breakdown error');
      });

      await expect(handler(event)).rejects.toThrow('Failed to calculate attribute breakdown: Object breakdown error');
    });
  });

  describe('different attribute names', () => {
    it('should handle different attribute names for characters', async () => {
      const event = {
        source: { characterId: 'char-1' },
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'dexterity' }
      };

      const dexterityBreakdown = [
        {
          step: 1,
          entityName: 'Character',
          entityType: 'character',
          attributeValue: 8,
          runningTotal: 8
        }
      ];

      calculateAttributeBreakdown.mockReturnValue(dexterityBreakdown);

      const result = await handler(event);

      expect(calculateAttributeBreakdown).toHaveBeenCalledWith(
        expect.objectContaining({ characterId: 'char-1' }),
        'dexterity'
      );
      expect(result).toEqual(dexterityBreakdown);
    });

    it('should handle different attribute names for objects', async () => {
      const event = {
        source: { objectId: 'obj-1' },
        info: { parentTypeName: 'Object' },
        arguments: { attributeName: 'weight' }
      };

      const weightBreakdown = [
        {
          step: 1,
          entityName: 'Object',
          entityType: 'object',
          attributeValue: 5,
          runningTotal: 5
        }
      ];

      calculateObjectAttributeBreakdown.mockReturnValue(weightBreakdown);

      const result = await handler(event);

      expect(calculateObjectAttributeBreakdown).toHaveBeenCalledWith(
        expect.objectContaining({ objectId: 'obj-1' }),
        'weight'
      );
      expect(result).toEqual(weightBreakdown);
    });
  });

  describe('environment variables', () => {
    it('should use environment variables for table names', async () => {
      const event = {
        source: {
          characterId: 'char-1',
          equipmentIds: ['obj-1'],
          characterConditions: [{ conditionId: 'cond-1', amount: 1 }]
        },
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'strength' }
      };

      mockSend
        .mockResolvedValueOnce({ Item: { objectId: 'obj-1' } })
        .mockResolvedValueOnce({ Item: { conditionId: 'cond-1' } });

      calculateAttributeBreakdown.mockReturnValue([]);

      await handler(event);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'test-objects-table'
        })
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'test-conditions-table'
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty breakdown results', async () => {
      const event = {
        source: { characterId: 'char-1' },
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'nonexistent' }
      };

      calculateAttributeBreakdown.mockReturnValue([]);

      const result = await handler(event);

      expect(result).toEqual([]);
    });

    it('should handle null attribute name', async () => {
      const event = {
        source: { characterId: 'char-1' },
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: null }
      };

      const result = await handler(event);

      expect(result).toEqual([]);
    });

    it('should handle undefined attribute name', async () => {
      const event = {
        source: { characterId: 'char-1' },
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: undefined }
      };

      const result = await handler(event);

      expect(result).toEqual([]);
    });

    it('should handle character with complex equipment chains', async () => {
      const complexCharacter = {
        characterId: 'char-1',
        name: 'Complex Character',
        equipmentIds: ['obj-1', 'obj-2', 'obj-3'],
        characterConditions: [
          { conditionId: 'cond-1', amount: 2 },
          { conditionId: 'cond-2', amount: -1 }
        ]
      };

      const event = {
        source: complexCharacter,
        info: { parentTypeName: 'Character' },
        arguments: { attributeName: 'strength' }
      };

      // Mock multiple equipment and condition fetches
      mockSend
        .mockResolvedValueOnce({ Item: { objectId: 'obj-1', name: 'Sword' } })
        .mockResolvedValueOnce({ Item: { objectId: 'obj-2', name: 'Armor' } })
        .mockResolvedValueOnce({ Item: { objectId: 'obj-3', name: 'Ring' } })
        .mockResolvedValueOnce({ Item: { conditionId: 'cond-1', name: 'Blessing' } })
        .mockResolvedValueOnce({ Item: { conditionId: 'cond-2', name: 'Curse' } });

      const complexBreakdown = [
        { step: 1, entityName: 'Complex Character', entityType: 'character', attributeValue: 10, runningTotal: 10 },
        { step: 2, entityName: 'Sword', entityType: 'equipment', attributeValue: 3, runningTotal: 12.5 },
        { step: 3, entityName: 'Armor', entityType: 'equipment', attributeValue: 2, runningTotal: 13.7 },
        { step: 4, entityName: 'Ring', entityType: 'equipment', attributeValue: 1, runningTotal: 14.2 },
        { step: 5, entityName: 'Blessing', entityType: 'condition', attributeValue: 2, runningTotal: 16.2 },
        { step: 6, entityName: 'Curse', entityType: 'condition', attributeValue: -1, runningTotal: 15.2 }
      ];

      calculateAttributeBreakdown.mockReturnValue(complexBreakdown);

      const result = await handler(event);

      expect(calculateAttributeBreakdown).toHaveBeenCalled();
      expect(result).toEqual(complexBreakdown);
      expect(result).toHaveLength(6);
    });
  });
});