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
 * Calculate expected number of successes for a given dice pool
 * @param {number} diceCount - Number of dice to roll
 * @returns {number} Expected number of successes
 */
const calculateExpectedSuccesses = (diceCount) => {
  // Success rate is 50% per die (4-6 on d6, 5-8 on d8, 5-9 on d10)
  return diceCount * 0.5;
};

/**
 * Halve dice pools if total exceeds 20
 * @param {number} sourceDice - Source dice pool
 * @param {number} targetDice - Target dice pool
 * @returns {Object} Adjusted dice pools
 */
const adjustDicePools = (sourceDice, targetDice) => {
  let adjustedSource = sourceDice;
  let adjustedTarget = targetDice;
  
  while (adjustedSource + adjustedTarget > 20) {
    // Halve both pools, rounding down, but minimum 0 dice
    const newSource = Math.max(0, Math.floor(adjustedSource / 2));
    const newTarget = Math.max(0, Math.floor(adjustedTarget / 2));
    
    // If halving would result in both pools being 0, stop before this iteration
    if (newSource === 0 && newTarget === 0) {
      break;
    }
    
    adjustedSource = newSource;
    adjustedTarget = newTarget;
  }
  
  return { adjustedSource, adjustedTarget };
};

/**
 * Calculate action difficulty based on source and target values using dice-based system
 * @param {number} sourceValue - The source attribute value (number of dice)
 * @param {number} targetValue - The target attribute value (number of dice)
 * @returns {number} The action difficulty percentage (0-1)
 */
const calculateActionDifficulty = (sourceValue, targetValue) => {
  // Handle edge cases
  if (sourceValue === 0 && targetValue === 0) {
    return 0.5; // Default to 50% if both values are 0
  }
  
  // If only source has value (no opposition), very high success chance
  if (targetValue === 0) {
    return 0.95; // 95% success chance when unopposed
  }
  
  // If only target has value (no source), very low success chance
  if (sourceValue === 0) {
    return 0.05; // 5% success chance with no source attribute
  }
  
  // Ensure minimum 1 die for both sides
  let sourceDice = Math.max(1, Math.floor(sourceValue));
  let targetDice = Math.max(1, Math.floor(targetValue));
  
  // Adjust dice pools if total exceeds 20
  const { adjustedSource, adjustedTarget } = adjustDicePools(sourceDice, targetDice);
  
  // Calculate expected successes for each side
  const sourceSuccesses = calculateExpectedSuccesses(adjustedSource);
  const targetSuccesses = calculateExpectedSuccesses(adjustedTarget);
  
  // Calculate probability of source having more successes than target
  // This is a simplified calculation based on expected values
  // In reality, this would involve complex probability distributions
  
  // If expected successes are equal, it's 50/50
  if (sourceSuccesses === targetSuccesses) {
    return 0.5;
  }
  
  // Calculate success probability based on the ratio of expected successes
  // Using a sigmoid-like function to map the success difference to a probability
  const successDifference = sourceSuccesses - targetSuccesses;
  const totalSuccesses = sourceSuccesses + targetSuccesses;
  
  // This formula gives a smooth probability curve
  // When source has more expected successes, probability > 0.5
  // When target has more expected successes, probability < 0.5
  const probability = sourceSuccesses / (sourceSuccesses + targetSuccesses);
  
  // Apply a slight adjustment to make the curve more realistic
  // This accounts for the variance in dice rolls
  const adjustedProbability = 0.5 + (probability - 0.5) * 0.9;
  
  return Math.max(0.05, Math.min(0.95, adjustedProbability));
};

/**
 * Get single character attribute value with grouping
 * @param {Object} character - Character object
 * @param {string} attributeName - Attribute name (lowercase)
 * @returns {number} The grouped attribute value (includes fatigue)
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
 * @returns {number} The grouped attribute value (includes fatigue for characters)
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
    // Objects don't have fatigue
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
 * @returns {number} The grouped source value (includes fatigue)
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
 * @returns {number} The grouped target value (includes fatigue for characters)
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
  
  // Calculate source value (includes fatigue)
  const sourceValue = groupSourceAttributes(sourceCharacters, sourceLower);
  
  // Debug logging
  console.log('Action test calculation debug:', {
    sourceAttribute: sourceLower,
    sourceValue: sourceValue,
    sourceCharacterCount: sourceCharacters.length
  });
  
  // Calculate target value (includes fatigue for characters)
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
  
  // Calculate dice pool information
  const sourceDice = Math.max(1, Math.floor(sourceValue));
  const targetDice = Math.max(1, Math.floor(targetValue));
  const { adjustedSource, adjustedTarget } = adjustDicePools(sourceDice, targetDice);
  
  return {
    difficulty: Math.round(difficulty * 10000) / 10000, // Round to 4 decimal places
    sourceValue,
    targetValue,
    sourceCount: sourceCharacters.length,
    targetCount: override ? 0 : targetEntities.length,
    successPercentage: Math.round(difficulty * 10000) / 100, // Convert to percentage with 2 decimals
    // Dice pool information for display
    sourceDice,
    targetDice,
    adjustedSourceDice: adjustedSource,
    adjustedTargetDice: adjustedTarget,
    dicePoolExceeded: (sourceDice + targetDice) > 20
  };
};

module.exports = {
  calculateActionDifficulty,
  calculateExpectedSuccesses,
  adjustDicePools,
  getSingleCharacterAttributeValue,
  getSingleEntityAttributeValue,
  groupSourceAttributes,
  groupTargetAttributes,
  calculateActionTest
};