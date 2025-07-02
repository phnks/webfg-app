const { handler } = require('../../../functions/resolveAttributeBreakdown');

// Mock the utility functions
jest.mock('../../../utils/attributeBreakdown', () => ({
  calculateAttributeBreakdown: jest.fn()
}));

const { calculateAttributeBreakdown } = require('../../../utils/attributeBreakdown');

describe('resolveAttributeBreakdown resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should resolve attribute breakdown for character', async () => {
    const mockBreakdown = {
      breakdown: [
        { step: 1, description: 'Base attribute', value: 10, runningTotal: 10 },
        { step: 2, description: 'Equipment bonus', value: 3, runningTotal: 13 }
      ],
      total: 13
    };

    calculateAttributeBreakdown.mockReturnValue(mockBreakdown);

    const mockEvent = {
      parent: {
        characterId: 'char123',
        name: 'Test Character',
        strength: { attribute: { attributeValue: 10 } }
      },
      arguments: {
        attribute: 'strength'
      }
    };

    const result = await handler(mockEvent);

    expect(calculateAttributeBreakdown).toHaveBeenCalledWith(mockEvent.parent, 'strength');
    expect(result).toEqual(mockBreakdown);
  });

  test('should handle missing attribute argument', async () => {
    const mockEvent = {
      parent: {
        characterId: 'char123'
      },
      arguments: {}
    };

    calculateAttributeBreakdown.mockReturnValue({ breakdown: [], total: 0 });

    const result = await handler(mockEvent);

    expect(calculateAttributeBreakdown).toHaveBeenCalledWith(mockEvent.parent, undefined);
    expect(result).toEqual({ breakdown: [], total: 0 });
  });

  test('should handle missing parent', async () => {
    const mockEvent = {
      arguments: {
        attribute: 'strength'
      }
    };

    calculateAttributeBreakdown.mockReturnValue({ breakdown: [], total: 0 });

    const result = await handler(mockEvent);

    expect(calculateAttributeBreakdown).toHaveBeenCalledWith(undefined, 'strength');
    expect(result).toEqual({ breakdown: [], total: 0 });
  });

  test('should handle utility function errors', async () => {
    calculateAttributeBreakdown.mockImplementation(() => {
      throw new Error('Breakdown calculation error');
    });

    const mockEvent = {
      parent: {
        characterId: 'char123'
      },
      arguments: {
        attribute: 'strength'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Breakdown calculation error');
  });

  test('should pass through all character data', async () => {
    const mockCharacter = {
      characterId: 'char123',
      name: 'Test Character',
      strength: { attribute: { attributeValue: 10 } },
      equipment: [{ objectId: 'sword1', strength: { attributeValue: 3 } }],
      conditions: [{ name: 'Strength Boost', amount: 2 }]
    };

    calculateAttributeBreakdown.mockReturnValue({ breakdown: [], total: 15 });

    const mockEvent = {
      parent: mockCharacter,
      arguments: {
        attribute: 'strength'
      }
    };

    await handler(mockEvent);

    expect(calculateAttributeBreakdown).toHaveBeenCalledWith(mockCharacter, 'strength');
  });

  test('should handle null parent', async () => {
    const mockEvent = {
      parent: null,
      arguments: {
        attribute: 'strength'
      }
    };

    calculateAttributeBreakdown.mockReturnValue({ breakdown: [], total: 0 });

    const result = await handler(mockEvent);

    expect(calculateAttributeBreakdown).toHaveBeenCalledWith(null, 'strength');
    expect(result).toEqual({ breakdown: [], total: 0 });
  });

  test('should handle different attributes', async () => {
    const mockEvent = {
      parent: {
        characterId: 'char123',
        dexterity: { attribute: { attributeValue: 8 } }
      },
      arguments: {
        attribute: 'dexterity'
      }
    };

    calculateAttributeBreakdown.mockReturnValue({ breakdown: [], total: 8 });

    await handler(mockEvent);

    expect(calculateAttributeBreakdown).toHaveBeenCalledWith(mockEvent.parent, 'dexterity');
  });

  test('should handle empty breakdown result', async () => {
    calculateAttributeBreakdown.mockReturnValue({ breakdown: [], total: 0 });

    const mockEvent = {
      parent: { characterId: 'char123' },
      arguments: { attribute: 'intelligence' }
    };

    const result = await handler(mockEvent);

    expect(result.breakdown).toEqual([]);
    expect(result.total).toBe(0);
  });
});