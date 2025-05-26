/**
 * Utility functions for calculating grouped attribute values
 * between characters and their equipped objects.
 * This is the backend version - shared across all resolvers.
 */

// All available attribute names
const ATTRIBUTE_NAMES = [
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
const calculateGroupingFormula = (highestValue, otherValue, attributeType) => {
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
const extractAttributeInfo = (attributeData) => {
  if (!attributeData) return null;
  
  // Handle character attributes with fatigue structure
  if (attributeData.attribute) {
    return {
      value: attributeData.attribute.attributeValue || 0,
      type: attributeData.attribute.attributeType || 'NONE'
    };
  }
  
  // Handle object attributes with direct structure
  if (attributeData.attributeValue !== undefined && attributeData.attributeType) {
    return {
      value: attributeData.attributeValue || 0,
      type: attributeData.attributeType || 'NONE'
    };
  }
  
  return null;
};

/**
 * Groups attributes from a character and their equipped objects
 * @param {Object} character - Character object with attributes and equipment
 * @returns {Object} Object containing grouped values for each attribute
 */
const calculateGroupedAttributes = (character) => {
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
    
    // Collect all entities with their grouped values (equipment might have their own equipment)
    const allEntities = [];
    
    // Add character with base value
    allEntities.push({
      value: charAttrInfo.value,
      type: charAttrInfo.type,
      groupedValue: charAttrInfo.value
    });
    
    // Add equipment with their own grouped values
    if (character.equipment && character.equipment.length > 0) {
      character.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        if (itemAttrInfo && itemAttrInfo.type !== 'NONE') {
          // Calculate equipment's individual grouped value using their own equipment (if any)
          let itemGroupedValue = itemAttrInfo.value;
          
          // Only calculate grouped value if equipment has its own equipment
          if (item.equipment && item.equipment.length > 0) {
            const itemGroupedAttrs = calculateObjectGroupedAttributes(item);
            itemGroupedValue = itemGroupedAttrs[attributeName] || itemAttrInfo.value;
          }
          
          allEntities.push({
            value: itemAttrInfo.value,
            type: itemAttrInfo.type,
            groupedValue: itemGroupedValue
          });
        }
      });
    }
    
    // Sort by grouped value in descending order (highest first)
    allEntities.sort((a, b) => b.groupedValue - a.groupedValue);
    
    // Apply grouping formula sequentially starting with highest value
    let currentGroupedValue = allEntities[0].groupedValue;
    
    // Apply grouping formula for all subsequent entities in descending order
    for (let i = 1; i < allEntities.length; i++) {
      currentGroupedValue = calculateGroupingFormula(
        currentGroupedValue,
        allEntities[i].groupedValue,
        allEntities[i].type
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
const calculateObjectGroupedAttributes = (object) => {
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
    
    // Collect all entities with their values (objects don't have nested equipment in this context)
    const allEntities = [];
    
    // Add object with base value
    allEntities.push({
      value: objAttrInfo.value,
      type: objAttrInfo.type,
      groupedValue: objAttrInfo.value
    });
    
    // Add equipment with their base values (no nested equipment for objects)
    equipmentAttributes.forEach(itemAttrInfo => {
      allEntities.push({
        value: itemAttrInfo.value,
        type: itemAttrInfo.type,
        groupedValue: itemAttrInfo.value
      });
    });
    
    // Sort by grouped value in descending order (highest first)
    allEntities.sort((a, b) => b.groupedValue - a.groupedValue);
    
    // Apply grouping formula sequentially starting with highest value
    let currentGroupedValue = allEntities[0].groupedValue;
    
    // Apply grouping formula for all subsequent entities in descending order
    for (let i = 1; i < allEntities.length; i++) {
      currentGroupedValue = calculateGroupingFormula(
        currentGroupedValue,
        allEntities[i].groupedValue,
        allEntities[i].type
      );
    }
    
    groupedAttributes[attributeName] = Math.round(currentGroupedValue * 100) / 100; // Round to 2 decimal places
  });
  
  return groupedAttributes;
};

module.exports = {
  ATTRIBUTE_NAMES,
  calculateGroupingFormula,
  extractAttributeInfo,
  calculateGroupedAttributes,
  calculateObjectGroupedAttributes
};