import React from 'react';

// Mock environment variables
const mockEnv = {
  REACT_APP_APPSYNC_URL: 'https://test.appsync-api.us-east-1.amazonaws.com/graphql',
  REACT_APP_APPSYNC_API_KEY: 'test-api-key'
};

// Mock all the dependencies
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn()
  }))
}));

jest.mock('@apollo/client', () => ({
  ApolloClient: jest.fn(),
  InMemoryCache: jest.fn(),
  ApolloProvider: jest.fn(({ children }) => children),
  split: jest.fn(),
  HttpLink: jest.fn(),
  ApolloLink: jest.fn(),
  Observable: jest.fn()
}));

jest.mock('@apollo/client/utilities', () => ({
  getMainDefinition: jest.fn()
}));

jest.mock('@apollo/client/core', () => ({
  ApolloLink: jest.fn(),
  Observable: jest.fn()
}));

jest.mock('graphql', () => ({
  print: jest.fn()
}));

jest.mock('../App', () => {
  return function MockApp() {
    return <div>Mock App</div>;
  };
});

// Mock DOM methods
Object.defineProperty(window, 'btoa', {
  value: jest.fn(() => 'encoded-string'),
  writable: true
});

Object.defineProperty(window, 'crypto', {
  value: { randomUUID: jest.fn(() => 'test-uuid') },
  writable: true
});

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // OPEN
  onopen: null,
  onmessage: null,
  onerror: null
}));

// Mock document.getElementById
Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => ({ id: 'root' })),
  writable: true
});

describe('index.js', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, ...mockEnv };
    
    // Clear console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  test('imports and initializes without errors', () => {
    // Clear module cache to ensure fresh require
    delete require.cache[require.resolve('../index')];
    
    expect(() => require('../index')).not.toThrow();
  });

  test('handles missing APPSYNC_URL', () => {
    delete process.env.REACT_APP_APPSYNC_URL;
    
    // Clear module cache to ensure fresh require
    delete require.cache[require.resolve('../index')];
    
    // Just verify that the module can be required without throwing
    expect(() => require('../index')).not.toThrow();
  });

  test('handles missing APPSYNC_API_KEY', () => {
    delete process.env.REACT_APP_APPSYNC_API_KEY;
    
    // Clear module cache to ensure fresh require
    delete require.cache[require.resolve('../index')];
    
    // Just verify that the module can be required without throwing
    expect(() => require('../index')).not.toThrow();
  });
});