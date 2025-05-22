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
    
    // Find the highest value
    let highestValue = Math.max(...allAttributes.map(attr => attr.value));
    let currentGroupedValue = highestValue;
    
    // Apply grouping formula for all other attributes (NONE attributes are already filtered out)
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
    
    // Find the highest value
    let highestValue = Math.max(...allAttributes.map(attr => attr.value));
    let currentGroupedValue = highestValue;
    
    // Apply grouping formula for all other attributes (NONE attributes are already filtered out)
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
 * Calculates step-by-step breakdown of how each equipment affects the final grouped value
 * @param {Object} character - Character object with attributes and equipment
 * @param {string} attributeName - The specific attribute to analyze (e.g., 'lethality')
 * @returns {Array} Array of steps showing the progression
 */
export const calculateAttributeBreakdown = (character, attributeName) => {
  const breakdown = [];
  
  if (\!character) return breakdown;
  
  const charAttrInfo = extractAttributeInfo(character[attributeName]);
  if (\!charAttrInfo) return breakdown;
  
  // Add the starting character value
  breakdown.push({
    step: 1,
    entityName: character.name || 'Character',
    entityType: 'character',
    attributeValue: charAttrInfo.value,
    attributeType: charAttrInfo.type,
    runningTotal: charAttrInfo.value,
    formula: null
  });
  
  // If character attribute is NONE, no further grouping occurs
  if (charAttrInfo.type === 'NONE') {
    return breakdown;
  }
  
  // Collect equipment attributes (excluding NONE types)
  const equipmentAttributes = [];
  if (character.equipment && character.equipment.length > 0) {
    character.equipment.forEach(item => {
      const itemAttrInfo = extractAttributeInfo(item[attributeName]);
      if (itemAttrInfo && itemAttrInfo.type \!== 'NONE') {
        equipmentAttributes.push({
          name: item.name,
          ...itemAttrInfo
        });
      }
    });
  }
  
  // If no valid equipment, return just the character value
  if (equipmentAttributes.length === 0) {
    return breakdown;
  }
  
  // Combine character and equipment attributes
  const allAttributes = [
    { name: character.name || 'Character', ...charAttrInfo },
    ...equipmentAttributes
  ];
  
  // Find the highest value to start with
  const highestValue = Math.max(...allAttributes.map(attr => attr.value));
  let currentValue = highestValue;
  let stepNumber = 1;
  
  // Find who has the highest value
  const highestAttr = allAttributes.find(attr => attr.value === highestValue);
  
  // If the highest isn't the character, add a step showing we start with the highest
  if (highestAttr.name \!== (character.name || 'Character')) {
    stepNumber++;
    breakdown.push({
      step: stepNumber,
      entityName: highestAttr.name,
      entityType: 'equipment',
      attributeValue: highestAttr.value,
      attributeType: highestAttr.type,
      runningTotal: currentValue,
      formula: `Starting with highest value: ${highestValue}`
    });
  }
  
  // Apply grouping formula for each other attribute
  allAttributes.forEach(attr => {
    if (attr.value \!== highestValue) {
      const previousValue = currentValue;
      currentValue = calculateGroupingFormula(currentValue, attr.value, attr.type);
      
      stepNumber++;
      breakdown.push({
        step: stepNumber,
        entityName: attr.name,
        entityType: attr.name === (character.name || 'Character') ? 'character' : 'equipment',
        attributeValue: attr.value,
        attributeType: attr.type,
        runningTotal: Math.round(currentValue * 100) / 100,
        formula: attr.type === 'HELP' 
          ? `(${previousValue} + ${previousValue} × (1 + ${attr.value}/${previousValue})) / 2`
          : `(${previousValue} + ${previousValue} × (1 - ${attr.value}/${previousValue})) / 2`
      });
    }
  });
  
  return breakdown;
};

/**
 * Calculates step-by-step breakdown for object grouping
 * @param {Object} object - Object with attributes and equipment
 * @param {string} attributeName - The specific attribute to analyze
 * @returns {Array} Array of steps showing the progression
 */
export const calculateObjectAttributeBreakdown = (object, attributeName) => {
  const breakdown = [];
  
  if (\!object) return breakdown;
  
  const objAttrInfo = extractAttributeInfo(object[attributeName]);
  if (\!objAttrInfo) return breakdown;
  
  // Add the starting object value
  breakdown.push({
    step: 1,
    entityName: object.name || 'Object',
    entityType: 'object',
    attributeValue: objAttrInfo.value,
    attributeType: objAttrInfo.type,
    runningTotal: objAttrInfo.value,
    formula: null
  });
  
  // If object attribute is NONE, no further grouping occurs
  if (objAttrInfo.type === 'NONE') {
    return breakdown;
  }
  
  // Collect equipment attributes (excluding NONE types)
  const equipmentAttributes = [];
  if (object.equipment && object.equipment.length > 0) {
    object.equipment.forEach(item => {
      const itemAttrInfo = extractAttributeInfo(item[attributeName]);
      if (itemAttrInfo && itemAttrInfo.type \!== 'NONE') {
        equipmentAttributes.push({
          name: item.name,
          ...itemAttrInfo
        });
      }
    });
  }
  
  // If no valid equipment, return just the object value
  if (equipmentAttributes.length === 0) {
    return breakdown;
  }
  
  // Combine object and equipment attributes
  const allAttributes = [
    { name: object.name || 'Object', ...objAttrInfo },
    ...equipmentAttributes
  ];
  
  // Find the highest value to start with
  const highestValue = Math.max(...allAttributes.map(attr => attr.value));
  let currentValue = highestValue;
  let stepNumber = 1;
  
  // Find who has the highest value
  const highestAttr = allAttributes.find(attr => attr.value === highestValue);
  
  // If the highest isn't the object, add a step showing we start with the highest
  if (highestAttr.name \!== (object.name || 'Object')) {
    stepNumber++;
    breakdown.push({
      step: stepNumber,
      entityName: highestAttr.name,
      entityType: 'equipment',
      attributeValue: highestAttr.value,
      attributeType: highestAttr.type,
      runningTotal: currentValue,
      formula: `Starting with highest value: ${highestValue}`
    });
  }
  
  // Apply grouping formula for each other attribute
  allAttributes.forEach(attr => {
    if (attr.value \!== highestValue) {
      const previousValue = currentValue;
      currentValue = calculateGroupingFormula(currentValue, attr.value, attr.type);
      
      stepNumber++;
      breakdown.push({
        step: stepNumber,
        entityName: attr.name,
        entityType: attr.name === (object.name || 'Object') ? 'object' : 'equipment',
        attributeValue: attr.value,
        attributeType: attr.type,
        runningTotal: Math.round(currentValue * 100) / 100,
        formula: attr.type === 'HELP' 
          ? `(${previousValue} + ${previousValue} × (1 + ${attr.value}/${previousValue})) / 2`
          : `(${previousValue} + ${previousValue} × (1 - ${attr.value}/${previousValue})) / 2`
      });
    }
  });
  
  return breakdown;
};
EOF < /dev/null
