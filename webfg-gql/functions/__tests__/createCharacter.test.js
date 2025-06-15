const { describe, it, expect, beforeEach } = require('@jest/globals');
const { 
  mockCharacterOperations,
  createLambdaResponse, 
  createErrorResponse,
  verifyDynamoDBCall,
  ddbDocMock 
} = require('../../test-utils/aws-mocks');

// Import the function under test
const { handler: createCharacter } = require('../createCharacter');

describe('createCharacter Lambda Function', () => {
  let event, context;

  beforeEach(() => {
    context = createMockContext();
    mockCharacterOperations();
  });

  describe('successful character creation', () => {
    it('should create character with all required fields', async () => {
      const characterData = {
        name: 'Test Character',
        category: 'HUMAN',
        description: 'A test character',
        strength: 10,
        dexterity: 10,
        agility: 10,
        endurance: 10,
        vigor: 10,
        perception: 10,
        intelligence: 10,
        will: 10,
        social: 10,
        faith: 10,
        armor: 10,
        lethality: 10
      };

      event = createMockEvent({ input: characterData });

      const result = await createCharacter(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response).toHaveProperty('id');
      expect(response.name).toBe(characterData.name);
      expect(response.category).toBe(characterData.category);
      expect(response.description).toBe(characterData.description);
      expect(response).toHaveProperty('createdAt');
      expect(response).toHaveProperty('updatedAt');

      // Verify DynamoDB put operation was called
      verifyDynamoDBCall(ddbDocMock, require('@aws-sdk/lib-dynamodb').PutCommand, 1);
    });

    it('should create character with minimal required fields', async () => {
      const minimalCharacter = {
        name: 'Minimal Character',
        category: 'HUMAN'
      };

      event = createMockEvent({ input: minimalCharacter });

      const result = await createCharacter(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.name).toBe(minimalCharacter.name);
      expect(response.category).toBe(minimalCharacter.category);
      
      // Should have default values for attributes
      expect(response.strength).toBe(1);
      expect(response.dexterity).toBe(1);
      expect(response.agility).toBe(1);
    });

    it('should generate unique ID for each character', async () => {
      const characterData = {
        name: 'Character 1',
        category: 'HUMAN'
      };

      event = createMockEvent({ input: characterData });

      const result1 = await createCharacter(event, context);
      const response1 = JSON.parse(result1.body);

      const result2 = await createCharacter(event, context);
      const response2 = JSON.parse(result2.body);

      expect(response1.id).not.toBe(response2.id);
      expect(response1.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(response2.id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should set timestamps correctly', async () => {
      const characterData = {
        name: 'Timestamped Character',
        category: 'HUMAN'
      };

      event = createMockEvent({ input: characterData });

      const beforeCreate = new Date().toISOString();
      const result = await createCharacter(event, context);
      const afterCreate = new Date().toISOString();
      
      const response = JSON.parse(result.body);

      expect(response.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(response.createdAt).toBeLessThanOrEqual(afterCreate);
      expect(response.updatedAt).toBe(response.createdAt);
    });
  });

  describe('input validation', () => {
    it('should return 400 for missing name', async () => {
      const invalidCharacter = {
        category: 'HUMAN'
        // Missing required name field
      };

      event = createMockEvent({ input: invalidCharacter });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Name is required');
    });

    it('should return 400 for empty name', async () => {
      const invalidCharacter = {
        name: '',
        category: 'HUMAN'
      };

      event = createMockEvent({ input: invalidCharacter });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Name cannot be empty');
    });

    it('should return 400 for missing category', async () => {
      const invalidCharacter = {
        name: 'Test Character'
        // Missing required category field
      };

      event = createMockEvent({ input: invalidCharacter });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Category is required');
    });

    it('should return 400 for invalid category', async () => {
      const invalidCharacter = {
        name: 'Test Character',
        category: 'INVALID_CATEGORY'
      };

      event = createMockEvent({ input: invalidCharacter });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Invalid category');
    });

    it('should validate all character categories', async () => {
      const validCategories = ['HUMAN', 'ANIMAL', 'DIVINE', 'DEMONIC', 'UNDEAD', 'CONSTRUCT', 'ELEMENTAL'];

      for (const category of validCategories) {
        const characterData = {
          name: `${category} Character`,
          category: category
        };

        event = createMockEvent({ input: characterData });

        const result = await createCharacter(event, context);
        const response = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(response.category).toBe(category);
      }
    });

    it('should return 400 for negative attribute values', async () => {
      const invalidCharacter = {
        name: 'Invalid Character',
        category: 'HUMAN',
        strength: -5
      };

      event = createMockEvent({ input: invalidCharacter });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Attributes must be non-negative');
    });

    it('should return 400 for non-numeric attribute values', async () => {
      const invalidCharacter = {
        name: 'Invalid Character',
        category: 'HUMAN',
        strength: 'not a number'
      };

      event = createMockEvent({ input: invalidCharacter });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Attributes must be numeric');
    });

    it('should return 400 for excessively long name', async () => {
      const invalidCharacter = {
        name: 'a'.repeat(256), // Very long name
        category: 'HUMAN'
      };

      event = createMockEvent({ input: invalidCharacter });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Name too long');
    });

    it('should return 400 for excessively long description', async () => {
      const invalidCharacter = {
        name: 'Test Character',
        category: 'HUMAN',
        description: 'x'.repeat(2001) // Very long description
      };

      event = createMockEvent({ input: invalidCharacter });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Description too long');
    });
  });

  describe('error handling', () => {
    it('should return 400 for invalid JSON body', async () => {
      event = {
        ...createMockEvent(),
        body: 'invalid json'
      };

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Invalid JSON');
    });

    it('should return 400 for missing body', async () => {
      event = {
        ...createMockEvent(),
        body: null
      };

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Request body is required');
    });

    it('should return 400 for missing input in body', async () => {
      event = createMockEvent({
        // Missing input field
      });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Input is required');
    });

    it('should return 500 for DynamoDB errors', async () => {
      const dbError = new Error('DynamoDB write failed');
      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').PutCommand).rejects(dbError);

      const characterData = {
        name: 'Test Character',
        category: 'HUMAN'
      };

      event = createMockEvent({ input: characterData });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toHaveProperty('error');
    });

    it('should handle conditional check failures', async () => {
      const conditionalError = new Error('ConditionalCheckFailedException');
      conditionalError.name = 'ConditionalCheckFailedException';
      
      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').PutCommand).rejects(conditionalError);

      const characterData = {
        name: 'Duplicate Character',
        category: 'HUMAN'
      };

      event = createMockEvent({ input: characterData });

      const result = await createCharacter(event, context);

      expect(result.statusCode).toBe(409);
      expect(JSON.parse(result.body).error).toContain('Character already exists');
    });
  });

  describe('attribute defaults and transformations', () => {
    it('should apply default values for missing attributes', async () => {
      const characterData = {
        name: 'Default Character',
        category: 'HUMAN',
        strength: 15
        // Other attributes missing
      };

      event = createMockEvent({ input: characterData });

      const result = await createCharacter(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.strength).toBe(15); // Provided value
      expect(response.dexterity).toBe(1); // Default value
      expect(response.agility).toBe(1); // Default value
      expect(response.endurance).toBe(1); // Default value
    });

    it('should convert string numbers to integers', async () => {
      const characterData = {
        name: 'String Numbers Character',
        category: 'HUMAN',
        strength: '15',
        dexterity: '10.5'
      };

      event = createMockEvent({ input: characterData });

      const result = await createCharacter(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.strength).toBe(15);
      expect(response.dexterity).toBe(10); // Should be truncated to integer
    });

    it('should trim whitespace from string fields', async () => {
      const characterData = {
        name: '  Trimmed Character  ',
        category: 'HUMAN',
        description: '  This has whitespace  '
      };

      event = createMockEvent({ input: characterData });

      const result = await createCharacter(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.name).toBe('Trimmed Character');
      expect(response.description).toBe('This has whitespace');
    });
  });

  describe('response format', () => {
    it('should include CORS headers', async () => {
      const characterData = {
        name: 'CORS Test Character',
        category: 'HUMAN'
      };

      event = createMockEvent({ input: characterData });

      const result = await createCharacter(event, context);

      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Headers');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
    });

    it('should return proper Content-Type header', async () => {
      const characterData = {
        name: 'Content Type Test Character',
        category: 'HUMAN'
      };

      event = createMockEvent({ input: characterData });

      const result = await createCharacter(event, context);

      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    });

    it('should return valid JSON response', async () => {
      const characterData = {
        name: 'JSON Test Character',
        category: 'HUMAN'
      };

      event = createMockEvent({ input: characterData });

      const result = await createCharacter(event, context);

      expect(() => JSON.parse(result.body)).not.toThrow();
      
      const response = JSON.parse(result.body);
      expect(typeof response).toBe('object');
    });
  });
});