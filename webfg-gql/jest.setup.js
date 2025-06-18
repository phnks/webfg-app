// Jest setup file for webfg-gql

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.DYNAMODB_TABLE = 'test-table';
process.env.CHARACTERS_TABLE = 'test-table';
process.env.OBJECTS_TABLE = 'test-table';
process.env.ACTIONS_TABLE = 'test-table';
process.env.CONDITIONS_TABLE = 'test-table';
process.env.ENCOUNTER_TABLE = 'test-encounter-table';

// Mock AWS SDK globally
const mockSend = jest.fn();
const mockDynamoDBClient = jest.fn(() => ({
  send: mockSend
}));
const mockDynamoDBDocumentClient = {
  from: jest.fn(() => ({
    send: mockSend
  }))
};

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: mockDynamoDBClient
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: mockDynamoDBDocumentClient,
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn(),
  ScanCommand: jest.fn(),
  QueryCommand: jest.fn(),
  BatchGetCommand: jest.fn()
}));

// Export mock send function for use in tests
global.mockDynamoSend = mockSend;

// Global test utilities
global.createMockEvent = (body = {}, pathParameters = {}, headers = {}) => ({
  body: JSON.stringify(body),
  pathParameters,
  headers: {
    'Content-Type': 'application/json',
    ...headers
  },
  requestContext: {
    requestId: 'test-request-id',
    identity: {
      sourceIp: '127.0.0.1'
    }
  },
  isBase64Encoded: false
});

global.createMockContext = () => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2023/01/01/[1]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn()
});

// Mock DynamoDB responses
global.mockDynamoDBItem = (overrides = {}) => ({
  id: 'test-id',
  name: 'Test Item',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

global.mockDynamoDBResponse = (items = []) => ({
  Items: items.length ? items : [mockDynamoDBItem()],
  Count: items.length || 1,
  ScannedCount: items.length || 1
});

// Character mock data
global.mockCharacter = (overrides = {}) => ({
  id: 'char-123',
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
  lethality: 10,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

// Object mock data
global.mockObject = (overrides = {}) => ({
  id: 'obj-123',
  name: 'Test Object',
  category: 'WEAPON',
  description: 'A test object',
  speed: 0,
  weight: 1,
  size: 1,
  intensity: 0,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

// Action mock data
global.mockAction = (overrides = {}) => ({
  id: 'action-123',
  name: 'Test Action',
  description: 'A test action',
  source: 'strength',
  target: 'armor',
  type: 'normal',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

// Condition mock data
global.mockCondition = (overrides = {}) => ({
  id: 'condition-123',
  name: 'Test Condition',
  description: 'A test condition',
  type: 'help',
  attribute: 'strength',
  value: 5,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

// Console suppression for cleaner test output
const originalConsoleError = console.error;
beforeEach(() => {
  // Suppress expected error logs during testing
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});