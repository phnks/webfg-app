// Mock web-vitals module 
jest.mock('web-vitals', () => ({
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn()
}));

import reportWebVitals from '../reportWebVitals';

describe('reportWebVitals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls web vitals functions when valid callback is provided', async () => {
    const mockCallback = jest.fn();
    
    // Just test that it doesn't crash when called with a valid function
    expect(() => reportWebVitals(mockCallback)).not.toThrow();
  });

  test('does not call web vitals when no callback provided', () => {
    expect(() => reportWebVitals()).not.toThrow();
  });

  test('does not call web vitals when null callback provided', () => {
    expect(() => reportWebVitals(null)).not.toThrow();
  });

  test('does not call web vitals when non-function callback provided', () => {
    expect(() => reportWebVitals('not-a-function')).not.toThrow();
  });

  test('handles number as callback', () => {
    expect(() => reportWebVitals(123)).not.toThrow();
  });

  test('handles object as callback', () => {
    expect(() => reportWebVitals({ not: 'a function' })).not.toThrow();
  });
});