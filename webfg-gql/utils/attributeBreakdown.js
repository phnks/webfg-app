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

const { toInt } = require('./stringToNumber');

/**
 * Apply conditions to the breakdown calculation
 * @param {Object} character - Character object with conditions
 * @param {string} attributeName - The attribute being calculated
 * @param {Array} breakdown - The breakdown array to append to
 * @param {number} currentValue - The current running total
 * @param {number} stepNumber - The current step number
 * @returns {number} The new running total after conditions
 */
const applyConditionsToBreakdown = (character, attributeName, breakdown, currentValue, stepNumber) => {
  let runningTotal = currentValue;
  let currentStep = stepNumber;
  
  // console.log(`[DEBUG] Checking for conditions to apply in attribute breakdown for ${attributeName}`);
  // console.log(`[DEBUG-ATTRS] Character conditions structure:`, JSON.stringify(character.conditions, null, 2));
  
  if (character.conditions && character.conditions.length > 0) {
    // console.log(`[DEBUG] Found ${character.conditions.length} conditions to check for attribute ${attributeName}`);
    
    character.conditions.forEach(condition => {
      // console.log(`[DEBUG] Checking condition ${condition.name} (${condition.conditionType}) for ${attributeName}`);
      // console.log(`[DEBUG-ATTRS] Full condition object:`, JSON.stringify(condition, null, 2));
      // console.log(`[DEBUG-ATTRS] Amount type: ${typeof condition.amount}, value: ${condition.amount}`);
      
      if (!condition.conditionTarget || !condition.conditionType || condition.amount === undefined) {
        // console.log(`[DEBUG] Skipping invalid condition: missing required fields`);
        // console.log(`[DEBUG-ATTRS] Missing fields check: conditionTarget=${!!condition.conditionTarget}, conditionType=${!!condition.conditionType}, amount=${condition.amount !== undefined}`);
        return; // Skip invalid conditions
      }
      
      // Convert condition target to lowercase to match attribute names
      const targetAttribute = condition.conditionTarget.toLowerCase();
      // console.log(`[DEBUG] Condition target: ${targetAttribute}, Current attribute: ${attributeName}`);
      
      // Only apply if this condition targets the current attribute
      if (targetAttribute === attributeName) {
        // console.log(`[DEBUG] Condition targets current attribute - applying effect`);
        const previousValue = runningTotal;
        
        // Ensure amount is a number using our helper
        const amount = toInt(condition.amount, 0); // Use 0 as default for invalid values
        // console.log(`[DEBUG-ATTRS] Using amount: ${amount} (original value: ${condition.amount}, type: ${typeof condition.amount})`);
        
        if (amount === 0) {
          // console.log(`[DEBUG-ATTRS] SKIPPING due to zero amount for ${condition.name}`);
          return;
        }
        
        if (condition.conditionType === 'HELP') {
          runningTotal = runningTotal + amount;
          // console.log(`[DEBUG] Applied HELP: ${previousValue} + ${amount} = ${runningTotal}`);
        } else if (condition.conditionType === 'HINDER') {
          runningTotal = runningTotal - amount;
          // console.log(`[DEBUG] Applied HINDER: ${previousValue} - ${amount} = ${runningTotal}`);
        }
        
        currentStep++;
        const breakdownStep = {
          step: currentStep,
          entityName: condition.name || 'Condition',
          entityType: 'condition',
          attributeValue: amount, // Use the parsed integer
          isGrouped: true,
          runningTotal: Math.round(runningTotal * 100) / 100,
          formula: `${condition.conditionType}: ${previousValue} ${condition.conditionType === 'HELP' ? '+' : '-'} ${amount}`
        };
        
        // console.log(`[DEBUG] Adding condition step to breakdown:`, JSON.stringify(breakdownStep));
        breakdown.push(breakdownStep);
      } else {
        // console.log(`[DEBUG] Condition does not target current attribute - skipping`);
      }
    });
  } else {
    // console.log(`[DEBUG] No conditions found for character in breakdown calculation`);
  }
  
  return runningTotal;
};

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
  
  // console.log(`[DEBUG-START] Starting breakdown for ${attributeName}, charAttrInfo:`, JSON.stringify(charAttrInfo));
  
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
    // console.log("[DEBUG-PATH] Taking early return path 1: no grouping at all");
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
    
    // Apply conditions even when there's no grouping
    applyConditionsToBreakdown(character, attributeName, breakdown, currentValue, stepNumber);
    
    return breakdown;
  }
  
  // Re-use the equipment attributes already collected above
  // (No need to collect again since we already have them from lines 30-43)
  
  // If no valid equipment, start with just the character value
  if (equipmentAttributes.length === 0) {
    // console.log("[DEBUG-PATH] Taking early return path 2: no equipment");
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
    
    // Apply conditions even when there's no equipment
    applyConditionsToBreakdown(character, attributeName, breakdown, currentValue, stepNumber);
    
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
    // console.log("[DEBUG-PATH] Taking early return path 3: no entities grouped");
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
    
    // Apply conditions even when nothing is grouped
    applyConditionsToBreakdown(character, attributeName, breakdown, currentValue, stepNumber);
    
    return breakdown;
  }
  
  // No need to sort for simple addition
  
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
  
  // Start with the first entity's value
  let currentValue = allEntities[0].groupedValue;
  
  // Add the first entity
  breakdown.push({
    step: stepNumber,
    entityName: allEntities[0].name,
    entityType: allEntities[0].entityType,
    attributeValue: allEntities[0].groupedValue,
    isGrouped: allEntities[0].isGrouped,
    runningTotal: currentValue,
    formula: null
  });
  
  // Apply simple addition grouping formula for each subsequent entity
  const allGroupedValues = allEntities.map(e => e.groupedValue);
  
  for (let i = 1; i < allEntities.length; i++) {
    const entity = allEntities[i];
    const previousValue = currentValue;
    
    // Use simple addition formula
    const valuesUpToHere = allGroupedValues.slice(0, i + 1);
    let sum = 0;
    
    // Simply add all values together
    for (let j = 0; j < valuesUpToHere.length; j++) {
      sum += valuesUpToHere[j];
    }
    
    currentValue = sum;
    
    stepNumber++;
    breakdown.push({
      step: stepNumber,
      entityName: entity.name,
      entityType: entity.entityType,
      attributeValue: entity.groupedValue,
      isGrouped: entity.isGrouped,
      runningTotal: Math.round(currentValue * 100) / 100,
      formula: `Addition: ${valuesUpToHere.join(' + ')} = ${sum}`
    });
  }
  
  // Apply conditions (HELP/HINDER) at the end
  applyConditionsToBreakdown(character, attributeName, breakdown, currentValue, stepNumber);
  
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
  
  // No need to sort for simple addition, but we'll keep first entity logic
  // Start with the first grouped value
  let currentValue = allEntities[0].groupedValue;
  let stepNumber = 1;
  
  // Apply simple addition grouping formula for each subsequent entity
  const allGroupedValues = allEntities.map(e => e.groupedValue);
  
  for (let i = 1; i < allEntities.length; i++) {
    const entity = allEntities[i];
    const previousValue = currentValue;
    
    // Use simple addition formula
    const valuesUpToHere = allGroupedValues.slice(0, i + 1);
    let sum = 0;
    
    // Simply add all values together
    for (let j = 0; j < valuesUpToHere.length; j++) {
      sum += valuesUpToHere[j];
    }
    
    currentValue = sum;
    
    stepNumber++;
    breakdown.push({
      step: stepNumber,
      entityName: entity.name,
      entityType: entity.entityType,
      attributeValue: entity.groupedValue,
      isGrouped: entity.isGrouped,
      runningTotal: Math.round(currentValue * 100) / 100,
      formula: `Addition: ${valuesUpToHere.join(' + ')} = ${sum}`
    });
  }
  
  return breakdown;
};

module.exports = {
  calculateAttributeBreakdown,
  calculateObjectAttributeBreakdown
};