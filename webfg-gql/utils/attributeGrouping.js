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
 * @returns {Object} { value: number, type: string, fatigue: number } or null if no data
 */
const extractAttributeInfo = (attributeData) => {
  if (!attributeData) return null;
  
  // Handle character attributes with fatigue structure
  if (attributeData.attribute) {
    return {
      value: attributeData.attribute.attributeValue || 0,
      fatigue: attributeData.fatigue || 0,
      type: attributeData.attribute.attributeType || 'NONE'
    };
  }
  
  // Handle object attributes with direct structure (no fatigue)
  if (attributeData.attributeValue !== undefined && attributeData.attributeType) {
    return {
      value: attributeData.attributeValue || 0,
      fatigue: 0,
      type: attributeData.attributeType || 'NONE'
    };
  }
  
  return null;
};

/**
 * Groups attributes from a character and their equipped objects
 * IMPORTANT: Fatigue is applied AFTER grouping
 * @param {Object} character - Character object with attributes and equipment
 * @returns {Object} Object containing grouped values for each attribute (with fatigue applied)
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
    
    // Store fatigue for later application
    const fatigue = charAttrInfo.fatigue || 0;
    
    // Start with character's base value (without fatigue)
    let groupedValue = charAttrInfo.value;
    
    // Collect all relevant attributes from equipment
    const equipmentAttributes = [];
    
    if (character.equipment && character.equipment.length > 0) {
      character.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        if (itemAttrInfo && itemAttrInfo.type !== 'NONE') {
          equipmentAttributes.push(itemAttrInfo);
        }
      });
    }
    
    // If character attribute is NONE or no equipment, just apply fatigue and return
    if (charAttrInfo.type === 'NONE' || equipmentAttributes.length === 0) {
      groupedAttributes[attributeName] = Math.max(1, groupedValue - fatigue);
      return;
    }
    
    // Collect all entities for grouping
    const allEntities = [];
    
    // Add character
    allEntities.push({
      value: charAttrInfo.value,
      type: charAttrInfo.type,
      groupedValue: charAttrInfo.value
    });
    
    // Add equipment
    character.equipment.forEach(item => {
      const itemAttrInfo = extractAttributeInfo(item[attributeName]);
      if (itemAttrInfo && itemAttrInfo.type !== 'NONE') {
        // For objects, check if they have their own equipment
        let itemGroupedValue = itemAttrInfo.value;
        
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
    
    // Sort by grouped value in descending order
    allEntities.sort((a, b) => b.groupedValue - a.groupedValue);
    
    // Apply grouping formula sequentially
    let currentGroupedValue = allEntities[0].groupedValue;
    
    for (let i = 1; i < allEntities.length; i++) {
      currentGroupedValue = calculateGroupingFormula(
        currentGroupedValue,
        allEntities[i].groupedValue,
        allEntities[i].type
      );
    }
    
    // Apply fatigue AFTER all grouping is complete
    // Ensure minimum of 1 die
    const finalValue = Math.max(1, currentGroupedValue - fatigue);
    
    groupedAttributes[attributeName] = Math.round(finalValue * 100) / 100;
  });
  
  return groupedAttributes;
};

/**
 * Groups attributes from an object and its equipped objects
 * Objects don't have fatigue
 * @param {Object} object - Object with attributes and equipment
 * @returns {Object} Object containing grouped values for each attribute
 */
const calculateObjectGroupedAttributes = (object) => {
  const groupedAttributes = {};
  
  if (!object) return groupedAttributes;
  
  ATTRIBUTE_NAMES.forEach(attributeName => {
    const objAttrInfo = extractAttributeInfo(object[attributeName]);
    
    if (!objAttrInfo) {
      return;
    }
    
    // Objects don't have fatigue, so we just do normal grouping
    let groupedValue = objAttrInfo.value;
    
    // Collect equipment attributes
    const equipmentAttributes = [];
    
    if (object.equipment && object.equipment.length > 0) {
      object.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        if (itemAttrInfo && itemAttrInfo.type !== 'NONE') {
          equipmentAttributes.push(itemAttrInfo);
        }
      });
    }
    
    // If no equipment or NONE type, return base value
    if (objAttrInfo.type === 'NONE' || equipmentAttributes.length === 0) {
      groupedAttributes[attributeName] = objAttrInfo.value;
      return;
    }
    
    // Collect all entities
    const allEntities = [{
      value: objAttrInfo.value,
      type: objAttrInfo.type,
      groupedValue: objAttrInfo.value
    }];
    
    // Add equipment values
    equipmentAttributes.forEach(itemAttrInfo => {
      allEntities.push({
        value: itemAttrInfo.value,
        type: itemAttrInfo.type,
        groupedValue: itemAttrInfo.value
      });
    });
    
    // Sort and apply grouping
    allEntities.sort((a, b) => b.groupedValue - a.groupedValue);
    
    let currentGroupedValue = allEntities[0].groupedValue;
    
    for (let i = 1; i < allEntities.length; i++) {
      currentGroupedValue = calculateGroupingFormula(
        currentGroupedValue,
        allEntities[i].groupedValue,
        allEntities[i].type
      );
    }
    
    groupedAttributes[attributeName] = Math.round(currentGroupedValue * 100) / 100;
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