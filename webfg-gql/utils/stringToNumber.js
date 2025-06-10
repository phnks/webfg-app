/**
 * Utility function to safely parse any value to an integer
 * Use this consistently throughout the application for all number handling
 * 
 * @param {any} value - Value to convert to number
 * @param {number} defaultValue - Default value if parsing fails (default: 0)
 * @returns {number} - The parsed integer or default value
 */
const toInt = (value, defaultValue = 0) => {
  // Handle undefined or null
  if (value === undefined || value === null) {
    return defaultValue;
  }

  // If already a number, ensure it's an integer
  if (typeof value === 'number') {
    return Math.floor(value);
  }

  // Try to parse as integer
  try {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      return defaultValue;
    }
    return parsed;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Utility function to safely parse any value to a float
 * 
 * @param {any} value - Value to convert to number
 * @param {number} defaultValue - Default value if parsing fails (default: 0)
 * @returns {number} - The parsed float or default value
 */
const toFloat = (value, defaultValue = 0) => {
  // Handle undefined or null
  if (value === undefined || value === null) {
    return defaultValue;
  }

  // If already a number, return as is
  if (typeof value === 'number') {
    return value;
  }

  // Try to parse as float
  try {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return defaultValue;
    }
    return parsed;
  } catch (error) {
    return defaultValue;
  }
};

module.exports = {
  toInt,
  toFloat
};