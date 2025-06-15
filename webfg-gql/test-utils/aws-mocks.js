const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand, 
  ScanCommand, 
  QueryCommand 
} = require('@aws-sdk/lib-dynamodb');

// Create mocked DynamoDB clients
const ddbMock = mockClient(DynamoDBClient);
const ddbDocMock = mockClient(DynamoDBDocumentClient);

/**
 * Setup DynamoDB mocks for testing
 */
function setupDynamoDBMocks() {
  // Reset all mocks
  ddbMock.reset();
  ddbDocMock.reset();
  
  return { ddbMock, ddbDocMock };
}

/**
 * Mock successful DynamoDB operations
 */
function mockDynamoDBSuccess() {
  const { ddbMock, ddbDocMock } = setupDynamoDBMocks();
  
  // Mock successful get operation
  ddbDocMock.on(GetCommand).resolves({
    Item: mockDynamoDBItem()
  });
  
  // Mock successful put operation
  ddbDocMock.on(PutCommand).resolves({
    Attributes: mockDynamoDBItem()
  });
  
  // Mock successful update operation
  ddbDocMock.on(UpdateCommand).resolves({
    Attributes: mockDynamoDBItem()
  });
  
  // Mock successful delete operation
  ddbDocMock.on(DeleteCommand).resolves({
    Attributes: mockDynamoDBItem()
  });
  
  // Mock successful scan operation
  ddbDocMock.on(ScanCommand).resolves({
    Items: [mockDynamoDBItem()],
    Count: 1,
    ScannedCount: 1
  });
  
  // Mock successful query operation
  ddbDocMock.on(QueryCommand).resolves({
    Items: [mockDynamoDBItem()],
    Count: 1,
    ScannedCount: 1
  });
  
  return { ddbMock, ddbDocMock };
}

/**
 * Mock DynamoDB errors
 */
function mockDynamoDBError(errorType = 'InternalServerError', message = 'Mock error') {
  const { ddbMock, ddbDocMock } = setupDynamoDBMocks();
  
  const error = new Error(message);
  error.name = errorType;
  
  ddbDocMock.on(GetCommand).rejects(error);
  ddbDocMock.on(PutCommand).rejects(error);
  ddbDocMock.on(UpdateCommand).rejects(error);
  ddbDocMock.on(DeleteCommand).rejects(error);
  ddbDocMock.on(ScanCommand).rejects(error);
  ddbDocMock.on(QueryCommand).rejects(error);
  
  return { ddbMock, ddbDocMock, error };
}

/**
 * Mock specific DynamoDB operation
 */
function mockDynamoDBOperation(command, response) {
  const { ddbDocMock } = setupDynamoDBMocks();
  
  if (response instanceof Error) {
    ddbDocMock.on(command).rejects(response);
  } else {
    ddbDocMock.on(command).resolves(response);
  }
  
  return ddbDocMock;
}

/**
 * Mock character-specific DynamoDB operations
 */
function mockCharacterOperations() {
  const { ddbDocMock } = setupDynamoDBMocks();
  
  // Mock character get
  ddbDocMock.on(GetCommand, {
    TableName: process.env.DYNAMODB_TABLE,
    Key: { id: 'char-123' }
  }).resolves({
    Item: mockCharacter()
  });
  
  // Mock character create/update
  ddbDocMock.on(PutCommand).resolves({
    Attributes: mockCharacter()
  });
  
  ddbDocMock.on(UpdateCommand).resolves({
    Attributes: mockCharacter()
  });
  
  // Mock character list
  ddbDocMock.on(ScanCommand, {
    TableName: process.env.DYNAMODB_TABLE,
    FilterExpression: 'attribute_exists(#name)'
  }).resolves({
    Items: [mockCharacter(), mockCharacter({ id: 'char-456', name: 'Another Character' })],
    Count: 2,
    ScannedCount: 2
  });
  
  return ddbDocMock;
}

/**
 * Mock object-specific DynamoDB operations
 */
function mockObjectOperations() {
  const { ddbDocMock } = setupDynamoDBMocks();
  
  // Mock object operations
  ddbDocMock.on(GetCommand).resolves({
    Item: mockObject()
  });
  
  ddbDocMock.on(PutCommand).resolves({
    Attributes: mockObject()
  });
  
  ddbDocMock.on(ScanCommand).resolves({
    Items: [mockObject(), mockObject({ id: 'obj-456', name: 'Another Object' })],
    Count: 2,
    ScannedCount: 2
  });
  
  return ddbDocMock;
}

/**
 * Mock action test calculation data
 */
function mockActionTestData() {
  const { ddbDocMock } = setupDynamoDBMocks();
  
  const sourceCharacter = mockCharacter({
    id: 'source-char',
    name: 'Source Character',
    strength: 15,
    dexterity: 12
  });
  
  const targetCharacter = mockCharacter({
    id: 'target-char',
    name: 'Target Character',
    armor: 8,
    agility: 10
  });
  
  const action = mockAction({
    id: 'action-123',
    name: 'Test Action',
    source: 'strength',
    target: 'armor',
    type: 'normal'
  });
  
  // Mock multiple gets for action test
  ddbDocMock.on(GetCommand, {
    TableName: process.env.DYNAMODB_TABLE,
    Key: { id: 'source-char' }
  }).resolves({ Item: sourceCharacter });
  
  ddbDocMock.on(GetCommand, {
    TableName: process.env.DYNAMODB_TABLE,
    Key: { id: 'target-char' }
  }).resolves({ Item: targetCharacter });
  
  ddbDocMock.on(GetCommand, {
    TableName: process.env.DYNAMODB_TABLE,
    Key: { id: 'action-123' }
  }).resolves({ Item: action });
  
  // Mock inventory queries
  ddbDocMock.on(QueryCommand).resolves({
    Items: [],
    Count: 0
  });
  
  return { sourceCharacter, targetCharacter, action, ddbDocMock };
}

/**
 * Create AWS Lambda response
 */
function createLambdaResponse(statusCode = 200, body = {}, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode = 500, message = 'Internal Server Error') {
  return createLambdaResponse(statusCode, {
    error: message,
    statusCode
  });
}

/**
 * Utility to verify DynamoDB operation was called
 */
function verifyDynamoDBCall(mock, command, times = 1) {
  expect(mock.calls()).toHaveLength(times);
  if (times > 0) {
    expect(mock.commandCalls(command)).toHaveLength(times);
  }
}

module.exports = {
  setupDynamoDBMocks,
  mockDynamoDBSuccess,
  mockDynamoDBError,
  mockDynamoDBOperation,
  mockCharacterOperations,
  mockObjectOperations,
  mockActionTestData,
  createLambdaResponse,
  createErrorResponse,
  verifyDynamoDBCall,
  ddbMock,
  ddbDocMock
};