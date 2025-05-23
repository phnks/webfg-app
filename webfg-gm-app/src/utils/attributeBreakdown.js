/**
 * Additional utility functions for detailed attribute grouping breakdowns
 */

import { extractAttributeInfo, calculateGroupingFormula, calculateGroupedAttributes, calculateObjectGroupedAttributes } from './attributeGrouping';

/**
 * Calculates step-by-step breakdown of how each equipment affects the final grouped value
 * @param {Object} character - Character object with attributes and equipment
 * @param {string} attributeName - The specific attribute to analyze (e.g., 'lethality')
 * @param {Object} characterGroupedAttributes - Pre-calculated grouped attributes for character
 * @returns {Array} Array of steps showing the progression
 */
export const calculateAttributeBreakdown = (character, attributeName, characterGroupedAttributes = null) => {
  const breakdown = [];
  
  if (!character) return breakdown;
  
  const charAttrInfo = extractAttributeInfo(character[attributeName]);
  if (!charAttrInfo) return breakdown;
  
  // If character attribute is NONE, no further grouping occurs
  if (charAttrInfo.type === 'NONE') {
    breakdown.push({
      step: 1,
      entityName: character.name || 'Character',
      entityType: 'character',
      attributeValue: charAttrInfo.value,
      attributeType: charAttrInfo.type,
      runningTotal: charAttrInfo.value,
      formula: null
    });
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
    breakdown.push({
      step: 1,
      entityName: character.name || 'Character',
      entityType: 'character',
      attributeValue: charAttrInfo.value,
      attributeType: charAttrInfo.type,
      runningTotal: charAttrInfo.value,
      formula: null
    });
    return breakdown;
  }
  
  // Get grouped values for each entity
  const allEntities = [];
  
  // Add character with base value (since we're calculating character's grouping)
  const characterEntity = {
    name: character.name || 'Character',
    entityType: 'character',
    attributeValue: charAttrInfo.value,
    attributeType: charAttrInfo.type,
    groupedValue: charAttrInfo.value
  };
  allEntities.push(characterEntity);
  
  // Add equipment with their grouped values from the character's grouped attributes
  if (character.equipment && character.equipment.length > 0) {
    character.equipment.forEach(item => {
      const itemAttrInfo = extractAttributeInfo(item[attributeName]);
      if (itemAttrInfo && itemAttrInfo.type !== 'NONE') {
        // Use the final grouped value that the character view displays
        // Since we know the character's main display is correct, we can work backwards
        // For now, let's use a simple approach: get the grouped value from main calculation
        let itemGroupedValue = itemAttrInfo.value;
        
        // Calculate equipment's individual grouped value using their own equipment
        const itemGroupedAttrs = calculateGroupedAttributes(item);
        itemGroupedValue = itemGroupedAttrs[attributeName] || itemAttrInfo.value;
        
        allEntities.push({
          name: item.name,
          entityType: 'equipment',
          attributeValue: itemAttrInfo.value,
          attributeType: itemAttrInfo.type,
          groupedValue: itemGroupedValue
        });
      }
    });
  }
  
  // Sort by grouped value in descending order (highest first)
  allEntities.sort((a, b) => b.groupedValue - a.groupedValue);
  
  // Start with the highest grouped value and build breakdown from sorted entities
  let currentValue = allEntities[0].groupedValue;
  let stepNumber = 1;
  
  // Add the first (highest) entity as step 1
  breakdown.push({
    step: stepNumber,
    entityName: allEntities[0].name,
    entityType: allEntities[0].entityType,
    attributeValue: allEntities[0].groupedValue,
    attributeType: allEntities[0].attributeType,
    runningTotal: currentValue,
    formula: null
  });
  
  // Apply grouping formula for each subsequent entity in descending order
  for (let i = 1; i < allEntities.length; i++) {
    const entity = allEntities[i];
    const previousValue = currentValue;
    currentValue = calculateGroupingFormula(currentValue, entity.groupedValue, entity.attributeType);
    
    stepNumber++;
    breakdown.push({
      step: stepNumber,
      entityName: entity.name,
      entityType: entity.entityType,
      attributeValue: entity.groupedValue,
      attributeType: entity.attributeType,
      runningTotal: Math.round(currentValue * 100) / 100,
      formula: entity.attributeType === 'HELP' 
        ? `(${previousValue} + ${previousValue} × (1 + ${entity.groupedValue}/${previousValue})) / 2`
        : `(${previousValue} + ${previousValue} × (1 - ${entity.groupedValue}/${previousValue})) / 2`
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
  
  // Get grouped values for each entity
  const allEntities = [];
  
  // Add object with base value (since we're calculating object's grouping)
  allEntities.push({
    name: object.name || 'Object',
    entityType: 'object',
    attributeValue: objAttrInfo.value,
    attributeType: objAttrInfo.type,
    groupedValue: objAttrInfo.value
  });
  
  // Add equipment with their own individual grouped values
  if (object.equipment && object.equipment.length > 0) {
    object.equipment.forEach(item => {
      const itemAttrInfo = extractAttributeInfo(item[attributeName]);
      if (itemAttrInfo && itemAttrInfo.type !== 'NONE') {
        // Calculate this equipment's own grouped value using calculateObjectGroupedAttributes
        const itemGroupedAttrs = calculateObjectGroupedAttributes(item);
        const itemGroupedValue = itemGroupedAttrs[attributeName] || itemAttrInfo.value;
        
        allEntities.push({
          name: item.name,
          entityType: 'equipment',
          attributeValue: itemAttrInfo.value,
          attributeType: itemAttrInfo.type,
          groupedValue: itemGroupedValue
        });
      }
    });
  }
  
  // Sort by grouped value in descending order (highest first)
  allEntities.sort((a, b) => b.groupedValue - a.groupedValue);
  
  // Start with the highest grouped value
  let currentValue = allEntities[0].groupedValue;
  let stepNumber = 1;
  
  // Apply grouping formula for each subsequent entity in descending order
  for (let i = 1; i < allEntities.length; i++) {
    const entity = allEntities[i];
    const previousValue = currentValue;
    currentValue = calculateGroupingFormula(currentValue, entity.groupedValue, entity.attributeType);
    
    stepNumber++;
    breakdown.push({
      step: stepNumber,
      entityName: entity.name,
      entityType: entity.entityType,
      attributeValue: entity.groupedValue,
      attributeType: entity.attributeType,
      runningTotal: Math.round(currentValue * 100) / 100,
      formula: entity.attributeType === 'HELP' 
        ? `(${previousValue} + ${previousValue} × (1 + ${entity.groupedValue}/${previousValue})) / 2`
        : `(${previousValue} + ${previousValue} × (1 - ${entity.groupedValue}/${previousValue})) / 2`
    });
  }
  
  return breakdown;
};