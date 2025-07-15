import reportWebVitals from '../reportWebVitals';

// Mock web-vitals module
const mockGetCLS = jest.fn();
const mockGetFID = jest.fn();
const mockGetFCP = jest.fn();
const mockGetLCP = jest.fn();
const mockGetTTFB = jest.fn();

jest.mock('web-vitals', () => ({
  getCLS: mockGetCLS,
  getFID: mockGetFID,
  getFCP: mockGetFCP,
  getLCP: mockGetLCP,
  getTTFB: mockGetTTFB
}));

describe('reportWebVitals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls web vitals functions when valid callback is provided', async () => {
    const mockCallback = jest.fn();
    
    reportWebVitals(mockCallback);
    
    // Wait for dynamic import to resolve
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockGetCLS).toHaveBeenCalledWith(mockCallback);
    expect(mockGetFID).toHaveBeenCalledWith(mockCallback);
    expect(mockGetFCP).toHaveBeenCalledWith(mockCallback);
    expect(mockGetLCP).toHaveBeenCalledWith(mockCallback);
    expect(mockGetTTFB).toHaveBeenCalledWith(mockCallback);
  });

  test('does not call web vitals when no callback provided', () => {
    reportWebVitals();
    
    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });

  test('does not call web vitals when null callback provided', () => {
    reportWebVitals(null);
    
    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });

  test('does not call web vitals when non-function callback provided', () => {
    reportWebVitals('not-a-function');
    
    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });

  test('handles number as callback', () => {
    reportWebVitals(123);
    
    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });

  test('handles object as callback', () => {
    reportWebVitals({ not: 'a function' });
    
    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });
});