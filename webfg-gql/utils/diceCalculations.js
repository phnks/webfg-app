/**
 * New dice rolling mechanics for attribute-based dice system
 * Each attribute maps to a specific die type or static value
 */

// Attribute to dice mapping
const ATTRIBUTE_DICE_MAP = {
  // No dice (static values)
  WEIGHT: null,
  SIZE: null,
  LETHALITY: null,
  ARMOUR: null,
  ARMOR: null, // Alternative spelling
  ENDURANCE: null,
  PERCEPTION: null,
  INTENSITY: null,
  MORALE: null,
  
  // Dice-based attributes
  SPEED: 4,      // d4
  STRENGTH: 8,   // d8
  DEXTERITY: 6,  // d6
  AGILITY: 10,   // d10
  CHARISMA: 100, // d100
  INTELLIGENCE: 20, // d20
  RESOLVE: 12    // d12
};

/**
 * Get the dice type for a given attribute
 * @param {string} attribute - The attribute name (case insensitive)
 * @returns {number|null} - The dice sides (e.g., 8 for d8) or null for static attributes
 */
const getDiceForAttribute = (attribute) => {
  if (!attribute) return null;
  return ATTRIBUTE_DICE_MAP[attribute.toUpperCase()] || null;
};

/**
 * Check if an attribute uses dice rolling
 * @param {string} attribute - The attribute name (case insensitive)
 * @returns {boolean} - True if the attribute uses dice, false if static
 */
const attributeUsesDice = (attribute) => {
  return getDiceForAttribute(attribute) !== null;
};

/**
 * Calculate the modifier for an attribute (attribute value minus fatigue for dice-based, or just attribute value for static)
 * @param {number} attributeValue - The base attribute value
 * @param {number} fatigue - The character's fatigue (only applied to dice-based attributes)
 * @param {string} attribute - The attribute name
 * @returns {number} - The modifier to add to dice roll or the static value
 */
const calculateAttributeModifier = (attributeValue, fatigue, attribute) => {
  const value = attributeValue || 0;
  
  // For static attributes (no dice), don't apply fatigue
  if (!attributeUsesDice(attribute)) {
    return Math.round(value); // Round static values too
  }
  
  // For dice-based attributes, subtract fatigue and round
  const fatigueValue = fatigue || 0;
  const result = Math.max(0, value - fatigueValue); // Don't allow negative modifiers
  return Math.round(result); // Round to integer (.0-.4 down, .5-.9 up)
};

/**
 * Get the dice range for a given attribute
 * @param {string} attribute - The attribute name
 * @param {number} modifier - The calculated modifier
 * @returns {object} - Object with min and max possible values
 */
const getAttributeRange = (attribute, modifier) => {
  const diceSides = getDiceForAttribute(attribute);
  
  if (!diceSides) {
    // Static attribute - same value always
    return { min: modifier, max: modifier };
  }
  
  return {
    min: 1 + modifier,
    max: diceSides + modifier
  };
};

/**
 * Calculate the exact success probability for dice vs dice or dice vs static
 * @param {string} sourceAttribute - Source attribute name
 * @param {number} sourceModifier - Source modifier (attribute value - fatigue, rounded)
 * @param {string} targetAttribute - Target attribute name  
 * @param {number} targetModifier - Target modifier (attribute value - fatigue, rounded)
 * @returns {number} - Success probability (0.0 to 1.0)
 */
const calculateDiceSuccessProbability = (sourceAttribute, sourceModifier, targetAttribute, targetModifier) => {
  const sourceRange = getAttributeRange(sourceAttribute, sourceModifier);
  const targetRange = getAttributeRange(targetAttribute, targetModifier);
  
  // For static vs static
  if (!attributeUsesDice(sourceAttribute) && !attributeUsesDice(targetAttribute)) {
    if (sourceRange.min > targetRange.min) return 1.0; // Source wins
    if (sourceRange.min < targetRange.min) return 0.0; // Source loses
    return 0.0; // Tie goes to target (source loses)
  }
  
  // For dice vs static
  if (!attributeUsesDice(targetAttribute)) {
    const targetValue = targetRange.min; // Static value
    const sourceDice = getDiceForAttribute(sourceAttribute);
    
    // Count how many source outcomes beat the static target
    let successfulOutcomes = 0;
    for (let roll = 1; roll <= sourceDice; roll++) {
      if (roll + sourceModifier > targetValue) {
        successfulOutcomes++;
      }
    }
    return successfulOutcomes / sourceDice;
  }
  
  // For static vs dice
  if (!attributeUsesDice(sourceAttribute)) {
    const sourceValue = sourceRange.min; // Static value
    const targetDice = getDiceForAttribute(targetAttribute);
    
    // Count how many target outcomes the static source beats
    let successfulOutcomes = 0;
    for (let roll = 1; roll <= targetDice; roll++) {
      if (sourceValue > roll + targetModifier) {
        successfulOutcomes++;
      }
    }
    return successfulOutcomes / targetDice;
  }
  
  // For dice vs dice
  const sourceDice = getDiceForAttribute(sourceAttribute);
  const targetDice = getDiceForAttribute(targetAttribute);
  
  let totalOutcomes = 0;
  let successfulOutcomes = 0;
  
  // Check all possible combinations
  for (let sourceRoll = 1; sourceRoll <= sourceDice; sourceRoll++) {
    for (let targetRoll = 1; targetRoll <= targetDice; targetRoll++) {
      totalOutcomes++;
      const sourceTotal = sourceRoll + sourceModifier;
      const targetTotal = targetRoll + targetModifier;
      
      if (sourceTotal > targetTotal) {
        successfulOutcomes++;
      }
      // Ties go to target (source loses)
    }
  }
  
  return totalOutcomes > 0 ? successfulOutcomes / totalOutcomes : 0.0;
};

/**
 * Format a dice roll display (e.g., "1d8+5" or "Static: 10")
 * @param {string} attribute - The attribute name
 * @param {number} modifier - The calculated modifier
 * @returns {string} - Formatted dice roll string
 */
const formatDiceRoll = (attribute, modifier) => {
  const diceSides = getDiceForAttribute(attribute);
  
  if (!diceSides) {
    return `Static: ${modifier}`;
  }
  
  return `1d${diceSides}+${modifier}`;
};

/**
 * Analyze success ranges and return color-coded results
 * @param {string} sourceAttribute - Source attribute name
 * @param {number} sourceModifier - Source modifier
 * @param {string} targetAttribute - Target attribute name
 * @param {number} targetModifier - Target modifier
 * @returns {object} - Analysis with ranges and success type
 */
const analyzeSuccessRanges = (sourceAttribute, sourceModifier, targetAttribute, targetModifier) => {
  const sourceRange = getAttributeRange(sourceAttribute, sourceModifier);
  const targetRange = getAttributeRange(targetAttribute, targetModifier);
  
  // Determine success scenarios
  const guaranteedSuccess = sourceRange.min > targetRange.max;
  const guaranteedFailure = sourceRange.max <= targetRange.min;
  
  return {
    sourceRange,
    targetRange,
    guaranteedSuccess,
    guaranteedFailure,
    partialSuccess: !guaranteedSuccess && !guaranteedFailure
  };
};

module.exports = {
  ATTRIBUTE_DICE_MAP,
  getDiceForAttribute,
  attributeUsesDice,
  calculateAttributeModifier,
  getAttributeRange,
  calculateDiceSuccessProbability,
  formatDiceRoll,
  analyzeSuccessRanges
};