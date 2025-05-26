/**
 * Utility functions for action test calculations
 * Backend version for GraphQL resolvers
 */

const { 
  calculateGroupedAttributes, 
  calculateObjectGroupedAttributes,
  calculateGroupingFormula 
} = require('./attributeGrouping');

/**
 * Calculate action difficulty based on source and target values
 * @param {number} sourceValue - The source attribute value
 * @param {number} targetValue - The target attribute value
 * @returns {number} The action difficulty percentage (0-1)
 */
const calculateActionDifficulty = (sourceValue, targetValue) => {
  // Calculate difficulty using formula: A1/(A1+A2)
  if (sourceValue === 0 && targetValue === 0) {
    return 0.5; // Default to 50% if both values are 0
  }
  
  return sourceValue / (sourceValue + targetValue);
};

/**
 * Get single character attribute value with grouping
 * @param {Object} character - Character object
 * @param {string} attributeName - Attribute name (lowercase)
 * @returns {number} The grouped attribute value
 */
const getSingleCharacterAttributeValue = (character, attributeName) => {
  const groupedAttributes = calculateGroupedAttributes(character);
  if (groupedAttributes[attributeName] !== undefined) {
    return groupedAttributes[attributeName];
  } else if (character[attributeName] && character[attributeName].attribute) {
    return character[attributeName].attribute.attributeValue || 0;
  }
  return 0;
};

/**
 * Get single entity attribute value with grouping (works for both characters and objects)
 * @param {Object} entity - Character or Object
 * @param {string} attributeName - Attribute name (lowercase)
 * @param {string} entityType - 'CHARACTER' or 'OBJECT'
 * @returns {number} The grouped attribute value
 */
const getSingleEntityAttributeValue = (entity, attributeName, entityType) => {
  if (entityType === 'CHARACTER') {
    const groupedAttributes = calculateGroupedAttributes(entity);
    if (groupedAttributes[attributeName] !== undefined) {
      return groupedAttributes[attributeName];
    } else if (entity[attributeName] && entity[attributeName].attribute) {
      return entity[attributeName].attribute.attributeValue || 0;
    }
  } else if (entityType === 'OBJECT') {
    const groupedAttributes = calculateObjectGroupedAttributes(entity);
    if (groupedAttributes[attributeName] !== undefined) {
      return groupedAttributes[attributeName];
    } else if (entity[attributeName]) {
      return entity[attributeName].attributeValue || 0;
    }
  }
  return 0;
};

/**
 * Group multiple sources into a single attribute value
 * @param {Array} sourceCharacters - Array of character objects
 * @param {string} sourceAttribute - Attribute name (lowercase)
 * @returns {number} The grouped source value
 */
const groupSourceAttributes = (sourceCharacters, sourceAttribute) => {
  if (!sourceCharacters || sourceCharacters.length === 0) return 0;
  
  if (sourceCharacters.length === 1) {
    // Single source - get grouped value
    return getSingleCharacterAttributeValue(sourceCharacters[0], sourceAttribute);
  }
  
  // Get the final grouped attribute value for each source character
  const sourceValues = [];
  sourceCharacters.forEach(character => {
    const groupedValue = getSingleCharacterAttributeValue(character, sourceAttribute);
    if (groupedValue > 0) { // Only include non-zero values
      sourceValues.push({
        name: character.name || 'Unknown',
        value: groupedValue,
        type: 'HELP' // Use HELP as default type for combining grouped values
      });
    }
  });
  
  if (sourceValues.length === 0) return 0;
  if (sourceValues.length === 1) return sourceValues[0].value;
  
  // Apply grouping formula to combine the grouped values
  // Sort by value descending to start with highest value first
  sourceValues.sort((a, b) => b.value - a.value);
  
  // Start with the highest value and apply the formula for each subsequent value
  let currentValue = sourceValues[0].value;
  
  for (let i = 1; i < sourceValues.length; i++) {
    currentValue = calculateGroupingFormula(currentValue, sourceValues[i].value, 'HELP');
  }
  
  return Math.round(currentValue * 100) / 100;
};

/**
 * Group multiple targets into a single attribute value
 * @param {Array} targetEntities - Array of character or object entities
 * @param {string} targetAttribute - Attribute name (lowercase)
 * @param {string} targetType - 'CHARACTER' or 'OBJECT'
 * @returns {number} The grouped target value
 */
const groupTargetAttributes = (targetEntities, targetAttribute, targetType) => {
  if (!targetEntities || targetEntities.length === 0) return 0;
  
  if (targetEntities.length === 1) {
    // Single target - get grouped value
    return getSingleEntityAttributeValue(targetEntities[0], targetAttribute, targetType);
  }
  
  // Get the final grouped attribute value for each target entity
  const targetValues = [];
  targetEntities.forEach(entity => {
    const groupedValue = getSingleEntityAttributeValue(entity, targetAttribute, targetType);
    if (groupedValue > 0) { // Only include non-zero values
      targetValues.push({
        name: entity.name || 'Unknown',
        value: groupedValue,
        type: 'HELP' // Use HELP as default type for combining grouped values
      });
    }
  });
  
  if (targetValues.length === 0) return 0;
  if (targetValues.length === 1) return targetValues[0].value;
  
  // Apply grouping formula to combine the grouped values
  // Sort by value descending to start with highest value first
  targetValues.sort((a, b) => b.value - a.value);
  
  // Start with the highest value and apply the formula for each subsequent value
  let currentValue = targetValues[0].value;
  
  for (let i = 1; i < targetValues.length; i++) {
    currentValue = calculateGroupingFormula(currentValue, targetValues[i].value, 'HELP');
  }
  
  return Math.round(currentValue * 100) / 100;
};

/**
 * Calculate action test result with all necessary data
 * @param {Object} params - Parameters for calculation
 * @param {Array} params.sourceCharacters - Array of source characters
 * @param {Array} params.targetEntities - Array of target entities (characters/objects)
 * @param {string} params.sourceAttribute - Source attribute name (uppercase)
 * @param {string} params.targetAttribute - Target attribute name (uppercase)
 * @param {string} params.targetType - 'CHARACTER' or 'OBJECT'
 * @param {boolean} params.override - Whether to use override value
 * @param {number} params.overrideValue - Override value if override is true
 * @returns {Object} Action test result with difficulty and breakdown
 */
const calculateActionTest = (params) => {
  const {
    sourceCharacters,
    targetEntities,
    sourceAttribute,
    targetAttribute,
    targetType,
    override = false,
    overrideValue = 0
  } = params;
  
  // Convert attribute names to lowercase for calculation
  const sourceLower = sourceAttribute.toLowerCase();
  const targetLower = targetAttribute.toLowerCase();
  
  // Calculate source value
  const sourceValue = groupSourceAttributes(sourceCharacters, sourceLower);
  
  // Calculate target value
  let targetValue = 0;
  if (override) {
    targetValue = overrideValue;
  } else if (targetType === 'ACTION') {
    // Action targets not implemented yet
    targetValue = 0;
  } else {
    targetValue = groupTargetAttributes(targetEntities, targetLower, targetType);
  }
  
  // Calculate difficulty
  const difficulty = calculateActionDifficulty(sourceValue, targetValue);
  
  return {
    difficulty: Math.round(difficulty * 10000) / 10000, // Round to 4 decimal places
    sourceValue,
    targetValue,
    sourceCount: sourceCharacters.length,
    targetCount: override ? 0 : targetEntities.length,
    successPercentage: Math.round(difficulty * 10000) / 100 // Convert to percentage with 2 decimals
  };
};

module.exports = {
  calculateActionDifficulty,
  getSingleCharacterAttributeValue,
  getSingleEntityAttributeValue,
  groupSourceAttributes,
  groupTargetAttributes,
  calculateActionTest
};