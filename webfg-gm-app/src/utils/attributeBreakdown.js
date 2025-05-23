/**
 * Additional utility functions for detailed attribute grouping breakdowns
 */

import { extractAttributeInfo, calculateGroupingFormula } from './attributeGrouping';

/**
 * Calculates step-by-step breakdown of how each equipment affects the final grouped value
 * @param {Object} character - Character object with attributes and equipment
 * @param {string} attributeName - The specific attribute to analyze (e.g., 'lethality')
 * @returns {Array} Array of steps showing the progression
 */
export const calculateAttributeBreakdown = (character, attributeName) => {
  const breakdown = [];
  
  if (!character) return breakdown;
  
  const charAttrInfo = extractAttributeInfo(character[attributeName]);
  if (!charAttrInfo) return breakdown;
  
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
      if (itemAttrInfo && itemAttrInfo.type !== 'NONE') {
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
  
  // Apply grouping formula sequentially to all attributes
  let currentValue = allAttributes[0].value;
  let stepNumber = 1;
  
  // Apply grouping formula for each subsequent attribute
  for (let i = 1; i < allAttributes.length; i++) {
    const attr = allAttributes[i];
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
  
  if (!object) return breakdown;
  
  const objAttrInfo = extractAttributeInfo(object[attributeName]);
  if (!objAttrInfo) return breakdown;
  
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
      if (itemAttrInfo && itemAttrInfo.type !== 'NONE') {
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
  
  // Apply grouping formula sequentially to all attributes
  let currentValue = allAttributes[0].value;
  let stepNumber = 1;
  
  // Apply grouping formula for each subsequent attribute
  for (let i = 1; i < allAttributes.length; i++) {
    const attr = allAttributes[i];
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
  
  return breakdown;
};