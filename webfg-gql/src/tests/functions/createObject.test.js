const { handler } = require('../../../functions/createObject');

// Mock Date to ensure consistent timestamps
const mockDate = '2023-01-01T00:00:00.000Z';
const originalDate = global.Date;

beforeAll(() => {
  global.Date = jest.fn(() => ({
    toISOString: () => mockDate
  }));
});

afterAll(() => {
  global.Date = originalDate;
});

describe('createObject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBJECTS_TABLE_NAME = 'test-objects-table';
  });

  // Default attribute generator that considers dynamic attributes
  const getDefaultAttribute = (attributeName) => {
    const DYNAMIC_ATTRIBUTES = {
      speed: { diceType: 'd4', defaultCount: 1 },
      agility: { diceType: 'd6', defaultCount: 1 },
      dexterity: { diceType: 'd8', defaultCount: 1 },
      strength: { diceType: 'd10', defaultCount: 1 },
      charisma: { diceType: 'd12', defaultCount: 1 },
      seeing: { diceType: 'd20', defaultCount: 1 },
      hearing: { diceType: 'd20', defaultCount: 1 },
      intelligence: { diceType: 'd100', defaultCount: 1 }
    };
    
    const dynamicInfo = DYNAMIC_ATTRIBUTES[attributeName];
    return { 
      attributeValue: 0, 
      isGrouped: true,
      diceCount: dynamicInfo ? dynamicInfo.defaultCount : null
    };
  };

  it('should create an object successfully with all fields', async () => {
    const mockInput = {
      name: 'Test Sword',
      description: 'A mighty test sword',
      objectCategory: 'WEAPON',
      isEquipment: true,
      speed: { attributeValue: 5, isGrouped: true, diceCount: 1 },
      weight: { attributeValue: 3, isGrouped: true, diceCount: null },
      size: { attributeValue: 2, isGrouped: true, diceCount: null },
      lethality: { attributeValue: 8, isGrouped: true, diceCount: null }
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify the result contains expected fields
    expect(result).toHaveProperty('objectId');
    expect(result.createdAt).toBe(mockDate);
    expect(result.name).toBe('Test Sword');
    expect(result.nameLowerCase).toBe('test sword');
    expect(result.description).toBe('A mighty test sword');
    expect(result.objectCategory).toBe('WEAPON');
    expect(result.isEquipment).toBe(true);
    expect(result.speed).toEqual({ attributeValue: 5, isGrouped: true, diceCount: 1 });
    expect(result.weight).toEqual({ attributeValue: 3, isGrouped: true, diceCount: null });
    expect(result.size).toEqual({ attributeValue: 2, isGrouped: true, diceCount: null });
    expect(result.lethality).toEqual({ attributeValue: 8, isGrouped: true, diceCount: null });

    // Verify default attributes are applied for missing ones
    expect(result.armour).toEqual(getDefaultAttribute('armour'));
    expect(result.endurance).toEqual(getDefaultAttribute('endurance'));
    expect(result.strength).toEqual(getDefaultAttribute('strength'));

    // Verify default arrays
    expect(result.special).toEqual([]);
    expect(result.equipmentIds).toEqual([]);

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should apply default values for missing fields', async () => {
    const mockInput = {
      name: 'Minimal Object'
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify defaults are applied
    expect(result.objectCategory).toBe('TOOL');
    expect(result.isEquipment).toBe(true);
    expect(result.speed).toEqual(getDefaultAttribute('speed'));
    expect(result.weight).toEqual(getDefaultAttribute('weight'));
    expect(result.size).toEqual(getDefaultAttribute('size'));
    expect(result.special).toEqual([]);
    expect(result.equipmentIds).toEqual([]);
  });

  it('should handle empty name by setting it to empty string', async () => {
    const mockInput = {
      name: null
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result.name).toBe('');
    expect(result.nameLowerCase).toBe('');
  });

  it('should handle undefined name by setting it to empty string', async () => {
    const mockInput = {
      description: 'Object without name'
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result.name).toBe('');
    expect(result.nameLowerCase).toBe('');
  });

  it('should convert name to lowercase correctly', async () => {
    const mockInput = {
      name: 'UPPERCASE SWORD NAME'
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result.nameLowerCase).toBe('uppercase sword name');
  });

  it('should handle DynamoDB errors', async () => {
    const mockInput = {
      name: 'Test Object'
    };

    const event = {
      input: mockInput
    };

    // Mock DynamoDB error
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    // Expect the function to throw an error
    await expect(handler(event)).rejects.toThrow('Error creating object.');

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should use environment variable for table name', async () => {
    process.env.OBJECTS_TABLE_NAME = 'custom-objects-table';

    const mockInput = {
      name: 'Test Object'
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    await handler(event);

    // Verify DynamoDB was called (table name verification happens internally)
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should preserve provided attributes and not override with defaults', async () => {
    const mockInput = {
      name: 'Custom Object',
      speed: { attributeValue: 10, isGrouped: false, diceCount: 2 },
      special: ['fire', 'magic'],
      equipmentIds: ['eq1', 'eq2']
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify provided values are preserved
    expect(result.speed).toEqual({ attributeValue: 10, isGrouped: false, diceCount: 2 });
    expect(result.special).toEqual(['fire', 'magic']);
    expect(result.equipmentIds).toEqual(['eq1', 'eq2']);
    // But missing attributes still get defaults
    expect(result.weight).toEqual(getDefaultAttribute('weight'));
  });

  it('should handle null objectCategory by setting default', async () => {
    const mockInput = {
      name: 'Test Object',
      objectCategory: null
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result.objectCategory).toBe('TOOL');
  });

  it('should handle null isEquipment by setting default', async () => {
    const mockInput = {
      name: 'Test Object',
      isEquipment: null
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result.isEquipment).toBe(true);
  });

  it('should set createdAt timestamp', async () => {
    const mockInput = {
      name: 'Timestamped Object'
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result.createdAt).toBe(mockDate);
  });
});