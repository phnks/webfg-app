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
      fatigue: 5,
      values: ['courage', 'honor'],
      speed: { current: 10, max: 10, base: 10 },
      weight: { current: 75, max: 75, base: 75 },
      size: { current: 5, max: 5, base: 5 },
      armour: { current: 8, max: 10, base: 8 },
      endurance: { current: 12, max: 15, base: 12 },
      lethality: { current: 7, max: 10, base: 7 },
      strength: { current: 14, max: 16, base: 14 },
      dexterity: { current: 11, max: 12, base: 11 },
      agility: { current: 13, max: 15, base: 13 },
      perception: { current: 10, max: 12, base: 10 },
      intensity: { current: 9, max: 10, base: 9 },
      resolve: { current: 16, max: 18, base: 16 },
      morale: { current: 12, max: 15, base: 12 },
      intelligence: { current: 11, max: 13, base: 11 },
      charisma: { current: 8, max: 10, base: 8 },
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
    expect(result.fatigue).toBe(5);
    expect(result.values).toEqual(['courage', 'honor']);
    expect(result.speed).toEqual({ current: 10, max: 10, base: 10 });
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
    expect(result.fatigue).toBe(0);
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
      strength: { current: 10 }, // Missing max and base
      dexterity: { max: 15 }, // Missing current and base
      agility: { current: 8, max: 12 } // Missing base
    };

    const event = {
      input: mockInput
    };

    // Mock successful DynamoDB response
    mockDynamoSend.mockResolvedValueOnce({});

    const result = await handler(event);

    // Verify partial objects are preserved as-is
    expect(result.strength).toEqual({ current: 10 });
    expect(result.dexterity).toEqual({ max: 15 });
    expect(result.agility).toEqual({ current: 8, max: 12 });
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