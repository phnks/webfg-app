const { describe, it, expect, beforeEach } = require('@jest/globals');
const { 
  mockActionTestData, 
  createLambdaResponse, 
  createErrorResponse,
  verifyDynamoDBCall,
  ddbDocMock 
} = require('../../test-utils/aws-mocks');

// Import the function under test
const { handler: calculateActionTest } = require('../calculateActionTest');

describe('calculateActionTest Lambda Function', () => {
  let event, context, mockData;

  beforeEach(() => {
    context = createMockContext();
    mockData = mockActionTestData();
  });

  describe('successful action test calculation', () => {
    it('should calculate action test with basic parameters', async () => {
      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'target-char',
        actionId: 'action-123'
      });

      const result = await calculateActionTest(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response).toHaveProperty('difficulty');
      expect(response).toHaveProperty('sourceValue');
      expect(response).toHaveProperty('targetValue');
      expect(response).toHaveProperty('rollRequired');
      expect(response.sourceValue).toBe(15); // Source character strength
      expect(response.targetValue).toBe(8);  // Target character armor
      expect(response.difficulty).toBe(-7);  // 8 - 15 = -7

      // Verify DynamoDB calls were made
      verifyDynamoDBCall(ddbDocMock, require('@aws-sdk/lib-dynamodb').GetCommand, 3);
    });

    it('should handle positive difficulty calculation', async () => {
      // Mock target with higher armor than source strength
      const strongTarget = mockCharacter({
        id: 'strong-target',
        armor: 20
      });

      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').GetCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: 'strong-target' }
      }).resolves({ Item: strongTarget });

      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'strong-target',
        actionId: 'action-123'
      });

      const result = await calculateActionTest(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.difficulty).toBe(5); // 20 - 15 = 5
      expect(response.targetValue).toBe(20);
    });

    it('should include action modifiers in calculation', async () => {
      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'target-char',
        actionId: 'action-123',
        actionModifier: 3
      });

      const result = await calculateActionTest(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response).toHaveProperty('actionModifier');
      expect(response.actionModifier).toBe(3);
      // Difficulty should factor in the modifier
      expect(response.adjustedDifficulty).toBe(-10); // -7 - 3 = -10
    });

    it('should handle equipped items affecting attributes', async () => {
      // Mock equipped items query
      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').QueryCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        IndexName: 'CharacterEquippedIndex',
        KeyConditionExpression: 'characterId = :characterId and inventoryType = :inventoryType'
      }).resolves({
        Items: [
          {
            id: 'equipped-1',
            objectId: 'sword-123',
            characterId: 'source-char',
            inventoryType: 'equipped',
            object: mockObject({
              id: 'sword-123',
              name: 'Magic Sword',
              strength: 5 // Adds to character strength
            })
          }
        ]
      });

      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'target-char',
        actionId: 'action-123'
      });

      const result = await calculateActionTest(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      // Source value should include equipment bonus
      expect(response.sourceValue).toBe(20); // 15 + 5 = 20
      expect(response.difficulty).toBe(-12); // 8 - 20 = -12
    });

    it('should handle conditions affecting attributes', async () => {
      // Mock conditions query
      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').QueryCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        IndexName: 'CharacterConditionsIndex',
        KeyConditionExpression: 'characterId = :characterId'
      }).resolves({
        Items: [
          {
            id: 'condition-1',
            conditionId: 'weakness-123',
            characterId: 'source-char',
            condition: mockCondition({
              id: 'weakness-123',
              name: 'Weakness',
              type: 'hinder',
              attribute: 'strength',
              value: 3
            })
          }
        ]
      });

      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'target-char',
        actionId: 'action-123'
      });

      const result = await calculateActionTest(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      // Source value should be reduced by condition
      expect(response.sourceValue).toBe(12); // 15 - 3 = 12
      expect(response.difficulty).toBe(-4); // 8 - 12 = -4
    });
  });

  describe('error handling', () => {
    it('should return 400 for missing required parameters', async () => {
      event = createMockEvent({
        // Missing required parameters
      });

      const result = await calculateActionTest(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error');
    });

    it('should return 400 for invalid JSON body', async () => {
      event = {
        ...createMockEvent(),
        body: 'invalid json'
      };

      const result = await calculateActionTest(event, context);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Invalid JSON');
    });

    it('should return 404 when source character not found', async () => {
      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').GetCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: 'nonexistent-char' }
      }).resolves({ Item: undefined });

      event = createMockEvent({
        sourceCharacterId: 'nonexistent-char',
        targetCharacterId: 'target-char',
        actionId: 'action-123'
      });

      const result = await calculateActionTest(event, context);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toContain('Source character not found');
    });

    it('should return 404 when target character not found', async () => {
      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').GetCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: 'nonexistent-target' }
      }).resolves({ Item: undefined });

      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'nonexistent-target',
        actionId: 'action-123'
      });

      const result = await calculateActionTest(event, context);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toContain('Target character not found');
    });

    it('should return 404 when action not found', async () => {
      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').GetCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: 'nonexistent-action' }
      }).resolves({ Item: undefined });

      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'target-char',
        actionId: 'nonexistent-action'
      });

      const result = await calculateActionTest(event, context);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toContain('Action not found');
    });

    it('should return 500 for DynamoDB errors', async () => {
      const dbError = new Error('DynamoDB connection failed');
      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').GetCommand).rejects(dbError);

      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'target-char',
        actionId: 'action-123'
      });

      const result = await calculateActionTest(event, context);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toHaveProperty('error');
    });
  });

  describe('edge cases', () => {
    it('should handle zero attribute values', async () => {
      const weakCharacter = mockCharacter({
        id: 'weak-char',
        strength: 0
      });

      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').GetCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: 'weak-char' }
      }).resolves({ Item: weakCharacter });

      event = createMockEvent({
        sourceCharacterId: 'weak-char',
        targetCharacterId: 'target-char',
        actionId: 'action-123'
      });

      const result = await calculateActionTest(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.sourceValue).toBe(0);
      expect(response.difficulty).toBe(8); // 8 - 0 = 8
    });

    it('should handle negative attribute values', async () => {
      const debuffedCharacter = mockCharacter({
        id: 'debuffed-char',
        armor: -5
      });

      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').GetCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: 'debuffed-char' }
      }).resolves({ Item: debuffedCharacter });

      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'debuffed-char',
        actionId: 'action-123'
      });

      const result = await calculateActionTest(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.targetValue).toBe(-5);
      expect(response.difficulty).toBe(-20); // -5 - 15 = -20
    });

    it('should handle very high attribute values', async () => {
      const godlikeCharacter = mockCharacter({
        id: 'godlike-char',
        strength: 9999
      });

      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').GetCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: 'godlike-char' }
      }).resolves({ Item: godlikeCharacter });

      event = createMockEvent({
        sourceCharacterId: 'godlike-char',
        targetCharacterId: 'target-char',
        actionId: 'action-123'
      });

      const result = await calculateActionTest(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.sourceValue).toBe(9999);
      expect(response.difficulty).toBe(-9991); // 8 - 9999 = -9991
    });
  });

  describe('action types', () => {
    it('should handle trigger actions', async () => {
      const triggerAction = mockAction({
        id: 'trigger-action',
        type: 'trigger',
        triggersActionId: 'next-action-123'
      });

      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').GetCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: 'trigger-action' }
      }).resolves({ Item: triggerAction });

      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'target-char',
        actionId: 'trigger-action'
      });

      const result = await calculateActionTest(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.actionType).toBe('trigger');
      expect(response.triggersActionId).toBe('next-action-123');
    });

    it('should handle destroy actions', async () => {
      const destroyAction = mockAction({
        id: 'destroy-action',
        type: 'destroy'
      });

      ddbDocMock.on(require('@aws-sdk/lib-dynamodb').GetCommand, {
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: 'destroy-action' }
      }).resolves({ Item: destroyAction });

      event = createMockEvent({
        sourceCharacterId: 'source-char',
        targetCharacterId: 'target-char',
        actionId: 'destroy-action'
      });

      const result = await calculateActionTest(event, context);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.actionType).toBe('destroy');
      expect(response.isDestructive).toBe(true);
    });
  });
});