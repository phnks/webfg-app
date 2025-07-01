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
  
  // Coverage thresholds - start with achievable targets, gradually increase to 90%
  // TODO: Increase thresholds as test coverage improves
  // Target: 10% -> 25% -> 50% -> 75% -> 90%
  coverageThreshold: {
    global: {
      branches: 5,   // Current: ~2%, Target: 90%
      functions: 5,  // Current: ~1%, Target: 90%
      lines: 5,      // Current: ~2%, Target: 90%
      statements: 5  // Current: ~2%, Target: 90%
    }
  }
};