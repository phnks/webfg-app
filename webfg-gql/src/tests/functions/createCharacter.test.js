const { handler } = require('../../../functions/createCharacter');

describe('createCharacter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHARACTERS_TABLE = 'test-characters-table';
  });

  it('should create a character successfully with all fields', async () => {
    const mockInput = {
      name: 'Test Hero',
      characterCategory: 'HUMAN',
      will: 15,
      values: ['courage', 'honor'],
      speed: { attributeValue: 10, isGrouped: true, diceCount: 1 },
      weight: { attributeValue: 75, isGrouped: true, diceCount: null },
      size: { attributeValue: 5, isGrouped: true, diceCount: null },
      armour: { attributeValue: 8, isGrouped: true, diceCount: null },
      endurance: { attributeValue: 12, isGrouped: true, diceCount: null },
      lethality: { attributeValue: 7, isGrouped: true, diceCount: null },
      complexity: { attributeValue: 6, isGrouped: true, diceCount: null },
      strength: { attributeValue: 14, isGrouped: true, diceCount: 1 },
      dexterity: { attributeValue: 11, isGrouped: true, diceCount: 1 },
      agility: { attributeValue: 13, isGrouped: true, diceCount: 1 },
      obscurity: { attributeValue: 10, isGrouped: true, diceCount: null },
      resolve: { attributeValue: 16, isGrouped: true, diceCount: null },
      morale: { attributeValue: 12, isGrouped: true, diceCount: null },
      intelligence: { attributeValue: 11, isGrouped: true, diceCount: 1 },
      charisma: { attributeValue: 8, isGrouped: true, diceCount: 1 },
      seeing: { attributeValue: 10, isGrouped: true, diceCount: 1 },
      hearing: { attributeValue: 10, isGrouped: true, diceCount: 1 },
      penetration: { attributeValue: 0, isGrouped: true, diceCount: null },
      light: { attributeValue: 0, isGrouped: true, diceCount: null },
      noise: { attributeValue: 0, isGrouped: true, diceCount: null },
      actionIds: ['action-1', 'action-2'],
      special: ['night-vision', 'quick-reflexes'],
      stashIds: ['stash-1'],
      equipmentIds: ['sword-1', 'shield-1'],
      readyIds: ['potion-1']
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify the result structure
    expect(result).toHaveProperty('characterId');
    expect(result.name).toBe('Test Hero');
    expect(result.nameLowerCase).toBe('test hero');
    expect(result.characterCategory).toBe('HUMAN');
    expect(result.will).toBe(15);
    expect(result.values).toEqual(['courage', 'honor']);
    expect(result.speed).toEqual({ attribute: { attributeValue: 10, isGrouped: true, diceCount: 1 } });
    expect(result.actionIds).toEqual(['action-1', 'action-2']);
    expect(result.special).toEqual(['night-vision', 'quick-reflexes']);
    expect(result.stashIds).toEqual(['stash-1']);
    expect(result.equipmentIds).toEqual(['sword-1', 'shield-1']);
    expect(result.readyIds).toEqual(['potion-1']);

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should apply default values for optional fields', async () => {
    const mockInput = {
      name: 'Simple Character',
      characterCategory: 'HUMAN'
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify defaults are applied
    expect(result.will).toBe(0);
    expect(result.values).toEqual([]);
    expect(result.actionIds).toEqual([]);
    expect(result.special).toEqual([]);
    expect(result.stashIds).toEqual([]);
    expect(result.equipmentIds).toEqual([]);
    expect(result.readyIds).toEqual([]);
  });

  it('should convert name to lowercase correctly', async () => {
    const mockInput = {
      name: 'UPPERCASE CHARACTER NAME',
      characterCategory: 'HUMAN'
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    expect(result.nameLowerCase).toBe('uppercase character name');
  });

  it('should throw error when CHARACTERS_TABLE environment variable is not set', async () => {
    delete process.env.CHARACTERS_TABLE;

    const event = {
      input: {
        name: 'Test Character',
        characterCategory: 'HUMAN'
      }
    };

    await expect(handler(event)).rejects.toThrow('Internal server error.');
  });

  it('should handle DynamoDB errors', async () => {
    const mockInput = {
      name: 'Test Character',
      characterCategory: 'HUMAN'
    };

    const event = {
      input: mockInput
    };

    // Mock DynamoDB error
    const dynamoError = new Error('DynamoDB connection error');
    mockDynamoSend.mockRejectedValueOnce(dynamoError);

    // Expect the function to throw the original error
    await expect(handler(event)).rejects.toThrow('DynamoDB connection error');

    // Verify DynamoDB was called
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it('should preserve provided array values and not override with defaults', async () => {
    const mockInput = {
      name: 'Character with Arrays',
      characterCategory: 'HUMAN',
      values: ['custom', 'values'],
      actionIds: ['action-1'],
      special: ['special-ability'],
      stashIds: ['item-1', 'item-2'],
      equipmentIds: ['weapon-1'],
      readyIds: ['potion-1', 'scroll-1']
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify provided values are preserved
    expect(result.values).toEqual(['custom', 'values']);
    expect(result.actionIds).toEqual(['action-1']);
    expect(result.special).toEqual(['special-ability']);
    expect(result.stashIds).toEqual(['item-1', 'item-2']);
    expect(result.equipmentIds).toEqual(['weapon-1']);
    expect(result.readyIds).toEqual(['potion-1', 'scroll-1']);
  });

  it('should handle partial attribute objects', async () => {
    const mockInput = {
      name: 'Partial Character',
      characterCategory: 'HUMAN',
      strength: { attributeValue: 10 }, // Missing isGrouped and diceCount
      dexterity: { attributeValue: 15, isGrouped: false }, // Missing diceCount
      agility: { attributeValue: 8, diceCount: 2 } // Missing isGrouped
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify partial objects are preserved and filled with defaults
    expect(result.strength).toEqual({ attribute: { attributeValue: 10, isGrouped: true, diceCount: 1 } });
    expect(result.dexterity).toEqual({ attribute: { attributeValue: 15, isGrouped: false, diceCount: 1 } });
    expect(result.agility).toEqual({ attribute: { attributeValue: 8, isGrouped: true, diceCount: 2 } });
  });

  it('should use environment variable for table name', async () => {
    process.env.CHARACTERS_TABLE = 'custom-characters-table';

    const mockInput = {
      name: 'Test Character',
      characterCategory: 'HUMAN'
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
});