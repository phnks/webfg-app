/**
 * Feature flags to control which implementation to use
 * This allows gradual migration from frontend to backend calculations
 */

export const FEATURE_FLAGS = {
  // Use backend for grouped attribute calculations
  USE_BACKEND_GROUPED_ATTRIBUTES: process.env.REACT_APP_USE_BACKEND_GROUPED_ATTRIBUTES === 'true' || false,
  
  // Use backend for action test calculations
  USE_BACKEND_ACTION_TEST: process.env.REACT_APP_USE_BACKEND_ACTION_TEST === 'true' || false,
  
  // Use backend for attribute breakdown
  USE_BACKEND_ATTRIBUTE_BREAKDOWN: process.env.REACT_APP_USE_BACKEND_ATTRIBUTE_BREAKDOWN === 'true' || false,
};

// Helper to check if any backend features are enabled
export const isBackendEnabled = () => {
  return Object.values(FEATURE_FLAGS).some(flag => flag === true);
};