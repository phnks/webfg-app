module.exports = {
  // Use Create React App's default Jest configuration as base
  ...require('react-scripts/scripts/utils/createJestConfig')(),
  
  // Override test directory patterns to include our new tests/ directory
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/setupTests.js',
    '!src/reportWebVitals.js',
    '!src/**/*.css',
    '!src/logo.svg'
  ],
  
  // Coverage thresholds - start with achievable targets, gradually increase to 90%
  // TODO: Increase thresholds as test coverage improves
  // Target: 10% -> 25% -> 50% -> 75% -> 90%
  coverageThreshold: {
    global: {
      branches: 5,   // Current: ~0%, Target: 90%
      functions: 5,  // Current: ~0%, Target: 90%
      lines: 5,      // Current: ~0%, Target: 90%
      statements: 5  // Current: ~0%, Target: 90%
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};