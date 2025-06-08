/**
 * Additional utility functions for detailed attribute grouping breakdowns
 * Backend version for GraphQL resolvers
 */

const { 
  extractAttributeInfo, 
  calculateGroupingFormula, 
  calculateGroupedAttributes, 
  calculateObjectGroupedAttributes 
} = require('./attributeGrouping');

/**
 * Calculates step-by-step breakdown of how each equipment affects the final grouped value
 * @param {Object} character - Character object with attributes and equipment
 * @param {string} attributeName - The specific attribute to analyze (e.g., 'lethality')
 * @param {Object} characterGroupedAttributes - Pre-calculated grouped attributes for character
 * @returns {Array} Array of steps showing the progression
 */
const calculateAttributeBreakdown = (character, attributeName, characterGroupedAttributes = null) => {
  const breakdown = [];
  
  if (!character) return breakdown;
  
  const charAttrInfo = extractAttributeInfo(character[attributeName]);
  if (!charAttrInfo) return breakdown;
  
  // Check if there's any equipment with this attribute that wants to be grouped
  let hasGroupableEquipment = false;
  const equipmentAttributes = [];
  
  if (character.equipment && character.equipment.length > 0) {
    character.equipment.forEach(item => {
      const itemAttrInfo = extractAttributeInfo(item[attributeName]);
      if (itemAttrInfo && itemAttrInfo.isGrouped) {
        hasGroupableEquipment = true;
        equipmentAttributes.push({
          name: item.name,
          ...itemAttrInfo
        });
      }
    });
  }
  
  // If character attribute is not grouped AND no equipment wants to group, no further grouping occurs
  if (!charAttrInfo.isGrouped && !hasGroupableEquipment) {
    let currentValue = charAttrInfo.value;
    let stepNumber = 1;
    
    breakdown.push({
      step: stepNumber,
      entityName: character.name || 'Character',
      entityType: 'character',
      attributeValue: charAttrInfo.value,
      isGrouped: charAttrInfo.isGrouped,
      runningTotal: currentValue,
      formula: null
    });
    
    return breakdown;
  }
  
  // Re-use the equipment attributes already collected above
  // (No need to collect again since we already have them from lines 30-43)
  
  // If no valid equipment, start with just the character value
  if (equipmentAttributes.length === 0) {
    let currentValue = charAttrInfo.value;
    let stepNumber = 1;
    
    breakdown.push({
      step: stepNumber,
      entityName: character.name || 'Character',
      entityType: 'character',
      attributeValue: charAttrInfo.value,
      isGrouped: charAttrInfo.isGrouped,
      runningTotal: currentValue,
      formula: null
    });
    
    return breakdown;
  }
  
  // Get grouped values for each entity
  const allEntities = [];
  
  // Add character with base value only if they have isGrouped=true
  if (charAttrInfo.isGrouped) {
    const characterEntity = {
      name: character.name || 'Character',
      entityType: 'character',
      attributeValue: charAttrInfo.value,
      isGrouped: charAttrInfo.isGrouped,
      groupedValue: charAttrInfo.value
    };
    allEntities.push(characterEntity);
  }
  
  // Add equipment with their grouped values from the character's grouped attributes
  if (character.equipment && character.equipment.length > 0) {
    character.equipment.forEach(item => {
      const itemAttrInfo = extractAttributeInfo(item[attributeName]);
      if (itemAttrInfo && itemAttrInfo.isGrouped) {
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
          isGrouped: itemAttrInfo.isGrouped,
          groupedValue: itemGroupedValue
        });
      }
    });
  }
  
  // If no entities are being grouped, return the character value with fatigue
  if (allEntities.length === 0) {
    let currentValue = charAttrInfo.value;
    let stepNumber = 1;
    
    // Show character value (not grouped)
    breakdown.push({
      step: stepNumber,
      entityName: character.name || 'Character',
      entityType: 'character',
      attributeValue: charAttrInfo.value,
      isGrouped: charAttrInfo.isGrouped,
      runningTotal: currentValue,
      formula: 'Not grouped'
    });
    
    return breakdown;
  }
  
  // Sort by grouped value in descending order (highest first)
  allEntities.sort((a, b) => b.groupedValue - a.groupedValue);
  
  // If character has isGrouped=false but equipment is being grouped, show character first (not participating)
  let stepNumber = 1;
  if (!charAttrInfo.isGrouped && allEntities.length > 0) {
    breakdown.push({
      step: stepNumber,
      entityName: character.name || 'Character',
      entityType: 'character',
      attributeValue: charAttrInfo.value,
      isGrouped: charAttrInfo.isGrouped,
      runningTotal: charAttrInfo.value,
      formula: 'Not participating in grouping'
    });
    stepNumber++;
  }
  
  // Start with the highest grouped value and build breakdown from sorted entities
  let currentValue = allEntities[0].groupedValue;
  
  // Add the first (highest) entity
  breakdown.push({
    step: stepNumber,
    entityName: allEntities[0].name,
    entityType: allEntities[0].entityType,
    attributeValue: allEntities[0].groupedValue,
    isGrouped: allEntities[0].isGrouped,
    runningTotal: currentValue,
    formula: null
  });
  
  // Apply new weighted average grouping formula for each subsequent entity
  const allGroupedValues = allEntities.map(e => e.groupedValue);
  
  for (let i = 1; i < allEntities.length; i++) {
    const entity = allEntities[i];
    const previousValue = currentValue;
    
    // Use the new weighted average formula
    const valuesUpToHere = allGroupedValues.slice(0, i + 1);
    const A1 = valuesUpToHere[0]; // highest value
    let sum = A1;
    
    for (let j = 1; j < valuesUpToHere.length; j++) {
      const Ai = valuesUpToHere[j];
      if (A1 > 0) {
        sum += Ai * (0.1 + Ai / A1);
      } else {
        sum += Ai * 0.1;
      }
    }
    
    currentValue = sum / valuesUpToHere.length;
    
    stepNumber++;
    breakdown.push({
      step: stepNumber,
      entityName: entity.name,
      entityType: entity.entityType,
      attributeValue: entity.groupedValue,
      isGrouped: entity.isGrouped,
      runningTotal: Math.round(currentValue * 100) / 100,
      formula: `Weighted Average: (${A1} + ${entity.groupedValue}*(0.1+${entity.groupedValue}/${A1})) / ${valuesUpToHere.length}`
    });
  }
  
  // Apply conditions (HELP/HINDER) at the end
  console.log(`[DEBUG] Checking for conditions to apply in attribute breakdown for ${attributeName}`);
  if (character.conditions && character.conditions.length > 0) {
    console.log(`[DEBUG] Found ${character.conditions.length} conditions to check for attribute ${attributeName}`);
    
    character.conditions.forEach(condition => {
      console.log(`[DEBUG] Checking condition ${condition.name} (${condition.conditionType}) for ${attributeName}`);
      
      if (!condition.conditionTarget || !condition.conditionType || condition.conditionAmount === undefined) {
        console.log(`[DEBUG] Skipping invalid condition: missing required fields`);
        return; // Skip invalid conditions
      }
      
      // Convert condition target to lowercase to match attribute names
      const targetAttribute = condition.conditionTarget.toLowerCase();
      console.log(`[DEBUG] Condition target: ${targetAttribute}, Current attribute: ${attributeName}`);
      
      // Only apply if this condition targets the current attribute
      if (targetAttribute === attributeName) {
        console.log(`[DEBUG] Condition targets current attribute - applying effect`);
        const previousValue = currentValue;
        
        if (condition.conditionType === 'HELP') {
          currentValue = currentValue + condition.conditionAmount;
          console.log(`[DEBUG] Applied HELP: ${previousValue} + ${condition.conditionAmount} = ${currentValue}`);
        } else if (condition.conditionType === 'HINDER') {
          currentValue = currentValue - condition.conditionAmount;
          console.log(`[DEBUG] Applied HINDER: ${previousValue} - ${condition.conditionAmount} = ${currentValue}`);
        }
        
        stepNumber++;
        const breakdownStep = {
          step: stepNumber,
          entityName: condition.name || 'Condition',
          entityType: 'condition',
          attributeValue: condition.conditionAmount,
          isGrouped: true,
          runningTotal: Math.round(currentValue * 100) / 100,
          formula: `${condition.conditionType}: ${previousValue} ${condition.conditionType === 'HELP' ? '+' : '-'} ${condition.conditionAmount}`
        };
        
        console.log(`[DEBUG] Adding condition step to breakdown:`, JSON.stringify(breakdownStep));
        breakdown.push(breakdownStep);
      } else {
        console.log(`[DEBUG] Condition does not target current attribute - skipping`);
      }
    });
  } else {
    console.log(`[DEBUG] No conditions found for character in breakdown calculation`);
  }
  
  return breakdown;
};

/**
 * Calculates step-by-step breakdown for object grouping
 * @param {Object} object - Object with attributes and equipment
 * @param {string} attributeName - The specific attribute to analyze
 * @returns {Array} Array of steps showing the progression
 */
const calculateObjectAttributeBreakdown = (object, attributeName) => {
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
    isGrouped: objAttrInfo.isGrouped,
    runningTotal: objAttrInfo.value,
    formula: null
  });
  
  // If object attribute is not grouped, no further grouping occurs
  if (!objAttrInfo.isGrouped) {
    return breakdown;
  }
  
  // Collect equipment attributes (excluding non-grouped types)
  const equipmentAttributes = [];
  if (object.equipment && object.equipment.length > 0) {
    object.equipment.forEach(item => {
      const itemAttrInfo = extractAttributeInfo(item[attributeName]);
      if (itemAttrInfo && itemAttrInfo.isGrouped) {
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
    isGrouped: objAttrInfo.isGrouped,
    groupedValue: objAttrInfo.value
  });
  
  // Add equipment with their own individual grouped values
  if (object.equipment && object.equipment.length > 0) {
    object.equipment.forEach(item => {
      const itemAttrInfo = extractAttributeInfo(item[attributeName]);
      if (itemAttrInfo && itemAttrInfo.isGrouped) {
        // Calculate this equipment's own grouped value using calculateObjectGroupedAttributes
        const itemGroupedAttrs = calculateObjectGroupedAttributes(item);
        const itemGroupedValue = itemGroupedAttrs[attributeName] || itemAttrInfo.value;
        
        allEntities.push({
          name: item.name,
          entityType: 'equipment',
          attributeValue: itemAttrInfo.value,
          isGrouped: itemAttrInfo.isGrouped,
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
  
  // Apply new weighted average grouping formula for each subsequent entity
  const allGroupedValues = allEntities.map(e => e.groupedValue);
  
  for (let i = 1; i < allEntities.length; i++) {
    const entity = allEntities[i];
    const previousValue = currentValue;
    
    // Use the new weighted average formula
    const valuesUpToHere = allGroupedValues.slice(0, i + 1);
    const A1 = valuesUpToHere[0]; // highest value
    let sum = A1;
    
    for (let j = 1; j < valuesUpToHere.length; j++) {
      const Ai = valuesUpToHere[j];
      if (A1 > 0) {
        sum += Ai * (0.1 + Ai / A1);
      } else {
        sum += Ai * 0.1;
      }
    }
    
    currentValue = sum / valuesUpToHere.length;
    
    stepNumber++;
    breakdown.push({
      step: stepNumber,
      entityName: entity.name,
      entityType: entity.entityType,
      attributeValue: entity.groupedValue,
      isGrouped: entity.isGrouped,
      runningTotal: Math.round(currentValue * 100) / 100,
      formula: `Weighted Average: (${A1} + ${entity.groupedValue}*(0.1+${entity.groupedValue}/${A1})) / ${valuesUpToHere.length}`
    });
  }
  
  return breakdown;
};

module.exports = {
  calculateAttributeBreakdown,
  calculateObjectAttributeBreakdown
};