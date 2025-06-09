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
 * Then applies conditions (HELP/HINDER) to the final values
 * Note: Fatigue is no longer applied here - it's handled at the action test level
 * @param {Object} character - Character object with attributes, equipment, and conditions
 * @returns {Object} Object containing grouped values for each attribute
 */
const calculateGroupedAttributes = (character) => {
  const groupedAttributes = {};
  
  if (!character) return groupedAttributes;
  
  // First calculate base grouped attributes from character and equipment
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
  
  // Now apply conditions (HELP/HINDER) to the grouped values
  console.log(`[DEBUG] Starting to apply conditions for character ${character.name || 'unknown'} (${character.characterId || 'no-id'})`);
  console.log(`[DEBUG-GROUP] Character conditions:`, JSON.stringify(character.conditions, null, 2));
  
  if (character.conditions && character.conditions.length > 0) {
    console.log(`[DEBUG] Found ${character.conditions.length} conditions to process`);
    
    character.conditions.forEach(condition => {
      console.log(`[DEBUG] Processing condition: ${JSON.stringify(condition)}`);
      console.log(`[DEBUG-GROUP] Condition amount type: ${typeof condition.amount}, value: ${condition.amount}`);
      
      if (!condition.conditionTarget || !condition.conditionType || condition.amount === undefined) {
        console.log(`[DEBUG] Skipping invalid condition: ${condition.name || 'unnamed'} - missing required fields`);
        console.log(`[DEBUG-GROUP] Missing fields check: target=${!!condition.conditionTarget}, type=${!!condition.conditionType}, amount=${condition.amount !== undefined}`);
        return; // Skip invalid conditions
      }
      
      // Convert condition target to lowercase to match attribute names
      const targetAttribute = condition.conditionTarget.toLowerCase();
      console.log(`[DEBUG] Condition target attribute: ${targetAttribute}`);
      
      // Only apply if this is a valid attribute and we have a value for it
      if (ATTRIBUTE_NAMES.includes(targetAttribute) && groupedAttributes[targetAttribute] !== undefined) {
        const currentValue = groupedAttributes[targetAttribute];
        let newValue = currentValue;
        
        console.log(`[DEBUG] Before applying condition: ${targetAttribute} = ${currentValue}`);
        
        // Ensure amount is a number
        const amount = parseInt(condition.amount, 10);
        console.log(`[DEBUG-GROUP] Parsed amount from ${condition.amount} to number: ${amount}, isNaN: ${isNaN(amount)}`);
        
        if (isNaN(amount)) {
          console.log(`[DEBUG-GROUP] SKIPPING due to NaN amount for ${condition.name}`);
          return;
        }
        
        if (condition.conditionType === 'HELP') {
          newValue = currentValue + amount;
          console.log(`[DEBUG] Applying HELP condition: ${currentValue} + ${amount} = ${newValue}`);
        } else if (condition.conditionType === 'HINDER') {
          newValue = currentValue - amount;
          console.log(`[DEBUG] Applying HINDER condition: ${currentValue} - ${amount} = ${newValue}`);
        }
        
        // Round to 2 decimal places
        groupedAttributes[targetAttribute] = Math.round(newValue * 100) / 100;
        console.log(`[DEBUG] After applying condition (rounded): ${targetAttribute} = ${groupedAttributes[targetAttribute]}`);
      } else {
        console.log(`[DEBUG] Cannot apply condition: target=${targetAttribute}, valid=${ATTRIBUTE_NAMES.includes(targetAttribute)}, hasValue=${groupedAttributes[targetAttribute] !== undefined}`);
      }
    });
  } else {
    console.log('[DEBUG] No conditions to apply');
  }
  
  console.log('[DEBUG] Final grouped attributes after conditions:', JSON.stringify(groupedAttributes));
  
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