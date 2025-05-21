/**
 * Utility functions for calculating grouped attribute values
 * between characters and their equipped objects.
 */

// All available attribute names
export const ATTRIBUTE_NAMES = [
  'lethality', 'armour', 'endurance', 'strength', 'dexterity', 
  'agility', 'perception', 'intelligence', 'charisma', 'resolve', 'morale'
];

/**
 * Calculates the grouped value for a single attribute using the grouping formula
 * @param {number} highestValue - The highest attribute value (A1)
 * @param {number} otherValue - The other attribute value (A2) 
 * @param {string} attributeType - Either 'HELP' or 'HINDER'
 * @returns {number} The calculated grouped value
 */
export const calculateGroupingFormula = (highestValue, otherValue, attributeType) => {
  if (attributeType === 'HELP') {
    return (highestValue + highestValue * (1 + (otherValue / highestValue))) / 2;
  } else if (attributeType === 'HINDER') {
    return (highestValue + highestValue * (1 - (otherValue / highestValue))) / 2;
  }
  return highestValue; // Default fallback
};

/**
 * Extracts attribute value and type from character or object attribute data
 * @param {Object} attributeData - The attribute data object
 * @returns {Object} { value: number, type: string } or null if no data
 */
export const extractAttributeInfo = (attributeData) => {
  if (!attributeData) return null;
  
  // Handle character attributes with fatigue structure
  if (attributeData.attribute) {
    return {
      value: attributeData.attribute.attributeValue,
      type: attributeData.attribute.attributeType
    };
  }
  
  // Handle object attributes with direct structure
  if (attributeData.attributeValue && attributeData.attributeType) {
    return {
      value: attributeData.attributeValue,
      type: attributeData.attributeType
    };
  }
  
  return null;
};

/**
 * Groups attributes from a character and their equipped objects
 * @param {Object} character - Character object with attributes and equipment
 * @returns {Object} Object containing grouped values for each attribute
 */
export const calculateGroupedAttributes = (character) => {
  const groupedAttributes = {};
  
  if (!character) return groupedAttributes;
  
  ATTRIBUTE_NAMES.forEach(attributeName => {
    const charAttrInfo = extractAttributeInfo(character[attributeName]);
    
    if (!charAttrInfo) {
      // Character doesn't have this attribute, skip grouping
      return;
    }
    
    // Collect all relevant attributes from equipment
    const equipmentAttributes = [];
    
    if (character.equipment && character.equipment.length > 0) {
      character.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        if (itemAttrInfo) {
          equipmentAttributes.push(itemAttrInfo);
        }
      });
    }
    
    // If no equipment has this attribute, grouped value equals character value
    if (equipmentAttributes.length === 0) {
      groupedAttributes[attributeName] = charAttrInfo.value;
      return;
    }
    
    // Add character attribute to the list for comparison
    const allAttributes = [charAttrInfo, ...equipmentAttributes];
    
    // Find the highest value
    let highestValue = Math.max(...allAttributes.map(attr => attr.value));
    let currentGroupedValue = highestValue;
    
    // Apply grouping formula for all other attributes
    allAttributes.forEach(attr => {
      if (attr.value !== highestValue) {
        currentGroupedValue = calculateGroupingFormula(
          currentGroupedValue,
          attr.value,
          attr.type
        );
      }
    });
    
    groupedAttributes[attributeName] = Math.round(currentGroupedValue * 100) / 100; // Round to 2 decimal places
  });
  
  return groupedAttributes;
};

/**
 * Groups attributes from an object and its equipped objects
 * @param {Object} object - Object with attributes and equipment
 * @returns {Object} Object containing grouped values for each attribute
 */
export const calculateObjectGroupedAttributes = (object) => {
  const groupedAttributes = {};
  
  if (!object) return groupedAttributes;
  
  ATTRIBUTE_NAMES.forEach(attributeName => {
    const objAttrInfo = extractAttributeInfo(object[attributeName]);
    
    if (!objAttrInfo) {
      // Object doesn't have this attribute, skip grouping
      return;
    }
    
    // Collect all relevant attributes from equipment
    const equipmentAttributes = [];
    
    if (object.equipment && object.equipment.length > 0) {
      object.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        if (itemAttrInfo) {
          equipmentAttributes.push(itemAttrInfo);
        }
      });
    }
    
    // If no equipment has this attribute, grouped value equals object value
    if (equipmentAttributes.length === 0) {
      groupedAttributes[attributeName] = objAttrInfo.value;
      return;
    }
    
    // Add object attribute to the list for comparison
    const allAttributes = [objAttrInfo, ...equipmentAttributes];
    
    // Find the highest value
    let highestValue = Math.max(...allAttributes.map(attr => attr.value));
    let currentGroupedValue = highestValue;
    
    // Apply grouping formula for all other attributes
    allAttributes.forEach(attr => {
      if (attr.value !== highestValue) {
        currentGroupedValue = calculateGroupingFormula(
          currentGroupedValue,
          attr.value,
          attr.type
        );
      }
    });
    
    groupedAttributes[attributeName] = Math.round(currentGroupedValue * 100) / 100; // Round to 2 decimal places
  });
  
  return groupedAttributes;
};