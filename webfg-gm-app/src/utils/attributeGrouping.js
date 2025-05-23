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
 * @param {string} attributeType - Either 'HELP', 'HINDER', or 'NONE'
 * @returns {number} The calculated grouped value
 */
export const calculateGroupingFormula = (highestValue, otherValue, attributeType) => {
  if (attributeType === 'HELP') {
    return (highestValue + highestValue * (1 + (otherValue / highestValue))) / 2;
  } else if (attributeType === 'HINDER') {
    return (highestValue + highestValue * (1 - (otherValue / highestValue))) / 2;
  } else if (attributeType === 'NONE') {
    // NONE attributes don't participate in grouping, return the highest value unchanged
    return highestValue;
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
    
    // Collect all relevant attributes from equipment, excluding NONE types
    const equipmentAttributes = [];
    
    if (character.equipment && character.equipment.length > 0) {
      character.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        if (itemAttrInfo && itemAttrInfo.type !== 'NONE') {
          equipmentAttributes.push(itemAttrInfo);
        }
      });
    }
    
    // If character attribute is NONE, grouped value equals character value (no grouping)
    if (charAttrInfo.type === 'NONE') {
      groupedAttributes[attributeName] = charAttrInfo.value;
      return;
    }
    
    // If no equipment has this attribute (or all equipment attributes are NONE), grouped value equals character value
    if (equipmentAttributes.length === 0) {
      groupedAttributes[attributeName] = charAttrInfo.value;
      return;
    }
    
    // Add character attribute to the list for comparison
    const allAttributes = [charAttrInfo, ...equipmentAttributes];
    
    // Apply grouping formula sequentially to all attributes
    let currentGroupedValue = allAttributes[0].value;
    
    // Apply grouping formula for all subsequent attributes (NONE attributes are already filtered out)
    for (let i = 1; i < allAttributes.length; i++) {
      currentGroupedValue = calculateGroupingFormula(
        currentGroupedValue,
        allAttributes[i].value,
        allAttributes[i].type
      );
    }
    
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
    
    // Collect all relevant attributes from equipment, excluding NONE types
    const equipmentAttributes = [];
    
    if (object.equipment && object.equipment.length > 0) {
      object.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        if (itemAttrInfo && itemAttrInfo.type !== 'NONE') {
          equipmentAttributes.push(itemAttrInfo);
        }
      });
    }
    
    // If object attribute is NONE, grouped value equals object value (no grouping)
    if (objAttrInfo.type === 'NONE') {
      groupedAttributes[attributeName] = objAttrInfo.value;
      return;
    }
    
    // If no equipment has this attribute (or all equipment attributes are NONE), grouped value equals object value
    if (equipmentAttributes.length === 0) {
      groupedAttributes[attributeName] = objAttrInfo.value;
      return;
    }
    
    // Add object attribute to the list for comparison
    const allAttributes = [objAttrInfo, ...equipmentAttributes];
    
    // Apply grouping formula sequentially to all attributes
    let currentGroupedValue = allAttributes[0].value;
    
    // Apply grouping formula for all subsequent attributes (NONE attributes are already filtered out)
    for (let i = 1; i < allAttributes.length; i++) {
      currentGroupedValue = calculateGroupingFormula(
        currentGroupedValue,
        allAttributes[i].value,
        allAttributes[i].type
      );
    }
    
    groupedAttributes[attributeName] = Math.round(currentGroupedValue * 100) / 100; // Round to 2 decimal places
  });
  
  return groupedAttributes;
};
