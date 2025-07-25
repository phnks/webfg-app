/**
 * Utility functions for action test calculations
 * Backend version for GraphQL resolvers
 */

const { 
  calculateGroupedAttributes, 
  calculateReadyGroupedAttributes,
  calculateObjectGroupedAttributes,
  calculateGroupingFormula,
  calculateGroupedAttributesWithSelectedReady
} = require('./attributeGrouping');

const {
  attributeUsesDice,
  calculateAttributeModifier,
  getAttributeRange,
  calculateDiceSuccessProbability,
  formatDiceRoll,
  analyzeSuccessRanges,
  calculateSubtractSuccessProbability,
  analyzeSubtractSuccessRanges,
  calculateDeltaSuccessProbability,
  analyzeDeltaSuccessRanges
} = require('./diceCalculations');

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
  
  return { source: adjustedSource, target: adjustedTarget };
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
  const { source: adjustedSource, target: adjustedTarget } = adjustDicePools(sourceDice, targetDice);
  
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
const getSingleCharacterSourceAttributeValue = (character, attributeName, selectedReadyObjectId = null) => {
  // console.log('=== [DEBUG getSingleCharacterSourceAttributeValue] START ===', {
  //   characterName: character?.name,
  //   attributeName,
  //   selectedReadyObjectId,
  //   hasReadyArray: !!character?.ready,
  //   readyCount: character?.ready?.length || 0,
  //   readyIds: character?.readyIds || [],
  //   readyObjectIds: character?.ready?.map(obj => obj.objectId) || []
  // });
  
  if (selectedReadyObjectId) {
    // console.log('[DEBUG] Selected ready object ID provided, will calculate with selected ready object');
    // If a ready object is selected, calculate grouping including that specific object
    const groupedAttributes = calculateGroupedAttributesWithSelectedReady(character, selectedReadyObjectId);
    
    // console.log('[DEBUG after calculateGroupedAttributesWithSelectedReady]', {
    //   characterName: character?.name,
    //   attributeName,
    //   selectedReadyObjectId,
    //   groupedValue: groupedAttributes[attributeName],
    //   allGroupedAttributes: groupedAttributes
    // });
    
    if (groupedAttributes[attributeName] !== undefined) {
      const finalValue = groupedAttributes[attributeName];
      // console.log(`[DEBUG] RETURNING GROUPED VALUE WITH SELECTED READY: ${finalValue}`);
      return finalValue;
    } else {
      // console.log('[DEBUG] Grouped attributes did not contain the requested attribute, falling through');
    }
  } else {
    // console.log('[DEBUG] No ready object selected, using equipment-only grouping');
    // If no ready object is selected, use equipment-only grouping
    const groupedAttributes = calculateGroupedAttributes(character);
    
    if (groupedAttributes[attributeName] !== undefined) {
      const equipmentValue = groupedAttributes[attributeName];
      // console.log(`[DEBUG] RETURNING EQUIPMENT-ONLY GROUPED VALUE: ${equipmentValue}`);
      return equipmentValue;
    }
  }
  
  // Fallback to base attribute value
  if (character[attributeName] && character[attributeName].attribute) {
    const baseValue = character[attributeName].attribute.attributeValue || 0;
    // console.log(`[DEBUG] FALLING BACK TO BASE ATTRIBUTE VALUE: ${baseValue}`);
    return baseValue;
  }
  // console.log('[DEBUG] NO VALUE FOUND, RETURNING 0');
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
const groupSourceAttributes = (sourceCharacters, sourceAttribute, selectedReadyObjectId = null) => {
  if (!sourceCharacters || sourceCharacters.length === 0) return 0;
  
  if (sourceCharacters.length === 1) {
    // Single source - get value based on ready object selection
    return getSingleCharacterSourceAttributeValue(sourceCharacters[0], sourceAttribute, selectedReadyObjectId);
  }
  
  // Get the final grouped attribute value for each source character
  const sourceValues = [];
  sourceCharacters.forEach(character => {
    const groupedValue = getSingleCharacterSourceAttributeValue(character, sourceAttribute, selectedReadyObjectId);
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
 * Calculate action test result with new dice-based system
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
 * @returns {Object} Action test result with dice mechanics and breakdown
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
    sourceOverrideValue = 0,
    selectedReadyObjectId = null,
    formula = 'CONTEST' // Default to CONTEST if not provided
  } = params;
  
  // Convert attribute names to lowercase for calculation
  const sourceLower = sourceAttribute.toLowerCase();
  const targetLower = targetAttribute.toLowerCase();
  
  // Calculate source value (without fatigue)
  let sourceValue = 0;
  
  if (sourceOverride) {
    sourceValue = sourceOverrideValue;
  } else {
    sourceValue = groupSourceAttributes(sourceCharacters, sourceLower, selectedReadyObjectId);
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
  // console.log('NEW DICE SYSTEM - Action test calculation debug:', {
  //   sourceAttribute: sourceAttribute,
  //   targetAttribute: targetAttribute,
  //   sourceValue: sourceValue,
  //   targetValue: targetValue,
  //   sourceCharacterCount: sourceCharacters.length,
  //   targetEntityCount: targetEntities.length
  // });
  
  // Fatigue is deprecated - set to 0 for backwards compatibility
  const sourceFatigue = 0;
  const targetFatigue = 0;
  const sourceFatigueDetails = [];
  const targetFatigueDetails = [];
  
  // Calculate final modifiers (no fatigue applied)
  const sourceModifier = calculateAttributeModifier(sourceValue, 0, sourceAttribute);
  const targetModifier = calculateAttributeModifier(targetValue, 0, targetAttribute);
  
  // Apply formula-specific calculations
  let successProbability, sourceDiceDisplay, targetDiceDisplay, rangeAnalysis;
  let finalSourceModifier = sourceModifier; // Will be adjusted for DELTA formula
  let finalTargetModifier = targetModifier;
  
  if (formula === 'CONTEST') {
    // CONTEST: Both sides roll dice and add their attributes (current implementation)
    successProbability = calculateDiceSuccessProbability(sourceAttribute, sourceModifier, targetAttribute, targetModifier);
    sourceDiceDisplay = formatDiceRoll(sourceAttribute, sourceModifier);
    targetDiceDisplay = formatDiceRoll(targetAttribute, targetModifier);
    rangeAnalysis = analyzeSuccessRanges(sourceAttribute, sourceModifier, targetAttribute, targetModifier);
  } else if (formula === 'SUBTRACT') {
    // SUBTRACT: Source rolls, target value is subtracted from source result, final result must be > 0
    successProbability = calculateSubtractSuccessProbability(sourceAttribute, sourceModifier, targetValue);
    sourceDiceDisplay = formatDiceRoll(sourceAttribute, sourceModifier);
    targetDiceDisplay = `${targetValue} (static)`;
    rangeAnalysis = analyzeSubtractSuccessRanges(sourceAttribute, sourceModifier, targetValue);
  } else if (formula === 'DELTA') {
    // DELTA: Delta modifier applied to source, then compared against static 10
    // For DELTA, we need to get both source and target values using the TARGET attribute
    const sourceTargetAttributeValue = groupSourceAttributes(sourceCharacters, targetLower, selectedReadyObjectId);
    const targetTargetAttributeValue = targetValue; // This is already calculated using target attribute
    const deltaModifier = targetTargetAttributeValue - sourceTargetAttributeValue; // target's target attr - source's target attr
    const unroundedFinalModifier = sourceModifier + deltaModifier; // Keep unrounded for calculations
    finalSourceModifier = Math.round(unroundedFinalModifier); // Round for dice display
    successProbability = calculateDeltaSuccessProbability(sourceAttribute, finalSourceModifier);
    sourceDiceDisplay = formatDiceRoll(sourceAttribute, finalSourceModifier);
    targetDiceDisplay = `10 (static target)`;
    rangeAnalysis = analyzeDeltaSuccessRanges(sourceAttribute, finalSourceModifier);
  } else {
    // Default to CONTEST for unknown formulas
    successProbability = calculateDiceSuccessProbability(sourceAttribute, sourceModifier, targetAttribute, targetModifier);
    sourceDiceDisplay = formatDiceRoll(sourceAttribute, sourceModifier);
    targetDiceDisplay = formatDiceRoll(targetAttribute, targetModifier);
    rangeAnalysis = analyzeSuccessRanges(sourceAttribute, sourceModifier, targetAttribute, targetModifier);
  }
  
  // console.log('DICE CALCULATION RESULTS:', {
  //   sourceModifier,
  //   targetModifier,
  //   sourceDiceDisplay,
  //   targetDiceDisplay,
  //   successProbability,
  //   rangeAnalysis
  // });
  
  return {
    // Core results using new dice system
    difficulty: Math.round(successProbability * 10000) / 10000, // Round to 4 decimal places
    sourceValue,
    targetValue,
    sourceCount: sourceOverride ? 0 : sourceCharacters.length,
    targetCount: override ? 0 : targetEntities.length,
    successPercentage: Math.round(successProbability * 10000) / 100, // Convert to percentage with 2 decimals
    
    // New dice system information - ensure all integers are properly rounded
    sourceModifier: Math.round(finalSourceModifier),
    targetModifier: Math.round(finalTargetModifier),
    sourceDiceDisplay,
    targetDiceDisplay,
    sourceRange: rangeAnalysis.sourceRange,
    targetRange: rangeAnalysis.targetRange,
    guaranteedSuccess: rangeAnalysis.guaranteedSuccess,
    guaranteedFailure: rangeAnalysis.guaranteedFailure,
    partialSuccess: rangeAnalysis.partialSuccess,
    
    // Fatigue information (deprecated - always 0)
    sourceFatigue: 0,
    targetFatigue: 0,
    sourceFatigueDetails: [],
    targetFatigueDetails: [],
    
    // Legacy fields for backwards compatibility (using placeholder values)
    sourceDice: 0, // No longer relevant in new system
    targetDice: 0, // No longer relevant in new system
    adjustedSourceDice: 0,
    adjustedTargetDice: 0,
    finalSourceDice: 0,
    finalTargetDice: 0,
    dicePoolExceeded: false // No longer relevant in new system
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