// Attribute to dice mapping for the new dice rolling mechanics
// Maps each attribute to its corresponding die type or null for static values

export const ATTRIBUTE_DICE_MAP = {
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
  SPEED: 'd4',
  STRENGTH: 'd8',
  DEXTERITY: 'd6',
  AGILITY: 'd10',
  CHARISMA: 'd100',
  INTELLIGENCE: 'd20',
  RESOLVE: 'd12'
};

/**
 * Get the dice type for a given attribute
 * @param {string} attribute - The attribute name (case insensitive)
 * @returns {string|null} - The dice type (e.g., 'd8') or null for static attributes
 */
export const getDiceForAttribute = (attribute) => {
  if (!attribute) return null;
  return ATTRIBUTE_DICE_MAP[attribute.toUpperCase()] || null;
};

/**
 * Check if an attribute uses dice rolling
 * @param {string} attribute - The attribute name (case insensitive)
 * @returns {boolean} - True if the attribute uses dice, false if static
 */
export const attributeUsesDice = (attribute) => {
  return getDiceForAttribute(attribute) !== null;
};

/**
 * Get the dice range for a given dice type
 * @param {string} diceType - The dice type (e.g., 'd8')
 * @returns {object} - Object with min and max values for the dice
 */
export const getDiceRange = (diceType) => {
  if (!diceType) return { min: 0, max: 0 };
  
  const sides = parseInt(diceType.substring(1));
  return {
    min: 1,
    max: sides
  };
};

/**
 * Calculate the modifier for an attribute
 * @param {number} attributeValue - The base attribute value
 * @param {number} fatigue - (deprecated) No longer used
 * @param {string} attribute - The attribute name
 * @returns {number} - The modifier to add to dice roll or the static value
 */
export const calculateAttributeModifier = (attributeValue, fatigue, attribute) => {
  const value = attributeValue || 0;
  
  // Just return the rounded value
  return Math.round(value); // Round to integer (.0-.4 down, .5-.9 up)
};

/**
 * Format a dice roll display (e.g., "1d8+5" or "Static: 10")
 * @param {string} attribute - The attribute name
 * @param {number} modifier - The calculated modifier
 * @returns {string} - Formatted dice roll string
 */
export const formatDiceRoll = (attribute, modifier) => {
  const diceType = getDiceForAttribute(attribute);
  
  if (!diceType) {
    return `Static: ${modifier}`;
  }
  
  return `1${diceType}+${modifier}`;
};

/**
 * Calculate the possible range of values for an attribute roll
 * @param {string} attribute - The attribute name
 * @param {number} modifier - The calculated modifier
 * @returns {object} - Object with min and max possible values
 */
export const getAttributeRange = (attribute, modifier) => {
  const diceType = getDiceForAttribute(attribute);
  
  if (!diceType) {
    // Static attribute - same value always
    return { min: modifier, max: modifier };
  }
  
  const diceRange = getDiceRange(diceType);
  return {
    min: diceRange.min + modifier,
    max: diceRange.max + modifier
  };
};