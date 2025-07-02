const { handler } = require('../../../functions/updateCharacterPosition');

// Mock constants
jest.mock('../../../functions/constants', () => ({
  TimelineEventType: {
    CHARACTER_MOVED: 'CHARACTER_MOVED'
  }
}));

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
  GetCommand: jest.fn(),
  UpdateCommand: jest.fn()
}));

const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const mockSend = jest.fn();

// Setup mock return value
DynamoDBDocumentClient.from.mockReturnValue({
  send: mockSend
});

describe('updateCharacterPosition Lambda function', () => {
  const mockEncounter = {
    encounterId: 'enc123',
    characterPositions: [
      { characterId: 'char123', x: 0, y: 0 }
    ],
    currentTime: 100,
    objectPositions: [],
    terrainElements: [],
    gridElements: [],
    history: []
  };

  const mockCharacter = {
    characterId: 'char123',
    name: 'Test Hero',
    stats: {
      hitPoints: { current: 50 },
      fatigue: { current: 10 },
      surges: { current: 3 },
      exhaustion: { current: 0 }
    },
    conditions: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENCOUNTERS_TABLE = 'test-encounters-table';
    process.env.CHARACTERS_TABLE = 'test-characters-table';
  });

  afterEach(() => {
    delete process.env.ENCOUNTERS_TABLE;
    delete process.env.CHARACTERS_TABLE;
  });

  test('should update character position successfully', async () => {
    // Mock the encounter fetch
    mockSend
      .mockResolvedValueOnce({ Item: mockEncounter })  // First GetCommand - encounter
      .mockResolvedValueOnce({ Item: mockCharacter })  // Second GetCommand - character  
      .mockResolvedValueOnce({})                       // UpdateCommand
      .mockResolvedValueOnce({ Item: {                 // Final GetCommand - encounter after update
        ...mockEncounter,
        characterPositions: [{ characterId: 'char123', x: 5, y: 3 }],
        history: [{
          time: 100,
          type: 'CHARACTER_MOVED',
          characterId: 'char123',
          description: 'Test Hero moved to position (25ft, 15ft)',
          x: 5,
          y: 3,
          stats: {
            hitPoints: 50,
            fatigue: 10,
            surges: 3,
            exhaustion: 0
          },
          conditions: []
        }]
      }});

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123',
        x: 5,
        y: 3
      }
    };

    const result = await handler(mockEvent);

    expect(GetCommand).toHaveBeenCalledTimes(3); // encounter, character, encounter after update
    expect(UpdateCommand).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledTimes(4);

    expect(result.encounterId).toBe('enc123');
    expect(result.characterPositions[0].x).toBe(5);
    expect(result.characterPositions[0].y).toBe(3);
    expect(result.history).toHaveLength(1);
    expect(result.history[0].description).toBe('Test Hero moved to position (25ft, 15ft)');
  });

  test('should handle character not found in encounter', async () => {
    const encounterWithoutChar = {
      ...mockEncounter,
      characterPositions: [
        { characterId: 'other-char', x: 0, y: 0 }
      ]
    };

    mockSend.mockResolvedValueOnce({ Item: encounterWithoutChar });

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123',
        x: 5,
        y: 3
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Character char123 not found in encounter enc123');
  });

  test('should handle encounter not found', async () => {
    mockSend.mockResolvedValueOnce({ Item: null });

    const mockEvent = {
      arguments: {
        encounterId: 'nonexistent',
        characterId: 'char123',
        x: 5,
        y: 3
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Encounter nonexistent or its characterPositions not found');
  });

  test('should handle character not found in database', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: mockEncounter })  // encounter found
      .mockResolvedValueOnce({ Item: null });          // character not found

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123',
        x: 5,
        y: 3
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('Character with ID char123 not found');
  });

  test('should handle default coordinates', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: mockEncounter })
      .mockResolvedValueOnce({ Item: mockCharacter })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Item: {
        ...mockEncounter,
        history: [{
          time: 100,
          type: 'CHARACTER_MOVED',
          characterId: 'char123',
          description: 'Test Hero moved to position (0ft, 0ft)',
          x: 0,
          y: 0,
          stats: {
            hitPoints: 50,
            fatigue: 10,
            surges: 3,
            exhaustion: 0
          },
          conditions: []
        }]
      }});

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123'
        // x and y not provided - should default to 0
      }
    };

    const result = await handler(mockEvent);

    expect(result.history[0].description).toBe('Test Hero moved to position (0ft, 0ft)');
    expect(result.history[0].x).toBe(0);
    expect(result.history[0].y).toBe(0);
  });

  test('should handle character with missing stats', async () => {
    const characterWithoutStats = {
      characterId: 'char123',
      name: 'Test Hero'
      // No stats property
    };

    mockSend
      .mockResolvedValueOnce({ Item: mockEncounter })
      .mockResolvedValueOnce({ Item: characterWithoutStats })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Item: {
        ...mockEncounter,
        history: [{
          time: 100,
          type: 'CHARACTER_MOVED',
          characterId: 'char123',
          description: 'Test Hero moved to position (25ft, 15ft)',
          x: 5,
          y: 3,
          stats: {
            hitPoints: 0,
            fatigue: 0,
            surges: 0,
            exhaustion: 0
          },
          conditions: []
        }]
      }});

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123',
        x: 5,
        y: 3
      }
    };

    const result = await handler(mockEvent);

    expect(result.history[0].stats).toEqual({
      hitPoints: 0,
      fatigue: 0,
      surges: 0,
      exhaustion: 0
    });
  });

  test('should handle character without name', async () => {
    const characterWithoutName = {
      characterId: 'char123',
      stats: mockCharacter.stats,
      conditions: []
    };

    mockSend
      .mockResolvedValueOnce({ Item: mockEncounter })
      .mockResolvedValueOnce({ Item: characterWithoutName })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Item: {
        ...mockEncounter,
        history: [{
          time: 100,
          type: 'CHARACTER_MOVED',
          characterId: 'char123',
          description: 'Unknown Character moved to position (25ft, 15ft)',
          x: 5,
          y: 3,
          stats: {
            hitPoints: 50,
            fatigue: 10,
            surges: 3,
            exhaustion: 0
          },
          conditions: []
        }]
      }});

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123',
        x: 5,
        y: 3
      }
    };

    const result = await handler(mockEvent);

    expect(result.history[0].description).toBe('Unknown Character moved to position (25ft, 15ft)');
  });

  test('should scale coordinates correctly in description', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: mockEncounter })
      .mockResolvedValueOnce({ Item: mockCharacter })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Item: {
        ...mockEncounter,
        history: [{
          time: 100,
          type: 'CHARACTER_MOVED',
          characterId: 'char123',
          description: 'Test Hero moved to position (50ft, 75ft)',
          x: 10,
          y: 15,
          stats: mockCharacter.stats,
          conditions: []
        }]
      }});

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123',
        x: 10,
        y: 15
      }
    };

    const result = await handler(mockEvent);

    // 10 * 5 = 50ft, 15 * 5 = 75ft
    expect(result.history[0].description).toBe('Test Hero moved to position (50ft, 75ft)');
  });

  test('should use encounter current time for history event', async () => {
    const encounterWithTime = {
      ...mockEncounter,
      currentTime: 500
    };

    mockSend
      .mockResolvedValueOnce({ Item: encounterWithTime })
      .mockResolvedValueOnce({ Item: mockCharacter })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Item: {
        ...encounterWithTime,
        history: [{
          time: 500, // Should use encounter's currentTime
          type: 'CHARACTER_MOVED',
          characterId: 'char123',
          description: 'Test Hero moved to position (25ft, 15ft)',
          x: 5,
          y: 3,
          stats: mockCharacter.stats,
          conditions: []
        }]
      }});

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123',
        x: 5,
        y: 3
      }
    };

    const result = await handler(mockEvent);

    expect(result.history[0].time).toBe(500);
  });

  test('should include all encounter data in response', async () => {
    const fullEncounter = {
      ...mockEncounter,
      objectPositions: [{ objectId: 'obj1', x: 2, y: 2 }],
      terrainElements: [{ type: 'wall', x: 1, y: 1 }],
      gridElements: [{ type: 'grid', size: 5 }]
    };

    mockSend
      .mockResolvedValueOnce({ Item: fullEncounter })
      .mockResolvedValueOnce({ Item: mockCharacter })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Item: fullEncounter });

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123',
        x: 5,
        y: 3
      }
    };

    const result = await handler(mockEvent);

    expect(result.objectPositions).toEqual([{ objectId: 'obj1', x: 2, y: 2 }]);
    expect(result.terrainElements).toEqual([{ type: 'wall', x: 1, y: 1 }]);
    expect(result.gridElements).toEqual([{ type: 'grid', size: 5 }]);
  });

  test('should handle DynamoDB errors', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB connection failed'));

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123',
        x: 5,
        y: 3
      }
    };

    await expect(handler(mockEvent)).rejects.toThrow('DynamoDB connection failed');
  });

  test('should handle missing environment variables', async () => {
    delete process.env.ENCOUNTERS_TABLE;
    delete process.env.CHARACTERS_TABLE;

    mockSend.mockResolvedValueOnce({ Item: mockEncounter });

    const mockEvent = {
      arguments: {
        encounterId: 'enc123',
        characterId: 'char123',
        x: 5,
        y: 3
      }
    };

    await handler(mockEvent);

    const getCall = GetCommand.mock.calls[0][0];
    expect(getCall.TableName).toBeUndefined();
  });
});