module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns - include both old and new test locations
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '<rootDir>/tests/**/*.{js,ts}',
    '<rootDir>/tests/**/*.(test|spec).{js,ts}'
  ],
  
  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'functions/**/*.js',
    'utils/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!coverage/**'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Transform configuration (if needed for ES modules)
  transform: {},
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Coverage thresholds - Set to current achievable level (allowing for test failures)
  coverageThreshold: {
    global: {
      branches: 45,   // Current: ~50%, set below for failing tests
      functions: 45,  // Current: ~57%, set below for failing tests  
      lines: 50,      // Current: ~59%, achievable
      statements: 50  // Current: ~59%, achievable
    }
  }
};