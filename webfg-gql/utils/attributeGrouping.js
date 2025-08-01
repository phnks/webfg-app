/**
 * Utility functions for calculating grouped attribute values
 * between characters and their equipped objects.
 * This is the backend version - shared across all resolvers.
 */
const { toInt } = require('./stringToNumber');

// All available attribute names organized by group
const ATTRIBUTE_NAMES = [
  // BODY attributes
  'weight', 'size', 'armour', 'endurance', 'lethality', 'penetration', 'complexity',
  // MARTIAL attributes  
  'speed', 'strength', 'dexterity', 'agility',
  // MENTAL attributes
  'resolve', 'morale', 'intelligence', 'charisma',
  // SENSES attributes
  'obscurity', 'seeing', 'hearing', 'light', 'noise'
];

// Attribute groupings for frontend display
const ATTRIBUTE_GROUPS = {
  BODY: ['weight', 'size', 'armour', 'endurance', 'lethality', 'penetration', 'complexity'],
  MARTIAL: ['speed', 'strength', 'dexterity', 'agility'],
  MENTAL: ['resolve', 'morale', 'intelligence', 'charisma'],
  SENSES: ['obscurity', 'seeing', 'hearing', 'light', 'noise']
};

/**
 * Calculate the grouped value using simple addition
 * Formula: A1 + A2 + A3 + ...
 * Where A1, A2, A3... are all attribute values
 * @param {Array} values - Array of attribute values
 * @returns {number} The calculated grouped value
 */
const calculateGroupingFormula = (values) => {
  if (!values || values.length === 0) return 0;
  if (values.length === 1) return values[0];
  
  // Simply add all values together
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
  }
  
  return sum;
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
        // Default to true if isEquipment is undefined/null for backwards compatibility
        const isEquipment = item.isEquipment !== undefined ? item.isEquipment : true;
        return itemAttrInfo && itemAttrInfo.isGrouped && isEquipment !== false;
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
      // Build quantity map for equipment items
      const inventoryItems = character.inventoryItems || [];
      const equipmentQuantityMap = new Map();
      
      inventoryItems
        .filter(invItem => invItem.inventoryLocation === 'EQUIPMENT')
        .forEach(invItem => {
          equipmentQuantityMap.set(invItem.objectId, invItem.quantity);
        });

      character.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        // Only include equipment items that are marked as equipment (isEquipment: true)
        // Skip weapons/tools that require active use (isEquipment: false)
        // IMPORTANT: Default to true if isEquipment is undefined/null for backwards compatibility
        const isEquipment = item.isEquipment !== undefined ? item.isEquipment : true;
        if (itemAttrInfo && itemAttrInfo.isGrouped && isEquipment !== false) {
          // For objects, check if they have their own equipment and get their grouped value
          let itemValue = itemAttrInfo.value;
          
          if (item.equipment && item.equipment.length > 0) {
            const itemGroupedAttrs = calculateObjectGroupedAttributes(item);
            itemValue = itemGroupedAttrs[attributeName] || itemAttrInfo.value;
          }
          
          // Add the item value multiple times based on quantity
          const quantity = equipmentQuantityMap.get(item.objectId) || 1;
          for (let i = 0; i < quantity; i++) {
            valuesToGroup.push(itemValue);
          }
        }
      });
    }
    
    // If no values to group (shouldn't happen with our logic above), use character's base value
    if (valuesToGroup.length === 0) {
      groupedAttributes[attributeName] = charAttrInfo.value;
      return;
    }
    
    // No need to sort for simple addition
    // Apply simple addition grouping formula
    const groupedValue = calculateGroupingFormula(valuesToGroup);
    
    // Debug logging removed
    
    // No fatigue applied here anymore - it's handled at action test level
    groupedAttributes[attributeName] = Math.round(groupedValue * 100) / 100;
  });
  
  // Now apply conditions (HELP/HINDER) to the grouped values
  // console.log(`[DEBUG] Starting to apply conditions for character ${character.name || 'unknown'} (${character.characterId || 'no-id'})`);
  // console.log(`[DEBUG-GROUP] Character conditions:`, JSON.stringify(character.conditions, null, 2));
  
  if (character.conditions && character.conditions.length > 0) {
    // console.log(`[DEBUG] Found ${character.conditions.length} conditions to process`);
    
    character.conditions.forEach(condition => {
      // console.log(`[DEBUG] Processing condition: ${JSON.stringify(condition)}`);
      // console.log(`[DEBUG-GROUP] Condition amount type: ${typeof condition.amount}, value: ${condition.amount}`);
      
      if (!condition.conditionTarget || !condition.conditionType || condition.amount === undefined) {
        // console.log(`[DEBUG] Skipping invalid condition: ${condition.name || 'unnamed'} - missing required fields`);
        // console.log(`[DEBUG-GROUP] Missing fields check: target=${!!condition.conditionTarget}, type=${!!condition.conditionType}, amount=${condition.amount !== undefined}`);
        return; // Skip invalid conditions
      }
      
      // Convert condition target to lowercase to match attribute names
      const targetAttribute = condition.conditionTarget.toLowerCase();
      // console.log(`[DEBUG] Condition target attribute: ${targetAttribute}`);
      
      // Only apply if this is a valid attribute and we have a value for it
      if (ATTRIBUTE_NAMES.includes(targetAttribute) && groupedAttributes[targetAttribute] !== undefined) {
        const currentValue = groupedAttributes[targetAttribute];
        let newValue = currentValue;
        
        // console.log(`[DEBUG] Before applying condition: ${targetAttribute} = ${currentValue}`);
        
        // Ensure amount is a number - use our helper for guaranteed numeric value
        const amount = toInt(condition.amount, 0); // If amount is missing/invalid, use 0 (no effect)
        // console.log(`[DEBUG-GROUP] Using amount: ${amount} (original value: ${condition.amount}, type: ${typeof condition.amount})`);
        
        // Skip conditions with zero amount (no effect)
        if (amount === 0) {
          // console.log(`[DEBUG-GROUP] SKIPPING due to zero amount for ${condition.name}`);
          return;
        }
        
        if (condition.conditionType === 'HELP') {
          newValue = currentValue + amount;
          // console.log(`[DEBUG] Applying HELP condition: ${currentValue} + ${amount} = ${newValue}`);
        } else if (condition.conditionType === 'HINDER') {
          newValue = currentValue - amount;
          // console.log(`[DEBUG] Applying HINDER condition: ${currentValue} - ${amount} = ${newValue}`);
        }
        
        // Round to 2 decimal places
        groupedAttributes[targetAttribute] = Math.round(newValue * 100) / 100;
        // console.log(`[DEBUG] After applying condition (rounded): ${targetAttribute} = ${groupedAttributes[targetAttribute]}`);
      } else {
        // console.log(`[DEBUG] Cannot apply condition: target=${targetAttribute}, valid=${ATTRIBUTE_NAMES.includes(targetAttribute)}, hasValue=${groupedAttributes[targetAttribute] !== undefined}`);
      }
    });
  } else {
    // console.log('[DEBUG] No conditions to apply');
  }
  
  // console.log('[DEBUG] Final grouped attributes after conditions:', JSON.stringify(groupedAttributes));
  
  return groupedAttributes;
};

/**
 * Calculate ready grouped attributes which includes character base + equipment + ready objects
 * This is used when a character is acting as a source in action tests
 * @param {Object} character - Character object with attributes, equipment, ready objects, and conditions
 * @returns {Object} Object containing ready grouped values for each attribute
 */
const calculateReadyGroupedAttributes = (character) => {
  const groupedAttributes = {};
  
  if (!character) {
    // Return all attributes as null when no character
    ATTRIBUTE_NAMES.forEach(attributeName => {
      groupedAttributes[attributeName] = null;
    });
    return groupedAttributes;
  }
  
  // First calculate ready grouped attributes from character, equipment, and ready objects
  // We ALWAYS compute ALL attributes to ensure frontend gets complete data
  ATTRIBUTE_NAMES.forEach(attributeName => {
    const charAttrInfo = extractAttributeInfo(character[attributeName]);
    
    if (!charAttrInfo) {
      // Character doesn't have this attribute, set as null
      groupedAttributes[attributeName] = null;
      return;
    }
    
    // Check if there's any equipment or ready objects with this attribute that wants to be grouped
    let hasGroupableEquipment = false;
    let hasGroupableReady = false;
    
    // Check equipment
    if (character.equipment && character.equipment.length > 0) {
      hasGroupableEquipment = character.equipment.some(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        // Default to true if isEquipment is undefined/null for backwards compatibility
        const isEquipment = item.isEquipment !== undefined ? item.isEquipment : true;
        return itemAttrInfo && itemAttrInfo.isGrouped && isEquipment !== false;
      });
    }
    
    // Check ready objects
    if (character.ready && character.ready.length > 0) {
      hasGroupableReady = character.ready.some(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        return itemAttrInfo && itemAttrInfo.isGrouped;
      });
    }
    
    const hasAnyGroupableObjects = hasGroupableEquipment || hasGroupableReady;
    
    // If character attribute is not grouped AND no objects want to group, just return base value
    if (!charAttrInfo.isGrouped && !hasAnyGroupableObjects) {
      groupedAttributes[attributeName] = charAttrInfo.value;
      return;
    }
    
    // Collect all values for grouping
    const valuesToGroup = [];
    
    // Only include character's value if they have isGrouped=true
    if (charAttrInfo.isGrouped) {
      valuesToGroup.push(charAttrInfo.value);
    }
    
    // Add equipment values (no quantity handling needed as equipment array is already expanded)
    if (character.equipment && character.equipment.length > 0) {
      character.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        // Only include equipment items that are marked as equipment (isEquipment: true)
        // Skip weapons/tools that require active use (isEquipment: false)
        // IMPORTANT: Default to true if isEquipment is undefined/null for backwards compatibility
        const isEquipment = item.isEquipment !== undefined ? item.isEquipment : true;
        if (itemAttrInfo && itemAttrInfo.isGrouped && isEquipment !== false) {
          // For objects, check if they have their own equipment and get their grouped value
          let itemValue = itemAttrInfo.value;
          
          if (item.equipment && item.equipment.length > 0) {
            const itemGroupedAttrs = calculateObjectGroupedAttributes(item);
            itemValue = itemGroupedAttrs[attributeName] || itemAttrInfo.value;
          }
          
          // Equipment array is already expanded by GraphQL resolvers, so no quantity multiplication needed
          valuesToGroup.push(itemValue);
        }
      });
    }
    
    // Add ready object values with quantity handling
    if (character.ready && character.ready.length > 0) {
      // Build quantity map for ready items
      const inventoryItems = character.inventoryItems || [];
      const readyQuantityMap = new Map();
      
      inventoryItems
        .filter(invItem => invItem.inventoryLocation === 'READY')
        .forEach(invItem => {
          readyQuantityMap.set(invItem.objectId, invItem.quantity);
        });

      character.ready.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        if (itemAttrInfo && itemAttrInfo.isGrouped) {
          // For objects, check if they have their own equipment and get their grouped value
          let itemValue = itemAttrInfo.value;
          
          if (item.equipment && item.equipment.length > 0) {
            const itemGroupedAttrs = calculateObjectGroupedAttributes(item);
            itemValue = itemGroupedAttrs[attributeName] || itemAttrInfo.value;
          }
          
          // Add the item value multiple times based on quantity
          const quantity = readyQuantityMap.get(item.objectId) || 1;
          for (let i = 0; i < quantity; i++) {
            valuesToGroup.push(itemValue);
          }
        }
      });
    }
    
    // If no values to group (shouldn't happen with our logic above), use character's base value
    if (valuesToGroup.length === 0) {
      groupedAttributes[attributeName] = charAttrInfo.value;
      return;
    }
    
    // No need to sort for simple addition
    // Apply simple addition grouping formula
    const groupedValue = calculateGroupingFormula(valuesToGroup);
    
    // Debug logging for ALL attributes to find speed vs armor difference
    if (character.name === 'The Guy' && (attributeName === 'speed' || attributeName === 'armour')) {
      console.log(`[DEBUG ALL] Calculating ready grouped ${attributeName} for The Guy:`);
      console.log(`[DEBUG ALL] Character base value: ${charAttrInfo.value}, isGrouped: ${charAttrInfo.isGrouped}`);
      console.log(`[DEBUG ALL] Equipment items: ${JSON.stringify(character.equipment?.map(item => ({
        name: item.name,
        [attributeName]: item[attributeName],
        extracted: extractAttributeInfo(item[attributeName])
      })) || [])}`);
      console.log(`[DEBUG ALL] Ready items: ${JSON.stringify(character.ready?.map(item => ({
        name: item.name,
        [attributeName]: item[attributeName],
        extracted: extractAttributeInfo(item[attributeName])
      })) || [])}`);
      console.log(`[DEBUG ALL] Values to group: ${JSON.stringify(valuesToGroup)}`);
      console.log(`[DEBUG ALL] Grouped value before rounding: ${groupedValue}`);
    }
    
    // No fatigue applied here anymore - it's handled at action test level
    groupedAttributes[attributeName] = Math.round(groupedValue * 100) / 100;
  });
  
  // Now apply conditions (HELP/HINDER) to the grouped values
  // console.log(`[DEBUG] Starting to apply conditions for ready grouped attributes for character ${character.name || 'unknown'} (${character.characterId || 'no-id'})`);
  
  if (character.conditions && character.conditions.length > 0) {
    // console.log(`[DEBUG] Found ${character.conditions.length} conditions to process for ready grouped attributes`);
    
    character.conditions.forEach(condition => {
      // console.log(`[DEBUG] Processing condition for ready attributes: ${JSON.stringify(condition)}`);
      
      if (!condition.conditionTarget || !condition.conditionType || condition.amount === undefined) {
        // console.log(`[DEBUG] Skipping invalid condition: ${condition.name || 'unnamed'} - missing required fields`);
        return; // Skip invalid conditions
      }
      
      // Convert condition target to lowercase to match attribute names
      const targetAttribute = condition.conditionTarget.toLowerCase();
      
      // Only apply if this is a valid attribute and we have a value for it
      if (ATTRIBUTE_NAMES.includes(targetAttribute) && groupedAttributes[targetAttribute] !== undefined) {
        const currentValue = groupedAttributes[targetAttribute];
        let newValue = currentValue;
        
        // console.log(`[DEBUG] Before applying condition to ready attributes: ${targetAttribute} = ${currentValue}`);
        
        // Ensure amount is a number - use our helper for guaranteed numeric value
        const amount = toInt(condition.amount, 0); // If amount is missing/invalid, use 0 (no effect)
        
        // Skip conditions with zero amount (no effect)
        if (amount === 0) {
          // console.log(`[DEBUG] SKIPPING ready condition due to zero amount for ${condition.name}`);
          return;
        }
        
        if (condition.conditionType === 'HELP') {
          newValue = currentValue + amount;
          // console.log(`[DEBUG] Applying HELP condition to ready attributes: ${currentValue} + ${amount} = ${newValue}`);
        } else if (condition.conditionType === 'HINDER') {
          newValue = currentValue - amount;
          // console.log(`[DEBUG] Applying HINDER condition to ready attributes: ${currentValue} - ${amount} = ${newValue}`);
        }
        
        // Round to 2 decimal places
        groupedAttributes[targetAttribute] = Math.round(newValue * 100) / 100;
        // console.log(`[DEBUG] After applying condition to ready attributes (rounded): ${targetAttribute} = ${groupedAttributes[targetAttribute]}`);
      }
    });
  } else {
    // console.log('[DEBUG] No conditions to apply to ready grouped attributes');
  }
  
  // console.log('[DEBUG] Final ready grouped attributes after conditions:', JSON.stringify(groupedAttributes));
  
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
    
    // No need to sort for simple addition
    // Apply simple addition grouping formula
    const groupedValue = calculateGroupingFormula(valuesToGroup);
    
    groupedAttributes[attributeName] = Math.round(groupedValue * 100) / 100;
  });
  
  return groupedAttributes;
};

/**
 * Groups attributes from a character, their equipped objects, and a specific selected ready object
 * @param {Object} character - Character object with attributes, equipment, and ready items
 * @param {string} selectedReadyObjectId - ID of the specific ready object to include
 * @returns {Object} Object containing grouped values for each attribute
 */
const calculateGroupedAttributesWithSelectedReady = (character, selectedReadyObjectId) => {
  const groupedAttributes = {};
  
  // console.log('[DEBUG calculateGroupedAttributesWithSelectedReady]', {
  //   characterName: character?.name,
  //   selectedReadyObjectId,
  //   hasReadyArray: !!character?.ready,
  //   readyCount: character?.ready?.length || 0,
  //   readyObjects: character?.ready?.map(obj => ({ objectId: obj.objectId, name: obj.name })) || []
  // });
  
  if (!character || !selectedReadyObjectId) {
    // console.log('[DEBUG] Fallback: no character or selectedReadyObjectId');
    return calculateGroupedAttributes(character); // Fallback to equipment-only
  }
  
  // Find the selected ready object
  const selectedReadyObject = character.ready?.find(obj => obj.objectId === selectedReadyObjectId);
  // console.log('[DEBUG] Found selected ready object:', selectedReadyObject ? { objectId: selectedReadyObject.objectId, name: selectedReadyObject.name } : 'NOT FOUND');
  
  if (!selectedReadyObject) {
    // console.log('[DEBUG] Fallback: selected ready object not found in character.ready array');
    return calculateGroupedAttributes(character); // Fallback if object not found
  }
  
  ATTRIBUTE_NAMES.forEach(attributeName => {
    const charAttrInfo = extractAttributeInfo(character[attributeName]);
    
    if (!charAttrInfo) {
      // Character doesn't have this attribute, skip grouping
      return;
    }
    
    // Collect all values for grouping (base + equipment + selected ready object)
    const valuesToGroup = [];
    
    // Only include character's value if they have isGrouped=true
    if (charAttrInfo.isGrouped) {
      valuesToGroup.push(charAttrInfo.value);
    }
    
    // Add equipment values if they're groupable
    if (character.equipment && character.equipment.length > 0) {
      character.equipment.forEach(item => {
        const itemAttrInfo = extractAttributeInfo(item[attributeName]);
        // Only include equipment items that are marked as equipment (isEquipment: true)
        // Skip weapons/tools that require active use (isEquipment: false)
        // IMPORTANT: Default to true if isEquipment is undefined/null for backwards compatibility
        const isEquipment = item.isEquipment !== undefined ? item.isEquipment : true;
        if (itemAttrInfo && itemAttrInfo.isGrouped && isEquipment !== false) {
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
    
    // Add selected ready object value if it's groupable
    const readyAttrInfo = extractAttributeInfo(selectedReadyObject[attributeName]);
    if (readyAttrInfo && readyAttrInfo.isGrouped) {
      let readyValue = readyAttrInfo.value;
      
      if (selectedReadyObject.equipment && selectedReadyObject.equipment.length > 0) {
        const readyGroupedAttrs = calculateObjectGroupedAttributes(selectedReadyObject);
        readyValue = readyGroupedAttrs[attributeName] || readyAttrInfo.value;
      }
      
      valuesToGroup.push(readyValue);
      
      // Debug logging for dexterity specifically
      // if (attributeName === 'dexterity') {
      //   console.log('[DEBUG selected ready object dexterity]', {
      //     objectName: selectedReadyObject.name,
      //     readyAttrInfo,
      //     readyValue,
      //     addedToGroup: true
      //   });
      // }
    } else if (attributeName === 'dexterity') {
      // console.log('[DEBUG selected ready object dexterity NOT grouped]', {
      //   objectName: selectedReadyObject.name,
      //   readyAttrInfo,
      //   reason: !readyAttrInfo ? 'no attribute info' : 'not grouped'
      // });
    }
    
    // Calculate final grouped value
    if (valuesToGroup.length === 0) {
      groupedAttributes[attributeName] = charAttrInfo.value;
    } else if (valuesToGroup.length === 1) {
      groupedAttributes[attributeName] = valuesToGroup[0];
    } else {
      // No need to sort for simple addition
      // Apply simple addition grouping formula
      const groupedValue = calculateGroupingFormula(valuesToGroup);
      
      groupedAttributes[attributeName] = Math.round(groupedValue * 100) / 100;
    }
    
    // Debug logging for dexterity calculation
    // if (attributeName === 'dexterity') {
    //   console.log('[DEBUG calculateGroupedAttributesWithSelectedReady dexterity result]', {
    //     characterName: character.name,
    //     selectedObjectName: selectedReadyObject.name,
    //     valuesToGroup,
    //     finalValue: groupedAttributes[attributeName]
    //   });
    // }
  });
  
  return groupedAttributes;
};

module.exports = {
  ATTRIBUTE_NAMES,
  ATTRIBUTE_GROUPS,
  calculateGroupingFormula,
  extractAttributeInfo,
  calculateGroupedAttributes,
  calculateReadyGroupedAttributes,
  calculateObjectGroupedAttributes,
  calculateGroupedAttributesWithSelectedReady
};