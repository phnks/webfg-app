/**
 * Utility functions for action test calculations
 * Backend version for GraphQL resolvers
 */

const { 
  calculateGroupedAttributes, 
  calculateReadyGroupedAttributes,
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
    // Halve both pools, rounding to nearest integer, but minimum 0 dice
    adjustedSource = Math.max(0, Math.round(adjustedSource / 2));
    adjustedTarget = Math.max(0, Math.round(adjustedTarget / 2));
    
    // If either pool is now 0 and total still > 20, do one more halving and stop
    if ((adjustedSource === 0 || adjustedTarget === 0) && adjustedSource + adjustedTarget > 20) {
      adjustedSource = Math.max(0, Math.round(adjustedSource / 2));
      adjustedTarget = Math.max(0, Math.round(adjustedTarget / 2));
      break;
    }
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
  
  // If only source has value (no opposition), guaranteed success
  if (targetValue === 0) {
    return 1.0; // 100% success chance when unopposed (0 target dice)
  }
  
  // If only target has value (no source), guaranteed failure
  if (sourceValue === 0) {
    return 0.0; // 0% success chance with no source attribute (0 source dice)
  }
  
  // Calculate dice pools (allow 0 dice for guaranteed actions)
  let sourceDice = Math.max(0, Math.floor(sourceValue));
  let targetDice = Math.max(0, Math.floor(targetValue));
  
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
 * Get single character attribute value with grouping for sources (uses ready grouped attributes)
 * @param {Object} character - Character object
 * @param {string} attributeName - Attribute name (lowercase)
 * @returns {number} The ready grouped attribute value (equipment + ready objects)
 */
const getSingleCharacterSourceAttributeValue = (character, attributeName) => {
  const readyGroupedAttributes = calculateReadyGroupedAttributes(character);
    
  if (readyGroupedAttributes[attributeName] !== undefined) {
    return readyGroupedAttributes[attributeName];
  } else if (character[attributeName] && character[attributeName].attribute) {
    return character[attributeName].attribute.attributeValue || 0;
  }
  return 0;
};

/**
 * Get single character attribute value with grouping for targets (uses equipment grouped attributes)
 * @param {Object} character - Character object
 * @param {string} attributeName - Attribute name (lowercase)
 * @returns {number} The equipment grouped attribute value (equipment only)
 */
const getSingleCharacterTargetAttributeValue = (character, attributeName) => {
  const groupedAttributes = calculateGroupedAttributes(character);
    
  if (groupedAttributes[attributeName] !== undefined) {
    return groupedAttributes[attributeName];
  } else if (character[attributeName] && character[attributeName].attribute) {
    return character[attributeName].attribute.attributeValue || 0;
  }
  return 0;
};

/**
 * Get single entity attribute value for targets (characters use equipment grouped, objects use their own grouped)
 * @param {Object} entity - Character or Object
 * @param {string} attributeName - Attribute name (lowercase)
 * @param {string} entityType - 'CHARACTER' or 'OBJECT'
 * @returns {number} The grouped attribute value for targets
 */
const getSingleEntityTargetAttributeValue = (entity, attributeName, entityType) => {
  if (entityType === 'CHARACTER') {
    return getSingleCharacterTargetAttributeValue(entity, attributeName);
  } else if (entityType === 'OBJECT') {
    // Objects don't have fatigue and use their own grouping logic
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
 * Group multiple sources into a single attribute value (uses ready grouped attributes)
 * @param {Array} sourceCharacters - Array of character objects
 * @param {string} sourceAttribute - Attribute name (lowercase)
 * @returns {number} The grouped source value using ready attributes (equipment + ready objects)
 */
const groupSourceAttributes = (sourceCharacters, sourceAttribute) => {
  if (!sourceCharacters || sourceCharacters.length === 0) return 0;
  
  if (sourceCharacters.length === 1) {
    // Single source - get ready grouped value
    return getSingleCharacterSourceAttributeValue(sourceCharacters[0], sourceAttribute);
  }
  
  // Get the final ready grouped attribute value for each source character
  const sourceValues = [];
  sourceCharacters.forEach(character => {
    const groupedValue = getSingleCharacterSourceAttributeValue(character, sourceAttribute);
    if (groupedValue > 0) { // Only include non-zero values
      sourceValues.push(groupedValue);
    }
  });
  
  if (sourceValues.length === 0) return 0;
  if (sourceValues.length === 1) return sourceValues[0];
  
  // Sort values in descending order (highest first)
  sourceValues.sort((a, b) => b - a);
  
  // Apply new weighted average grouping formula
  const groupedValue = calculateGroupingFormula(sourceValues);
  
  return Math.round(groupedValue * 100) / 100;
};

/**
 * Group multiple targets into a single attribute value (uses equipment grouped attributes for characters)
 * @param {Array} targetEntities - Array of character or object entities
 * @param {string} targetAttribute - Attribute name (lowercase)
 * @param {string} targetType - 'CHARACTER' or 'OBJECT'
 * @returns {number} The grouped target value using equipment attributes (equipment only for characters)
 */
const groupTargetAttributes = (targetEntities, targetAttribute, targetType) => {
  if (!targetEntities || targetEntities.length === 0) return 0;
  
  if (targetEntities.length === 1) {
    // Single target - get equipment grouped value for characters, normal grouped for objects
    return getSingleEntityTargetAttributeValue(targetEntities[0], targetAttribute, targetType);
  }
  
  // Get the final grouped attribute value for each target entity
  const targetValues = [];
  targetEntities.forEach(entity => {
    const groupedValue = getSingleEntityTargetAttributeValue(entity, targetAttribute, targetType);
    if (groupedValue > 0) { // Only include non-zero values
      targetValues.push(groupedValue);
    }
  });
  
  if (targetValues.length === 0) return 0;
  if (targetValues.length === 1) return targetValues[0];
  
  // Sort values in descending order (highest first)
  targetValues.sort((a, b) => b - a);
  
  // Apply new weighted average grouping formula
  const groupedValue = calculateGroupingFormula(targetValues);
  
  return Math.round(groupedValue * 100) / 100;
};

/**
 * Calculate action test result with all necessary data
 * @param {Object} params - Parameters for calculation
 * @param {Array} params.sourceCharacters - Array of source characters
 * @param {Array} params.targetEntities - Array of target entities (characters/objects)
 * @param {string} params.sourceAttribute - Source attribute name (uppercase)
 * @param {string} params.targetAttribute - Target attribute name (uppercase)
 * @param {string} params.targetType - 'CHARACTER' or 'OBJECT'
 * @param {boolean} params.override - Whether to use target override value
 * @param {number} params.overrideValue - Target override value if override is true
 * @param {boolean} params.sourceOverride - Whether to use source override value
 * @param {number} params.sourceOverrideValue - Source override value if sourceOverride is true
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
    overrideValue = 0,
    sourceOverride = false,
    sourceOverrideValue = 0
  } = params;
  
  // Convert attribute names to lowercase for calculation
  const sourceLower = sourceAttribute.toLowerCase();
  const targetLower = targetAttribute.toLowerCase();
  
  // Calculate source value (without fatigue)
  let sourceValue = 0;
  
  if (sourceOverride) {
    sourceValue = sourceOverrideValue;
  } else {
    sourceValue = groupSourceAttributes(sourceCharacters, sourceLower);
  }
  
  // Calculate target value (without fatigue for characters)
  let targetValue = 0;
  
  if (override) {
    targetValue = overrideValue;
  } else if (targetType === 'ACTION') {
    // Action targets not implemented yet
    targetValue = 0;
  } else {
    targetValue = groupTargetAttributes(targetEntities, targetLower, targetType);
  }
  
  // Debug logging
  console.log('Action test calculation debug:', {
    sourceAttribute: sourceLower,
    targetAttribute: targetLower,
    sourceValue: sourceValue,
    targetValue: targetValue,
    sourceCharacterCount: sourceCharacters.length,
    targetEntityCount: targetEntities.length,
    sourceCharacters: sourceCharacters.map(c => ({ name: c.name, [sourceLower]: c[sourceLower] })),
    targetEntities: targetEntities.map(t => ({ name: t.name, [targetLower]: t[targetLower] }))
  });
  
  // Calculate dice pool information before fatigue (allow 0 dice for guaranteed actions)
  const sourceDice = Math.max(0, Math.round(sourceValue));
  const targetDice = Math.max(0, Math.round(targetValue));
  
  // Apply dice pool halving if needed
  const { adjustedSource, adjustedTarget } = adjustDicePools(sourceDice, targetDice);
  
  // Calculate total fatigue for source characters and collect details
  // Only apply source fatigue if not using source override
  let sourceFatigue = 0;
  const sourceFatigueDetails = [];
  if (!sourceOverride) {
    sourceCharacters.forEach(character => {
      const characterFatigue = character.fatigue || 0;
      sourceFatigue += characterFatigue;
      sourceFatigueDetails.push({
        characterId: character.characterId,
        characterName: character.name,
        fatigue: characterFatigue
      });
    });
  }
  
  // Calculate total fatigue for target characters (objects don't have fatigue)
  let targetFatigue = 0;
  const targetFatigueDetails = [];
  if (targetType === 'CHARACTER') {
    targetEntities.forEach(character => {
      const characterFatigue = character.fatigue || 0;
      targetFatigue += characterFatigue;
      targetFatigueDetails.push({
        characterId: character.characterId,
        characterName: character.name,
        fatigue: characterFatigue
      });
    });
  }
  
  // Apply fatigue AFTER halving
  // Fatigue can reduce dice to 0, but not below 0
  let finalSourceDice, finalTargetDice;
  
  if (adjustedSource === 0) {
    // If already 0 after halving, fatigue can't reduce it further
    finalSourceDice = 0;
  } else {
    // If > 0 after halving, apply fatigue (can reduce to 0, but not below)
    finalSourceDice = Math.max(0, adjustedSource - sourceFatigue);
  }
  
  if (adjustedTarget === 0) {
    // If already 0 after halving, fatigue can't reduce it further
    finalTargetDice = 0;
  } else {
    // If > 0 after halving, apply fatigue (can reduce to 0, but not below)
    finalTargetDice = Math.max(0, adjustedTarget - targetFatigue);
  }
  
  // Calculate difficulty using final dice pools
  const difficulty = calculateActionDifficulty(finalSourceDice, finalTargetDice);
  
  return {
    difficulty: Math.round(difficulty * 10000) / 10000, // Round to 4 decimal places
    sourceValue,
    targetValue,
    sourceCount: sourceOverride ? 0 : sourceCharacters.length,
    targetCount: override ? 0 : targetEntities.length,
    successPercentage: Math.round(difficulty * 10000) / 100, // Convert to percentage with 2 decimals
    // Dice pool information for display
    sourceDice,
    targetDice,
    adjustedSourceDice: adjustedSource,
    adjustedTargetDice: adjustedTarget,
    sourceFatigue,
    targetFatigue,
    finalSourceDice,
    finalTargetDice,
    dicePoolExceeded: (sourceDice + targetDice) > 20,
    sourceFatigueDetails,
    targetFatigueDetails
  };
};

module.exports = {
  calculateActionDifficulty,
  calculateExpectedSuccesses,
  adjustDicePools,
  getSingleCharacterSourceAttributeValue,
  getSingleCharacterTargetAttributeValue,
  getSingleEntityTargetAttributeValue,
  groupSourceAttributes,
  groupTargetAttributes,
  calculateActionTest
};