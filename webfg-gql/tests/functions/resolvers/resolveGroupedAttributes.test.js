const { handler } = require('../../../functions/resolveGroupedAttributes');

// Mock AWS SDK
jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({}))
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn()
    }))
  },
  GetCommand: jest.fn()
}));

// Mock the utility functions
jest.mock('../../../utils/attributeGrouping', () => ({
  calculateGroupedAttributes: jest.fn(),
  calculateObjectGroupedAttributes: jest.fn()
}));

const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { calculateGroupedAttributes, calculateObjectGroupedAttributes } = require('../../../utils/attributeGrouping');
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('resolveGroupedAttributes resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE = 'test-objects-table';
    process.env.CONDITIONS_TABLE = 'test-conditions-table';
  });

  afterEach(() => {
    delete process.env.OBJECTS_TABLE;
    delete process.env.CONDITIONS_TABLE;
  });

  test('should resolve grouped attributes for character', async () => {
    const mockGroupedAttributes = {
      strength: 12,
      dexterity: 8,
      armour: 5,
      agility: null,
      perception: null,
      charisma: null,
      intelligence: null,
      resolve: null,
      morale: null,
      speed: null,
      weight: null,
      size: null,
      intensity: null,
      lethality: null,
      endurance: null
    };

    calculateGroupedAttributes.mockReturnValue(mockGroupedAttributes);
    mockSend.mockResolvedValue({ Item: null }); // Mock empty equipment/conditions

    const mockEvent = {
      source: {
        characterId: 'char123',
        name: 'Test Character',
        strength: { attribute: { attributeValue: 10 } },
        equipmentIds: [],
        characterConditions: []
      },
      info: {
        parentTypeName: 'Character'
      }
    };

    const result = await handler(mockEvent);

    expect(calculateGroupedAttributes).toHaveBeenCalled();
    expect(result).toEqual({
      strength: 12,
      dexterity: 8,
      armour: 5,
      agility: null,
      perception: null,
      charisma: null,
      intelligence: null,
      resolve: null,
      morale: null,
      speed: null,
      weight: null,
      size: null,
      intensity: null,
      lethality: null,
      endurance: null
    });
  });

  test('should resolve grouped attributes for object', async () => {
    const mockGroupedAttributes = {
      strength: 5,
      weight: 3,
      lethality: 8
    };

    calculateObjectGroupedAttributes.mockReturnValue(mockGroupedAttributes);
    mockSend.mockResolvedValue({ Item: null }); // Mock empty equipment

    const mockEvent = {
      source: {
        objectId: 'obj123',
        name: 'Test Object',
        equipmentIds: []
      },
      info: {
        parentTypeName: 'Object'
      }
    };

    const result = await handler(mockEvent);

    expect(calculateObjectGroupedAttributes).toHaveBeenCalled();
    expect(result.strength).toBe(5);
    expect(result.weight).toBe(3);
    expect(result.lethality).toBe(8);
  });

  test('should handle character with no source data', async () => {
    const mockEvent = {
      source: null,
      info: {
        parentTypeName: 'Character'
      }
    };

    const result = await handler(mockEvent);

    expect(result).toEqual({
      speed: null,
      weight: null,
      size: null,
      intensity: null,
      lethality: null,
      armour: null,
      endurance: null,
      strength: null,
      dexterity: null,
      agility: null,
      perception: null,
      charisma: null,
      intelligence: null,
      resolve: null,
      morale: null
    });
  });

  test('should handle utility function errors', async () => {
    calculateGroupedAttributes.mockImplementation(() => {
      throw new Error('Calculation error');
    });

    mockSend.mockResolvedValue({ Item: null });

    const mockEvent = {
      source: {
        characterId: 'char123'
      },
      info: {
        parentTypeName: 'Character'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to calculate grouped attributes: Calculation error');
  });

  test('should handle unknown entity type', async () => {
    const mockEvent = {
      source: {
        id: 'test123'
      },
      info: {
        parentTypeName: 'UnknownType'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Failed to calculate grouped attributes: Unknown entity type: UnknownType');
  });

  test('should enrich character with equipment', async () => {
    const mockEquipment = {
      objectId: 'sword1',
      name: 'Iron Sword',
      strength: { attributeValue: 3 }
    };

    mockSend.mockResolvedValue({ Item: mockEquipment });
    calculateGroupedAttributes.mockReturnValue({ strength: 13 });

    const mockEvent = {
      source: {
        characterId: 'char123',
        equipmentIds: ['sword1'],
        characterConditions: []
      },
      info: {
        parentTypeName: 'Character'
      }
    };

    await handler(mockEvent);

    expect(mockSend).toHaveBeenCalled();
    expect(GetCommand).toHaveBeenCalledWith({
      TableName: 'test-objects-table',
      Key: { objectId: 'sword1' }
    });
  });

  test('should enrich character with conditions', async () => {
    const mockCondition = {
      conditionId: 'cond1',
      name: 'Strength Boost',
      conditionType: 'HELP'
    };

    mockSend.mockResolvedValue({ Item: mockCondition });
    calculateGroupedAttributes.mockReturnValue({ strength: 15 });

    const mockEvent = {
      source: {
        characterId: 'char123',
        equipmentIds: [],
        characterConditions: [{ conditionId: 'cond1', amount: 5 }]
      },
      info: {
        parentTypeName: 'Character'
      }
    };

    await handler(mockEvent);

    expect(mockSend).toHaveBeenCalled();
    expect(GetCommand).toHaveBeenCalledWith({
      TableName: 'test-conditions-table',
      Key: { conditionId: 'cond1' }
    });
  });

  test('should handle missing info property', async () => {
    const mockEvent = {
      source: {
        characterId: 'char123'
      }
      // Missing info property
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });
});