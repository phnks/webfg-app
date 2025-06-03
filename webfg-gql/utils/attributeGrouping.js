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
 * Calculate the grouped value using the new weighted average formula
 * Formula: (A1 + A2*(0.1+A2/A1) + A3*(0.1+A3/A1) + ...) / N
 * Where A1 is the highest value, A2, A3... are other values, N is total count
 * @param {Array} values - Array of attribute values, sorted highest first
 * @returns {number} The calculated grouped value
 */
const calculateGroupingFormula = (values) => {
  if (!values || values.length === 0) return 0;
  if (values.length === 1) return values[0];
  
  const A1 = values[0]; // Highest value
  let sum = A1; // Start with the highest value
  
  // Add weighted values for all other attributes
  for (let i = 1; i < values.length; i++) {
    const Ai = values[i];
    if (A1 > 0) {
      sum += Ai * (0.1 + Ai / A1);
    } else {
      // Handle edge case where A1 is 0
      sum += Ai * 0.1;
    }
  }
  
  return sum / values.length;
};

/**
 * Extracts attribute value and grouping status from character or object attribute data
 * @param {Object} attributeData - The attribute data object
 * @returns {Object} { value: number, isGrouped: boolean } or null if no data
 */
const extractAttributeInfo = (attributeData) => {
  if (!attributeData) return null;
  
  // Handle character attributes (no longer has fatigue in attributes)
  if (attributeData.attribute) {
    return {
      value: attributeData.attribute.attributeValue || 0,
      isGrouped: attributeData.attribute.isGrouped !== undefined ? attributeData.attribute.isGrouped : true // Default to true
    };
  }
  
  // Handle object attributes with direct structure
  if (attributeData.attributeValue !== undefined) {
    return {
      value: attributeData.attributeValue || 0,
      isGrouped: attributeData.isGrouped !== undefined ? attributeData.isGrouped : true // Default to true
    };
  }
  
  return null;
};

/**
 * Groups attributes from a character and their equipped objects using weighted average formula
 * Note: Fatigue is no longer applied here - it's handled at the action test level
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
    
    // Check if there's any equipment with this attribute that wants to be grouped
    let hasGroupableEquipment = false;
    if (character.equipment && character.equipment.length > 0) {
      hasGroupableEquipment = character.equipment.some(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        return itemAttrInfo && itemAttrInfo.isGrouped;
      });
    }
    
    // If character attribute is not grouped AND no equipment wants to group, just return base value
    if (!charAttrInfo.isGrouped && !hasGroupableEquipment) {
      groupedAttributes[attributeName] = charAttrInfo.value;
      return;
    }
    
    // Collect all values for grouping
    const valuesToGroup = [];
    
    // Only include character's value if they have isGrouped=true
    if (charAttrInfo.isGrouped) {
      valuesToGroup.push(charAttrInfo.value);
    }
    
    if (character.equipment && character.equipment.length > 0) {
      character.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        if (itemAttrInfo && itemAttrInfo.isGrouped) {
          // For objects, check if they have their own equipment and get their grouped value
          let itemValue = itemAttrInfo.value;
          
          if (item.equipment && item.equipment.length > 0) {
            const itemGroupedAttrs = calculateObjectGroupedAttributes(item);
            itemValue = itemGroupedAttrs[attributeName] || itemAttrInfo.value;
          }
          
          valuesToGroup.push(itemValue);
        }
      });
    }
    
    // If no values to group (shouldn't happen with our logic above), use character's base value
    if (valuesToGroup.length === 0) {
      groupedAttributes[attributeName] = charAttrInfo.value;
      return;
    }
    
    // Sort values in descending order (highest first)
    valuesToGroup.sort((a, b) => b - a);
    
    // Apply new weighted average grouping formula
    const groupedValue = calculateGroupingFormula(valuesToGroup);
    
    // No fatigue applied here anymore - it's handled at action test level
    groupedAttributes[attributeName] = Math.round(groupedValue * 100) / 100;
  });
  
  return groupedAttributes;
};

/**
 * Groups attributes from an object and its equipped objects using weighted average formula
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
    
    // If object attribute is not grouped, return base value
    if (!objAttrInfo.isGrouped) {
      groupedAttributes[attributeName] = objAttrInfo.value;
      return;
    }
    
    // Collect all values for grouping (object + equipment)
    const valuesToGroup = [objAttrInfo.value]; // Start with object's base value
    
    if (object.equipment && object.equipment.length > 0) {
      object.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        if (itemAttrInfo && itemAttrInfo.isGrouped) {
          // For nested equipment, get their grouped value recursively
          let itemValue = itemAttrInfo.value;
          
          if (item.equipment && item.equipment.length > 0) {
            const itemGroupedAttrs = calculateObjectGroupedAttributes(item);
            itemValue = itemGroupedAttrs[attributeName] || itemAttrInfo.value;
          }
          
          valuesToGroup.push(itemValue);
        }
      });
    }
    
    // Sort values in descending order (highest first)
    valuesToGroup.sort((a, b) => b - a);
    
    // Apply new weighted average grouping formula
    const groupedValue = calculateGroupingFormula(valuesToGroup);
    
    groupedAttributes[attributeName] = Math.round(groupedValue * 100) / 100;
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