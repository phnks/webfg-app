const { handler } = require('../../../functions/resolveGroupedAttributes');

// Mock the utility functions
jest.mock('../../../utils/attributeGrouping', () => ({
  calculateGroupedAttributes: jest.fn()
}));

const { calculateGroupedAttributes } = require('../../../utils/attributeGrouping');

describe('resolveGroupedAttributes resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should resolve grouped attributes for character', async () => {
    const mockGroupedAttributes = {
      strength: 12,
      dexterity: 8,
      armour: 5
    };

    calculateGroupedAttributes.mockReturnValue(mockGroupedAttributes);

    const mockEvent = {
      parent: {
        characterId: 'char123',
        name: 'Test Character',
        strength: { attribute: { attributeValue: 10 } }
      }
    };

    const result = await handler(mockEvent);

    expect(calculateGroupedAttributes).toHaveBeenCalledWith(mockEvent.parent);
    expect(result).toEqual(mockGroupedAttributes);
  });

  test('should handle character with no parent data', async () => {
    const mockEvent = {};

    calculateGroupedAttributes.mockReturnValue({});

    const result = await handler(mockEvent);

    expect(calculateGroupedAttributes).toHaveBeenCalledWith(undefined);
    expect(result).toEqual({});
  });

  test('should handle utility function errors', async () => {
    calculateGroupedAttributes.mockImplementation(() => {
      throw new Error('Calculation error');
    });

    const mockEvent = {
      parent: {
        characterId: 'char123'
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Calculation error');
  });

  test('should pass through all character data to utility', async () => {
    const mockCharacter = {
      characterId: 'char123',
      name: 'Test Character',
      strength: { attribute: { attributeValue: 10 } },
      equipment: [{ objectId: 'sword1', strength: { attributeValue: 3 } }],
      conditions: []
    };

    calculateGroupedAttributes.mockReturnValue({ strength: 13 });

    const mockEvent = {
      parent: mockCharacter
    };

    await handler(mockEvent);

    expect(calculateGroupedAttributes).toHaveBeenCalledWith(mockCharacter);
  });

  test('should handle null parent', async () => {
    const mockEvent = {
      parent: null
    };

    calculateGroupedAttributes.mockReturnValue({});

    const result = await handler(mockEvent);

    expect(calculateGroupedAttributes).toHaveBeenCalledWith(null);
    expect(result).toEqual({});
  });
});